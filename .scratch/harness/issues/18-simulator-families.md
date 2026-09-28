# 18: Simulated Learners that learn, in two Simulator Families

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 3 › Simulator Families; `.scratch/harness/decisions.md` #15, 16; research §4.3; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** The six Simulated Learners keep their seeds, their planted weaknesses, their fatigue and the held-out split, and they now learn from practice under two Simulator Families.
- **BKT forward model:** a hidden known or unknown state per Skill, learning with p(T) after each practice opportunity, answering through guess and slip. Its parameters are drawn from a different distribution than the engine's hand-set tracer.
- **Performance Factors Analysis:** each prior success and failure on a Skill moves the log-odds of the next answer.

The eval runs every Learner under both families and the Baseline. The report gives Sessions to Mastery per family, with the Coach-minus-Baseline difference and its interval, ready for the 0.5-Skill non-inferiority test.

**Blocked by:** 15

**Status:** ready-for-agent

- [ ] The same seed reproduces a run byte for byte in each family
- [ ] Tests show accuracy rising with practice (BKT) and log-odds moving with each outcome (PFA), and a planted weakness lowering accuracy only on matching Problems
- [ ] The fake eval reports both families side by side, with the Baseline's Mastery curve now rising
- [ ] The parameter distributions and why they differ from the tracer's are written in the evals methods doc
