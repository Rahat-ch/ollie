# 07: Sonnet 5.5 against Opus 5, pre-registered

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 1 › The Sonnet comparison; `.scratch/harness/decisions.md` #5, 6, 12, 28; `docs/evals/README.md` (method and thresholds today); `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**Hard rule:** these runs happen before ticket 16 or 17 changes the Coach prompt. Nothing in Phase 2 changes it, so they may run at any time before Phase 3.

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

**Status:** resolved

- [x] Pre-registration 1 is committed before the first live report's timestamp, with the owner's sign-off recorded in this ticket's Comments
- [x] The Opus reports are re-scored with the scorer the Sonnet runs use, at no model cost
- [x] Three Sonnet reports are committed with per-call latency; charts regenerate from the latest
- [x] A results section compares each metric with its threshold and says plainly which passed and which failed
- [x] Spend is logged against the $300 budget

## Comments

**2026-09-28, the draft (first half).** Pre-registration 1 is drafted in `docs/evals/preregistration-1.md` and is **ready for the owner's sign-off**. Its "Owner sign-off" line is empty. **The live runs have NOT been started**, and no model was called or paid for in this work.

Re-scoring. `pnpm eval:rescore` was run on the three Opus 5 reports of 2026-09-18, and its output is committed as `docs/evals/rescore-opus-2026-09-28.txt`. No value changed: detection and false positives are identical for every Learner in every run. None of the scorers (`src/evals/hypotheses.ts`, `evals.ts`, `stats.ts`, `stories.ts`, `summaries.ts`, `judge.ts`, `convergence.ts`, `src/loop`) has changed since the commit that stored the runs (021b66a). So the stored Evidence Integrity, Claim Agreement, Plan sources, Mastery, Story and Summary figures are what the Sonnet runs' scorer would give, and the rescore command, which covers detection and false positives only, confirms those two. The Coach, Summary and Story prompts are also unchanged since then.

The draft states the question, the Arms, a threshold, failure line and kind (non-inferiority margin or absolute floor) for each metric, justified from the Opus range and Wilson intervals. It also covers what a failed Judge gate means (the score is withheld, which is itself a reported result), how results are reported, and the budget: about $32 for the three runs at the planning figure, with a hard stop at $25 for a single run, $75 for the series, and $300 overall. The command is three sequential `pnpm eval` runs. No new flag or script was needed, since `pnpm eval` defaults to 20 Sessions on the real models and each run writes its own report. `docs/evals/README.md` links the draft and the rescore output.

For the owner to check before signing: the budget log assumes the three Opus runs ($79.86) predate the $300 budget, and it records no live CI smoke run.

**2026-09-29, the runs and the results.** The owner approved the runs on 2026-09-29, after tightening detection, false positives and p95 latency on 2026-09-28 (decision 35). The sign-off is commit eac6b9b ("Pre-registration 1: approved"), timed 18:56:43Z, and the first Sonnet report is timed 19:10:40Z. Three sequential live `pnpm eval` runs on Sonnet 5.5 are committed unedited in f2a6a17: `docs/evals/2026-09-29T19-10-40Z.json`, `…T19-24-39Z.json` and `…T19-37-11Z.json`. Each has per-call latency (`telemetry.latency`, `telemetry.calls`), and the charts are redrawn from the third. None crashed, and none was repeated.

The Results section of `docs/evals/preregistration-1.md` is filled in. Every value comes from the reports through `node scripts/preregistration-1-results.mjs`, which calls no model, and `pnpm eval:rescore` on each Sonnet report changed no value. Per row:

- **Pass:** 1 Evidence Integrity (1.0000 in every split; 0 invented IDs in 35,189 citations); 2 Claim Agreement (tuning 0.956 to 0.985, held out 0.930 to 0.996); 3a first-attempt Plans (355 of 360); 3b Baseline fallbacks (0 of 360); 4a detection (6 of 6); 7 cost per Session ($0.0499 to $0.0541); 8a, 8b and 8c Summaries (6 of 6 valid, no templates, faithfulness 5, 6 and 6 of 6); 9a and 9b Story validity (30 of 30 in every run); 10 Judge gate (Stories 17 of 20 with kappa 0.71, Summaries 10 of 10 with kappa 1.00, every run).
- **Fail:** 4b false positives, tuning (0.333 to 0.500 against 0.222 or less); 4c false positives, held out (0.143 to 0.300 against 0.100 or less); 5 Sessions to Mastery (run 2 tuning 5.00 against 5.25 or more); 6 p95 Coach latency (92.2 to 94.0 s against under 30 s); 9c Story readability (0.467 to 0.533 against 0.55 or more).
- **Withheld:** none.
- **Verdicts:** the Coach is not acceptable, the Parent Summary is acceptable, the Story writer is not acceptable, and the Judge is acceptable on row 10.

Spend: $6.7164, $6.3714 and $6.9060, so $19.99 for the three runs and $20.06 against the $300 budget in all. No stop rule was reached.

A separately labelled "Findings outside the pre-registered lines" subsection changes no verdict. The Coach's p95 of about 92 to 94 s comes from rounds of 5 or 6 consecutive slow calls. Each takes 86 to 114 s, about 70 s longer than its ordinary-sized output explains, while six Learners' Coach calls are in flight at once.

- In runs 1 and 2 the rounds are at nearly the same completion positions: 31 to 37 and 98 to 103, then 28 to 34 and 104 to 108.
- Run 3's are at 59 to 64, plus its last call.
- The cause is not established. The candidates are SDK-internal retries after a 429 or 529, which telemetry does not record (the eval uses the SDK's default retries, and the live route sets none), and concurrency effects.
- The live app makes one Coach call per Learner at a time, so the eval may overstate production latency. Even so, the calls outside the rounds have a p95 of 36 to 42 s, still over the line.
- Next step: record retries and request ids per call, then time one Learner serially (about $1).

Also noted in that subsection:

- The Sonnet 5.5 Judge marks the intended `{{nickname}}` placeholder as a defect in most of its Story fails, which bears on 9c.
- Sonnet's Coach supported about half as many Hypotheses as Opus's, with a similar count of false ones.
