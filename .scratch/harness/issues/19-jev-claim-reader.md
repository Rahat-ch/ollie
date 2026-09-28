# 19: Jev reads the Coach's claims in the eval

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 3 › Jev in the eval; `.scratch/harness/decisions.md` #11, 28; research §4a; the TypeSafe docs index at https://docs.typesafe.ai/llms.txt; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** In the eval only, Jev (TypeSafe, `@typesafe-ai/sdk`) reads each claim:
- a Choice for its Polarity;
- a Noul per Feature for "names this as a difficulty".

That gives Declaration Fidelity: how often the words say what the declaration says. The same reader is the prose reader for reports that have no declarations, the Opus-era ones included.

It is calibrated on the labelled claims under the Judge's gate (agreement at least 0.8 and kappa at least 0.6). The final score comes from the sealed half. Regex and Jev agreement are reported side by side.

Without a TypeSafe key, the section says "withheld". The live app never calls Jev.

**Blocked by:** 14, 17

**Status:** ready-for-agent

- [ ] A fake Jev with fixed judgments drives the scorer's tests
- [ ] The report shows regex against Jev agreement and kappa on the open half, and marks the sealed half unscored until the final run
- [ ] No file under the app's routes imports the TypeSafe SDK (test)
- [ ] Pricing and the SDK's `noul` signature are checked and noted in the Comments
