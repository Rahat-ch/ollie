# 07: Sonnet 5.5 against Opus 5, pre-registered

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 1 › The Sonnet comparison; `.scratch/harness/decisions.md` #5, 6, 12, 28; `docs/evals/README.md` (method and thresholds today); `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** Before any live run, Pre-registration 1 is committed to the evals folder. It states:
- the Arms: Sonnet 5.5 at high effort, against the three stored Opus 5 reports re-scored with the same scorer;
- the metrics:
  - Evidence Integrity;
  - Claim Agreement;
  - where the Plans came from;
  - detection and false positives, read by today's prose reader;
  - Sessions to Mastery;
  - Story and Summary validity;
  - the Judge gate;
  - p95 Coach latency;
  - cost per Session;
- each threshold and what counts as failing. At minimum: p95 Coach latency under the server deadline, and no metric worse than the lowest Opus run by more than its stated margin;
- the budget line.

The owner signs off on it before anything is spent. Then three live runs on Sonnet 5.5 at the same seeds, before any Phase 3 change to the Coach prompt. Results are written against every threshold, pass or fail, and the budget line is updated.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Pre-registration 1 is committed before the first live report's timestamp, with the owner's sign-off recorded in this ticket's Comments
- [ ] The Opus reports are re-scored with the scorer the Sonnet runs use, at no model cost
- [ ] Three Sonnet reports are committed with per-call latency; charts regenerate from the latest
- [ ] A results section compares each metric with its threshold and says plainly which passed and which failed
- [ ] Spend is logged against the $300 budget
