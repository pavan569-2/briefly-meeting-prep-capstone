# Briefly - AI Meeting Intelligence Platform

Briefly is an AI-powered meeting intelligence platform that helps professionals prepare for meetings. By converting raw context into structured briefing documents, it ensures you walk into every meeting fully prepared while reducing manual effort.

## Features

- Secure authentication via Supabase
- AI-generated meeting briefs using Anthropic Claude
- Live streaming generation via Server-Sent Events (SSE)
- Persistent brief history and retrieval
- Follow-up meeting generation linking past context
- Data ownership protection (multi-tenant isolation)
- Responsive UI built with React and Tailwind CSS
- Backend validation using Zod
- Rate limiting to protect API resources

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React, Vite, Tailwind CSS | Provides the user interface, routing, and streaming render logic. |
| **Backend** | Node.js, Express, TypeScript | Orchestrates requests, validates data, and enforces security. |
| **Database** | Supabase PostgreSQL | Persists meeting brief history securely. |
| **Authentication** | Supabase Auth | Manages user authentication and application sessions. |
| **AI Generation** | Anthropic Claude API | Processes context to generate structured meeting briefs. |
| **Validation** | Zod | Enforces strict schema and character limits on all inputs. |
| **Testing** | Vitest, Supertest | Executes backend unit and integration test suites. |

## Project Structure

```text
briefly-meeting-prep-capstone/
|-- frontend/
|-- backend/
`-- docs/
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v11+)
- A Supabase project
- An Anthropic API key

### Installation
Clone the repository and install dependencies in both the frontend and backend directories:
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### Environment Variables
Configure the environment variables in both directories based on the provided `.env.example` files.

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=replace_with_supabase_anon_key
```

**`backend/.env`**
```env
ANTHROPIC_API_KEY=replace_with_anthropic_api_key
ANTHROPIC_MODEL=claude-sonnet-5
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace_with_supabase_service_role_key
FRONTEND_URL=http://localhost:5173
PORT=3000
```

## Running the Application

### Frontend Commands (from `frontend/`)
- `npm run dev` - Starts the Vite development server (port 5173).
- `npm run build` - Builds the application for production.
- `npm run preview` - Previews the production build locally.
- `npm run typecheck` - Runs the TypeScript compiler check.
- `npm run lint` - Runs ESLint.

### Backend Commands (from `backend/`)
- `npm run dev` - Starts the backend development server using `tsx`.
- `npm run build` - Compiles the TypeScript code to JavaScript.
- `npm run start` - Runs the compiled production server.
- `npm run test` - Runs the Vitest test suite.
- `npm run typecheck` - Runs the TypeScript compiler check.
- `npm run lint` - Runs ESLint.

## Testing
The backend implements a comprehensive testing approach using Vitest. It includes unit tests for isolated service layers and AI utilities (mocking the Anthropic SDK), and integration tests using Supertest to validate the full request lifecycle. Currently, 97 backend tests pass, verifying the core logic, API endpoints, validation, and error handling.

## Architecture Overview
Briefly implements a secure three-tier architecture:

Frontend SPA -> Backend API -> AI + Database

The React frontend handles user interaction and displays real-time SSE streams. The Express backend orchestrates the workflow, validating requests before securely communicating with the Anthropic AI service and persisting results to Supabase. This ensures sensitive credentials remain entirely on the server.

For a comprehensive breakdown, please refer to [docs/03-architecture.md](docs/03-architecture.md).

## API
The Briefly backend exposes a robust REST API for authentication and CRUD operations, alongside a specialized Server-Sent Events (SSE) endpoint (`/api/briefs/generate`) that streams generated content back to the client progressively to minimise perceived latency.

For the full endpoint specifications, refer to [docs/06-api-documentation.md](docs/06-api-documentation.md).

## Documentation

| Document | Purpose |
|---|---|
| [01 Project Proposal](docs/01-project-proposal.md) | The original idea brief and success criteria. |
| [02 PRD](docs/02-prd.md) | Detailed Product Requirements Document mapping features to user stories. |
| [03 Architecture](docs/03-architecture.md) | High-level system design and component responsibilities. |
| [04 Vibe Coding Spec](docs/04-vibe-coding-spec.md) | The original specification guiding the AI-assisted development. |
| [05 Prompt Library](docs/05-prompt-library.md) | Key AI prompts used to construct the system and capabilities. |
| [06 API Documentation](docs/06-api-documentation.md) | Comprehensive REST and Streaming API specifications. |
| [07 Security Audit](docs/07-security-audit.md) | Vulnerability assessments and remediation logs. |
| [08 Stakeholder Review](docs/08-stakeholder-review.md) | Evaluation of stakeholder UX changes against the existing implementation. |
| [09 Debugging Journal](docs/09-debugging-journal.md) | Record of major technical challenges and their resolutions. |
| [10 Retrospective](docs/10-retrospective.md) | Personal reflections and lessons learned during the capstone. |
| [11 Self-Assessment](docs/11-self-assessment.md) | Evidence-based self-assessment against the Module 15 rubric. |

## Deployment

The deployment architecture consists of a React SPA on Vercel, a Node.js API on Railway, and database/authentication via Supabase.

Deployment sequence:
1. Configure Supabase
2. Deploy backend to Railway
3. Verify backend health endpoint
4. Deploy frontend to Vercel
5. Update Railway FRONTEND_URL to the deployed Vercel origin
6. Perform final production smoke testing

### Supabase
Supabase provides authentication and the PostgreSQL database. Required credentials are listed in the Environment Variables section. Do not expose real secret values.

### Railway Backend
- **Repository:** pavan569-2/briefly-meeting-prep-capstone
- **Root Directory:** backend
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm start`

Required environment variables:
`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL`

The hosting platform provides the runtime port, and the application reads it through the environment configuration.

After deployment, verify the health endpoint via GET `/api/health`. The current production health endpoint is:
https://briefly-meeting-prep-capstone-production.up.railway.app/api/health

### Vercel Frontend
- **Repository:** pavan569-2/briefly-meeting-prep-capstone
- **Root Directory:** frontend
- **Framework:** Vite

Required environment variables:
`VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

For production, `VITE_API_BASE_URL` should point to the Railway backend base URL. Do NOT expose or suggest putting `SUPABASE_SERVICE_ROLE_KEY` in the frontend.

The file `frontend/vercel.json` contains the SPA rewrite required so React Router routes such as `/dashboard` work correctly on direct navigation and hard refresh. After obtaining the final Vercel URL, the Railway `FRONTEND_URL` should be set to that exact frontend origin so the backend CORS configuration accepts the deployed frontend.

### Production Validation
Perform a concise smoke-test checklist after deployment:
- frontend loads
- authentication works
- dashboard/history loads
- brief generation works
- SSE streaming works
- saved brief appears in history
- follow-up generation works
- direct /dashboard refresh works
- no critical browser-console errors

## Future Enhancements
- Exporting generated briefs to alternative formats (e.g., PDF).
- Direct document and file uploads to capture deeper meeting context.

## License
This project was created as part of a software engineering capstone project.
