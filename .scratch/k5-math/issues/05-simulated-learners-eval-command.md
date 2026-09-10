# 05: Simulated Learners and the eval command

**What to build:** A developer runs one eval command and gets a dated JSON report plus a convergence chart for the Baseline across six seeded Simulated Learners: strong, average, weak, crossing-ten weakness, change-unknown weakness, fast-fatigue. Each profile has a true per-Skill ability, weakness tags, and a fatigue curve, and answers are sampled from them with no model involved. Two profiles are marked held-out and reported separately. Hundreds of Sessions run in seconds.

**Blocked by:** 04 Plan Space and Baseline

**Status:** ready-for-agent

- [ ] Six profiles are defined in one place with seeds; the same seed reproduces the same run byte for byte
- [ ] A weakness tag lowers first-attempt accuracy only on Problems matching the tag (for example sums crossing ten)
- [ ] The eval command runs all profiles for 20 Sessions under the Baseline in under a minute and writes a dated JSON report to the evals directory
- [ ] The report includes Sessions to Mastery per Skill and the share of Problems in the target accuracy band, per profile, with held-out profiles flagged
- [ ] A chart is regenerated from the report files, not from live runs
