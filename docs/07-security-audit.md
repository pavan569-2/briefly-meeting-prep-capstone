# Briefly – Security Audit Record

> Captured during Module 15 Capstone Phase 1 · Date: 2026-08-06  
> Baseline repository tag at start of capstone: `v1.0.0`

---

## Audit Context

The security review included verification of authentication, ownership enforcement, input validation, secret containment, dependency auditing, and central error sanitisation.

| Field | Value |
|---|---|
| Date | 2026-08-06 |
| Repository | briefly-meeting-prep-capstone |
| Git tag | v1.0.0 |
| npm version | 11.16.0 |
| Node version | ≥ 20 |
| Scope | `backend/` and `frontend/` dependency trees |
| Method | `npm audit` (npm built-in, advisory database) |

---

## Section 1 – Audit Commands

The following commands were run in order:

```bash
# Backend: production dependencies only
cd backend
npm audit --omit=dev

# Backend: full tree (includes devDependencies)
cd backend
npm audit

# Frontend: full tree
cd frontend
npm audit
```

---

## Section 2 – Backend: Production Dependencies

### Command

```bash
cd backend
npm audit --omit=dev
```

### Result

**0 vulnerabilities found.**

The production dependency tree (packages listed under `dependencies` in
`backend/package.json`) contains no reported advisories.

| Package | Resolved version |
|---|---|
| `@anthropic-ai/sdk` | 0.39.0 |
| `@supabase/supabase-js` | 2.112.1 |
| `cors` | 2.8.6 |
| `dotenv` | 16.6.1 |
| `express` | 4.22.2 |
| `express-rate-limit` | 7.5.1 |
| `zod` | 3.25.76 |

**No high or critical vulnerabilities exist in any production-deployed backend dependency.**

---

## Section 3 – Backend: Development Dependencies

### Command

```bash
cd backend
npm audit
```

### Result

**5 vulnerabilities — 3 moderate, 1 high, 1 critical**

All 5 findings are in packages installed exclusively as devDependencies for test execution.
None of these packages are present in the production bundle or the production process.

### Finding Detail

| Advisory | Affected package | Severity | GHSA |
|---|---|---|---|
| esbuild dev server allows arbitrary request forwarding | `esbuild <=0.24.2` | moderate | GHSA-67mh-4wv8-2f99 |
| `vite` depends on vulnerable `esbuild` | `vite <=6.4.2` | (transitive) | — |
| `@vitest/mocker` depends on vulnerable `vite` | `@vitest/mocker <=3.0.0-beta.4` | (transitive) | — |
| `vitest` depends on vulnerable toolchain | `vitest <=3.2.5` | (transitive) | — |
| `vite-node` depends on vulnerable `vite` | `vite-node <=2.2.0-beta.2` | (transitive) | — |

### Attack Surface Analysis

The esbuild advisory (GHSA-67mh-4wv8-2f99) concerns the esbuild development server
(`esbuild serve`) or the Vite development server (`vite dev`). It allows a website to send
arbitrary requests to the local dev server and read responses — exploitable only when:

1. A developer is running `vite dev` or `npm test` on their local machine, **and**
2. The developer simultaneously visits a malicious website in the same browser session.

The Briefly backend does not use Vite or esbuild in production. The production server is a
plain Node.js Express process (`node dist/index.js`). Vitest and Vite are never deployed.
The attack surface is therefore limited to a developer's local machine on a trusted network.

### Fix Availability

`npm audit fix --force` would upgrade `vitest` to v4.x — a breaking change that exceeds the
scope of this phase. This was not applied. The 97 tests pass on the installed version.

**Status: Accepted — devDependency-only, no production deployment exposure.**

---

## Section 4 – Frontend: Dependencies

### Command

```bash
cd frontend
npm audit
```

### Result

**2 moderate severity vulnerabilities**

Both advisories are in `react-router-dom` (and its dependency `react-router`).

### Advisory 1 — Open Redirect via Backslash

| Field | Value |
|---|---|
| Advisory | CVE-2025-68470 / GHSA-wrjc-x8rr-h8h6 |
| Package | `react-router 6.0.0 – 7.17.0` |
| Severity | Moderate |
| Description | A backslash in the `to` prop of `<Link>` or in a `useNavigate` call can produce an open redirect on some browsers |

**Applicability to Briefly:**

All navigation in Briefly uses hardcoded route strings (`'/login'`, `'/dashboard'`). No user
input is passed as a navigation target at any call site currently implemented. The open-redirect
vulnerability requires user-controlled data to be provided as a navigation target. That path
is not currently reachable through the implemented navigation logic.

**Risk assessment:** Accepted residual moderate risk. The vulnerability is present in the
installed package version but is not reachable through the current navigation implementation.
If future changes introduce user-controlled navigation targets, this advisory must be
re-evaluated before that feature ships.

---

### Advisory 2 — Arbitrary Constructor Injection via SSR Hydration

| Field | Value |
|---|---|
| Advisory | GHSA-337j-9hxr-rhxg |
| Package | `react-router 6.0.0 – 7.17.0` |
| Severity | Moderate |
| Description | `deserializeErrors()` in the SSR hydration path can be used to inject arbitrary constructors if the server serialises error objects that reach the client |

**Applicability to Briefly:**

Briefly is a client-rendered Vite SPA. There is no server-side rendering, no server-to-client
error serialisation, and no hydration step. The `deserializeErrors()` code path is not
exercised by this architecture.

**Risk assessment:** Not applicable to the current client-rendered Vite SPA architecture.

---

### Fix Availability

`npm audit fix` was executed but did not resolve the remaining React Router advisories.

**Recommendation:** Monitor future React Router releases for a compatible fix to the remaining moderate advisories. Upgrade once a compatible release is available and validate the application after the upgrade.

---

## Section 5 – Overall Assessment

| Scope | Findings | Status |
|---|---|---|
| Backend production dependencies | **0 vulnerabilities** | ✅ Clean |
| Backend devDependencies (Vitest toolchain) | 5 findings — esbuild/Vite dev server only | ✅ Accepted — no production exposure |
| Frontend (react-router) | 2 moderate | ⚠️ Accepted residual risk — see analysis above |

**No high or critical vulnerabilities exist in any production-deployed dependency.**

---

## Section 6 – Recommended Next Actions

1. **Frontend:** Monitor future React Router releases for a compatible fix to the remaining moderate advisories. Upgrade once a compatible release is available and validate the application after the upgrade.
2. **Backend devDependencies:** Monitor Vitest and Vite release notes for a non-breaking path to address the esbuild dev-server advisory. Apply when available without `--force`.
3. **Ongoing:** Re-run `npm audit --omit=dev` (backend) and `npm audit` (frontend) before each production release and record results in this document.
4. **Future features:** If any future change introduces user-controlled navigation targets in the frontend, re-evaluate the CVE-2025-68470 open-redirect advisory before that change ships.
