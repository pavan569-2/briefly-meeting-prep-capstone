# Briefly – AI Meeting Intelligence Platform
# Vibe-Coding Specification

> Module 15 Capstone · Phase 1 Documentation

---

## Section 1 – Project Overview

**Briefly** is an AI-powered meeting briefing generator that prepares users for meetings in
minutes. It takes a meeting title, objective, agenda, and optional context (attendees, previous
notes, background) and uses the Anthropic Claude API to produce a structured eight-section
briefing document.

**Core user problem:** Professionals walk into meetings under-prepared because gathering context,
reviewing prior outcomes, and formulating questions takes time they do not have. Briefly
eliminates that overhead by generating a complete briefing document on demand.

### Key Capabilities

| Capability | Description |
|---|---|
| Meeting Form | Title, objective, agenda, attendees, context, previous notes |
| AI Brief Generation | Claude API via Server-Sent Events (SSE) streaming |
| Streaming Preview | Progressive display of AI output during generation |
| Brief History | Persistent list of all user briefs, ownership-isolated |
| Follow-up Linking | Parent-brief context injection for sequential meetings |
| Copy to Clipboard | Export full brief or individual sections as plain text |
| Authentication | Supabase Auth with JWT; session-aware token refresh |
| Error Handling | User-facing friendly errors; no SDK internals exposed |
| Loading States | Every data-fetching and async operation has explicit UI feedback |
| Mobile Layout | Two key screens (Login, Dashboard) fully responsive |

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express + TypeScript |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (JWT, service-role verification) |
| AI | Anthropic Claude API (streaming) |
| Validation | Zod (runtime schema validation, both layers) |
| Rate Limiting | express-rate-limit (global + per-route) |

---

## Section 2 – Architecture and Component Map

### System Architecture

```
Browser (React / Vite SPA)
        │ HTTPS REST + SSE
        ▼
Express API (Node.js / TypeScript)
        │                    │
        ▼                    ▼
Supabase (Postgres + RLS)   Anthropic Claude API
```

- The **frontend** is a static SPA. It calls the backend via REST for CRUD and SSE for generation. It connects to Supabase directly using the public anon key only for authentication state (session management).
- The **backend** holds all secrets (service-role key, Anthropic API key). It is the sole writer to the database and the sole caller of the Anthropic API.
- The **Supabase service-role key** never leaves the backend process.
- The **Anthropic API key** never leaves the backend process.

### Backend Module Map

| Module | File | Responsibility |
|---|---|---|
| Env config | `config/env.ts` | Zod-validated startup env; throws on missing vars |
| Auth middleware | `middleware/auth.ts` | JWT verification via `supabaseAdmin.auth.getUser` |
| Brief service | `briefs/briefService.ts` | All CRUD operations with ownership enforcement |
| Brief controller | `briefs/briefController.ts` | HTTP handler layer; error classification |
| Brief schemas | `briefs/briefSchemas.ts` | Zod request validation schemas |
| Prompt builder | `ai/promptBuilder.ts` | Pure prompt construction; XML-tagged user data |
| Response validator | `ai/responseValidator.ts` | AI JSON output validation via Zod |
| Stream parser | `ai/streamParser.ts` | SSE frame writers (`setupSSE`, `sendChunk`, `sendComplete`, `sendError`) |
| Brief generator | `ai/briefGenerator.ts` | Anthropic streaming wrapper; accumulates response |
| AI controller | `ai/aiController.ts` | SSE generation orchestration; abort handling |
| Supabase client | `lib/supabaseAdmin.ts` | Admin client (service-role key, no session persistence) |
| Anthropic client | `lib/anthropicClient.ts` | Anthropic SDK client |

### Frontend Component Map

| Component | Responsibility |
|---|---|
| `App.tsx` | Routing, `AuthProvider`, `ProtectedRoute` |
| `LoginPage.tsx` | Auth screen shell; login/signup toggle |
| `DashboardPage.tsx` | Central orchestration; all view state and async logic |
| `LoginForm.tsx` | Sign-in form with friendly error mapping |
| `SignupForm.tsx` | Sign-up form with friendly error mapping |
| `BriefHistory.tsx` | Sidebar list with loading/error/empty states |
| `BriefViewer.tsx` | Full brief display with delete confirmation and follow-up |
| `MeetingForm.tsx` | Meeting input form with character counts |
| `StreamingBriefPreview.tsx` | Live streaming output panel |
| `ErrorBanner.tsx` | Reusable error display with optional retry |
| `LoadingScreen.tsx` | Full-screen loading for session restore |
| `AppHeader.tsx` | App header with sign-out and new meeting action |

### API Surface

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Returns `{ status: "ok", timestamp }` |
| GET | `/api/auth/me` | JWT | Returns `{ id, email }` of authenticated user |
| GET | `/api/briefs` | JWT | List all briefs for authenticated user (summary shape) |
| GET | `/api/briefs/:id` | JWT | Fetch single brief owned by authenticated user |
| POST | `/api/briefs` | JWT | Create a new brief manually |
| PUT | `/api/briefs/:id` | JWT | Update a brief owned by authenticated user |
| DELETE | `/api/briefs/:id` | JWT | Delete a brief owned by authenticated user |
| POST | `/api/briefs/generate` | JWT + rate limit | Generate brief via AI; streams SSE |

---

## Section 3 – Security Boundaries

### Secret Containment

| Concern | Boundary |
|---|---|
| Anthropic API key | Backend process only; never referenced in frontend code |
| Supabase service-role key | Backend process only; never referenced in frontend code |
| Supabase anon key | Frontend only; safe for browser use with RLS enforced |
| CORS | Backend accepts requests only from `FRONTEND_URL` |
| Rate limiting | 100 requests / 15 minutes per IP (global); 20 / 15 min for `/generate` |
| JSON body | Express default limit (~100 KB) |
| Error responses | Stack traces and secret values are never included in HTTP responses |

### Ownership Enforcement

Although the backend uses the Supabase service-role client (which bypasses RLS at the DB layer),
ownership is enforced at the application layer on every query:
- Every query explicitly appends `.eq('user_id', req.user.id)`.
- `parent_brief_id` is verified to belong to the same user before insertion or update.
- Cross-user access is prevented by treating a missing-or-other-user row as a 404, not a 403,
  to avoid disclosing whether a brief exists for another user.

### Prompt Injection Mitigation

The system prompt instructs the model to treat all user-supplied data as passive input only.
User field values are wrapped in XML tags and the system prompt explicitly states they are
`UNTRUSTED USER DATA` that must not be interpreted as instructions.

---

## Section 4 – Task Scope (Capstone Testing Phase)

### Task Description

Close the capstone technical gap on automated testing. The application had 0 automated tests
and no test runner installed prior to this phase.

### In Scope

- Install Vitest, Supertest, and `@types/supertest` as devDependencies
- Write unit tests for every exported service-layer and AI utility function
- Write integration tests for at least 3 API endpoint groups including unauthenticated access
- Confirm all three stakeholder change requirements are satisfied (by code inspection)
- Capture `npm audit` evidence for the security audit record
- No changes to any production source file

### Out of Scope

- New product features
- Frontend automated tests (stakeholder change requirements confirmed satisfied by inspection)
- Architectural refactoring
- ADRs
- Production dependency upgrades

### Input State

- 0 automated tests
- No test runner installed
- 100% manual validation only
- All existing `npm run typecheck`, `npm run lint`, `npm run build` passing on both sides

---

## Section 5 – Constraints

| Constraint | Rationale |
|---|---|
| Tests must not call real external services | No Anthropic or Supabase credentials in CI |
| Tests must not modify production source files | Preserve verified working state |
| Strict env validation must be preserved | `env.ts` throws at startup on missing vars; tests bootstrap fake vars first |
| ESLint must apply to test files in full, no exclusions | Tests are production-quality code |
| All Vitest functions imported explicitly from `'vitest'` | `globals: false` enforced; no implicit injection |
| No frontend automated tests | Stakeholder requirements confirmed by code review |
| Approved packages only | `vitest`, `supertest`, `@types/supertest` |
| Integration tests must assert response bodies, not status codes alone | Confirms correct data flow, not just HTTP mechanics |
| Integration tests must assert dependency interactions | Confirms middleware and service are invoked or bypassed correctly |
| All mocks reset between tests | `vi.resetAllMocks()` in `beforeEach` prevents cross-test leakage |

---

## Section 6 – Acceptance Criteria and Test Coverage

### Unit Test Coverage

| Module | Functions Tested |
|---|---|
| `promptBuilder.ts` | `buildSystemPrompt`, `buildUserPrompt` |
| `responseValidator.ts` | `validateGeneratedBrief` |
| `streamParser.ts` | `setupSSE`, `sendChunk`, `sendComplete`, `sendError` |
| `briefGenerator.ts` | `generateBriefStream` |
| `briefSchemas.ts` | `generatedBriefSchema`, `createMeetingBriefSchema`, `updateMeetingBriefSchema`, `uuidParamSchema` |
| `briefService.ts` | `getBriefs`, `getBriefById`, `createBrief`, `updateBrief`, `deleteBrief`, `NotFoundError`, `ValidationError` |

### Integration Test Coverage

| Group | Endpoint | Coverage |
|---|---|---|
| 1 | `GET /api/health` | Public access, correct body |
| 2 | `GET /api/auth/me` | No header, malformed header, empty token, invalid token, valid token |
| 3 | `GET /api/briefs` | No auth, empty list, populated list, service DB error (500 sanitisation) |
| 4 | `GET /api/briefs/:id` | No auth, non-UUID param, not found, success |
| 5 | `DELETE /api/briefs/:id` | No auth, non-UUID param, not found, success (204), unexpected error (500 sanitisation) |
| 6 | `POST /api/briefs` | No auth, empty body, missing fields, invalid UUID, success (201), ValidationError (400), unexpected error (500 sanitisation) |

### Additional Criteria

- All tests pass with fake env vars only; no real credentials required
- Central 500 error handler verified: raw error messages do not appear in response bodies
- `POST /api/briefs/generate` excluded from integration tests (SSE + Anthropic dependency); covered by `briefGenerator.ts` and `streamParser.ts` unit tests

### Stakeholder Change Requirements (Confirmed by Inspection — No Code Changes Required)

| Requirement | Evidence |
|---|---|
| Clear actionable user-facing errors | `LoginForm`/`SignupForm` map raw Supabase errors; `apiClient` parses `error` JSON field; `ErrorBanner` used throughout dashboard; `sendError` in SSE path |
| Mobile-responsive layout on ≥ 2 key screens | `LoginPage`: `min-h-screen flex items-center justify-center p-4`, `max-w-sm` card. `DashboardPage`: `aside` shown/hidden via `md:block`, mobile "← Back to History" button |
| Loading state for every data-fetching operation | `historyLoading`, `detailLoading`, `isGenerating`, `isDeleting`, `submitting` — all with UI feedback. `LoadingScreen` for session restore. |

---

## Section 7 – Validation Commands and Results

### Commands Executed (in order)

```bash
git diff --check
cd backend && npm run typecheck
cd backend && npm run lint
cd backend && npm run build
cd backend && npm test
cd frontend && npm run typecheck
cd frontend && npm run lint
cd frontend && npm run build
cd backend && npm audit --omit=dev
cd backend && npm audit
cd frontend && npm audit
```

### Results

| Command | Result |
|---|---|
| `git diff --check` | ✅ Pass — LF/CRLF line-ending warnings only; no whitespace errors |
| `backend: npm run typecheck` | ✅ Pass — 0 errors (one TS2339 fixed during development) |
| `backend: npm run lint` | ✅ Pass — 0 errors (two lint errors fixed during development) |
| `backend: npm run build` | ✅ Pass — `tsc` produces `dist/` without errors |
| `backend: npm test` | ✅ 97/97 tests pass across 7 test files |
| `frontend: npm run typecheck` | ✅ Pass |
| `frontend: npm run lint` | ✅ Pass |
| `frontend: npm run build` | ✅ Pass — 95 modules, Vite |
| `backend: npm audit --omit=dev` | ✅ 0 vulnerabilities in production dependencies |
| `backend: npm audit` | ⚠️ 5 findings — devDependencies only (Vitest/Vite/esbuild toolchain) |
| `frontend: npm audit` | ⚠️ 2 moderate findings — react-router (see security audit) |

### Test Breakdown

| File | Tests |
|---|---|
| `src/ai/promptBuilder.test.ts` | 10 |
| `src/ai/streamParser.test.ts` | 5 |
| `src/ai/responseValidator.test.ts` | 8 |
| `src/ai/briefGenerator.test.ts` | 9 |
| `src/briefs/briefSchemas.test.ts` | 19 |
| `src/briefs/briefService.test.ts` | 20 |
| `src/briefs/briefs.integration.test.ts` | 26 |
| **Total** | **97** |

### Production Dependency Version Verification

Lockfile comparison confirmed no production dependency versions changed. All packages below
resolved to the same version before and after `npm install`:

| Package | Version |
|---|---|
| `@anthropic-ai/sdk` | 0.39.0 |
| `@supabase/supabase-js` | 2.112.1 |
| `cors` | 2.8.6 |
| `dotenv` | 16.6.1 |
| `express` | 4.22.2 |
| `express-rate-limit` | 7.5.1 |
| `zod` | 3.25.76 |
| `typescript` | 5.7.3 |
| `tsx` | 4.23.7 |
| `eslint` | 9.39.5 |
| `typescript-eslint` | 8.66.0 |

---

## Section 8 – Outcome

### Before This Phase

| Metric | Value |
|---|---|
| Automated tests | 0 |
| Test runner | None installed |
| Validation method | 100% manual |

### After This Phase

| Metric | Value |
|---|---|
| Automated tests | 97 |
| Test files | 7 |
| Test runner | Vitest 2.1.x |
| Integration test groups | 6 |
| `npm test` duration | < 2 seconds |
| Production source changes | 0 |
| Production dependency changes | 0 |

### Additional Outcomes

- `npm audit --omit=dev` shows 0 production vulnerabilities
- `eslint.config.mjs` required no changes: the user ran `git restore backend/eslint.config.mjs` after implementation, confirming the original ESLint config already handled explicit Vitest imports without modification
- Three linting and type failures were encountered and resolved during implementation (see `docs/09-debugging-journal.md`)
- All stakeholder change requirements confirmed satisfied by code inspection; no production changes were needed to satisfy them
- No production code required modification because the stakeholder-requested UX improvements had already been implemented in the baseline application and were confirmed through code inspection.
