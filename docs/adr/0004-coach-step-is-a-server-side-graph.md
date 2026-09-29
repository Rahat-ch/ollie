---
status: superseded
date: 2026-09-28
---

# The Coach step is a LangGraph graph on the server; the engine's rules stay in the engine

> **Superseded on 2026-09-29.** LangGraph was removed to keep the project simple (decision 41 in `.scratch/harness/decisions.md`). The Coach route runs the plain server Coach step again: `serverCoachStep` over the engine's `coachStep`, in `src/coach/server.ts`. It keeps the check against the Problem IDs and the Plan Space rebuilt from the body, the one retry with every reason, the Baseline, the cancellation when the browser goes, and the route's 75 s deadline. The SDK's own retries replace the graph's transport retries, and nothing is traced. The rest of this ADR is kept as history.

The Coach step runs in `POST /api/coach` as a LangGraph graph:
- build the input;
- call the Coach;
- validate;
- then accept, retry once with every reason, or fall back to the Baseline.

Only validated output leaves the server. The device keeps its own check and the Baseline fallback, so play works offline and when the route is down.

We chose a graph because the ladder had to move to the server anyway. The old version had three faults:
- the output was never validated on the server;
- a timed-out call was retried, so each such Session paid for two calls;
- a call the browser had abandoned was never cancelled.

The graph adds three things the old code lacked:
- a deadline per step, below the browser's patience;
- retries on transport errors only (429, 529, network);
- a trace of each step for the eval.

The graph owns none of the rules. Its nodes wrap the engine's pure functions unchanged:
- `coachInput`;
- `checkCoachOutput`, with the validators behind it;
- `baselinePlan`.

The one retry that carries the rejected output and every reason stays the engine's rule. LangGraph's own `retryPolicy` never replaces it, because that policy re-runs a step with the same input.

## Considered options

- **Keep `coachSession` as plain TypeScript and move it to the route.** It is equally correct, and an `AbortSignal` gives the deadline. Rejected because the step-level trace, the transport retries and the drawable graph are the pieces the eval and the write-up use. The cost is one dependency.
- **`createAgent`, checkpointers, interrupts.** Rejected as ceremony:
  - the Coach runs one step and a fixed ladder;
  - the device already keeps the Session that is still waiting for its Coach run;
  - a server checkpointer would store Session evidence, against ADR 0002.
- **`ChatAnthropic` in place of the direct SDK.** Rejected because it pins an older `@anthropic-ai/sdk` than the app uses, which would install two copies. It also counts cached tokens inside `input_tokens`, which the telemetry would then double count. The graph calls the existing `Generation` adapter.

## Consequences

- `Generation` stays the seam. The graph is built by `coachGraph(generation)`, so the fake drives it in tests with no network.
- A parity test runs the same cases through `coachSession` and the compiled graph and asserts the same Coach step.
- No graph code is imported by the browser.
