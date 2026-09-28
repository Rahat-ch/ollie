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

**Status:** ready-for-agent

- [ ] The reproducing test is committed red first (visible in the PR's history), then passes
- [ ] An aborted request aborts the model call; a call past the server deadline returns the Baseline Plan with its reason
- [ ] A timed-out Coach is not retried by the device
- [ ] Reports carry per-call latency with p50 and p95 per operation; `pnpm eval --fake` prints them
- [ ] Existing Coach, route and browser tests pass
