# 13: A free labelling page, with sealed halves

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 2 › Labelling; `.scratch/harness/decisions.md` #24, 27; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** A small labelling page, local or a private artifact, shows one item at a time with its evidence and saves the labels to a JSON file committed to the repo. It covers:
- the 20 Stories;
- the 10 Summaries;
- about 100 Hypothesis claims drawn from the three live Opus reports.

For each claim, the labeller records:
- its Polarity;
- whether it names each planted weakness as a difficulty;
- whether its cited Problems support it.

Before anyone tunes anything, half of each set is sealed at random with a fixed seed, and the split is committed. The sealed half is scored only in the final runs.

The owner may label through a LangSmith annotation queue. The labels land in the same JSON.

**Blocked by:** None (can start immediately). Re-pointed 2026-09-28 from 10.

**Status:** resolved

- [x] The page runs with no account and writes labels in the schema the Judge gate and the claim reader read
- [x] The claim set is drawn reproducibly from the live reports (seeded) and covers every Polarity
- [x] The sealed split is committed before any label exists and a test fails if tuning code reads the sealed half
- [x] Human-human agreement and kappa are computed by the eval from two label files

## Comments

**2026-09-28, implementation.** `pnpm label --labeller <name>` serves the labelling page on http://localhost:3300 (`src/cli/label.ts`, the pure parts in `src/evals/label-server.ts` and `src/evals/label-page.ts`, in the pattern of `pnpm voice:ab --listen`). No account, no key. One item at a time with its evidence: a Story with its Theme, Skill, structure, Problem and answer; a Parent Summary with the tally it was written from and any Hypothesis in its Notes; a claim with its status and every cited Problem, with the Assistance State where it is known. Stories and Summaries are pass or fail against the Judge's rubric; a claim gets its Polarity (difficulty, strength, contrast, neither), for each planted weakness whether it names it as a difficulty, and whether its cited Problems support it (supports, does not support, cannot tell). Every save is written straight to `docs/evals/labels/<set>.<labeller>.json`. The page is sent only this labeller's own labels, never anyone else's label or note, nor which run or Simulated Learner a claim came from, and each labeller gets each set in their own seeded order, so the order the owner wrote the Stories in (passes first) says nothing. The schema is in `src/evals/labels.ts` (zod, checked on every read and write) and documented in `docs/evals/README.md` so an annotation-queue export can write the same file.

The owner's labels of 2026-09-13 moved out of `src/evals/calibration.ts` into `stories.owner.json` and `summaries.owner.json`, note for note; `calibration.ts` now holds the items only. The Judge gate joins them back (`storyCalibrationSet`, `summaryCalibrationSet` in `src/evals/sealed.ts`). A fake Eval Run on this branch and one on main give identical `stories.judge` and `summaries.judge`, and an identical report apart from the time, telemetry and the new `humanAgreement` section.

The claim set is `docs/evals/labels/claims.json`: 100 claims drawn with the seed `claim-set-2026-09-28` from the three live Opus reports (about 1,400 distinct claims in all), 25 of each Polarity as today's regex reader reads them, the reader's verdict not stored. A test draws it again from the reports and requires the same file. **A limit found here:** the reports keep each Session's Notes but not its Log, and the Coach's Plans are not kept either, so a later Session cannot be replayed. Only the Diagnostic Session can be, from its fixed Plan and the Learner's seed, and the replay is checked against each report's stored first-try rate. So 64 of the set's 1,488 citations carry an Assistance State and 5 claims carry all of theirs. The rest are shown as not recorded, and "cannot tell" is the honest answer to the support question for most claims. Polarity and weakness naming need only the words and are fully labellable. If the support question is to count, a later run should keep each Problem's Skill, equation and Assistance State in the report.

The sealed split is `docs/evals/labels/split.json`, drawn with the seed `sealed-2026-09-28` (`src/evals/split.ts`) before any label but the owner's old Story and Summary verdicts existed. It seals 10 Stories, 5 Summaries and 50 claims, and it was drawn from the ids alone, not stratified by label. A test requires the file to be exactly that seeded split. `src/evals/sealed.ts` is the one module that imports the sets and their label files. Reading as `"tuning"` gives the open half; the sealed half comes back only to `finalRun(reason)`. `src/evals/sealed.test.ts` reads the source and fails if anything other than the Eval Run (`src/evals/evals.ts`) and the labelling page (`src/cli/label.ts`) calls `finalRun`, if anything else imports the sets or the label JSON, or if anything other than `src/evals/label-files.ts` reads the labels directory. That reader drops labels on sealed items unless given a final run. A decision taken here: the Eval Run is a final run, because Pre-registration 1 (row 10) fixes the Judge gate on the whole of both Calibration Sets and this ticket was to leave the gate's results unchanged. `runStoryEvals` and `runSummaryEvals` called on their own read the open half. If the owner wants `pnpm eval` to score the open half by default, with a `--final` flag for pre-registered runs, it is one constant (`EVAL_RUN_ACCESS`), but it would need Pre-registration 1 amended first.

Human-human agreement is `src/evals/agreement.ts`: for every two labellers of a set, per question (pass; polarity, names crossing-ten, names change-unknown, cited support), over the items both labelled, raw agreement with its Wilson interval, Cohen's kappa (`cohensKappa` in `stats.ts`, any number of categories, null when both used one category throughout), and the disagreements listed. Every Eval Run reads the label files and reports it as `humanAgreement`, and the text says "no set has two labellers yet" until one does.

Driven once in headless Chromium at 375 px as `second`, against a scratch copy of the owner's files: none of the owner's notes or verdicts on the page, nothing pre-selected, save disabled until every question is answered. A Story labelled fail with a note and a claim fully labelled were written to `stories.second.json` and `claims.second.json`. A reload brought back the labeller's own answer and note. A claim with Diagnostic citations shows its table; one without lists the Problems as not recorded. No page errors and no horizontal scroll.

Verified with `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` and `pnpm exec tsx src/cli/eval.ts --fake` (its regenerated report and charts not committed). No model call, no key.

**Next: ticket 14 is the owner's.** The owner labels the claims (`pnpm label --labeller owner`, since the owner has Story and Summary labels already but none on the claims), and a second person runs `pnpm label --labeller second` on all three sets without seeing them. Both files are committed, and the next Eval Run reports their agreement.
