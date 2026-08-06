# Briefly – Product Requirements Document

## Document Information
- **Title:** Briefly Product Requirements Document
- **Version:** 1.0
- **Status:** Approved
- **Date:** 2026-08-06
- **Author:** Pavan

## Product Vision & Goals
**Vision:** Empower professionals to walk into meetings fully prepared by instantly synthesising meeting context into structured intelligence.
**Goals:** Deliver a secure, responsive platform that reliably generates structured meeting briefs from manual context inputs while enforcing strict user data isolation.

## 1. Problem
Professionals often attend meetings with fragmented information spread across agendas, previous discussions, notes, and action items. Gathering and synthesising this context is time-consuming and inconsistent, reducing meeting preparedness and overall meeting effectiveness.

## 2. Users and Personas
- **Programme or Project Manager:** Needs to ensure sequential meetings maintain continuity from previous discussions and track progress effectively.
- **Consultant or Analyst:** Attends multiple high-context client meetings and requires rapid synthesis of provided context to guide structured discussions.
- **Team Lead:** Prepares for weekly syncs and 1:1s, seeking consistent structures without spending hours on administrative preparation.

## 3. User Stories
- **US1:** As a professional, I want to register for an account so that I can securely store my meeting preparation materials.
- **US2:** As a returning user, I want to log in securely so that I can access my historical meeting briefs.
- **US3:** As a returning user with an active session, I want the application to automatically restore my session so that I do not have to log in repeatedly.
- **US4:** As an authenticated user, I want to sign out so that I can end my active application session and secure my account on shared devices.
- **US5:** As a meeting attendee, I want to input my meeting title, objective, agenda, attendees, and previous notes so that the AI has the necessary context.
- **US6:** As a meeting attendee, I want to generate a structured meeting brief from my context so that I can prepare for my meeting consistently.
- **US7:** As a user generating a brief, I want to see the brief appear progressively via streaming so that I know the system is actively working.
- **US8:** As a user, I want to view a history of all my generated briefs so that I can reference past meeting preparation.
- **US9:** As a user, I want to view a saved brief in full detail so that I can review it before a meeting.
- **US10:** As a user, I want to copy the complete brief or individual sections to my clipboard so that I can easily paste them into an email or document.
- **US11:** As a user, I want to delete a brief I no longer need so that I can keep my history organised.
- **US12:** As a user, I want to generate a follow-up brief linked to a previous meeting so that the new brief automatically considers the prior discussion.
- **US13:** As a user, I want to receive clear error messages if an input is invalid or a service fails so that I understand how to correct my action.
- **US14:** As an authenticated user, I want my meeting briefs to remain private so that no other user can view or modify my meeting information.

## 4. Features and Functional Requirements
- **FR-AUTH-1 (Registration and login):** The system must authenticate users using email and password, returning an authenticated application session or a clear authentication error.
- **FR-AUTH-2 (Session restoration and protected-route enforcement):** The system must automatically restore active sessions and deny unauthenticated access to restricted views.
- **FR-AUTH-3 (Sign-out):** Sign-out ends the active application session.
- **FR-CAP-1 (Context Capture):** The system must capture meeting context with strict server-enforced length validation:
  - *Title*: 1–200 characters (Required)
  - *Objective*: 1–3,000 characters (Required)
  - *Agenda*: 1–10,000 characters (Required)
  - *Context*: up to 10,000 characters (Optional)
  - *Attendees*: up to 3,000 characters (Optional)
  - *Previous Notes*: up to 20,000 characters (Optional)
- **FR-GEN-1 (Brief Generation):** The system must process captured context through an AI service to return a structured meeting brief.
- **FR-GEN-2 (Streaming):** The system must stream the AI output progressively to the user interface.
- **FR-MGMT-1 (Brief History):** The system must retrieve and display a list of the authenticated user's briefs, sorted descending by creation date (newest first).
- **FR-MGMT-2 (View Brief):** The system must display the full content of a selected saved brief.
- **FR-MGMT-3 (Copy Brief):** The system must provide a mechanism to copy the entire brief or individual sections to the user's clipboard as plain text.
- **FR-MGMT-4 (Delete Brief):** The system must allow users to permanently delete their own briefs.
- **FR-MGMT-5 (Ownership Isolation):** The system must strictly enforce data isolation, ensuring users can only interact with briefs matching their authenticated ID.
- **FR-FOL-1 (Follow-up Linking):** The system must support generating a follow-up brief that is linked to a parent brief's identifier.
- **FR-RES-1 (Rate Limiting):** The system must enforce rate limiting per IP address (100 requests per 15 minutes globally, 20 requests per 15 minutes for generation).
- **FR-RES-2 (Error Messaging):** The system must display clear, non-technical error messages for validation failures, network issues, or rate limits.

## 5. Non-functional Requirements
- **Usability:** The application must provide responsive layouts usable on both desktop and mobile screens, and display explicit loading states for all data-fetching operations.
- **Security:** The backend must strictly isolate data so users can only access their own resources, and securely contain all third-party API credentials without exposing them to the client.
- **Performance:** AI generated briefs must stream progressively to the client to minimise perceived latency rather than blocking the UI until the full document is generated.
- **Reliability:** Core workflows must complete without crashing the application, degrading gracefully with user-facing error messages when upstream services fail. Malformed or schema-invalid AI output must not be persisted as a valid completed brief, and upstream failures must produce a recoverable user-facing state.
- **Maintainability:** The backend must include a comprehensive suite of automated unit and integration tests confirming core capabilities.
- **Compatibility:** The application should support current mainstream desktop and mobile browsers used during project validation, without requiring proprietary extensions or plugins.

## 6. Out of Scope
- Calendar integration or email ingestion.
- Meeting transcription or audio recording.
- Collaborative workspaces, live collaboration, or document sharing.
- Role-based administration or analytics dashboards.
- CRM integration or automatic action-item tracking.
- Document and file uploads.

## 7. Success Metrics
### A. Current Release Success Measures
- All must-have acceptance criteria pass.
- Backend unit and integration tests pass.
- An authenticated user can complete the end-to-end brief-generation, persistence and retrieval workflow.
- Cross-user access attempts are rejected.
- Key desktop and mobile workflows complete without critical browser-console errors.
- No high or critical vulnerabilities exist in production-deployed dependencies.

### B. Future Operational Metrics Requiring Instrumentation
*(Note: These metrics are not currently instrumented in the application and represent future operational tracking goals.)*
- Generation completion rate.
- Time to first streamed response.
- Brief-copy usage.
- Repeat use of saved briefs.

## 8. Open Questions and Assumptions
### Open Questions
- **Q1:** Is the 20,000-character limit for "previous notes" sufficient for the target personas, or will future support for direct document/file upload be necessary to capture full context?
- **Q2:** Do users frequently need to export briefs to formats other than plain text clipboard copies (e.g., PDF export, direct email integration)?

### Assumptions
- **A1:** Users are willing to manually enter meeting context (objectives, agendas, and background) into a form in return for faster, structured meeting preparation.
- **A2:** A rate limit of 20 generation requests per 15 minutes per IP provides sufficient capacity for typical user workflows without impeding genuine usage.

## 9. Constraints
- The architecture must enforce a strict separation between the client interface and the backend API.
- All AI generation must route exclusively through the backend to protect API credentials.
- Users may only access and modify resources they own.
- The product serves as a professional business tool but is not scaled or guaranteed for enterprise-grade production SLAs.

## Acceptance Criteria

### Authentication
- **AC-AUTH-1.1:** Valid credentials grant access to the application; invalid credentials display a friendly authentication error.
- **AC-AUTH-2.1:** An existing active session automatically restores upon page reload, displaying a loading state until complete.
- **AC-AUTH-2.2:** Unauthenticated attempts to access restricted routes redirect to the login interface.
- **AC-AUTH-3.1:** Triggering sign-out terminates the active session and redirects the user to the login interface.

### Meeting Context Capture
- **AC-CAP-1.1:** Submitting the context form missing required fields, or exceeding exact character limits (e.g., >200 chars for title), prevents submission and displays a specific validation error.

### AI Brief Generation
- **AC-GEN-1.1:** A valid context submission results in a fully structured briefing document containing all expected sections.
- **AC-GEN-2.1:** The interface displays generated content progressively in real-time until the document is complete.

### Brief Management
- **AC-MGMT-1.1:** The dashboard displays a list of all previously generated briefs belonging to the logged-in user, ordered with the most recently created briefs appearing at the top.
- **AC-MGMT-2.1:** Selecting a brief from the history list displays the complete document.
- **AC-MGMT-3.1:** Clicking the copy action on the full brief or a specific section successfully places the plain text content into the system clipboard.
- **AC-MGMT-4.1:** Confirming deletion permanently removes the brief from the history list and database.
- **AC-MGMT-5.1:** Any API attempt to fetch, modify, or delete a brief belonging to another user returns a generic "Not Found" error.

### Follow-up Meetings
- **AC-FOL-1.1:** When the user creates a follow-up from a valid owned parent brief, the backend retrieves that parent, includes its approved context in prompt construction, and saves the resulting brief with the parent brief identifier.

### Resilience
- **AC-RES-1.1:** Requests exceeding the IP rate limit thresholds immediately return an actionable error explaining the limit.
- **AC-RES-2.1:** Validation, authentication, network, rate-limit and upstream-service failures display clear user-facing messages without stack traces, provider errors, credentials or other internal details.

## Feature Traceability
| Functional Req ID | User Story ID | Acceptance Criteria ID |
|---|---|---|
| FR-AUTH-1 | US1, US2 | AC-AUTH-1.1 |
| FR-AUTH-2 | US3 | AC-AUTH-2.1, AC-AUTH-2.2 |
| FR-AUTH-3 | US4 | AC-AUTH-3.1 |
| FR-CAP-1 | US5 | AC-CAP-1.1 |
| FR-GEN-1 | US6 | AC-GEN-1.1 |
| FR-GEN-2 | US7 | AC-GEN-2.1 |
| FR-MGMT-1 | US8 | AC-MGMT-1.1 |
| FR-MGMT-2 | US9 | AC-MGMT-2.1 |
| FR-MGMT-3 | US10 | AC-MGMT-3.1 |
| FR-MGMT-4 | US11 | AC-MGMT-4.1 |
| FR-MGMT-5 | US14 | AC-MGMT-5.1 |
| FR-FOL-1 | US12 | AC-FOL-1.1 |
| FR-RES-1 | US13 | AC-RES-1.1 |
| FR-RES-2 | US13 | AC-RES-2.1 |
