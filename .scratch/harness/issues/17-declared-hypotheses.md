# 17: Hypotheses declare what they claim, and the engine checks it

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 3 › Declared Hypotheses; Phase 3 › The claims the final runs test; `.scratch/harness/decisions.md` #13, 14, 19, 28; ADR 0005; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** Per ADR 0005, every Hypothesis declares:
- a Skill;
- a Polarity (difficulty, strength or contrast);
- optionally, a Feature from the list.

The Notes validator rejects, with reasons fed back through the one retry:
- Assistance States that disagree with the Polarity. A contrast must cite both first-try and assisted Problems.
- A supported Hypothesis that names no Feature.
- A supported Hypothesis that fails the Minimum-Evidence Rule: at least 4 first attempts on the Feature, and 95% Wilson intervals on first-try rate for the Feature and the rest of the Skill that do not overlap.

The Coach prompt explains all of this. Ollie's Notebook shows the Feature.

The eval reads detection from the declarations. Detection counts a supported Hypothesis that declares the planted Feature as a difficulty. False positives count supported difficulty declarations on any Feature the Learner does not have planted.

**Blocked by:** 16

**Status:** ready-for-agent

- [ ] Table tests cover each new rejection reason, and all reasons are reported together
- [ ] The fake Coach can produce declared Notes and the fake eval shows detection and false positives from declarations
- [ ] A Notebook browser test shows a Feature on a supported belief
- [ ] Prior reports still load (declarations absent means the prose reader is used)
