# CLAUDE.md

Project setup from the `claude-boilerplate` repo. Add project-specific notes at the bottom.

## Orchestration

```
Opus 5.5 main session plans + signs off
├── .claude/agents/explorer.md → model: haiku  · Read, Grep, Glob
├── .claude/agents/fixer.md    → model: sonnet · Read, Edit, Bash
├── .claude/agents/checker.md  → model: sonnet · cross-checks every patch
└── .claude/settings.json      → PostToolUse hook runs tests after each edit
```

- The main session stays on Opus 5.5: **plan, delegate, read summaries only, sign off.**
- Search and reading → `explorer` (summary < 200 words).
- Patches → `fixer` (smallest patch that fixes the issue).
- Every patch → `checker` (reviews it against its callers, reports regressions) before sign-off.
- Every subagent gets its own context window. The main session never reads raw output (logs, full files, diffs) when a subagent can summarize it.

## DRY (mandatory)

Code MUST be DRY. Do not duplicate definitions or logic. When the same constant, type, validation, or block of logic appears in more than one place, abstract it into a shared helper/utility and reuse it. Flag copy-pasted logic and repeated literals/definitions that should be centralized.

## Slash commands

| Command | Purpose |
|---|---|
| `/state-machines` | Document explicit/implicit state machines in `docs/STATE_MACHINES.md`, find reachable invalid states, fix with regression tests |
| `/dead-code` | Separate branch: remove every `src/` function/file without a caller |
| `/dedupe` | Separate branch: merge duplicated logic in `src/` into single functions |
| `/unused-deps` | Separate branch: remove unused `package.json` dependencies one by one |
| `/clean-worktrees` | Remove worktrees whose branch is already merged, log them in `MENAGE.md` |

## Behavioral guidelines

Source: [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills/blob/main/CLAUDE.md)

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code. (Duplicated code is not single-use: see DRY above.)
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Project-specific notes

<!-- Stack, commands (test/build/lint), conventions, gotchas. -->

### Stack
- npm workspaces monorepo: `apps/api` (Express + TS), `apps/web` (React + Vite + Tailwind), `packages/shared` (Zod schemas, enums, types used by both).
- PostgreSQL + Drizzle ORM (schema `apps/api/src/db/schema.ts`, versioned SQL migrations in `apps/api/src/db/migrations`).
- Auth: JWT (Bearer) + seeded users, roles `GROUP_ADMIN` / `SCHOOL_ADMIN`.
- Salesforce REST API (OAuth 2.0 Web Server Flow), client behind an interface, always mocked in tests.

### Commands (repo root)
| Command | Purpose |
|---|---|
| `npm run dev` | API (:3000) + web (:5173) |
| `npm run build` | api (tsup bundle, shared inlined) + web (Vite); shared ships as TS source |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` everywhere |
| `npm test` | Vitest unit + Supertest integration (needs `DATABASE_URL_TEST`) |
| `npm run db:migrate` / `db:seed` / `db:generate` | Drizzle migrations / seed / new migration from schema |
| `docker compose up -d db` | local Postgres (dev + test databases) |

### Conventions
- Conventional commits; one branch + one PR per milestone.
- Validation schemas live only in `packages/shared`; API and web import them.
- School isolation is enforced in the API (`middleware/schoolScope.ts`): a SCHOOL_ADMIN gets 404 for another school's data.
- Every API error goes through `middleware/errorHandler.ts` → `{ error: { code, message, details? } }`.
- Sync status transitions only through `lib/syncStateMachine.ts` (documented in `docs/STATE_MACHINES.md`).
- Out-of-scope ideas go to `docs/IDEAS.md`, never into code.
- UI: shadcn/ui (radix, `apps/web/src/components/ui`, add with `npx shadcn@latest add <name>` from `apps/web`). Design charter "Registre" (light, petrol `#0E5E5A`, IBM Plex): every colour is a token in `apps/web/src/index.css`, never a raw hex in components. French copy, sentence case, no trailing period on labels.
- Front state: server data via TanStack Query hooks in `apps/web/src/hooks`; list filters live in the URL (`useListFilters`).
- Secrets never committed: `.env.example` documents every variable, `config/env.ts` validates at startup.
