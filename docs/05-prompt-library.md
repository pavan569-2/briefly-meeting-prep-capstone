# Briefly – Prompt Library

> Annotated record of AI prompts used across all implementation phases.
> Prompts are added in order of use. Later phase prompts will be appended as each phase is completed.

---

## How to Read This Document

Each prompt entry documents:

| Field | Meaning |
|---|---|
| **Purpose** | Why this prompt was written; what decision or output it drives |
| **Target component** | Which part of the system the prompt addresses |
| **Constraints** | Explicit limits placed on the AI in the prompt |
| **Expected output** | What a successful response looks like |
| **How it was used** | Whether it was submitted as-is, iterated upon, or used as a specification |

Prompts are numbered by phase (first digit) and sequence within the phase (second digit).

---

## Phase 1 – Testing Infrastructure (Capstone Gap Closure)

### Prompt 1.1 – Initial Testing Implementation Plan

**Purpose:**
Request a complete, inspected implementation plan for closing five identified capstone technical
gaps. The prompt is written in plan-mode-only to prevent premature code generation. It provides
all constraints, approved tools, and structural requirements so the AI can produce a plan that
is ready for review without back-and-forth clarification.

**Target component:**
Backend test infrastructure, all service-layer and AI utility unit tests,
and at least three API integration test groups.

**Constraints:**
- Inspect the repository before proposing changes
- Provide the complete implementation plan before editing anything
- List every file to create or modify
- Identify every exported service-layer function and define its unit-test coverage
- Define at least 3 API endpoint integration-test groups including unauthenticated access
- Explain how Supabase, Anthropic, authentication, and service dependencies will be mocked
- Tests must not call real external services or require real credentials
- Preserve strict production environment validation
- Preserve ownership checks, validation, rate limiting, and existing production behaviour
- Assess loading states, mobile responsiveness, and user-facing errors across the current frontend
- Separate: (A) required test infrastructure, (B) required tests, (C) any necessary production fixes
- Do not add frontend automated tests unless a specific capstone requirement cannot be satisfied by backend tests
- Do not add new product features
- Keep refactoring minimal
- Approved testing tools: Vitest, Supertest, @types/supertest
- Include exact validation commands

**Expected output:**
A structured implementation plan document with named sections covering infrastructure, unit
tests, integration tests, mock strategies, security audit steps, and validation commands.
Plan to be presented in full before any file editing begins.

**How it was used:**
Submitted as a plan-mode-only prompt. Produced the initial implementation plan. Reviewed by
the user and found to require four corrections before it could be approved.

**Full prompt text:**

```
We are continuing the existing Briefly application as the Module 15 capstone.

Repository:
briefly-meeting-prep-capstone

Application positioning:
Briefly – AI Meeting Intelligence Platform

You are in PLAN MODE only.
Do not edit files, install packages, or generate implementation code.

Goal:
Create the smallest maintainable implementation plan required to close the remaining technical capstone gaps without adding unnecessary product features.

Known existing capabilities:
- React + TypeScript frontend
- Express + TypeScript backend
- Supabase PostgreSQL
- Supabase authentication
- ownership-protected brief CRUD
- Claude API integration
- streaming SSE generation
- persistent brief history
- follow-up briefs
- responsive UI
- loading states
- user-facing error handling
- Zod validation
- rate limiting
- deployed architecture
- no automated test framework currently installed

Capstone technical gaps to address:
1. Unit tests for all service-layer functions.
2. Integration tests for at least 3 API endpoints.
3. Security review and npm audit evidence.
4. Confirm the mandatory stakeholder change requirements are fully satisfied:
   - clear actionable user-facing errors
   - mobile-responsive layout on at least 2 key screens
   - loading state for every data-fetching operation
5. Make only genuinely necessary fixes discovered during review.

Approved testing tools:
- Vitest
- Supertest
- @types/supertest

Planning requirements:
- Inspect the repository before proposing changes.
- Provide the COMPLETE implementation plan before editing anything.
- List every file to create or modify.
- Identify every exported service-layer function and define its unit-test coverage.
- Define at least 3 API endpoint integration-test groups, including unauthenticated access.
- Explain how Supabase, Anthropic, authentication, and service dependencies will be mocked.
- Tests must not call real external services or require real credentials.
- Preserve strict production environment validation.
- Preserve ownership checks, validation, rate limiting, and existing production behaviour.
- Assess loading states, mobile responsiveness, and user-facing errors across the current frontend.
- Clearly separate:
  A. required test infrastructure
  B. required tests
  C. any production fixes that are actually necessary
- Do not add frontend automated tests unless you identify a specific capstone requirement that backend tests cannot satisfy.
- Do not add new product features.
- Keep refactoring minimal.
- Include exact validation commands:
  git diff --check
  backend: npm run typecheck
  backend: npm run lint
  backend: npm run build
  backend: npm test
  frontend: npm run typecheck
  frontend: npm run lint
  frontend: npm run build

Stop after presenting the plan and wait for approval.
```

---

### Prompt 1.2 – Revised Testing Implementation Plan

**Purpose:**
Incorporate four specific corrections into the plan identified by the user during review of
Prompt 1.1. The revision maintains plan-mode-only and produces a replacement plan that is
then approved and used directly as the implementation specification.

**Target component:**
Same as Prompt 1.1, with four targeted corrections to test methodology, file coverage,
integration test depth, and ESLint configuration.

**Constraints:**
All original constraints from Prompt 1.1, plus four specific corrections:
1. ESLint must apply to test files in full — no ignore patterns; tests must explicitly import Vitest functions rather than use globals
2. Add unit tests for `backend/src/ai/briefGenerator.ts` and its exported `generateBriefStream` function; mock Anthropic and `sendChunk`; cover streamed accumulation, ignored non-text events, correct SDK arguments, returned full response, and propagated errors/aborts
3. Add `backend/package-lock.json` to the complete modified-file list because dependency installation will update it
4. Integration tests must assert response bodies and dependency interactions, not status codes alone; include central 500 sanitisation; reset all mocks between tests

**Expected output:**
A complete revised plan replacing the initial plan. Same structure and level of detail, with
the four corrections fully incorporated throughout. Still plan-mode only — no implementation.

**How it was used:**
Submitted immediately after reviewing the initial plan. The AI produced a revised plan that
the user then approved with "proceed with implementation exactly as planned." The revised plan
was used as the direct specification for all implementation work.

**Full prompt text:**

```
Revise the plan before implementation:

1. Do not ignore test files in ESLint. Tests must be linted and should explicitly import Vitest functions rather than use globals.
2. Add unit tests for backend/src/ai/briefGenerator.ts and its exported generateBriefStream function. Mock Anthropic and sendChunk; cover streamed accumulation, ignored non-text events, correct SDK arguments, returned full response, and propagated errors/aborts.
3. Add backend/package-lock.json to the complete modified-file list because dependency installation will update it.
4. Integration tests must assert response bodies and dependency interactions, not status codes alone. Include central 500 sanitisation and reset all mocks between tests.

Return the revised COMPLETE plan only. Do not implement yet.
```

---

*Later phase prompts will be appended here as subsequent implementation phases are completed.*
