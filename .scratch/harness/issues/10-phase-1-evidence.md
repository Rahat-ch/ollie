# 10: Phase 1 evidence

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Solution › Phase 1; `.scratch/harness/decisions.md` #25; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** A reader of the Phase 1 post can check every claim in the repo. The README gains a short Results section, and the evals folder holds the detail.

Contents:
- a before/after table with cost per Session, p95 Coach latency, and the share of Sessions that ended in the Baseline, from the reproducing test and the live reports;
- the 403 and 429 curl output;
- the Sonnet-against-Opus results against Pre-registration 1;
- the voice A/B tally;
- the CI badge.

**Blocked by:** 05, 07, 09

**Status:** ready-for-agent

- [ ] Every number in the section links to the committed report, test or file it comes from
- [ ] The failed thresholds are listed as prominently as the passed ones
- [ ] README and evals methods doc agree with the reports
