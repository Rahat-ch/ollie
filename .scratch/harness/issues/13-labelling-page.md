# 13: A free labelling page, with sealed halves

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 2 › Labelling; `.scratch/harness/decisions.md` #24, 27; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** A small labelling page, local or a private artifact, shows one item at a time with its evidence and saves the labels to a JSON file committed to the repo. It covers:
- the 20 Stories;
- the 10 Summaries;
- about 100 Hypothesis claims drawn from the three live Opus reports.

For each claim, the labeller records:
- its Polarity;
- whether it names each planted weakness as a difficulty;
- whether its cited Problems support it.

Before anyone tunes anything, half of each set is sealed at random with a fixed seed, and the split is committed. The sealed half is scored only in the final runs.

The owner may label through a LangSmith annotation queue. The labels land in the same JSON.

**Blocked by:** 10

**Status:** ready-for-agent

- [ ] The page runs with no account and writes labels in the schema the Judge gate and the claim reader read
- [ ] The claim set is drawn reproducibly from the live reports (seeded) and covers every Polarity
- [ ] The sealed split is committed before any label exists and a test fails if tuning code reads the sealed half
- [ ] Human-human agreement and kappa are computed by the eval from two label files
