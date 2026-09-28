# 03: The Coach's timeout is reproduced, then fixed

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 1 › Timeout, cancellation and no retry on a timeout; Phase 1 › Per-call telemetry; `.scratch/harness/decisions.md` #9, 10; §1 ("A gap the reports do not show"), §4.8; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** Today:
- A Coach call averages about 71 s and the device gives up at 60 s.
- A timeout is treated as a rejection, so the device retries, gives up again, and falls back to the Baseline.
- The server never cancels the model call, so it pays twice for nothing.

**First**, a test with a slow fake Coach reproduces this and fails. It shows two calls paid for, the Baseline used, and no abort reaching the server call.

**Then** the fix:
- The route passes the request's abort signal into the model call.
- The server has its own deadline below the device's (proposed: 75 s on the server, 90 s on the device). On the deadline it answers with the Baseline Plan itself and says so.
- The device treats a timeout like an unreachable Coach: no retry.

The telemetry recorder keeps every call's wall time and tokens, and every Eval Run's report prints p50 and p95 per operation.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] The reproducing test is committed red first (visible in the PR's history), then passes
- [x] An aborted request aborts the model call; a call past the server deadline returns the Baseline Plan with its reason
- [x] A timed-out Coach is not retried by the device
- [x] Reports carry per-call latency with p50 and p95 per operation; `pnpm eval --fake` prints them
- [x] Existing Coach, route and browser tests pass

## Comments

**2026-09-28, implementation.** Red first: `src/play/coach-timeout.test.ts` was committed alone (d9c8cb7) and failed 4 of 4 on its assertions, not on a compile error. It runs the device's `routeCoaching`, the real `/api/coach` and `/api/summary` handlers behind a stubbed `fetch` that carries the device's signal, and a slow fake Coach mocked in under `@/generation/anthropic`'s name (the Generation fake with `runCoach` delayed), all on fake timers; `AbortSignal.timeout` is replaced by one that keeps the fake clock. On `main` it showed the fault as described: a 71 s Coach ended as the Baseline because the device gave up at 60 s; a two-minute Coach was called twice (two calls paid for) and neither call ever saw an abort; the route answered the Coach's output whenever it came, with no deadline of its own. One change to the test after the red commit: `elapse` now turns the event loop 20 times per fake second rather than once and the adapter is imported up front, because the route's body read and dynamic import were landing several fake seconds after the route's timer started, which made a 71 s Coach look like it missed a 75 s deadline. The assertions are unchanged.

The fix. `Generation.runCoach` and `writeSummary` take an optional `CallOptions` (`{ signal }`), which the Anthropic adapter passes to `messages.parse` as a request option and the fake's telemetry wrapper forwards. `modelRoute` hands every operation `AbortSignal.any([request.signal, deadline])`, and a route may declare a `deadline`: it races the call against a timer, and when the timer wins it aborts the call and answers `deadline.answer(input, reason)` with a 200. The Coach route's deadline is `COACH_SERVER_DEADLINE_MS = 75_000` (`src/coach/deadline.ts`, since a route file may only export its handlers), and its answer is `serverBaseline`: `{ source: "baseline", reason, notes, plan }`, the Baseline Plan built from the body alone (the Baseline depends only on Mastery and on whether a Session has been played, so the Knowledge Estimates and the Session number are enough; tested equal to the device's `baselinePlan` for the Diagnostic Session and a later one with two Skills Mastered). The Summary route passes the signal but has no deadline. On the device `COACH_TIMEOUT_MS` is 90 s; `post` turns a `TimeoutError`, before or during the body, into a `ModelUnavailableError`, and `routeCoaching().runCoach` turns the route's Baseline into one too (`/api/coach used the Baseline Plan: the model did not answer within the server's deadline of 75 s`), so `coachSession` uses the Baseline at once with one rejection marked unavailable and Ollie's Notebook says the Coach could not be reached. The device builds its own Baseline rather than taking the route's, which is the same Plan; ticket 04 can change that when the route runs the whole step.

Telemetry. The recorder already kept each call; `telemetrySection` now carries them as `telemetry.calls`, and `telemetry.latency` gives `{ calls, p50Ms, p95Ms }` per operation by nearest rank (null for an operation that never ran). The Cost block prints p50 and p95 columns; `pnpm eval --fake` prints them (all 0.0 s on the fake). `docs/evals/README.md` says so. The fake run's report and redrawn charts were not committed, so the charts stay drawn from the live reports.

Tests: 7 in `coach-timeout.test.ts` (71 s reaches the Learner and is called once; two minutes is one call, aborted at 75 s, Baseline at once with the reason; a request the device abandons aborts the call; the route's Baseline at its deadline; the clocks' order; the server's Baseline equals the device's; a route that never answers ends at the device's 90 s with no retry of the Coach or the Summary); nearest-rank percentiles, latency and the section in `telemetry.test.ts`; the Cost block's columns in `evals.test.ts`; and in `e2e/coach.spec.ts` a route that answers with its own Baseline is asked once, recorded unavailable with the reason, and the Notebook says the Coach could not be reached. Verified with `pnpm typecheck`, `pnpm lint`, `pnpm test` (634), `pnpm eval --fake`, `pnpm build`, and `e2e/coach.spec.ts` on `desktop-chrome` and `ipad-landscape` (5 of 5 each).

Decided here, not in the spec: a timed-out Summary is also treated as unreachable (the template at once, not a second 30 s wait), since `post` is shared and the reasoning is the same. Not verified: that Next 16's standalone server aborts `request.signal` when a browser disconnects (the route test builds the Request with the device's signal, which is what the server should do; the real disconnect was not exercised), and that the SDK stops billing at the abort. Whether the live Coach's p95 sits under 75 s is for the next live run and its Pre-registration: at a 71 s mean on Opus 5 it very likely does not, so until the model changes most live Coach runs will now end as the route's Baseline after one paid call rather than two.
