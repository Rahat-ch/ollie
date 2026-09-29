# Pre-registration 1: Sonnet 5.5 against Opus 5

Drafted 2026-09-28, before any live run on Sonnet 5.5. Nothing in this file may change once the owner signs it, except the Results section and the budget log, which are filled in afterwards. The first Sonnet report's timestamp must be later than the commit that records the sign-off.

**Owner sign-off:** ______________________ (name, date)

## The question

Is Claude Sonnet 5.5 (`claude-sonnet-5-5`) at effort `high` an acceptable replacement for Opus 5 (`claude-opus-5`) at effort `high` as the Coach, and as the model behind the Parent Summary, the Story writer and the eval Judge?

"Acceptable" means only this: on every metric below, Sonnet 5.5 is not worse than the weakest of the three Opus 5 runs by more than the stated margin, and it clears every absolute floor. It does not mean Sonnet 5.5 is as good as Opus 5, and three runs cannot show that. Each role is judged on its own metrics, so the answer can be yes for the Coach and no for the Judge.

## The Arms

- **Opus 5 (comparison Arm, already run, no cost).** The three live reports of 2026-09-18: `2026-09-18T18-12-41Z.json` (run 1), `2026-09-18T18-41-44Z.json` (run 2), `2026-09-18T19-09-56Z.json` (run 3). The Coach, the Parent Summary and the Judge ran on Opus 5; the Story writer ran on Sonnet 5.
- **Sonnet 5.5 (new Arm, three live runs).** Every call on `claude-sonnet-5-5` with the server-side refusal fallback, as merged in harness ticket 06. The Coach at effort `high`; the Summary and the Judge at `medium`; the Story writer at `low` (the same efforts as the Opus Arm).

Both Arms use the same six Simulated Learners, the same seeds, 20 Sessions each, the same Baseline (byte-identical in all three Opus reports), the same prompts and the same scorer. The Coach, Summary and Story prompts have not changed since the Opus runs; only the model ids, the refusal fallback and the call plumbing did (`git diff 021b66a HEAD -- src/generation src/coach`). The Sonnet runs must happen before any Phase 3 change to the Coach prompt, or the Arms stop being comparable. They run live, not on the Batch API, because latency is measured.

### The Opus Arm re-scored

`pnpm eval:rescore` was run on each Opus report on 2026-09-28. Its output is committed as [rescore-opus-2026-09-28.txt](./rescore-opus-2026-09-28.txt). **No value changed**: detection and false positives are the same for every Learner in every run. That is expected. The rescore command re-reads the Notes each report kept and reapplies the prose reader (`src/evals/hypotheses.ts`), and neither that file nor the other scorers (`evals.ts`, `stats.ts`, `stories.ts`, `summaries.ts`, `judge.ts`, `convergence.ts`, `src/loop`) have changed since the commit that stored the runs (021b66a). The changes since then are to telemetry, formatting, the Judge's model id and the call plumbing, none of which scores anything.

The rescore command covers detection and false positives only. Every other metric below is taken from the stored reports as written, because the code that computed it is the code the Sonnet runs will use.

Two things differ between the Arms that re-scoring cannot remove. The Judge is Opus 5 in one Arm and Sonnet 5.5 in the other, so Story readability and Summary faithfulness change writer and Judge together. The Opus reports also predate per-call latency, so the Opus Arm has a mean Coach latency but no p95.

## The command

Three sequential runs, from the repo root, with `ANTHROPIC_API_KEY` in the environment or in `.env.local`:

```sh
pnpm eval   # Sonnet run 1: then check the stop rule in "Budget" before going on
pnpm eval   # Sonnet run 2: check the stop rule again
pnpm eval   # Sonnet run 3
```

`pnpm eval` defaults to 20 Sessions and the real models (`src/cli/eval.ts`); no flag is needed and none is passed. Each run writes its own dated report in `docs/evals/` and redraws the charts from it. The runs are run one after another, not in parallel, so that the stop rule can be checked between them and so that concurrent calls do not inflate the latency. Each run's total is the last line of its Cost block, and `telemetry.total.dollars` in its report.

A run that crashes before it writes a report may be started again once. Its spend still counts. A run that writes a report is never discarded or repeated, whatever it shows.

## Metrics and thresholds

Unless a line says otherwise, the rule is: **the weakest of the three Sonnet runs is compared with the weakest of the three Opus runs.** A **non-inferiority margin** is how far below the weakest Opus run a Sonnet run may fall before it fails. An **absolute floor** holds whatever Opus did. Every rate is reported with its 95% Wilson interval (`wilsonInterval`, `src/evals/stats.ts`), but pass or fail is read from the point value against the line, so that the result is not a judgement call. With these sample sizes a pass does not mean the models are equal, and a narrow fail may be noise. The Results section will say which failures are within the Opus Arm's own spread.

The tuning split is Strong, Average, Weak and Crossing-ten weakness. The held-out split is Change-unknown weakness and Fast fatigue.

### Coach

| # | Metric | Opus 5, three runs (weakest run's interval) | Threshold (pass) | Fails when | Kind |
|---|---|---|---|---|---|
| 1 | Evidence Integrity, each split | 1.0000 printed in all six split-runs; 1 invented ID in 95,922 citations (held out, run 2: 10,284 of 10,285, CI 0.9994 to 1.0000) | ≥ 0.999 in every split of every run | any split of any run < 0.999 | Absolute floor |
| 2 | Claim Agreement, each split | tuning 0.923 to 0.940 (run 1: CI 0.920 to 0.927); held out 0.931 to 0.951 (run 1: CI 0.925 to 0.935) | tuning ≥ 0.893; held out ≥ 0.900 | any run below the line in either split | Non-inferiority, 3 points |
| 3a | Plans: first-attempt Coach Plans, pooled over 360 Sessions | 358 of 360 (0.994, CI 0.980 to 0.998); 2 retries | ≥ 342 of 360 (0.95) | < 342 of 360 | Non-inferiority, about 4 points |
| 3b | Plans: Baseline fallbacks, pooled over 360 Sessions | 0 of 360 (CI 0.000 to 0.011) | ≤ 3 of 360 | ≥ 4 of 360 | Absolute ceiling |
| 4a | Detection (prose reader), pooled | 4 of 6 chances (0.67, CI 0.30 to 0.90); crossing ten named in runs 2 and 3 (Session 6 both), change unknown in runs 1 and 2 (Sessions 13 and 16) | ≥ 3 of 6, and each planted weakness named in at least one run | < 3 of 6, or either weakness never named in any run | Non-inferiority, margin one hit below the Opus Arm's 4 of 6 (tightened by the owner 2026-09-28 from ≥ 2 of 6) |
| 4b | False positives (prose reader), tuning | 4/39, 7/44, 10/45: 0.103 to 0.222 (run 3: CI 0.125 to 0.363) | every run ≤ 0.222 | any run > 0.222 | No worse than the worst Opus run, margin zero (tightened by the owner 2026-09-28 from ≤ 0.32) |
| 4c | False positives (prose reader), held out | 3/30, 0/20, 2/20: 0.000 to 0.100 (run 1: CI 0.035 to 0.256) | every run ≤ 0.100 | any run > 0.100 | No worse than the worst Opus run, margin zero (tightened by the owner 2026-09-28 from ≤ 0.20) |
| 5 | Sessions to Mastery: mean Skills Mastered by Session 20 | tuning 5.75, 5.75, 6.50; held out 5.50, 5.50, 5.00 (Baseline 6.00 and 6.00) | tuning ≥ 5.25; held out ≥ 4.50 in every run | any run below the line | Non-inferiority, 0.5 Skills |
| 6 | p95 Coach latency, per run | not recorded (reports predate per-call latency); mean 69.9 to 73.3 s per call | p95 < 30.0 s in every run | any run's `telemetry.latency.coach.p95Ms` ≥ 30,000 | Hard, absolute (tightened by the owner 2026-09-28 from < 75 s, the route's deadline): the smoke's p95 was 17.9 s on early Sessions, and 30 s leaves room for the Notes growing while staying far inside the 75 s deadline |
| 7 | Cost per Session (`telemetry.perSession.dollarsPerSession`) | $0.2083 to $0.2148 | every run < $0.2083 | any run ≥ $0.2083 | Non-inferiority, margin zero: it must be cheaper than the cheapest Opus run |

Why these lines:

1. **Evidence Integrity** is the fabrication metric and is meant to be 1.00. Opus's worst split was 0.9999. The floor of 0.999 allows about one invented Problem ID per thousand citations, which is ten times Opus's worst observed rate. At 9,000 to 22,000 citations per split, that is 9 to 22 invented IDs in one split, a rate no run has come near. It is not set at 1.0000 because Opus itself did not hold that in every split, and the engine rejects an invented ID before it reaches Notes anyone reads. Every invented ID will be listed in the Results whether or not the floor holds.
2. **Claim Agreement.** Opus moved by 1.6 points (tuning) and 2.0 points (held out) across its three runs, and each run's interval is under a point wide. A 3-point margin is about one and a half times the Opus spread, so a fail is more than sampling.
3. **Plan sources.** Opus accepted all but 2 of 360 Plans on the first attempt and never fell back to the Baseline. The eval sets no deadline, so a Baseline Plan here means the Coach was rejected twice or refused through the whole fallback chain. That should almost never happen. Three in 360 is still under 1% of Sessions.
4. **Detection and false positives** are read by today's prose reader on both Arms (decision 28). One weakness is planted per split, so detection is 6 chances in all, and no threshold on it can tell a good detector from a lucky one. The line catches only a collapse. The Session of first detection will be reported beside Opus's 6, 6, 13 and 16, with no threshold, because on two to four hits it would be read from noise. False positives: Opus's tuning split moved 12 points across three runs with nothing changed, so a 10-point margin above its worst run is less than its own spread. A Sonnet run at the line would still sit inside the worst Opus run's interval (upper 0.363 tuning, 0.256 to 0.301 held out). This catches a clear degradation, nothing finer.
5. **Sessions to Mastery** is a mean over 4 or 2 Learners with no interval. One Skill on one tuning Learner moves the tuning mean by 0.25, and on one held-out Learner it moves the held-out mean by 0.5. The margin is two tuning Skills or one held-out Skill. The Simulated Learners have no practice effect, so this measures how fast a planner confirms what is already true (see the [README](./README.md)).
6. **Latency** is not compared with Opus, which averaged about 71 s a call and would very likely fail this line. The route aborts a Coach call at 75 s and gives the Learner the Baseline Plan (harness ticket 03), so a p95 at or above 75 s would mean more than one Session in twenty losing the Coach; the threshold is set at 30 s, well inside that, because the 3-Session smoke measured 17.9 s and a Coach that needs most of the deadline is not one to ship. The p95 is nearest-rank over every Coach call in the run, retries included. The eval itself sets no deadline, so slow calls finish and are counted. The p50 will be reported beside it. The 3-Session smoke (p95 17.9 s) covered early Sessions only, when the Notes are short.
7. **Cost.** A cheaper Coach is the reason for the change. The line only requires Sonnet to cost less than Opus, not to hit any particular saving. The Results will give the measured figure.

### Parent Summary, Story writer and Judge

| # | Metric | Opus Arm, three runs | Threshold (pass) | Fails when | Kind |
|---|---|---|---|---|---|
| 8a | Summary validity, first attempt | 6 of 6 in every run (CI 0.610 to 1.000) | ≥ 5 of 6 in every run | any run < 5 of 6 | Non-inferiority, one Summary |
| 8b | Summary template fallbacks | 0 in every run | 0 in every run | any fallback | Absolute |
| 8c | Summary faithfulness (Judge, when the gate opens) | 6 of 6 in every run | ≥ 5 of 6 in every run the gate opened | any such run < 5 of 6 | Non-inferiority, one Summary |
| 9a | Story validity, first attempt (of 30) | 26, 27, 28 (0.867 to 0.933; run 1: CI 0.703 to 0.947) | ≥ 24 of 30 (0.80) in every run | any run < 24 | Non-inferiority, 2 Stories |
| 9b | Story validity within the three attempts (of 30) | 30, 29, 29 (0.967 to 1.000); template fallbacks 0, 1, 1 | ≥ 28 of 30 in every run (at most 2 templates) | any run < 28 | Non-inferiority, 1 Story |
| 9c | Story readability (Judge, when the gate opens) | 20/30, 21/29, 19/29: 0.655 to 0.724 (run 3: CI 0.473 to 0.801) | ≥ 0.55 in every run the gate opened | any such run < 0.55 | Non-inferiority, about 10 points |
| 10 | Judge gate, both Calibration Sets | Stories 20 of 20, kappa 1.00, every run; Summaries 9 of 10 (kappa 0.80), 10 of 10, 10 of 10 | agreement ≥ 0.80 **and** kappa ≥ 0.60 on both sets in every run | either set fails either condition in any run | Absolute (`JUDGE_AGREEMENT_THRESHOLD`, `JUDGE_KAPPA_FLOOR`) |

The Story writer was Sonnet 5 in the Opus Arm, so rows 9a and 9b compare Sonnet 5 with Sonnet 5.5, not Opus with Sonnet. Rows 8c and 9c change the Judge as well as the writer, so a difference there cannot be put down to either one alone. The Judge and the writers are all Claude models in both Arms, and that same-family limitation stands.

**If the Judge gate fails on Sonnet 5.5.** The eval withholds that run's readability or faithfulness score (`judge.readability` or `judge.faithfulness` is null, and `judge.calibration.withheld` names the failed condition). That is reported as a result in its own right: row 10 fails, and rows 8c or 9c for that run are recorded as **withheld**, not as passing or failing. Rows 8c and 9c are then judged on the runs where the gate opened. If it opened in none, they have no Sonnet result, and the Results say so. A failed gate says Sonnet 5.5 is not an acceptable Judge on these rubrics. It says nothing about the Coach, and it does not affect rows 1 to 7. No re-run, threshold change or Judge swap is made to recover a withheld score. What to use as the Judge afterwards is a separate decision for the owner.

## How results are reported

- A Results section is added to this file after the third run. It has one line per threshold above, giving the three Sonnet values (low to high) with their Wilson intervals where the metric is a rate, the Opus range beside them, and **pass**, **fail** or **withheld**.
- Each role gets a one-line verdict: the Coach is acceptable only if rows 1 to 7 all pass; the Summary model if rows 8a to 8c pass; the Story writer if rows 9a to 9c pass; the Judge if row 10 passes.
- The results are published whatever they show. The three Sonnet reports are committed, and `docs/evals/README.md` is updated to quote them as a range across three runs, as it does for Opus.
- Nothing is re-run to turn a fail into a pass, and no threshold is changed after the first Sonnet report exists. Anything learned that would have changed a threshold is written up as a note beside the result, not applied.

## Budget

The harness budget is **$300** in API spend in all (decision 6). Every run's cost is logged below from its report's `telemetry.total.dollars`, which is an estimate from measured tokens at published rates, not the invoice.

**Estimate for the three Sonnet runs.** Two ways of estimating it, from the figures we have:

- The Opus runs' own token counts priced at Sonnet 5.5's rates ($2 in, $10 out per million): the Coach about $10.00 to $10.31 a run (about 1.02M input and 0.80M output tokens over 120 calls), plus about $0.60 for the Summaries, Stories and Judge. That comes to **$10.56 to $10.90 a run, about $32 for the three**, or about $0.085 per Coach Session. **This is the planning figure.**
- The 3-Session smoke on Sonnet 5.5 (harness ticket 06) measured $0.0207 per Session. Over 120 Sessions that is about $2.50 a run for the Coach, or about $9 for the three runs with the other calls. **This understates the cost.** It covered the Diagnostic Session and two Coach Sessions only, while the Notes the Coach reads and rewrites grow over twenty Sessions, and its input and output tokens grow with them. Opus's Coach averaged about 8,600 input and 6,700 output tokens a call over a whole run.

A ceiling for one run: the Coach's `max_tokens` is 16,000, and a run makes at most 240 Coach calls (120 Sessions, each with one retry). At full output that is 3.84M output tokens ($38.40), plus input and the other calls. One run cannot plausibly exceed about $50.

**Hard stop.** The runs are sequential, and after each one its `telemetry.total.dollars` is read before the next starts.
- If any single run costs more than **$25**, more than twice the planning figure, stop and go back to the owner before the next run.
- If the Sonnet runs together reach **$75**, stop.
- If a run would take total harness spend past **$300**, it is not started.

A stopped series is reported as it stands, with the runs it has, and it is not a pass.

### Budget log

| Date | What | Cost (estimate) | Running total |
|---|---|---|---|
| 2026-09-28 | Harness ticket 06: live `pnpm coach --real --sessions 2 --assert`, 3 Coach calls on Sonnet 5.5 | $0.0621 | $0.06 |
| 2026-09-28 | Re-scoring the three Opus reports (`pnpm eval:rescore`), no model call | $0.00 | $0.06 |
| | Sonnet 5.5 run 1 | | |
| | Sonnet 5.5 run 2 | | |
| | Sonnet 5.5 run 3 | | |

The three Opus runs of 2026-09-18 ($79.86) predate this budget and are not counted against it. The owner should correct this line if that is wrong. Any live CI smoke run that has been started by hand since ticket 02 has to be added here from its log. None is recorded at the time of writing.

## Results

Not yet run.
