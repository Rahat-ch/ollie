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
- [x] The Opus reports are re-scored with the scorer the Sonnet runs use, at no model cost
- [ ] Three Sonnet reports are committed with per-call latency; charts regenerate from the latest
- [ ] A results section compares each metric with its threshold and says plainly which passed and which failed
- [ ] Spend is logged against the $300 budget

## Comments

**2026-09-28, the draft (first half).** Pre-registration 1 is drafted in `docs/evals/preregistration-1.md` and is **ready for the owner's sign-off**. Its "Owner sign-off" line is empty. **The live runs have NOT been started**, and no model was called or paid for in this work.

Re-scoring. `pnpm eval:rescore` was run on the three Opus 5 reports of 2026-09-18, and its output is committed as `docs/evals/rescore-opus-2026-09-28.txt`. No value changed: detection and false positives are identical for every Learner in every run. None of the scorers (`src/evals/hypotheses.ts`, `evals.ts`, `stats.ts`, `stories.ts`, `summaries.ts`, `judge.ts`, `convergence.ts`, `src/loop`) has changed since the commit that stored the runs (021b66a). So the stored Evidence Integrity, Claim Agreement, Plan sources, Mastery, Story and Summary figures are what the Sonnet runs' scorer would give, and the rescore command, which covers detection and false positives only, confirms those two. The Coach, Summary and Story prompts are also unchanged since then.

The draft states the question, the Arms, a threshold, failure line and kind (non-inferiority margin or absolute floor) for each metric, justified from the Opus range and Wilson intervals. It also covers what a failed Judge gate means (the score is withheld, which is itself a reported result), how results are reported, and the budget: about $32 for the three runs at the planning figure, with a hard stop at $25 for a single run, $75 for the series, and $300 overall. The command is three sequential `pnpm eval` runs. No new flag or script was needed, since `pnpm eval` defaults to 20 Sessions on the real models and each run writes its own report. `docs/evals/README.md` links the draft and the rescore output.

For the owner to check before signing: the budget log assumes the three Opus runs ($79.86) predate the $300 budget, and it records no live CI smoke run.
