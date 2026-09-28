# 04: Only checked model output leaves the server

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 1 › Server-side validation; `.scratch/harness/decisions.md` #10; §4.7; ADR 0002's list of routes; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** The Coach route runs the Coach step itself (check, one retry with every reason, the Baseline). It returns only an accepted Coach output, a retried one, or the Baseline Plan, with where the Plan came from and any rejection reasons.
- It rebuilds what it checks against from the request: the known Problem IDs (this Session's evidence plus what the Notes already cite), and the Plan Space from the Knowledge Estimates (unlocks depend only on Mastery).
- The Summary route runs the Summary validator and its template fallback the same way.
- The device keeps its own check and fallback unchanged, so play still works offline.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] A route test with a fake Coach that invents a Problem ID or plans outside the Plan Space never sees that output in the response
- [ ] A route test with a Summary containing a number the engine did not give gets the retry or the template, never the bad Summary
- [ ] The Plan Space rebuilt on the server equals the device's for the same Profile (tested across Unit transitions)
- [ ] Browser tests pass; Ollie's Notebook still says when the Baseline was used
