# Pre-registration 1: Sonnet 5.5 against Opus 5

Drafted 2026-09-28, before any live run on Sonnet 5.5. Nothing in this file may change once the owner signs it, except the Results section and the budget log, which are filled in afterwards. The first Sonnet report's timestamp must be later than the commit that records the sign-off.

**Approval:** the thresholds below were committed on 2026-09-28, before any live Sonnet 5.5 run. The owner tightened three of them that day (detection, false positives, p95 latency; decision 35 in `.scratch/harness/decisions.md`) and approved the runs on 2026-09-29. The commit history is the record: every Sonnet report's timestamp is later than this commit.

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
| 2026-09-29 | Sonnet 5.5 run 1, `2026-09-29T19-10-40Z.json` | $6.7164 | $6.78 |
| 2026-09-29 | Sonnet 5.5 run 2, `2026-09-29T19-24-39Z.json` | $6.3714 | $13.15 |
| 2026-09-29 | Sonnet 5.5 run 3, `2026-09-29T19-37-11Z.json` | $6.9060 | $20.06 |
| 2026-09-29 | Latency probe, one Learner serially (`latency-probe-2026-09-29T19-50-09-896Z.json`), recorded here after the fact | $0.93 | $20.99 |
| 2026-09-29 | Exploratory Story re-judge, harness ticket 23 (`rejudge-2026-09-29T21-50-24Z.json`), 238 Judge calls | $0.5607 | $21.55 |

The three Opus runs of 2026-09-18 ($79.86) predate this budget and are not counted against it. The owner should correct this line if that is wrong. Any live CI smoke run that has been started by hand since ticket 02 has to be added here from its log. None is recorded at the time of writing.

## Results

Written on 2026-09-29 from the three Sonnet 5.5 reports, committed unedited: `2026-09-29T19-10-40Z.json` (run 1), `2026-09-29T19-24-39Z.json` (run 2) and `2026-09-29T19-37-11Z.json` (run 3). The sign-off commit (eac6b9b) is timed 18:56:43Z; the first Sonnet report 19:10:40Z. The three runs were sequential, none crashed, and none was repeated. The charts in this folder are now drawn from run 3.

**How to reproduce this table.** From the repo root:

```sh
node scripts/preregistration-1-results.mjs
```

It reads the six report files, calls no model and writes nothing. It computes every Wilson interval with the formula of `wilsonInterval` (`src/evals/stats.ts`) and stops with an error if one differs from the interval the report stored; it also recomputes each run's Coach p50 and p95 from `telemetry.calls` and stops if they differ from `telemetry.latency.coach`. `pnpm eval:rescore --report <file>` was run on each Sonnet report as well: stored and re-scored detection and false positives are the same for every Learner in every run.

Values are listed low to high. Pass or fail is read from the point value against the row's line, as the row defines it.

| # | Metric | Sonnet 5.5, three runs | Opus 5, three runs | Threshold (pass) | Result |
|---|---|---|---|---|---|
| 1 | Evidence Integrity, each split | tuning: run 1 1.0000 (8573 of 8573, CI 0.9996 to 1.0000); run 2 1.0000 (7323 of 7323, CI 0.9995 to 1.0000); run 3 1.0000 (7248 of 7248, CI 0.9995 to 1.0000)<br>held out: run 1 1.0000 (4067 of 4067, CI 0.9991 to 1.0000); run 2 1.0000 (3609 of 3609, CI 0.9989 to 1.0000); run 3 1.0000 (4369 of 4369, CI 0.9991 to 1.0000)<br>invented Problem IDs: 0 in 35189 citations | 1.0000 in all six split-runs; 1 invented ID in 95,922 | ≥ 0.999 in every split of every run | **pass** |
| 2 | Claim Agreement, each split | tuning: run 3 0.956 (CI 0.951 to 0.960); run 2 0.980 (CI 0.977 to 0.983); run 1 0.985 (CI 0.982 to 0.987)<br>held out: run 2 0.930 (CI 0.922 to 0.938); run 3 0.994 (CI 0.991 to 0.996); run 1 0.996 (CI 0.994 to 0.998) | tuning 0.923 to 0.940; held out 0.931 to 0.951 | tuning ≥ 0.893; held out ≥ 0.900 | **pass** |
| 3a | First-attempt Coach Plans, pooled | 355 of 360 (0.986, CI 0.968 to 0.994); 5 retries (per run 3, 0, 2) | 358 of 360 (0.994); 2 retries | ≥ 342 of 360 | **pass** |
| 3b | Baseline fallbacks, pooled | 0 of 360 (CI 0.000 to 0.011) | 0 of 360 | ≤ 3 of 360 | **pass** |
| 4a | Detection (prose reader), pooled | 6 of 6 (1.00, CI 0.61 to 1.00); crossing-ten: run 1 Session 6, run 2 Session 14, run 3 Session 6; change-unknown: run 1 Session 10, run 2 Session 12, run 3 Session 5 | 4 of 6; Sessions 6, 6, 13, 16 | ≥ 3 of 6, each weakness named in at least one run | **pass** |
| 4b | False positives (prose reader), tuning | run 3 7/21 = 0.333 (CI 0.172 to 0.546); run 1 7/19 = 0.368 (CI 0.191 to 0.590); run 2 7/14 = 0.500 (CI 0.268 to 0.732) | 4/39, 7/44, 10/45: 0.103 to 0.222 | every run ≤ 0.222 (10 of 45) | **fail** |
| 4c | False positives (prose reader), held out | run 3 2/14 = 0.143 (CI 0.040 to 0.399); run 2 2/12 = 0.167 (CI 0.047 to 0.448); run 1 3/10 = 0.300 (CI 0.108 to 0.603) | 3/30, 0/20, 2/20: 0.000 to 0.100 | every run ≤ 0.100 (3 of 30) | **fail** |
| 5 | Mean Skills Mastered by Session 20 | tuning: run 2 5.00, run 3 5.25, run 1 5.50 (Baseline 6.00)<br>held out: run 1 5.50, run 2 5.50, run 3 6.00 (Baseline 6.00) | tuning 5.75, 5.75, 6.50; held out 5.50, 5.50, 5.00 | tuning ≥ 5.25; held out ≥ 4.50, every run | **fail** |
| 6 | p95 Coach latency, per run | run 3 p95 92.2 s (p50 26.4 s, 122 calls); run 1 p95 93.4 s (p50 26.0 s, 123 calls); run 2 p95 94.0 s (p50 23.1 s, 120 calls) | not recorded; mean 69.9 to 73.3 s | p95 < 30.0 s in every run | **fail** |
| 7 | Cost per Session | run 2 $0.0499, run 1 $0.0527, run 3 $0.0541 | $0.2083 to $0.2148 | every run < $0.2083 | **pass** |
| 8a | Summary validity, first attempt | run 1 6 of 6 (CI 0.610 to 1.000); run 2 6 of 6 (CI 0.610 to 1.000); run 3 6 of 6 (CI 0.610 to 1.000) | 6 of 6 every run | ≥ 5 of 6 in every run | **pass** |
| 8b | Summary template fallbacks | run 1 0, run 2 0, run 3 0 | 0 every run | 0 in every run | **pass** |
| 8c | Summary faithfulness (Judge, gate open) | run 1 5 of 6 = 0.833 (CI 0.436 to 0.970); run 2 6 of 6 = 1.000 (CI 0.610 to 1.000); run 3 6 of 6 = 1.000 (CI 0.610 to 1.000) | 6 of 6 every run | ≥ 5 of 6 in every run the gate opened | **pass** |
| 9a | Story validity, first attempt (of 30) | run 1 30 (CI 0.886 to 1.000); run 2 30 (CI 0.886 to 1.000); run 3 30 (CI 0.886 to 1.000) | 26, 27, 28 | ≥ 24 of 30 in every run | **pass** |
| 9b | Story validity within three attempts (of 30) | run 1 30, 0 templates (CI 0.886 to 1.000); run 2 30, 0 templates (CI 0.886 to 1.000); run 3 30, 0 templates (CI 0.886 to 1.000) | 30, 29, 29; templates 0, 1, 1 | ≥ 28 of 30 in every run | **pass** |
| 9c | Story readability (Judge, gate open) | run 1 14 of 30 = 0.467 (CI 0.302 to 0.639); run 2 14 of 30 = 0.467 (CI 0.302 to 0.639); run 3 16 of 30 = 0.533 (CI 0.361 to 0.698) | 20/30, 21/29, 19/29: 0.655 to 0.724 | ≥ 0.55 in every run the gate opened | **fail** |
| 10 | Judge gate, both Calibration Sets | Stories: run 1 17 of 20 = 0.85 (CI 0.640 to 0.948), kappa 0.71; run 2 17 of 20 = 0.85 (CI 0.640 to 0.948), kappa 0.71; run 3 17 of 20 = 0.85 (CI 0.640 to 0.948), kappa 0.71<br>Summaries: run 1 10 of 10 = 1.00 (CI 0.722 to 1.000), kappa 1.00; run 2 10 of 10 = 1.00 (CI 0.722 to 1.000), kappa 1.00; run 3 10 of 10 = 1.00 (CI 0.722 to 1.000), kappa 1.00 | Stories 20/20 kappa 1.00 every run; Summaries 9/10, 10/10, 10/10 | agreement ≥ 0.80 and kappa ≥ 0.60, both sets, every run | **pass** |

Five rows fail: 4b, 4c, 5, 6 and 9c. None is withheld, because the Judge gate opened on both Calibration Sets in every run. No invented Problem ID appeared in any run (0 of 35,189 citations), so row 1 has none to list.

**Which failures sit inside the Opus Arm's own spread.** None of them does, on the point values.

- **4b, false positives, tuning.** Every Sonnet run (0.333, 0.368, 0.500) is above the worst Opus run (0.222). Only run 3's 0.333 falls inside the worst Opus run's own interval (0.125 to 0.363).
- **4c, false positives, held out.** Every Sonnet run (0.143, 0.167, 0.300) is above the worst Opus run (0.100). Runs 2 and 3 fall inside that Opus run's interval (0.035 to 0.256), and run 1 does not.
- **5, Sessions to Mastery.** One run fails, on one split: run 2's tuning mean is 5.00 against the 5.25 line, one Skill on one tuning Learner short. Opus's tuning range was 5.75 to 6.50, so this is below it. Runs 1 and 3 pass on tuning, and run 3's 5.25 sits exactly on the line. The held-out split passes in every run (5.50 to 6.00, at or above Opus's 5.00 to 5.50).
- **6, p95 Coach latency.** There is no Opus p95 to compare with. Every run is about three times the 30 s line (92.2 to 94.0 s). The line would still fail without the slow tail described below: set aside every call over 60 s, and the p95 of the remaining calls is 36.3, 41.9 and 37.5 s.
- **9c, Story readability.** 0.467 to 0.533, against Opus's 0.655 to 0.724 and the 0.55 line. Both the writer (Sonnet 5 to Sonnet 5.5) and the Judge (Opus 5 to Sonnet 5.5) changed, so this fail cannot be put down to either one alone. See the findings below.

**Per-role verdicts.**

- **Coach: not acceptable.** Rows 1, 2, 3a, 3b, 4a and 7 pass. Rows 4b, 4c, 5 and 6 fail.
- **Parent Summary: acceptable.** Rows 8a, 8b and 8c pass. Run 1's faithfulness, 5 of 6, is exactly on the line.
- **Story writer: not acceptable.** Rows 9a and 9b pass, with 30 of 30 valid on the first attempt in every run. Row 9c fails.
- **Judge: acceptable on row 10.** The gate opened on both sets in every run. On the Story Calibration Set, Sonnet 5.5 agreed on 17 of 20 (kappa 0.71) in every run, where Opus 5 agreed on 20 of 20.

Nothing was re-run and no threshold was changed.

### Findings outside the pre-registered lines

These are observations made while writing the results. **They change no verdict above.**

**1. The Coach latency tail.** Verified from each run's `telemetry.calls`, with positions counted from 1 in completion order among that run's Coach calls. `node scripts/preregistration-1-results.mjs` prints these figures.

- In all three runs the Coach's p95 is 92.2 to 94.0 s, while its p50 is 23.1 to 26.4 s. The distribution has two separate parts. No Coach call in any run took between 60 and 80 s. Every call over 60 s took 86 to 114 s, and every other call took at most 50.8 s.
- The slow calls come in rounds of consecutive calls:
  - run 1: 11 of 123 calls, at positions 31 to 37 (6 of those 7 calls; 36 was not slow) and 98 to 103 (5 of 6; 100 was not slow);
  - run 2: 11 of 120 calls, at 28 to 34 (6 of 7; 33 was not slow) and 104 to 108 (all 5);
  - run 3: 7 of 122 calls, at 59 to 64 (all 6) and at 122, the run's last Coach call, alone.

  Runs 1 and 2 put their two rounds in nearly the same places. Run 3 does not.
- The slow calls do not write more. Their median output was 3,218, 3,888 and 4,039 tokens, against 3,969, 3,593 and 4,007 for the other calls. Their output throughput was 35 to 44 tokens a second, against about 153 to 158 for the other calls. Put another way, every slow call took 65 to 74 s longer than its own output would take at the ordinary rate. That looks like a roughly fixed wait of about 70 s added to an otherwise ordinary call, rather than generation that was slow throughout. It is an inference from wall time and tokens only.
- The eval runs the six Learners concurrently (`runEvals` in `src/evals/evals.ts`, `Promise.all`), so about six Coach calls are in flight at once. The Stories and their Judge calls also overlap the first Coach Sessions. A round of 5 or 6 slow calls is about the number of calls in flight, which fits one event delaying every call open at that moment. Every call was served by `claude-sonnet-5-5`; the refusal fallback served none.
- **The cause is not established.** Telemetry records one wall time per call and nothing about what happened inside it. There are two candidates:
  - SDK-internal retries after a 429 or 529, which telemetry does not record. The eval builds its Coach with the SDK's default retries (`src/cli/generation.ts`), while the live route sets `maxRetries: 0` (`src/app/api/coach/route.ts`). (2026-09-29: ticket 24 removed the Coach graph, and the route now uses the SDK's default retries too, so this contrast no longer holds.)
  - Concurrency effects on the serving side.

  Nothing in the reports can tell these apart.
- **The eval may overstate production latency.** The live app makes one Coach call per Learner at a time, not six at once. Also, with retries off, a call that the eval would have waited out would fail or reach the 75 s deadline in production, and the Learner would get the Baseline Plan. So the tail's cost in production would be a Baseline fallback, not a wait. This does not rescue row 6. The calls outside the rounds alone have a p95 of 36 to 42 s, and Coach calls grow over a run as the Notes grow: input from about 3,300 to about 10,000 tokens, output from about 1,000 to about 7,000. (2026-09-29: since ticket 24 the route no longer turns retries off, so the "with retries off" part of this reasoning no longer holds. The one-call-at-a-time part and the 75 s deadline still do.)
- **Proposed next step.** Record per call, in telemetry, the SDK's retry count and the request ids it saw. Then time one Learner's 20 Sessions serially on Sonnet 5.5 (about $1 at these runs' cost per Session) to see whether the ~70 s rounds appear without concurrency.

**2. Story readability and the Judge change.** Every Story in both Arms carries the `{{nickname}}` placeholder by design (`NICKNAME_PLACEHOLDER`, `src/story/nickname.ts`). The app fills it in at play time, and the Story Judge's prompt (`STORY_JUDGE_SYSTEM_PROMPT`, `src/evals/judge.ts`) does not mention it.

- The Sonnet 5.5 Judge cites the placeholder as a defect in 11 of its 16, 12 of its 16 and 10 of its 14 failed Stories across the three runs. The Opus 5 Judge cited it in none of its 8 to 10 fails per run.
- On the Story Calibration Set, Sonnet 5.5 failed 3 human-passed Stories in every run, and 6 of those 9 disagreements cite the placeholder.

So row 9c's fail is at least partly the new Judge reading an intended placeholder as garbled text, and not only the new writer. The row stands as a fail as pre-registered. Anyone choosing the Judge afterwards should know this.

**3. Fewer supported Hypotheses, so higher false-positive rates.** Sonnet 5.5's Coach supported 19, 14 and 21 Hypotheses on the tuning split and 10, 12 and 14 held out. Opus 5 supported 39, 44 and 45, and 30, 20 and 20. The number of false positives is similar: 7, 7 and 7 on tuning against Opus's 4, 7 and 10, and 3, 2 and 2 held out against 3, 0 and 2. The rates in rows 4b and 4c rose mainly because the denominators roughly halved. The rows are defined on the rate, and they fail.

**4. Where Sonnet 5.5 did better than Opus 5.**

- Detection was 6 of 6, with first Sessions 5 to 14, against Opus's 4 of 6 at Sessions 6 to 16.
- Claim Agreement was above Opus's range in five of the six split-runs.
- Every Story was valid on the first attempt.
- Cost per Session was about a quarter of Opus's.

Sonnet also retried 5 Plans in 360, against Opus's 2, and none fell back to the Baseline.

**5. Cost against the planning figure.** The runs cost $6.37 to $6.91, against a planning figure of $10.56 to $10.90 a run. The Sonnet Coach wrote about 0.45 to 0.49M output tokens a run, where the planning figure assumed Opus's 0.80M. No stop rule was reached.

**Follow-up probe, 2026-09-29 (exploratory; changes no verdict).** `scripts/latency-probe.ts` ran one Learner (crossing-ten-weakness) for 20 Sessions on the real Coach, **one call at a time**, and logged every HTTP attempt the SDK made. The data is in `docs/evals/latency-probe-2026-09-29T19-50-09-896Z.json` and cost $0.93.

- **Retries, rate limits and concurrency are ruled out.** There were 20 HTTP attempts for 20 Coach calls, every one a 200, so no SDK retry, 429 or 529 happened. The rate-limit headers show the account nowhere near any limit. And one call still took 106.3 s with nothing else in flight, at 47 output tokens a second against about 150 for the rest.
- **The tail is occasional slow generation on the API side.** It happens in serial use too, so the live app, which makes one Coach call at a time, will see it.
- **Serial latency without the tail:** p50 23.1 s and p95 35.7 s. Calls lengthen as the Learner Notes grow: 10 to 15 s in the first Sessions, 30 to 35 s by Session 17. So row 6's 30 s line would fail even without the tail.
- **Next step: engineering.** Stream the Coach call and abandon it on silence (no tokens for a set time) instead of on total time. Hedge it: send a second request when the first stalls, and keep whichever finishes first.

**Exploratory: the Story Judge told about the placeholder, 2026-09-29.** This was done after the fact and changes no verdict. Row 9c's FAIL stands as pre-registered.

- **What changed.** Harness ticket 23 added one sentence to the Story Judge's prompt (`STORY_JUDGE_SYSTEM_PROMPT`, `src/evals/judge.ts`). It says `{{nickname}}` stands for the child's Nickname, which the app fills in, and that the Judge must never fail a Story for it. The sentence was written once and not tuned.
- **The run.** `pnpm eval:rejudge` re-judged the stored Stories of all six reports with the new prompt on the Sonnet 5.5 Judge. That covers the three Sonnet 5.5 runs, and the three Opus-Arm runs, whose Stories Sonnet 5 wrote. Each report's gate ran on the open half of the Story Calibration Set only (10 Stories), so the sealed half stays unscored for Pre-registration 2. The output is [rejudge-2026-09-29T21-50-24Z.txt](./rejudge-2026-09-29T21-50-24Z.txt), with every verdict and reason in the [JSON](./rejudge-2026-09-29T21-50-24Z.json). It cost $0.56.

| Stories | Stored readability | Re-judged readability (new prompt, Sonnet 5.5 Judge) | Open-half gate |
|---|---|---|---|
| Sonnet 5.5 writer, run 1 | 14 of 30 (0.467) | 17 of 30 (0.567, CI 0.392 to 0.726) | 9 of 10, kappa 0.80 |
| Sonnet 5.5 writer, run 2 | 14 of 30 (0.467) | 16 of 30 (0.533, CI 0.361 to 0.698) | 8 of 10, kappa 0.60 |
| Sonnet 5.5 writer, run 3 | 16 of 30 (0.533) | 15 of 30 (0.500, CI 0.332 to 0.668) | 8 of 10, kappa 0.60 |
| Sonnet 5 writer (Opus Arm), run 1 | 20 of 30 (0.667, Opus 5 Judge) | 11 of 30 (0.367, CI 0.219 to 0.545) | 9 of 10, kappa 0.80 |
| Sonnet 5 writer (Opus Arm), run 2 | 21 of 29 (0.724, Opus 5 Judge) | 8 of 29 (0.276, CI 0.147 to 0.457) | 9 of 10, kappa 0.80 |
| Sonnet 5 writer (Opus Arm), run 3 | 19 of 29 (0.655, Opus 5 Judge) | 12 of 29 (0.414, CI 0.255 to 0.593) | 8 of 10, kappa 0.60 |

What it shows:

- **The placeholder problem is gone.** None of the 99 re-judged fails mentions the placeholder, against 33 of 46 stored Sonnet-Judge fails. This was checked by reading the reasons, not only the count.
- **Readability barely moved.** It rose from 0.467 to 0.533 up to 0.500 to 0.567 for the Sonnet 5.5 Stories. The Sonnet 5.5 Judge still fails about half of them, now mostly on Theme fit ("a bare sum with a Theme word pasted on") and on stiff phrasing such as "at the start". Read against row 9c's 0.55 line, one run of three would clear it.
- **With the Judge held fixed, the newer writer does better.** Sonnet 5.5's Stories score 0.500 to 0.567, and Sonnet 5's score 0.276 to 0.414, under the same Judge and prompt. So row 9c's drop comes from the Judge changing (Opus 5 to Sonnet 5.5), and a stricter reading of Theme fit, not from a worse Story writer.
- **Caveats.**
  - The gate is 10 Stories, not the 20 of row 10, and two runs sit exactly on its lines (8 of 10, kappa 0.60).
  - Each Story was judged once, and some identical or near-identical Stories got different verdicts across runs.
  - The Sonnet 5.5 Judge disagrees with the owner's labels on 1 or 2 of the 10 open Stories. On the Theme rubric it is harsher than both the owner and the Opus 5 Judge.
  - Whether that harshness is right is a rubric question for Pre-registration 2. It is not settled here.

