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

## Pre-Deployment Security Checklist

| Security Area | Check Performed | Evidence | Result |
|---|---|---|---|
| **1. Authentication** | Protected routes require valid authentication. Unauthenticated requests are rejected. | `backend/src/middleware/auth.ts` intercepts and validates JWTs, returning `401 Unauthorized` for invalid or missing tokens. | PASS |
| **2. Authorization / Ownership** | Brief access is scoped to authenticated owner. Parent brief ownership is validated. | `briefService.ts` explicitly appends `.eq('user_id', userId)` to all `get`, `update`, and `delete` Supabase queries. | PASS |
| **3. Input Validation** | Server-side Zod validation with required fields and limits. Malformed requests rejected. | `backend/src/briefs/briefSchemas.ts` defines rigid character limits. Route middleware validates payloads and returns `400 Bad Request` on failure. | PASS |
| **4. Secrets and API Keys** | Anthropic and Supabase service-role keys remain backend-only. | `frontend` configuration only exports `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Backend secrets are accessed via `process.env` safely. | PASS |
| **5. Error Sanitisation** | Stack traces/internal provider errors are not returned to clients. | `app.ts` global error handler and `apiClient.ts` ensure only generic messages or safe validation/auth errors are exposed. | PASS |
| **6. CORS** | Backend restricts allowed frontend origin. | `backend/src/app.ts` configures `cors({ origin: process.env.FRONTEND_URL })`. | PASS |
| **7. Rate Limiting** | Global API limit and stricter generation limit. | `backend/src/app.ts` implements `express-rate-limit` (100 req/15m global, 20 req/15m for generation). | PASS |
| **8. Dependency Security** | Production audits performed. | `npm audit --omit=dev` confirms 0 backend vulnerabilities. Frontend React Router moderate findings accurately documented as residual risk. | PASS |
| **9. Prompt / AI Input Security** | User content treated as untrusted input. Prompt-injection mitigation implemented. | `promptBuilder.ts` wraps user input in XML tags and explicitly instructs Claude to treat data as passive and untrusted. | PASS |
| **10. AI Output Validation** | Malformed/schema-invalid output handling. | `responseValidator.ts` enforces Zod schemas on Claude's JSON output before persistence. Invalid output throws a `ValidationError`. | PASS |
| **11. Logging / Sensitive Info** | Secrets or raw privileged values are not exposed in errors. | `streamParser.ts` and general API handlers catch errors safely without dumping the environment object. | PASS |
| **12. Production Deployment** | Validated successful deployment and core workflows. | Vercel (frontend), Railway (backend), and Supabase (Auth/DB) smoke tests passed, including Phase 5 responsive fixes. | PASS |

---

## AI-Assisted Security Review of Authentication and Data Handling

### 1. Authentication bypass
- **Risk reviewed:** Can a user bypass the Express authentication middleware?
- **Files/components inspected:** `backend/src/middleware/auth.ts`, `backend/src/app.ts`.
- **Finding:** The middleware correctly extracts the Bearer token and verifies it using `supabaseAdmin.auth.getUser(token)`. Without a valid token, the request is immediately terminated with a 401 response before routing.
- **Existing mitigation:** Standard JWT verification via Supabase Admin SDK.
- **Status:** PASS

### 2. IDOR / BOLA / missing ownership checks
- **Risk reviewed:** Can a user manipulate UUIDs to read, modify, or delete another user's briefs?
- **Files/components inspected:** `backend/src/briefs/briefService.ts`.
- **Finding:** Every database operation (`getBriefById`, `updateBrief`, `deleteBrief`) strictly includes `.eq('user_id', userId)`. The `userId` is securely derived from the verified JWT, enforcing ownership isolation for the reviewed brief operations.
- **Existing mitigation:** Row-level ownership filtering on all database queries.
- **Status:** PASS

### 3. Cross-user parentBriefId access
- **Risk reviewed:** Can a user provide a `parentBriefId` belonging to someone else to extract its context into a new brief?
- **Files/components inspected:** `backend/src/ai/aiController.ts`.
- **Finding:** When a `parentBriefId` is provided, `aiController.ts` explicitly calls `briefService.getBriefById(parentBriefId, userId)`. This query enforces ownership, meaning cross-user injection attempts will safely fail with a 404.
- **Existing mitigation:** Ownership enforced during parent retrieval prior to prompt construction.
- **Status:** PASS

### 4. Supabase service-role exposure
- **Risk reviewed:** Are privileged Supabase keys exposed to the frontend?
- **Files/components inspected:** `backend/src/lib/supabaseAdmin.ts`, frontend environment files.
- **Finding:** The privileged `SUPABASE_SERVICE_ROLE_KEY` is exclusively instantiated in the backend Express process. The frontend only receives the safe, restricted `VITE_SUPABASE_ANON_KEY`.
- **Existing mitigation:** Strict backend/frontend environment variable separation.
- **Status:** PASS

### 5. User-input validation
- **Risk reviewed:** Can oversized or malformed payloads cause DoS or database corruption?
- **Files/components inspected:** `backend/src/briefs/briefSchemas.ts`.
- **Finding:** Zod schemas strictly define maximum string lengths (e.g., `previousNotes` capped at 20,000 characters). Requests violating these bounds are immediately rejected by middleware before processing.
- **Existing mitigation:** Comprehensive Zod schema enforcement.
- **Status:** PASS

### 6. Prompt injection / instruction override
- **Risk reviewed:** Can a user embed malicious instructions ("Ignore previous instructions...") inside meeting context to alter the AI's behavior?
- **Files/components inspected:** `backend/src/ai/promptBuilder.ts`.
- **Finding:** The prompt explicitly reduces the risk of instruction override by declaring all provided user data as untrusted and passive. While XML wrapping and explicit warnings provide an instruction/data boundary, they do not completely prevent highly sophisticated jailbreaks. 
- **Existing mitigation:** Explicit system prompt directives and strict XML data bounding.
- **Status:** PARTIAL (Accepted residual risk inherent to LLMs).

### 7. Untrusted AI output
- **Risk reviewed:** Can the AI generate invalid JSON or missing fields that break the frontend?
- **Files/components inspected:** `backend/src/ai/responseValidator.ts`, `backend/src/briefs/briefService.ts`.
- **Finding:** AI output is parsed and strictly validated against the `generatedBriefSchema`. If the AI hallucinates fields or breaks JSON formatting, it throws a `ValidationError` rather than persisting corrupt data to Supabase.
- **Existing mitigation:** Strict Zod validation on AI responses.
- **Status:** PASS

### 8. Sensitive error leakage
- **Risk reviewed:** Are backend provider errors, stack traces, or secrets leaked to the frontend?
- **Files/components inspected:** `backend/src/app.ts`, `backend/src/ai/streamParser.ts`.
- **Finding:** Both standard API responses and Server-Sent Events (SSE) streaming paths catch errors and emit sanitised, generic messages (e.g., "Brief generation failed.") rather than raw stack traces.
- **Existing mitigation:** Global and route-level error handlers masking internal details.
- **Status:** PASS

### 9. Rate-limit / API abuse
- **Risk reviewed:** Can users brute-force the API or exhaust Anthropic quota?
- **Files/components inspected:** `backend/src/app.ts`.
- **Finding:** `express-rate-limit` enforces a global limit of 100 requests per 15 minutes, and a stricter 20 requests per 15 minutes specifically on the `/api/briefs/generate` endpoint.
- **Existing mitigation:** IP-based rate limiting.
- **Status:** PASS

### 10. CORS boundary
- **Risk reviewed:** Can arbitrary origins interact with the backend API?
- **Files/components inspected:** `backend/src/app.ts`.
- **Finding:** The `cors` middleware explicitly restricts traffic to the specific `process.env.FRONTEND_URL`, blocking unauthorized cross-origin resource sharing.
- **Existing mitigation:** Configured CORS whitelisting.
- **Status:** PASS

---

## Security Review Summary

The explicit application-code security review and pre-deployment checklist confirmed that no critical or high-severity vulnerabilities exist in the Briefly MVP. Authentication, ownership isolation (IDOR protection), input validation, and secret containment are implemented and verified in the reviewed code paths. 

**Residual Risk:**
1. **Dependency Vulnerabilities:** The two moderate React Router advisories remain an accepted residual risk. The open-redirect advisory is not currently reachable through implemented navigation paths because Briefly uses hardcoded navigation targets. The SSR hydration advisory is not applicable to the current client-rendered Vite SPA architecture because Briefly does not use SSR/hydration.
2. **AI Constraints:** While prompt-injection mitigations reduce the risk of instruction override, no system completely prevents LLM jailbreaks. Additionally, semantic hallucinations within the generated brief content remain an accepted residual risk inherent to generative AI.
3. **Availability:** The system remains reliant on Anthropic Claude API uptime and quota limits, presenting a standard third-party availability risk.

The application satisfies the security requirements for Phase 7 production deployment.

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
