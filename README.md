# Briefly – AI Meeting Prep Assistant

> AI-powered briefing generator that prepares you for meetings in minutes.

## Overview

Briefly takes a meeting title, attendee list, date, and free-text context, then uses an AI model to generate a structured briefing document so you walk into every meeting prepared.

## Repository Layout

```
briefly-meeting-prep/
├── frontend/          # React · TypeScript · Vite · Tailwind CSS v4
├── backend/           # Node · Express · TypeScript
└── supabase/
    └── migrations/    # Supabase SQL migration files
```

## Architecture

```
Browser (React/Vite)
    │  HTTPS  │  REST
    ▼          ▼
Express API (Node/TypeScript)
    │               │
    ▼               ▼
Supabase        Anthropic Claude
(Postgres + RLS)  (brief generation)
```

- The **frontend** is a static SPA served independently. It communicates with the backend via REST and connects to Supabase directly using the public anon key for any row-level-secure reads.
- The **backend** holds all secrets (service-role key, Anthropic API key). It is the only process that writes to Supabase and calls the Anthropic API.
- The **Supabase service-role key** never leaves the backend process.
- The **Anthropic API key** never leaves the backend process.

## Local Development

### Prerequisites
- Node.js ≥ 20
- npm ≥ 10

### Frontend Workflow

The authenticated dashboard provides:
1. **Meeting Form**: Define your objective, agenda, and optional context.
2. **AI Streaming**: Progressively displays AI-generated summaries via SSE.
3. **Follow-up Linking**: Visually link sequential meetings, preserving contextual parent data for the backend AI prompt.
4. **Brief History**: View previously generated meeting briefs and follow-ups.
5. **Copy Actions**: Export the full meeting brief or individual sections directly to your clipboard in a deterministic plain text format.

## Local Testing

1. Ensure the Supabase backend configuration (`.env`) is valid.
2. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```
3. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```
4. Access the UI at `http://localhost:5173`.
5. *Note: Full integration testing requires real Anthropic and Supabase credentials. Do not treat local execution as fully tested for production without smoke testing these dependencies.*

### Backend

```bash
cd backend
cp .env.example .env          # fill in real values
npm install
npm run dev                   # http://localhost:3000
```

## Available Scripts

| Package | Command | Description |
|---------|---------|-------------|
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run build` | Production bundle |
| frontend | `npm run typecheck` | TypeScript type check |
| frontend | `npm run lint` | ESLint |
| backend | `npm run dev` | tsx watch mode |
| backend | `npm run build` | Compile to `dist/` |
| backend | `npm run typecheck` | TypeScript type check |
| backend | `npm run lint` | ESLint |
| backend | `npm start` | Run compiled output |

## API

### Implemented

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check — returns `{"status":"ok","timestamp":"…"}` |
| GET | `/api/auth/me` | Validates JWT and returns `{ id, email }` |
| GET | `/api/briefs` | List all briefs for the authenticated user |
| GET | `/api/briefs/:id` | Fetch a single brief owned by the user |
| POST | `/api/briefs` | Create a new meeting brief manually |
| PUT | `/api/briefs/:id` | Update a brief owned by the user |
| DELETE | `/api/briefs/:id` | Delete a brief owned by the user |
| POST | `/api/briefs/generate` | Generate a new brief via AI (Server-Sent Events) |

### AI Generation (POST `/api/briefs/generate`)
This endpoint accepts a strict JSON body with meeting details (title, objective, agenda, optional context, attendees, previousNotes, and parentBriefId).
- **Authentication**: Required (`Authorization: Bearer <token>`).
- **Rate Limit**: Dedicated limit of 20 requests per 15 minutes per IP.
- **Streaming (SSE)**: Streams Anthropic Claude text deltas as Server-Sent Events using exactly this format:
  - `data: {"type":"chunk","text":"..."}`
  - `data: {"type":"complete","briefId":"<uuid>"}` (Fires only after successful DB insertion)
  - `data: {"type":"error","message":"<Sanitized error>"}`
- **Persistence**: Automatically saved to the database *only* if the final AI JSON output strictly passes Zod schema validation. Incomplete or malformed JSON is never saved.
- **Security**: The backend explicitly controls the system prompt, model, and token limits. Client payloads are fully sandboxed.

## Database & Ownership

### Meeting Briefs Schema
The `meeting_briefs` table holds all user-generated meeting context and the AI-generated JSON brief.
- Contains references to `auth.users(id)` and a self-reference `parent_brief_id`.
- The `generated_brief` JSONB column stores the 8 required AI output sections.

### Row Level Security (RLS)
The database enforces strict RLS policies on `meeting_briefs`:
- No public or anonymous access is allowed.
- `SELECT`, `INSERT`, `UPDATE`, and `DELETE` are tightly bound to `auth.uid() = user_id`.

### Backend Defense in Depth
While the backend uses the Supabase service-role client (which bypasses RLS), **mandatory ownership filtering** is enforced at the application level:
- Every query explicitly appends `.eq('user_id', req.user.id)`.
- Client payloads attempting to forge ownership fields are strictly rejected.
- `parent_brief_id` is verified to belong to the exact same user before insertion/update.

### Applying Migrations
Apply the database schema locally using the Supabase CLI:
```bash
npx supabase db push
```
*(Requires a linked Supabase project)*

## Security Boundaries

| Concern | Boundary |
|---------|---------|
| Anthropic API key | Backend only — never referenced in frontend code |
| Supabase service-role key | Backend only — never referenced in frontend code |
| Supabase anon key | Frontend only — safe for browser use with RLS enforced |
| CORS | Backend accepts requests only from `FRONTEND_URL` |
| Rate limiting | 100 requests / 15 minutes per IP (global) |
| JSON body | Express default limit (~100 KB) |
| Error responses | Stack traces and secret values are never included in HTTP responses |
