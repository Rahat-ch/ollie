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

**Status:** ready-for-agent

- [ ] The existing Coach step test cases run against both the old step and the compiled graph and agree on every case (accepted, retried, Baseline after two rejections, unreachable, timeout)
- [ ] A transport error is retried by the policy; a validation rejection is retried once with reasons and never by the policy
- [ ] The fake drives the graph with no network; the client bundle contains no LangGraph code
- [ ] Route tests and browser tests pass unchanged
