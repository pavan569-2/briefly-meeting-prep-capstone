# Briefly – Debugging Journal

> Records genuine implementation failures encountered during vibe-coding sessions.
> Entries are added only when real failures occur. No invented entries.

---

## Entry Format

Each entry follows this fixed format:

1. **What happened** – the observable symptom, including the exact error message
2. **Failure pattern** – category of the failure
3. **Diagnosis** – root cause
4. **Exact recovery** – the specific fix applied, with code
5. **Outcome** – result after the fix
6. **Prevention lesson** – what to do differently next time

---

## Phase 1 – Testing Infrastructure (2026-08-06)

---

### Entry 1.1 — TypeScript TS2339: Property 'maybeSingle' Does Not Exist on Mocked Supabase Chain

**What happened:**

`npm run typecheck` failed immediately after `briefService.test.ts` was created.

```
src/briefs/briefService.test.ts(180,21): error TS2339: Property 'maybeSingle' does not
exist on type 'PostgrestQueryBuilder<any, any, any, "meeting_briefs", unknown>'.

src/briefs/briefService.test.ts(184,33): error TS2339: Property 'maybeSingle' does not
exist on type 'PostgrestQueryBuilder<any, any, any, "meeting_briefs", unknown>'.

src/briefs/briefService.test.ts(192,28): error TS2339: Property 'maybeSingle' does not
exist on type 'PostgrestQueryBuilder<any, any, any, "meeting_briefs", unknown>'.
```

All three errors were in the `createBrief` parent-validation test, which called
`supabaseAdmin.from('meeting_briefs').maybeSingle` to configure per-call mock return values.

**Failure pattern:**

Mock type mismatch — TypeScript resolves the declared return type of the real library
function for a mocked module's call, ignoring the runtime mock object's actual shape.

**Diagnosis:**

`supabaseAdmin.from('meeting_briefs')` is typed to return `PostgrestQueryBuilder` per the
Supabase TypeScript declarations. That type does not expose `maybeSingle` at the `from()`
return level — `maybeSingle` only appears after further chain calls (`.select()`, `.eq()`,
etc.). The mock object adds `maybeSingle` to the chain object at runtime, but TypeScript
statically resolves the return type of `from()` from the original module declarations and
therefore does not know the property exists. `vi.mocked()` only types what the real type
declares; it does not reflect runtime mock additions.

**Exact recovery:**

Changed the test to cast `supabaseAdmin.from` as `any` at the specific call site, then
typed only the mock function it needed:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chain = (supabaseAdmin.from as any)('meeting_briefs')
const maybeSingleMock = chain.maybeSingle as ReturnType<typeof vi.fn>

maybeSingleMock
  .mockResolvedValueOnce({ data: { id: 'parent-id' }, error: null })
  .mockResolvedValueOnce({ data: DB_ROW, error: null })
```

**Outcome:**

`npm run typecheck` passed with 0 errors after the change. The `@typescript-eslint/no-explicit-any`
suppression comment was added to satisfy the no-explicit-any lint rule, which is the
correct approach when an `any` cast is genuinely necessary.

**Prevention lesson:**

When a unit test needs to access or configure a mock chain property that does not appear in
the library's public type declarations (because it only becomes available after further
method chaining in the real API), plan upfront to cast the parent call result as `any` and
type only the specific mock function accessed. Do not attempt `vi.mocked()` on such
properties — it will only reflect the declared type, not the runtime mock shape.

---

### Entry 1.2 — ESLint `require-yield`: Generator Function Contains No Yield Statement

**What happened:**

`npm run lint` failed after `briefGenerator.test.ts` was created.

```
src/ai/briefGenerator.test.ts:166:5  error  This generator function does not have 'yield'
require-yield
```

The offending code was:

```typescript
async function* abortedStream() {
  throw abortError
}
```

**Failure pattern:**

ESLint rule enforcement — `require-yield` is included in the `eslint:recommended` rule set.
It treats any `function*` with no `yield` statement as an error on the grounds that a
generator with no yield is behaviorally equivalent to a regular function.

**Diagnosis:**

The test intended to create a mock async iterable that throws immediately, simulating an
`AbortError` during stream iteration. A `function*` that only throws and never yields
satisfies the TypeScript async iterable contract at the type level, but has no `yield`
statement, which `require-yield` flags. Because `eslint.config.mjs` applies the same
ESLint rules to test files as to production code (no exclusions), this rule was enforced.

**Exact recovery:**

Added a single dummy `yield` before the throw:

```typescript
async function* abortedStream() {
  yield { type: 'ping' } // required to be a valid generator
  throw abortError
}
```

This satisfies `require-yield` while preserving the test's intent. In the production
`briefGenerator.ts` code, the `for await` loop processes this yielded event — because its
`type` is `'ping'` (not `'content_block_delta'`), it is silently ignored, and the generator
then throws on the next iteration, which the test asserts as expected.

**Outcome:**

`npm run lint` passed after the change. The AbortError propagation test continued to
function correctly.

**Prevention lesson:**

Every `async function*` or `function*` used as a test helper must contain at least one
`yield` statement. If the intent is to simulate an immediate failure from a stream, add one
dummy event that the production code's event filter will ignore (e.g., `{ type: 'ping' }`).
Alternatively, consider whether the mock can be a regular `async function` returning a
rejected promise — this avoids the generator constraint entirely when the async iterable
shape is not required by the test.

---

### Entry 1.3 — ESLint `no-useless-escape`: Backslash-Escaped Backticks in a Regular String

**What happened:**

`npm run lint` failed with six errors in `responseValidator.test.ts`.

```
src/ai/responseValidator.test.ts:40:42  error  Unnecessary escape character: \`  no-useless-escape
src/ai/responseValidator.test.ts:40:44  error  Unnecessary escape character: \`  no-useless-escape
src/ai/responseValidator.test.ts:40:46  error  Unnecessary escape character: \`  no-useless-escape
src/ai/responseValidator.test.ts:40:60  error  Unnecessary escape character: \`  no-useless-escape
src/ai/responseValidator.test.ts:40:62  error  Unnecessary escape character: \`  no-useless-escape
src/ai/responseValidator.test.ts:40:64  error  Unnecessary escape character: \`  no-useless-escape
```

The offending line was:

```typescript
expect(() => validateGeneratedBrief('\`\`\`\nnot-json\n\`\`\`')).toThrow(…)
```

**Failure pattern:**

ESLint rule enforcement — `no-useless-escape` is part of `eslint:recommended`. Backtick
characters have no special meaning in single-quoted or double-quoted string literals, so
backslash-escaping them is unnecessary and flagged as an error.

**Diagnosis:**

The test was checking the markdown fence stripping logic in `validateGeneratedBrief`, which
strips triple-backtick fences from AI output before JSON parsing. The test string needed to
contain triple-backtick characters. In a single-quoted string literal, backticks are
ordinary characters requiring no escaping. The AI assistant generating the test applied
backslash-escaping by habit — likely from muscle memory of escaping backticks inside
template literal strings (where they would need escaping if used to close the literal).

**Exact recovery:**

Rewrote the string using a template literal with a single-character helper variable to avoid
any escaping:

```typescript
const bt = '`'
const fencedInvalid = `${bt}${bt}${bt}\nnot-json\n${bt}${bt}${bt}`
expect(() => validateGeneratedBrief(fencedInvalid)).toThrow('AI produced invalid JSON')
```

This produces the correct string ` ```\nnot-json\n``` ` without triggering `no-useless-escape`.

**Outcome:**

`npm run lint` passed after the change. The fence-stripping test behaviour was preserved —
the `validateGeneratedBrief` function correctly strips the fence and then fails to parse
`not-json`, which is the expected outcome.

**Prevention lesson:**

Backticks do not need escaping in single-quoted or double-quoted string literals. When
constructing strings containing backticks in test code, use one of the following approaches:

1. Unescaped backtick in a regular string: `'```'` (three backticks, no backslashes)
2. Template literal helper: `const bt = '\`'; const s = \`${bt}${bt}${bt}\``

Never apply `\`` inside a single-quoted or double-quoted string literal. Run `npm run lint`
before `npm test` during development so lint errors surface before test results do.
