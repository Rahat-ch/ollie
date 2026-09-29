# 11: The Coach step is a graph on the server

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 2 › The Coach graph; `.scratch/harness/decisions.md` #3, 10; ADR 0004; research §2 and §3 (current LangGraph JS API and a sketch); `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** Per ADR 0004, the Coach route runs a compiled LangGraph graph with these nodes:
- build the input;
- call the Coach;
- validate;
- accept, retry once with every reason, or use the Baseline.

The graph is built by `coachGraph(generation)`, and its nodes wrap the engine's existing functions unchanged. The call node has:
- a timeout at the server deadline;
- a `retryPolicy` for transport errors only (429, 529 and network).

The engine's retry-with-reasons is an edge in the graph, not the `retryPolicy`.

Also out of scope: no checkpointer, no interrupt, no `createAgent`, no LangChain chat model, and nothing imported by the browser. The README shows the graph drawn from the compiled graph itself.

**Blocked by:** 04 (done). Re-pointed 2026-09-28 from 10: the graph needs the server-side Coach step, not the Phase 1 results.

**Status:** resolved

- [x] The existing Coach step test cases run against both the old step and the compiled graph and agree on every case (accepted, retried, Baseline after two rejections, unreachable, timeout)
- [x] A transport error is retried by the policy; a validation rejection is retried once with reasons and never by the policy
- [x] The fake drives the graph with no network; the client bundle contains no LangGraph code
- [x] Route tests and browser tests pass unchanged

## Comments

**2026-09-28, implementation.** Test first: `src/coach/graph.test.ts` was written against a `coachGraph` that did not exist yet. Before any code, the installed `@langchain/langgraph` 1.4.18 was checked by running it, not from the research note: `StateSchema` with zod 4.6 `z.custom` fields works; a node `timeout` raises `NodeTimeoutError` into the node's `errorHandler` (after the `retryPolicy`, whose `retryOn` decides whether a timeout is retried); an error handler's plain update ends the run rather than following the node's edges, so it must return a `Command` with `goto`; and aborting the signal passed to `invoke` makes `invoke` throw the abort reason.

The graph (`src/coach/graph.ts`, server only): `buildInput` → `callCoach` → `validate` → `accept` | `retry` (an edge back to `callCoach`) | `baseline`. `buildInput` takes either a Session (`coachInput`, `sessionBounds`) or a route body (`boundsFromInput`, and the Plan Space the server rebuilt); `validate` is `checkCoachOutput`; `baseline` is `baselineStep` over `baselinePlan`; `rejected` and `CoachCall` are now exported from `coach.ts`, unchanged. `callCoach` passes a signal that aborts when the caller goes or the node times out; it rethrows transport errors (`isTransportError`: 429, 529, `APIConnectionError`; not the SDK's own timeout, not an abort, not other statuses) to a `retryPolicy` of three attempts with backoff from 500 ms, and turns anything else into a failed call. Its error handler, reached after the policy gives up or at the timeout, hands the failure to `validate` with a `Command`; a timeout is marked as a Coach not reached, with the route's own deadline sentence (`deadlineReason`, now exported from `model-route.ts`), so the Baseline is used at once. The caller's signal travels as graph context, not as `invoke`'s signal, so an abandoned call ends in the Baseline as `coachStep` did rather than throwing. `serverCoachStep` moved from `server.ts` (which the browser loads) to `graph.ts` and runs the graph; the route imports it lazily beside the adapter.

Tests: every Coach step case from `coach.test.ts` (accepted; retried for an invented Problem, a Plan outside the Plan Space, a Plan testing an unknown Hypothesis; Baseline after two rejections with the prior Notes; a throwing adapter; malformed output; unreachable) runs through `coachSession`/`coachStep` and through the compiled graph, on a Session and on a body, and must give the same Coach step and the same inputs to the Coach, retry input included (16 tests). The timeout case runs the graph with a 50 ms deadline against a Coach that never answers: one call, cancelled, not retried, and the answer equals `serverBaseline` with the deadline reason, which is what the route answered at its deadline before. A 429, a 529 and a network error are each retried by the policy with the same input and end as the Coach's first output; a 529 on every call gives three policy attempts, then the engine's retry with the reason, three more, then the Baseline; a validation rejection is called exactly twice, the second with the rejected output and every reason. The `server.test.ts` signal test now checks that the call's signal aborts when the caller's does (it is a combined signal, so it is no longer the caller's object). The README test holds the Mermaid in the README to `drawMermaid()` of the compiled graph; `pnpm coach:graph` rewrites it. LangGraph draws the error handler as a node of its own with no edges; the README says so.

The client bundle: `scripts/bundle-check.mjs` (`pnpm bundle:check`, in CI after the build) looks for strings LangGraph's own code carries (`__pregel_`, `__error_handler__`, `NodeTimeoutError`) in `.next/static`, after first finding them in `.next/server` so it cannot pass by looking for nothing. Checked both ways: it passes on this branch, and with the graph imported into `ShopScreen.tsx` for one build it fails and names the chunk. The standalone server was also run with `ANTHROPIC_BASE_URL` at a closed local port: `POST /api/coach` loaded the graph, retried the connection errors, and answered the Baseline with two "Connection error." rejections, with nothing leaving the machine.

Verified with `pnpm typecheck`, `pnpm lint`, `pnpm test` (763), `pnpm eval --fake` (report not committed), `pnpm build`, `pnpm bundle:check`, `pnpm licenses:check`, and `e2e/coach.spec.ts` on `desktop-chrome` (6 of 6). The route tests pass unchanged.

Decided here, not in the spec: the route's Anthropic client is built with `maxRetries: 0` (a new `maxRetries` option on `anthropicGeneration`), so the graph's policy is the only transport retry and a 429 is not tried nine times; the eval and the CLI keep the SDK's default. The node timeout is per attempt at `COACH_SERVER_DEADLINE_MS`, so in the route the route's own race over the whole step still decides first and its answer is unchanged; the node timeout is what stops a call when the graph runs anywhere else. A transport error that outlasts the policy is a rejection like any other thrown error, as it was in `coachStep`, so it gets the engine's one retry. `@langchain/langgraph` 1.4.18 and `@langchain/core` 1.2.13 are pinned exactly, like the other runtime dependencies; they bring `langsmith` in, whose tracing is off unless its environment variable is set (noted in `THIRD_PARTY.md`).

**2026-09-29, removed.** Decision 41 takes LangChain out of the project; ticket 24 removes this ticket's code. The Coach route runs the plain server Coach step again.
