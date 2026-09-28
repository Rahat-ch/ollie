# 20: Pre-registration 2 and the final runs

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 3 › The claims the final runs test; Phase 3 › Final runs; `.scratch/harness/decisions.md` #5, 6, 8, 15, 16, 19; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** Pre-registration 2 is committed before any final run and states:
- the Feature list;
- the primary diagnosis claims (detection of the planted weaknesses, false positives on every Feature not planted, Sessions to detection), each with a threshold and a failure line;
- the secondary claim: under each Simulator Family, the Coach is at most 0.5 Skills behind the Baseline in Skills Mastered by Session 20;
- the Judge and Jev gates on the sealed halves;
- repetitions and pairing;
- the budget.

The owner signs off. Then the final live runs: Sonnet 5.5, both Simulator Families, three repetitions, on the Batch API. Results are written against every threshold, pass or fail.

**Blocked by:** 17, 18, 19

**Status:** ready-for-agent

- [ ] Pre-registration 2 predates every final report and carries the owner's sign-off in the Comments
- [ ] Every threshold has a result beside it, with Wilson intervals and paired differences
- [ ] The sealed halves are scored exactly once, here
- [ ] Total spend stays within $300 and is logged
