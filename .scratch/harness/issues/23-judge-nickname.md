# 23: The Story Judge knows `{{nickname}}` is intended

**Read first:** `CONTEXT.md` (capitalised terms are defined there; see Nickname and Judge); `.scratch/harness/decisions.md` #24, 40; `docs/evals/preregistration-1.md`, Results › row 9c and Findings outside the pre-registered lines (2); `src/evals/judge.ts`, `src/evals/judge-anthropic.ts`, `src/evals/sealed.ts`, `src/story/nickname.ts`. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** Every Story is written with the `{{nickname}}` placeholder (`NICKNAME_PLACEHOLDER`), which the app fills in at play time. The Story Judge's prompt does not say so. The Sonnet 5.5 Judge cited the placeholder as a defect in 33 of its 46 Story fails across the three Pre-registration 1 runs, and in 6 of its 9 disagreements on the Story Calibration Set. The Opus 5 Judge never did.

1. **The prompt.** `STORY_JUDGE_SYSTEM_PROMPT` gains one or two sentences:
   - the placeholder stands for the child's Nickname, which the app fills in before the Story is read aloud;
   - the Judge reads it as a name and never fails a Story for it.
   - Build the sentence from `NICKNAME_PLACEHOLDER`, not a second copy of the string.
   - It is written once and not tuned against any result (decision 40).
2. **The re-judge command.** `pnpm eval:rejudge --report <file> [--report <file> ...] [--fake]`:
   - reads each stored report's Stories (`stories.stories`, each with its `input` and `text`);
   - judges them again with the eval's Judge (`anthropicJudge`, Sonnet 5.5, effort `medium`), unchanged apart from the prompt;
   - runs the Judge gate once per report on the **open half** of the Story Calibration Set only (`"tuning"` access). There is no new `finalRun` caller, and the seal's test is unchanged;
   - per report, prints and writes:
     - the stored readability;
     - the re-judged readability with its Wilson interval;
     - the open-half gate (agreement, kappa, pass or withheld, under the eval's thresholds; readability is withheld when the gate fails, as in the eval);
     - how many re-judged fails still mention the placeholder;
     - every Story whose verdict changed;
   - records cost with the telemetry recorder and prints the Cost block;
   - calls no model with `--fake` (the fake Judge), which is what the tests and CI use.
3. **The run, after merge (the orchestrator; cents, approved).** Re-judge the three Sonnet 5.5 reports of 2026-09-29 and the three Opus-Arm reports of 2026-09-18, whose Stories Sonnet 5 wrote. The same new Judge on both writers separates the writer from the Judge for row 9c. Commit the output under `docs/evals/`. Publish it in `docs/evals/preregistration-1.md`'s exploratory section, labelled as exploratory and after the fact. The pre-registered 9c FAIL stands and is not changed. Log the spend in the budget log.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] The prompt names the placeholder through `NICKNAME_PLACEHOLDER`; a test holds it
- [x] `pnpm eval:rejudge --fake` runs on a stored report with no network, and a test checks its figures against a hand-computed case
- [x] The re-judge reads the open half only; the seal's caller test is unchanged and passes
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm eval --fake` and `pnpm build` pass
- [x] After merge: both Arms re-judged and published as exploratory; 9c unchanged; spend logged (the orchestrator)

## Comments

**2026-09-29, implementation (PR #74).**
- **The prompt.** One paragraph is added to `STORY_JUDGE_SYSTEM_PROMPT`, built from `NICKNAME_PLACEHOLDER`. It was written once. A test holds the sentence and checks that `judge.ts` has no second copy of the string.
- **The command.** `pnpm eval:rejudge --report <file> ... [--fake] [--out <dir>]`: `src/evals/rejudge.ts`, with its tests, and `src/cli/eval-rejudge.ts`.
  - It gates each report on the open half of the Story Calibration Set (`"tuning"` access, no new `finalRun` caller), with the eval's own thresholds and `wilsonInterval`.
  - It prints the stored and re-judged readability, the gate, the fails that mention the placeholder (new and stored), and every changed verdict. It ends with the Cost block.
  - `--fake` writes to the temp directory.
- **Decided in the PR.**
  - Stories are judged even when the gate fails; only the readability score is withheld.
  - Placeholder mentions are counted with `/nickname|placeholder/i`.
  - The files are named `rejudge-<date>`, so `latestReportFile` never picks one up.
- **Review fixes.** A two-axis review led to shared helpers: `describeJudge`, `scoreLine` and `storyReadability`. `formatTelemetry` no longer takes a flag, and the command's names are clearer.

**2026-09-29, the live run (orchestrator).**
- **What ran.** All six stored reports were re-judged in one run: 238 Judge calls, $0.5607. The output is `docs/evals/rejudge-2026-09-29T21-50-24Z.{txt,json}`.
- **Placeholder mentions.** 0 of the 99 re-judged fails mention the placeholder, against 33 of 46 before.
- **Readability.** Sonnet 5.5's Stories re-judge at 0.500 to 0.567. Sonnet 5's Stories (the Opus Arm) re-judge at 0.276 to 0.414 under the same Judge. So row 9c's drop is the Judge, not the writer. The Sonnet 5.5 Judge is harsh on Theme fit.
- **The gate.** It opened in all six runs on the open half (8 or 9 of 10).
- **Where it is published.** In `docs/evals/preregistration-1.md`, after the follow-up probe, labelled exploratory. Row 9c's FAIL is unchanged. The spend and the latency probe's $0.93, which had not been logged, are now in the budget log.

