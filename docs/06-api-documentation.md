# Briefly – API Documentation

## Document Information
- **Title:** Briefly API Documentation
- **Version:** 1.0
- **Status:** Approved
- **Date:** 2026-08-06
- **Author:** Pavan

## 1. API Overview
The Briefly API is a stateless backend orchestration layer that facilitates the capture of meeting context, streaming of AI-generated briefs, and secure persistence of historical meeting data. It exposes standard REST endpoints for CRUD operations and a dedicated Server-Sent Events (SSE) streaming endpoint for low-latency generation previews.

Authentication is strictly enforced across all business endpoints via Supabase JWTs. The API embraces a robust validation philosophy: all incoming requests must conform to rigid character limits and type schemas enforced by Zod. Malformed requests are rejected immediately, protecting the backend AI integrations and database from invalid or oversized payloads.

## 2. Authentication
The Briefly backend delegates identity management to Supabase Auth.
- **Authenticated routes:** All endpoints under `/api/briefs` and `/api/auth/me` require a valid JWT.
- **Public routes:** The `/api/health` endpoint is fully public.
- **Authorization header requirements:** Authenticated requests must include the JWT in the standard `Authorization: Bearer <token>` format.
- **Authentication failures:** Requests lacking a token, or providing an expired/invalid token, will be rejected with a `401 Unauthorized` status and will not proceed to routing or validation.

## 3. API Endpoints

### Health
- **Method:** GET
- **Path:** `/api/health`
- **Purpose:** Verifies that the backend process is running and responsive.
- **Authentication Required:** No
- **Request Body:** None
- **Path Parameters:** None
- **Query Parameters:** None
- **Successful Response:** `200 OK` with JSON payload `{ "status": "ok", "timestamp": "<ISO-8601-date>" }`.
- **Common Error Responses:** None.
- **Validation Notes:** Fully public.

### Current User
- **Method:** GET
- **Path:** `/api/auth/me`
- **Purpose:** Returns the authenticated user's ID and email, verifying that the provided JWT is valid.
- **Authentication Required:** Yes
- **Request Body:** None
- **Path Parameters:** None
- **Query Parameters:** None
- **Successful Response:** `200 OK` with JSON payload `{ "id": "<uuid>", "email": "<string>" }`.
- **Common Error Responses:** `401 Unauthorized`.
- **Validation Notes:** Depends entirely on the JWT payload.

### Generate Brief (Streaming)
- **Method:** POST
- **Path:** `/api/briefs/generate`
- **Purpose:** Validates context, triggers the AI generation process, and streams the output progressively back to the client. Upon completion, the backend saves the brief and returns its ID.
- **Authentication Required:** Yes
- **Request Body:**
  - `title` (string, required)
  - `objective` (string, required)
  - `agenda` (string, required)
  - `context` (string, optional)
  - `attendees` (string, optional)
  - `previousNotes` (string, optional)
  - `parentBriefId` (string/UUID, optional)
- **Path Parameters:** None
- **Query Parameters:** None
- **Successful Response:** `200 OK` with `Content-Type: text/event-stream`.
- **Common Error Responses:** `400 Bad Request` (validation failed), `401 Unauthorized`, `404 Not Found` (parent brief invalid or unowned), `429 Too Many Requests`.
- **Validation Notes:** Request body omits the `generatedBrief` field.

### Create Brief
- **Method:** POST
- **Path:** `/api/briefs`
- **Purpose:** Manually creates a new brief (typically handled internally by the Generate endpoint, but exposed as standard CRUD).
- **Authentication Required:** Yes
- **Request Body:** Same as Generate, but must include `generatedBrief` object containing summary, objectives, action items, etc.
- **Path Parameters:** None
- **Query Parameters:** None
- **Successful Response:** `201 Created` with the saved brief JSON object.
- **Common Error Responses:** `400 Bad Request`, `401 Unauthorized`.
- **Validation Notes:** Full strict validation on input fields and generated structure.

### List Brief History
- **Method:** GET
- **Path:** `/api/briefs`
- **Purpose:** Retrieves a chronologically sorted list (newest first) of all briefs owned by the authenticated user.
- **Authentication Required:** Yes
- **Request Body:** None
- **Path Parameters:** None
- **Query Parameters:** None
- **Successful Response:** `200 OK` with an array of brief JSON objects.
- **Common Error Responses:** `401 Unauthorized`.
- **Validation Notes:** Results are strictly filtered by the authenticated user's ID.

### Get Brief Detail
- **Method:** GET
- **Path:** `/api/briefs/:id`
- **Purpose:** Retrieves the full content of a specific brief.
- **Authentication Required:** Yes
- **Request Body:** None
- **Path Parameters:** `id` (UUID, required)
- **Query Parameters:** None
- **Successful Response:** `200 OK` with the brief JSON object.
- **Common Error Responses:** `400 Bad Request` (invalid UUID format), `401 Unauthorized`, `404 Not Found` (brief does not exist or does not belong to user).
- **Validation Notes:** Checks UUID format before database query.

### Update Brief
- **Method:** PUT
- **Path:** `/api/briefs/:id`
- **Purpose:** Updates one or more fields of an existing brief.
- **Authentication Required:** Yes
- **Request Body:** Partial payload of the Create Brief schema. Must contain at least one field to update.
- **Path Parameters:** `id` (UUID, required)
- **Query Parameters:** None
- **Successful Response:** `200 OK` with the updated brief JSON object.
- **Common Error Responses:** `400 Bad Request` (empty payload, invalid data, or invalid UUID), `401 Unauthorized`, `404 Not Found`.
- **Validation Notes:** Strict partial validation.

### Delete Brief
- **Method:** DELETE
- **Path:** `/api/briefs/:id`
- **Purpose:** Permanently deletes a specific brief owned by the user.
- **Authentication Required:** Yes
- **Request Body:** None
- **Path Parameters:** `id` (UUID, required)
- **Query Parameters:** None
- **Successful Response:** `204 No Content`.
- **Common Error Responses:** `400 Bad Request` (invalid UUID format), `401 Unauthorized`, `404 Not Found`.
- **Validation Notes:** UUID is validated before execution.

## 4. Streaming API
The generation endpoint (`/api/briefs/generate`) utilises Server-Sent Events (SSE).
- **Connection:** The client establishes a POST request; the server responds with a `200 OK` and sets `Content-Type: text/event-stream`.
- **Streaming behaviour:** As the AI generates text, the server pushes JSON payloads prefixed with `data: `.
  - `{"type": "chunk", "text": "..."}`
- **Completion event:** When generation and database persistence succeed, the server sends:
  - `{"type": "complete", "briefId": "<uuid>"}` and closes the connection.
- **Error event:** If generation fails after the stream opens, the server sends:
  - `{"type": "error", "message": "Brief generation failed."}` and closes the connection.
- **Client expectations:** The client must parse the incoming text stream into distinct JSON payloads, appending `chunk` text to the UI and redirecting upon `complete`.

## 5. Error Handling

| Status Code | Meaning | Typical Cause | User Behaviour |
|---|---|---|---|
| 400 | Bad Request | Request failed Zod schema validation (e.g., character limit exceeded, missing required fields, invalid UUID). | Correct the input form data and resubmit. |
| 401 | Unauthorized | Missing, expired, or invalid JWT in Authorization header. | Redirect to the login page to authenticate. |
| 404 | Not Found | Resource does not exist, or the authenticated user does not own the requested resource. | Navigate back to the main dashboard. |
| 429 | Too Many Requests | Exceeded the 100 req/15 min global limit or 20 req/15 min generation limit per IP. | Wait the required timeframe before attempting the action again. |
| 500 | Internal Server Error | Unexpected failure in backend systems or third-party service integration. | Wait and retry later. |

## 6. Validation
- **Server validation:** All incoming requests are structurally validated using Zod schemas before hitting business logic.
- **Required fields:** `title`, `objective`, and `agenda` must be provided for generation and creation.
- **Length limits:** Strict server-side bounds are enforced. `title` (max 200 chars), `objective` (max 3,000 chars), `agenda` and `context` (max 10,000 chars), `attendees` (max 3,000 chars), `previousNotes` (max 20,000 chars).
- **Invalid requests:** Requests violating constraints are immediately rejected with a 400 status and a JSON payload detailing the exact failing fields.

## 7. Security Considerations
- **Authentication:** Verified securely via Supabase JWT middleware on all sensitive routes.
- **Ownership:** Multi-tenant separation is guaranteed at the application level; queries always filter by the authenticated user's ID, returning generic 404s for cross-user attempts.
- **Validation:** Strict character limits prevent oversized payloads from executing denial-of-service attacks or triggering upstream payload limits.
- **Rate limiting:** Express rate limiting restricts brute-force attempts globally and limits expensive AI generation calls via IP tracking.
- **Error sanitisation:** The global error handler intercepts faults to ensure stack traces and internal provider details are never leaked in 500 responses.
- **Secret containment:** Anthropic AI API keys and Supabase service-role credentials reside solely in the backend server memory and environment variables.

## 8. Example Workflow

1. **Login:** Client obtains JWT via Supabase Auth.
2. **Create meeting:** Client captures meeting details into a JSON payload.
3. **Generate brief:** Client POSTs payload to `/api/briefs/generate` with the JWT.
4. **Streaming:** Server returns a `text/event-stream` response, pushing text chunks progressively.
5. **Save:** Server completes AI generation, saves to database, and streams the `complete` event containing the ID.
6. **History:** Client GETs `/api/briefs` to retrieve the updated brief list.
7. **View:** Client GETs `/api/briefs/:id` to display the fully generated document.
8. **Delete:** Client DELETEs `/api/briefs/:id` to remove the document from history.
