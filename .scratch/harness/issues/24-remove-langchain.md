# 24: LangChain comes out

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/decisions.md` #41 (which supersedes 3 and 21); ticket 04 (`04-server-validation.md`) for the server Coach step as it stood before the graph; ticket 11 and ticket 12, including their Comments, for everything they added; ADR 0004. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** Remove LangGraph and LangSmith from the project. Ollie works exactly as it did, with the Coach step run by plain code on the server.

- **The Coach route** runs `serverCoachStep` over the engine's `coachStep` again, as ticket 04 left it (commit 40c4ec7 has that version of `src/coach/server.ts`). It keeps:
  - the checked output, one retry with every reason, and the Baseline Plan;
  - the Problem IDs and the Plan Space rebuilt from the body;
  - the caller's abort signal reaching the model call;
  - the route's 75 s deadline and its Baseline answer.
  - The route's Anthropic client goes back to the SDK's default retries, because the graph's transport retry policy is gone. The `maxRetries` option may stay if something else still uses it; otherwise remove it.
- **Delete** `src/coach/graph.ts`, `graph.test.ts`, `src/cli/coach-graph.ts` (and its `pnpm coach:graph` script), `src/evals/langsmith/`, `src/cli/eval-langsmith.ts` (and `pnpm eval:langsmith`), and the tracing hooks in `src/cli/eval.ts`, `src/cli/generation.ts` and `src/evals/evals.ts`. `runEvals` loses its `span` option. The `.env.local` loading in fake mode stays only if something other than LangSmith needs it.
- **Dependencies:** remove `@langchain/langgraph`, `@langchain/core` and `langsmith` from `package.json` and the lockfile. Nothing else should pull them in; check with `pnpm why`.
- **Tests keep their cover.** The graph's parity cases already run against `coachSession`/`coachStep` in `src/coach/coach.test.ts`; keep every case there. `src/coach/server.test.ts` tests the server step directly (the signal reaching the call, the Baseline at the deadline) as before ticket 11.
- **The bundle check** (`scripts/bundle-check.mjs`, in CI) keeps its checks unrelated to LangChain, if it has any. If it existed only for LangGraph and LangSmith, remove it and its CI step.
- **Docs:**
  - ADR 0004 gets `status: superseded`, with a short note saying why and what replaced it (the plain server step). Its body stays as history.
  - README: remove the graph drawing, `pnpm coach:graph`, `pnpm eval:langsmith` and every LangChain or LangSmith mention.
  - `docs/evals/README.md` and `docs/evals/evidence.md`: remove the "record and view" LangSmith text. The committed JSON reports are the record.
  - `THIRD_PARTY.md`, regenerated through `scripts/third-party.mjs` if that is how it is made.
  - ADR 0002's amendment that tracing is eval-only: reword so that nothing traces.
  - Leave `docs/research/langchain-harness.md` and the stored reports as history.
- **The plan:** the spec gets a one-line note at the top pointing to decision 41. Tickets 11 and 12 get a Comment saying they were removed by this ticket. Ticket 15 is `wontfix`.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `git grep -iE "langgraph|langsmith|@langchain|coachGraph|LANGSMITH"` finds nothing outside `docs/research/`, the stored reports, `.scratch/` history and ADR 0004's superseded body
- [x] The Coach route's tests and `src/coach/` tests pass with the same cases as before (accepted, retried with reasons, Baseline after two rejections, unreachable, deadline, abort)
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm eval --fake`, `pnpm build`, `pnpm licenses:check` and the Coach browser tests (`e2e/coach.spec.ts`, desktop-chrome) pass; CI's check and docker jobs are green
- [x] A fake `pnpm eval` on this branch writes a report identical to one on `main` apart from `generatedAt`

## Comments

**2026-09-29, implementation (PR #73).**
- **Deleted:** the Coach graph (`src/coach/graph.ts` and its tests, `src/cli/coach-graph.ts`); all of `src/evals/langsmith/` and `src/cli/eval-langsmith.ts`; `scripts/bundle-check.mjs` (every check in it was about LangGraph or LangSmith), with its CI step; and the `coach:graph`, `eval:langsmith` and `bundle:check` scripts.
- **Dependencies:** `@langchain/langgraph`, `@langchain/core` and `langsmith` are out of `package.json` and the lockfile, and `THIRD_PARTY.md` is regenerated.
- **The Coach files are back to 40c4ec7:** `src/coach/server.ts`, `coach.ts` and `index.ts` are byte-identical. `route.ts` and `model-route.ts` differ from it only by ticket 05's spend cap. The route uses the SDK's default retries again, and the `maxRetries` option is gone.
- **The eval files:** `src/cli/eval.ts`, `src/cli/generation.ts` and `src/evals/evals.ts` are back to before ticket 12. Ticket 13's labels, ticket 05's cap, ticket 06's Sonnet move and the Docker job all survive.
- **Tests:** a new unreachable-Coach case is in `coach.test.ts`. The stronger signal test from ticket 11 is kept in `server.test.ts`. The deadline stays covered by `src/play/coach-timeout.test.ts` and `e2e/coach.spec.ts`.
- **Docs:** ADR 0004 is superseded. ADR 0002 says nothing is traced. ADR 0003 is amended. The README and the evals docs lose LangGraph and LangSmith. `docs/evals/evidence.md` no longer pins a test count.
- **Pre-registration 1:** two dated notes in its Findings say the route's `maxRetries: 0` contrast no longer holds. The finding text and everything above Results are unchanged.
- **Verified:** `pnpm typecheck`, `pnpm lint`, `pnpm test` (788), `pnpm eval --fake`, `pnpm build`, `pnpm licenses:check`, and `e2e/coach.spec.ts` on desktop-chrome. A fake eval report is identical to main's apart from `generatedAt`. CI's check and docker jobs are green.
- **Reviewed (orchestrator):** two axes, standards and spec. The three stale docs they found are fixed in 3285779.
- **Not verified:** anything live.
