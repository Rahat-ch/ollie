# 07: Coach evals and the convergence chart

**What to build:** The eval command now runs every Simulated Learner under both the Coach and the Baseline and reports: Hypothesis hit rate against planted weaknesses, Sessions to detection, false positives, Evidence Integrity (every cited ID exists and its Assistance State is consistent with the claim), and convergence versus Baseline, with held-out profiles scored separately. The chart shows Coach versus Baseline. This is the day-four checkpoint.

**Blocked by:** 06 Coach in the Loop

**Status:** ready-for-agent

- [ ] A planted weakness counts as detected when a supported Hypothesis names it; the report gives detection rate and mean Sessions to detection per profile
- [ ] False positives are Hypotheses marked supported that name a weakness the profile does not have; the rate is reported
- [ ] Evidence Integrity is computed deterministically for every Hypothesis in every run and reported as a rate
- [ ] Coach and Baseline run on identical seeds and profiles; convergence metrics are reported side by side
- [ ] Held-out profiles are reported in a separate section and are never used to tune the Coach prompt
- [ ] The chart regenerates from the report and is committed with it
