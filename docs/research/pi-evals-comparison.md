# Ollie's evals against pi's: two harnesses built on the same instinct

Researched 2026-09-18, against a local fork of the pi coding agent at `/Users/rahat-clawd/dev/pi` (branch `main`, HEAD `853a80d2`, "Add [Unreleased] section for next cycle", 2026-08-28, v0.84.4, remote `earendil-works/pi`), against the current upstream `packages/evals` on GitHub, and against Ollie's own `src/evals/*.ts`, `docs/evals/README.md`, `docs/research/evals-comparison.md` and `docs/submission/evidence.md`.

## Summary

pi has a real eval harness — a private workspace package, `packages/evals`, built on `vitest-evals`, whose whole design is a **paired comparison**: the same cases run in a `without_docs` arm and a `with_docs` arm and the report prints the lift between them. Ollie's harness is hand-written, has no framework under it, and scores seven things instead of one. Built by different people for different products, they arrive at **the same three convictions**: score a candidate against a control on identical inputs, keep a low score as an observation rather than a test failure, and **refuse to print a headline number when the evidence behind it is incomplete**. The differences are mostly the products talking. pi grades a coding agent, whose work a program can check, so its judges are deterministic predicates over tool calls and files and it needs no calibration; Ollie grades a Story a six-year-old has to follow, which no program can check, so it needs a rubric Judge and the 80 %-plus-kappa gate in front of it. pi is plainly better at isolation, repetitions and per-run telemetry; Ollie is plainly better at held-out data, uncertainty and citable results. Neither runs its evals in CI.

The local fork is **about three weeks behind upstream**, and behind on exactly this package: since 2026-08-28 upstream has rewritten `packages/evals/src` into `cli.ts` / `docker.ts` / `plan.ts` / `report.ts` / `harness.ts` and added documentation-lift evals ([commits to `packages/evals`](https://github.com/earendil-works/pi/commits/main/packages/evals), latest 2026-09-17). The fork still carries the earlier in-process design (`pi-harness.ts`, `vitest-evals/harness-table.ts`, `summary.ts`, `reporter.ts`). Both are described below; the table reflects upstream, which is what the question points at.

---

## 1. The comparison

| Practice | pi | Ollie |
| --- | --- | --- |
| Harness structure | A private workspace package, `packages/evals`, on `vitest-evals`. Eval files flat under `evals/` (7 suites), runner split into `cli` / `docker` / `plan` / `report` / `harness`. The harness drives a real `AgentSession` in a throwaway workspace. | `src/evals/*.ts` inside the app, one pure `runEvals()` over the Loop plus `src/cli/eval.ts`. No framework; every scorer hand-written. Seven scores in one run. |
| Deterministic vs model-graded | **Deterministic throughout.** Every judge I could read is code — `ExtensionAuthoringJudge` scores imports, loader errors, the `hello({name:"Bob"})` tool call and the exact final string; upstream's example uses `StructuredOutputJudge` with strict matching. No LLM judge ships in either version. | **Deterministic first, then a rubric.** Validators gate Stories and Summaries (first-attempt rate, rate within bounded attempts, template fallbacks, rejection reasons); an Opus 5 Judge scores only what code cannot see. Evidence Integrity and detection are pure code. |
| Judge calibration | None — and none needed: a predicate has nothing to calibrate against. | Gated and withheld: agreement ≥ 0.80 **and** Cohen's kappa ≥ 0.60 against 20 hand-labelled Stories and 10 Summaries, with the confusion matrix and the two trivial judges printed beside it (`judge.ts`, `calibration.ts`). |
| Baseline or control | The centre of the design. `without_docs` vs `with_docs` images from the same staged runtime; lift = candidate pass rate − baseline pass rate in points. The fork's `evalHarnessTable` is the same idea in-process, with paired token / latency / cost deltas. | Also central. The Baseline planner (same Loop, fixed 8-of-10 rule) runs every Simulated Learner on **identical seeds** to the Coach, so the Diagnostic Sessions are byte-identical and every later difference is the planner's. |
| Seeds and reproducibility | Cannot seed a model, so it buys reproducibility with **isolation**: a fresh container, home, agent dir, workspace and session dir per arm; `thinkingLevel: "off"`; a `protocol.json` digest over model, image IDs and cases; repetition order alternated to reduce order bias; `--runs-per-variant` for stability. | The substrate is a pure function: every draw seeded by Learner + Problem ID + attempt, so a run reproduces byte for byte. The model calls are not seeded, no temperature is set, and **each Learner runs once** — nondeterminism is unmeasured. |
| Held-out data | None. Both arms see the same cases; there is no tuning corpus to hold anything back from. | 2 of 6 Simulated Learners held out of prompt tuning, declared in advance, scored in their own split in every report (`stats.ts: summariseSplits`). |
| Results storage and citation | Rich per run, **none committed**: `.eval/<timestamp>_<id>/` is gitignored and carries `protocol.json`, `expected-runs.json`, `observations.jsonl`, per-arm `vitest.json`, full Pi session JSONL, `report.json`/`report.txt`. No leaderboard, no history. | Thin per run, **all committed**: 8 dated JSON reports under `docs/evals/`, every chart redrawn from a report file and never from a live run, and the write-up cites a report by path. `eval:rescore` rescores a stored run with the current scorer without paying for it again. |
| Cost discipline | The eval path always hits a real provider; cost is held down by keeping the suite tiny, defaulting to one repetition, `noTools: "all"` on the smoke eval, thinking off, and recording `estimatedCostUsd` per run. The faux provider (`packages/ai/src/providers/faux.ts`) is for unit tests only — AGENTS.md: "No real provider APIs, keys, or paid tokens." | A fake Generation and a fake Judge run the **whole** harness offline (`pnpm eval --fake`, no network), and the fake Judge fails calibration by design so every fake run demonstrates the gate. A live run is a few dollars. |
| CI gating | No. `.github/workflows/ci.yml` runs build, check and `npm test`; no workflow invokes `npm run eval`. The harness's own code is unit tested (`test/vitest-evals/*.test.ts`, `test/pi-harness.test.ts`) and those do run in CI. | No — Ollie has no workflows at all. `pnpm test` (576 tests) covers the scorers locally. |
| Regression policy | The comparison is the gate and it **withholds**: a pair contributes only when both arms produce exactly one score; a blocked pair withholds headline pass rates and exits nonzero; the report flags no lift, negative deltas, saturated arms and flakiness. `judgeThreshold: null` keeps a low score out of the pass/fail path. No committed thresholds or history, so a human compares two runs. | "Run it before any prompt or Plan Space change so the numbers can be compared" (`src/cli/eval.ts`). Committed reports make that comparison possible; `eval:rescore` makes a scorer change testable against old runs. No threshold, no gate, no CI. |

## 2. Shared philosophy

Four things line up, and they are not accidents of vocabulary.

**A control arm on identical inputs, and the score is a difference.** pi does not ask "can the agent write an extension"; it asks how much the documentation in the system prompt moves the pass rate, baseline against candidate, on the same cases. Ollie runs the Baseline planner through the same Loop on the same seeds and reports the gap. Both refuse the absolute number.

**A low score is data, not a failed test.** pi says it outright — `judgeThreshold: null`, "reserve Vitest assertions for broken suite invariants", "`expect.soft(...)` is not a scoring mechanism". Ollie's equivalent is scoring rejected generations rather than throwing them away: an invented Problem ID counts against Evidence Integrity even though the engine refused the output.

**Withholding.** pi blocks a pair when an arm is missing, duplicated, skipped or errored, and withholds the eval set's headline if any pair is blocked. Ollie withholds `judge.readability` and `judge.faithfulness` and names the condition that failed. One refusal to publish a number the run did not earn.

**The harness is a seam in the product, not a dataset.** Neither has a JSONL corpus or a registry. pi's harness is an adapter over `AgentSession` with `transformSystemPrompt` and `output` hooks; Ollie's is a pure function over the Loop behind `Generation` and `Judge` interfaces. Both unit-test the scorers themselves (pi 4 files, Ollie 12).

## 3. Differences that come from the products

A coding agent's work is checkable by running it, so pi's grading collapses into predicates over the trajectory — did this tool call happen, with these arguments, returning this string — and the hard engineering moves into the **environment**: image parity between arms, symmetric removal of documentation from internal dependency packages, eval files root-owned and unreadable after the harness drops privileges, a planned cohort compared against the observed one. A Grade 1 word problem has no such oracle, so Ollie spends its engineering on **statistics**: Wilson intervals on every rate, kappa beside every agreement, a declared held-out split. pi has no calibration gate because it needs none; Ollie has no isolation machinery because a pure function needs none.

Scope differs too. pi measures **one intervention** across a handful of workflows and can therefore afford repetitions and containers. Ollie measures a whole loop — convergence, detection, false positives, citation integrity, two validities, two rubric scores — once, which is why its weak point is power, not design.

pi is straightforwardly better at: repetitions with a stability story, per-arm cost and latency telemetry, isolation strong enough to make a run reproducible beyond the seed, and a report that distinguishes "missing" from "zero". Ollie is straightforwardly better at: a held-out split, uncertainty on every number, judge calibration with a real refusal behind it, an offline fake that runs the whole harness in milliseconds, and committed reports. pi's `.eval/` is gitignored — nothing in that repo lets you check a number someone quoted last month.

## 4. What Ollie should copy

**Before the deadline (today, 2026-09-18) — cheap, and none of it touches a scorer:**

1. **Record telemetry per arm.** pi's reporter writes tokens, wall time and `estimatedCostUsd` for every run; Ollie's report says nothing about what a run cost or how long it took. Three fields make the live run's cost claim checkable.
2. **Write the planned cohort beside the observed one** (pi's `expected-runs.json` against `observations.jsonl`): how many Stories, Summaries and Sessions were *planned* against how many were scored, so a missing item is visible rather than silently absent from a denominator.
3. **Extend withholding from the Judge to any incomplete sample** — pi's "blocked pair" rule. Say "blocked" rather than print a rate when an arm errored.
4. **Name every model in the report**, not just `fake` or "the Coach": pi pins model, provider and image IDs into a protocol digest; Ollie's Story writer and Judge appear only on the console.

**After:**

1. **One real A/B in pi's shape.** Take a single intervention — the Coach prompt with and without the Notes rubric — run it five times per variant against a baseline arm, and report lift in points with blocked pairs. One defensible lift beats seven scores from a single run.
2. **Isolation and a protocol digest** so a live run is reproducible beyond the seed: pinned model IDs, a recorded prompt hash, a fresh directory per arm.
3. **Put the fake run in CI.** Both repos fail this; Ollie's `--fake` run is milliseconds and would catch harness regressions on every push.
4. **Do not copy pi's grading wholesale.** Deterministic judges suit a product whose output is verifiable. Ollie's detection regex is already that mistake in reverse — a program standing in for a judgement — and should move towards a calibrated rubric, not away from one.

---

## Sources

**pi, local fork** (`/Users/rahat-clawd/dev/pi`, `main` @ `853a80d2`, 2026-08-28, v0.84.4, remote `earendil-works/pi`):
`packages/evals/README.md`, `packages/evals/package.json`, `packages/evals/scripts/run-evals.mjs`, `packages/evals/vitest.config.ts`, `packages/evals/.gitignore`, `packages/evals/src/pi-harness.ts`, `src/smoke.eval.ts`, `src/extensions.eval.ts`, `src/vitest-evals/{harness-table,summary,reporter,artifacts,setup}.ts`, `packages/evals/test/**`; `.github/workflows/ci.yml`; root `package.json` (`"eval": "npm run eval --workspace=@earendil-works/pi-evals --"`); `AGENTS.md` (testing policy, faux provider); `packages/coding-agent/test/suite/harness.ts`; `packages/ai/src/providers/faux.ts`.

**pi, upstream `main`** (fetched 2026-09-18): [`packages/evals/README.md`](https://raw.githubusercontent.com/earendil-works/pi/main/packages/evals/README.md), [`packages/evals/src`](https://github.com/earendil-works/pi/tree/main/packages/evals/src), [`packages/evals/evals`](https://github.com/earendil-works/pi/tree/main/packages/evals/evals), [`packages/evals/package.json`](https://raw.githubusercontent.com/earendil-works/pi/main/packages/evals/package.json), [commit history for `packages/evals`](https://github.com/earendil-works/pi/commits/main/packages/evals).

**Ollie**: `docs/evals/README.md`, `docs/evals/*.json` (8 reports), `src/evals/{evals,judge,calibration,stats,learners,rescore,stories,summaries,hypotheses}.ts`, `src/cli/eval.ts`, `package.json` scripts, `docs/research/evals-comparison.md` §§1, 5–7, `docs/submission/evidence.md`.

**Unverified**: no eval was executed for this note, in either repo. Statements about what pi's upstream runner does at run time come from its README and file listing, not from a run; the fork's behaviour was read from source. No LLM judge appears in any pi eval I read, but upstream depends on `autoevals`, so one may exist in a file I did not fetch.
