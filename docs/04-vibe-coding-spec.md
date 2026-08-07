# Briefly – AI Meeting Intelligence Platform
# Vibe-Coding Specification

> Module 15 Capstone · Complete Implementation Specification

---

## 1. Overview

**Product Name:** Briefly
**Problem Being Solved:** Professionals frequently attend meetings unprepared because gathering and synthesising context from previous notes, agendas, and discussions is too time-consuming.
**Target Users:** Programme/Project Managers, Consultants, Analysts, and Team Leads who require high context for consecutive meetings.
**Core User Journey:** A user securely logs in, inputs raw meeting context into a structured form (including an optional link to a previous meeting brief), and immediately watches as an AI generates a structured, eight-section briefing document via live streaming. The brief is permanently saved to their secure, private history for future review or clipboard export.
**Overall Implementation Objective:** Build a secure, responsive, full-stack application from scratch, leveraging Supabase for authentication and persistence, and the Anthropic Claude API for high-quality, streamed generative AI.

---

## 2. Architecture

Briefly implements a secure three-tier client/server architecture:
- **Frontend:** A React Single Page Application (SPA) built with Vite, TypeScript, and Tailwind CSS. It manages client-side routing, user session state, and parses incoming Server-Sent Events (SSE).
- **Backend:** A Node.js and Express API built with TypeScript. It acts as the secure orchestration layer, handling validation, database CRUD operations, and external API requests.
- **Database & Authentication:** Supabase provides PostgreSQL for persistent data storage and Supabase Auth for identity management and JWT issuance.
- **AI Generation:** The Anthropic Claude API is invoked exclusively by the backend to produce structured briefs.
- **Streaming:** The backend streams AI responses directly to the frontend using Server-Sent Events to minimize perceived latency.
- **Validation:** Both frontend forms and backend API endpoints enforce strict character limits and type checking using Zod.
- **Ownership Enforcement:** The backend enforces multi-tenant data isolation by appending strict user ID filters to all database queries.

---

## 3. Security

The following strict security requirements governed the implementation:
- **Backend-only AI credentials:** Anthropic API keys and Supabase service-role keys must reside solely in backend environment variables and never be exposed to the client.
- **Supabase authentication:** All sensitive actions require a valid JWT issued by Supabase Auth, transmitted via the `Authorization: Bearer` header.
- **Protected API routes:** A centralized authentication middleware must intercept and reject requests lacking a valid session token.
- **Ownership enforcement:** Every database query must explicitly filter by the authenticated user's ID (`.eq('user_id', req.user.id)`). Cross-user access attempts must return a 404 Not Found to prevent data enumeration.
- **Server-side validation:** The backend must independently validate all payloads using Zod schemas, irrespective of frontend validation.
- **Rate limiting:** API endpoints must be protected by global rate limiting (100 requests / 15 mins) and strict generation limiting (20 requests / 15 mins) per IP address to prevent abuse and quota exhaustion.
- **Prompt-injection handling:** User inputs must be wrapped in XML tags within the AI system prompt and explicitly designated as untrusted, passive data.
- **Sanitized server errors:** A global error handler must intercept backend exceptions, ensuring internal stack traces and provider errors are never leaked in HTTP responses.

---

## 4. Task Scope

The implementation was driven through the following major AI coding-agent tasks:

### Task 1 — Project Foundation and Scaffolding

**Objective**
Establish the monorepo structure, initialize the frontend and backend frameworks, and configure strict TypeScript and linting environments.

**Composer Prompt (Reconstructed implementation prompt)**
```text
Create the foundational project structure for 'briefly-meeting-prep-capstone'. 
Set up a monorepo with two directories: 'frontend' and 'backend'.
In 'frontend', initialize a React SPA using Vite, TypeScript, and Tailwind CSS. 
In 'backend', initialize a Node.js Express server with TypeScript and tsx for development.
Configure ESLint across both directories.
Create .env.example files for both, ensuring the frontend has VITE_API_BASE_URL and the backend has PORT.
Verify that both applications can start and communicate with a basic /api/health endpoint.
```

**Expected Files / Components**
`package.json`, `frontend/vite.config.ts`, `frontend/tailwind.config.js`, `backend/src/app.ts`, `backend/src/index.ts`.

**Completion Condition**
Both frontend and backend development servers start successfully, and the frontend can fetch data from the backend `/api/health` route without CORS issues.

### Task 2 — Authentication and Protected Routing

**Objective**
Integrate Supabase Auth on the frontend and implement JWT verification middleware on the backend.

**Composer Prompt (Reconstructed implementation prompt)**
```text
Implement Supabase authentication across the application.
On the frontend, integrate @supabase/supabase-js. Create a Login and Signup page with email/password authentication. Build an AuthProvider context to manage the session state and a ProtectedRoute component to restrict access to the dashboard.
On the backend, create an Express middleware (middleware/auth.ts) that extracts the Bearer token, verifies it using the Supabase Admin SDK, and attaches the user object to the request.
Apply this middleware to a new /api/auth/me endpoint to verify it works.
Ensure user-friendly error messages are displayed on login failure.
```

**Expected Files / Components**
`frontend/src/contexts/AuthContext.tsx`, `frontend/src/pages/LoginPage.tsx`, `backend/src/middleware/auth.ts`, `backend/src/lib/supabaseAdmin.ts`.

**Completion Condition**
A user can register, log in, view the protected dashboard, and make an authenticated request to the backend that is successfully intercepted and verified by the middleware.

### Task 3 — Database Schema and Secure CRUD API

**Objective**
Define the PostgreSQL schema for meeting briefs and implement secure backend CRUD operations with Zod validation.

**Composer Prompt (Reconstructed implementation prompt)**
```text
Implement the database and API layer for Meeting Briefs.
First, provide the SQL migration to create a 'briefs' table in Supabase with fields: id, user_id (uuid), title, objective, agenda, context, attendees, previous_notes, generated_brief (jsonb), parent_brief_id (uuid), and created_at.
Next, create Zod schemas (briefSchemas.ts) enforcing strict character limits on all inputs (e.g. title max 200).
Finally, implement the Express router (briefRouter.ts) and controller (briefController.ts) for GET, POST, PUT, and DELETE operations. 
CRITICAL: Every database query in briefService.ts MUST append `.eq('user_id', req.user.id)` to strictly enforce ownership isolation.
```

**Expected Files / Components**
`backend/src/briefs/briefSchemas.ts`, `backend/src/briefs/briefService.ts`, `backend/src/briefs/briefController.ts`, `supabase/migrations/`.

**Completion Condition**
The backend API exposes fully functional, validated, and ownership-isolated CRUD endpoints for meeting briefs.

### Task 4 — AI Generation and SSE Streaming

**Objective**
Integrate the Anthropic Claude API to generate meeting briefs and stream the response to the frontend using Server-Sent Events.

**Composer Prompt (Reconstructed implementation prompt)**
```text
Implement the AI brief generation pipeline via SSE.
Create a promptBuilder that takes the validated meeting context and wraps user inputs in XML tags, instructing the model to output a structured JSON brief (Executive Summary, Action Items, etc.).
Create a new endpoint `POST /api/briefs/generate` protected by a specific rate limiter (20 req/15 min).
Use the Anthropic SDK to call Claude with streaming enabled. 
Implement streamParser.ts to pipe the AI output back to the Express response using Server-Sent Events format (`data: {"type": "chunk", "text": "..."}`).
Upon completion, validate the final JSON, save it to the database using briefService, and emit a `complete` event with the new brief ID.
```

**Expected Files / Components**
`backend/src/ai/promptBuilder.ts`, `backend/src/ai/briefGenerator.ts`, `backend/src/ai/streamParser.ts`, `backend/src/ai/aiController.ts`.

**Completion Condition**
The generation endpoint successfully accepts a meeting context payload, securely calls Anthropic, streams text chunks back to the client, persists the result, and gracefully handles aborts.

### Task 5 — Frontend Application Workflow

**Objective**
Build the core UI components for creating meetings, streaming brief previews, and managing brief history.

**Composer Prompt (Reconstructed implementation prompt)**
```text
Build the frontend dashboard workflow.
Create a MeetingForm component capturing all necessary context fields with Zod validation matching the backend.
Create a StreamingBriefPreview component that connects to `/api/briefs/generate` using the Fetch API, parses the SSE stream, and progressively renders the Markdown chunks.
Create a BriefHistory sidebar that lists past briefs, and a BriefViewer component to display a saved brief in full with options to Copy to Clipboard or Delete.
Ensure all async operations have explicit loading states and error boundaries. Make the layout responsive for mobile screens.
```

**Expected Files / Components**
`frontend/src/components/MeetingForm.tsx`, `frontend/src/components/StreamingBriefPreview.tsx`, `frontend/src/components/BriefHistory.tsx`, `frontend/src/components/BriefViewer.tsx`.

**Completion Condition**
A user can seamlessly fill out the meeting form, watch the brief generate in real-time, view their past briefs in the sidebar, and delete unwanted briefs, all within a responsive layout.

### Task 6 — Follow-up Brief Functionality

**Objective**
Implement the ability to generate a new meeting brief linked to the context of a previous meeting.

**Composer Prompt (Reconstructed implementation prompt)**
```text
Add support for follow-up meetings.
Update the backend `generate` endpoint to accept an optional `parentBriefId`. If provided, fetch the parent brief, verify it belongs to the user, and inject its `generated_brief` content into the AI prompt to inform the new meeting.
Update the frontend BriefViewer to include a "Create Follow-up" action, which pre-fills the new MeetingForm and passes the parent ID to the generation request.
```

**Expected Files / Components**
`backend/src/ai/promptBuilder.ts`, `backend/src/ai/aiController.ts`, `frontend/src/components/BriefViewer.tsx`.

**Completion Condition**
Generating a brief from a parent context successfully incorporates the prior meeting's outcomes into the new structured intelligence, and the new brief saves the parent ID relation.

### Task 7 — Automated Testing and Capstone Validation

**Objective**
Close the capstone technical gaps by implementing a comprehensive backend test suite and validating stakeholder requirements.

**Composer Prompt**
```text
We are continuing the existing Briefly application as the Module 15 capstone.
You are in PLAN MODE only.
Goal: Create an implementation plan to close the remaining technical capstone gaps.
Requirements:
- Install Vitest, Supertest, and @types/supertest.
- Write unit tests for all exported service-layer and AI utility functions.
- Write integration tests for at least 3 API endpoint groups.
- Mocks must isolate Supabase and Anthropic (no real credentials used).
- Confirm the mandatory stakeholder UX change requirements are satisfied by code inspection (clear errors, loading states, mobile responsiveness).
Provide the complete plan for review before making any file changes.
```

**Expected Files / Components**
`backend/src/ai/*.test.ts`, `backend/src/briefs/*.test.ts`, `backend/src/test-utils/`, `backend/vitest.config.ts`, `backend/package.json`, `backend/package-lock.json`.

**Completion Condition**
97/97 backend tests pass without requiring real API credentials, proving the reliability of the application logic, error handling, and ownership enforcement.

---

## 5. Constraints

The following constraints were strictly enforced during the implementation:
- **Client/Server Separation:** The React SPA must remain independent of the Node Express backend to ensure secrets are never bundled into client code.
- **Backend-only Secrets:** API keys and service-role keys must only exist in the backend environment.
- **Authenticated Ownership Model:** A brief can only exist if tied to a specific `user_id`. There is no global or anonymous brief access.
- **No Speculative Feature Expansion:** The application must remain focused on the core MVP outlined in the PRD (no calendar integration, no live collaboration).
- **Test Isolation:** Automated tests must utilize mock configurations exclusively to prevent accidental API quota usage or database pollution during CI/CD.
- **No Unnecessary Infrastructure:** The deployment must rely on straightforward static hosting and a standard Node process without inventing unverified microservices or caching layers.

---

## 6. Acceptance Criteria

The system implementation satisfies the following critical acceptance criteria mapped to the PRD:
- **Authentication:** Valid credentials grant access; unauthenticated attempts to access restricted routes redirect to the login interface.
- **Context Capture:** Submitting the context form missing required fields or exceeding exact character limits prevents submission and displays a specific validation error.
- **Generation & Streaming:** A valid context submission successfully triggers the AI, and the interface displays generated content progressively in real-time until the document is complete.
- **Persistence & History:** The dashboard displays a list of all previously generated briefs belonging to the logged-in user, ordered newest first.
- **Deletion:** Confirming deletion permanently removes the brief from the history list and database.
- **Ownership Isolation:** Any API attempt to fetch, modify, or delete a brief belonging to another user returns a generic "Not Found" error.
- **Follow-up Generation:** Generating a follow-up retrieves the valid owned parent brief and incorporates its context into the prompt construction.
- **Responsive Behaviour & Loading States:** Core workflows function without overlapping elements on mobile, and explicit visual loading states are presented for all data fetching.
- **Security:** Validation, authentication, network, and upstream-service failures display clear user-facing messages without exposing stack traces or provider errors.

---

## 7. Validation

The implementation was rigorously validated using the following methods supported by repository evidence:
- **TypeScript Typecheck:** `npm run typecheck` executed in both frontend and backend directories, returning 0 errors.
- **ESLint:** `npm run lint` executed across both directories, confirming strict adherence to style guidelines.
- **Production Build:** `npm run build` executed successfully, generating the compiled `dist` folder via `tsc` and `vite build`.
- **Backend Unit Tests:** 71 unit tests utilizing Vitest validating all exported utility and service functions (e.g., `promptBuilder`, `briefService`).
- **Integration Tests:** 26 integration tests utilizing Supertest verifying all standard API routes, ensuring 500 error sanitization and 401/404 handling.
- **Total Backend Test Suite:** 97 tests passing securely in under 2 seconds.
- **NPM Audit:** Security review confirmed `npm audit --omit=dev` yielded 0 vulnerabilities in backend production dependencies. The frontend has two remaining moderate React Router advisories. They were assessed against the current Briefly architecture: the open-redirect issue is not currently reachable through implemented navigation paths, and the SSR hydration issue is not applicable to the current client-rendered Vite SPA architecture. They remain accepted residual moderate risk pending a compatible upgrade.
- **Manual Ownership Testing:** Confirmed that attempting to access a valid UUID belonging to another user correctly returns a 404 response to prevent enumeration.

---

## 8. Outcome

The complete Briefly application MVP was successfully implemented. The foundation, secure data access, streaming AI generation, and frontend interactive workflows were built and wired together safely. 

During the Capstone Phase gap closure, a comprehensive 97-test Vitest and Supertest suite was introduced to guarantee the reliability of the backend architecture. All stakeholder-requested UX improvements (mobile responsiveness, loading states, actionable errors) were verified via code inspection, proving that **no production code modification was required** because the requested UX elements were already successfully incorporated into the baseline implementation. The system is functionally complete, thoroughly tested, and accurately documented according to the capstone requirements.
