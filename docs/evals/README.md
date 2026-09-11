# Eval Runs

Every `pnpm eval` writes one dated JSON report here, named by its UTC time (`2026-09-11T00-10-30Z.json`), and regenerates `convergence.svg` from that file. `pnpm eval:chart` redraws the chart from the latest report, or from any earlier one with `--report`. Reports are committed so a number in the write-up or the video can be traced to the run that produced it.

The convergence section runs the six Simulated Learners (`src/evals/learners.ts`) for 20 Sessions each under the Baseline and records, per Learner, the Session in which each Skill became Mastered, the first-try rate, and the share of Problems in the target accuracy band (a true first-try chance of 0.7 to 0.9). The two held-out Learners, change-unknown weakness and fast fatigue, are never used to tune a prompt and are flagged in every report. Simulated Learners only; never a real child's data.
