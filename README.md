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

### Frontend

```bash
cd frontend
cp .env.example .env          # fill in real values
npm install
npm run dev                   # http://localhost:5173
```

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

### Planned (future tasks)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/briefs` | Create a new meeting brief and trigger AI generation |
| GET | `/api/briefs` | List all briefs for the authenticated user |
| GET | `/api/briefs/:id` | Fetch a single brief with its generated content |

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
