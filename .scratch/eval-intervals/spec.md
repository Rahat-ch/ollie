# Spec: Uncertainty in the eval report

Status: ready-for-agent
Created: 2026-09-17
Deadline: before the live eval run; the entry closes 2026-09-18 11:59 PM CDT
Inputs: `docs/research/evals-comparison.md` (sections 3, 6, and 7), `src/evals/stats.ts`, `src/evals/judge.ts`, `src/evals/format.ts`, `src/evals/charts.ts`, `docs/evals/README.md`, `CONTEXT.md`

Vocabulary in this spec is the glossary in `CONTEXT.md`. Capitalised terms are defined there.

## Problem Statement

The eval report prints every rate as a bare number: Evidence Integrity 1.00, false positives 16.7 percent, Story validity 30 of 30, Judge agreement 12 of 20. A reviewer who knows evaluation reads those and asks how wide the true range is, because the samples are small: 3 of 18 false positives is really anywhere from about 6 to 39 percent, and 30 of 30 is anywhere from about 89 to 100. The Judge's gate is decided on 20 Stories and 10 Summaries by raw agreement alone, which does not say how much of the agreement a Judge that always says "pass" would get for free. The comparison research names this the first thing a rigorous reviewer attacks after the fake headline, and it is the cheapest to fix: every rate already passes through one small module.

## Solution

Every rate in the eval report carries a 95 percent interval beside it, in the JSON, in the text report, and on the charts, computed with the Wilson score interval so small samples and rates at 0 or 1 are handled honestly. The Judge's calibration reports, beside raw agreement, Cohen's kappa against the human verdicts, the confusion matrix, and the agreement two trivial Judges would score (always pass, always fail), so a reader sees how much of the agreement is skill; the gate itself keeps its threshold and gains a kappa floor. The evals README explains what the interval means in one paragraph, and the write-up quotes ranges, not points, where the sample is small.

## User Stories

1. As a reviewer, I want every rate in the report to show its 95 percent interval, so that I can see how much a small sample can support.
2. As a reviewer, I want the interval to be a Wilson score interval, so that a rate of 1.00 on 30 items does not claim a width of zero.
3. As a reviewer, I want the false-positive rate to read as a range, so that 3 of 18 is not presented as a precise 16.7 percent.
4. As a reviewer, I want the Judge's calibration to show kappa next to agreement, so that I know how far it is above chance.
5. As a reviewer, I want the agreement an always-pass Judge and an always-fail Judge would score on the same Calibration Set, so that I can see the floor the real Judge cleared.
6. As a reviewer, I want the confusion matrix (verdicts against human labels) for the Judge, so that I can see whether its errors are one-sided.
7. As a reviewer, I want the Judge gate to require both the agreement threshold and a kappa floor, so that a Judge cannot pass by agreeing with a lopsided set.
8. As a reviewer, I want the text report to print intervals in the same line as the rate, so that nothing needs a second table.
9. As a reviewer, I want the charts to show the interval as a mark or a bracket beside the bar, so that the picture does not overclaim what the number does not.
10. As the entrant, I want the write-up to quote ranges where the sample is small, so that a judge cannot catch a bare number that the interval contradicts.
11. As the entrant, I want the evals README to explain the interval and kappa in a paragraph, so that a reader who does not know them is not lost.
12. As the entrant, I want the JSON report to keep every existing field and add the intervals beside them, so that earlier reports and the charts still read.
13. As the entrant, I want the fake run to exercise every interval and the kappa, so that the live run shows nothing untested.
14. As a developer, I want one interval function at the stats module's chokepoint, so that no rate can be printed without one.
15. As a developer, I want the interval function checked against known values, so that an off-by-a-constant error cannot hide behind a report that merely has the field.
16. As a developer, I want kappa and the trivial baselines computed in the Judge's calibration module from the same verdicts, so that they cannot drift from the agreement they qualify.
17. As a developer, I want the gate's two conditions named in the report, so that "withheld" always says which one failed.

## Implementation Decisions

- **One interval function at the chokepoint.** The stats module gains a function that takes hits and a total and returns the rate with its Wilson 95 percent interval (lower and upper bounds), with the standard z of 1.96. Every rate the report carries (Evidence Integrity, detection share, false-positive rate, first-attempt and valid rates for Stories and Summaries, the Judge's agreement) is produced through it. A total of zero yields the rate 0 (or 1 for integrity, as today) with an interval of 0 to 1, stated as undefined rather than as a false precision.
- **The report keeps its shape and grows.** Each rate field stays as it is, and a sibling field carries the interval, so earlier reports, the chart code, and the tests that read a rate keep working. The text report prints the interval in brackets after the rate on the same line. The charts draw the interval as a thin bracket at the end of the bar, or as a range line for a headline number, using the chart kit's existing marks.
- **Kappa and baselines in the calibration.** The Judge's calibration gains Cohen's kappa against the human verdicts, the two-by-two confusion matrix, and the agreement of an always-pass and an always-fail Judge on the same set (which is the set's pass share and fail share). The gate becomes agreement at or above the existing threshold and kappa at or above 0.6; the report's withheld message names which condition failed. The fake Judge's kappa on the current sets is whatever it is, and the report shows it, as it shows the agreement today.
- **The write-up and README.** The README explains the Wilson interval and kappa in plain words with one example each. The write-up's eval section quotes the small-sample rates as ranges from the committed report.
- **Nothing else moves.** The eval's samples, seeds, Learners, Calibration Sets, and scorers are unchanged; this spec adds arithmetic and presentation.

## Testing Decisions

- A good test reads the report the way a reviewer would, through the eval's public result on the fake Generation, and asserts on values: that every rate has an interval containing the rate, that the interval's width shrinks with the sample, that kappa and the baselines are present and consistent with the confusion matrix, and that the text report and the charts carry them. It does not read private helpers.
- **The interval function** is tested directly against textbook values: 0 of 10 and 10 of 10 have non-degenerate intervals; 3 of 18 gives roughly 0.06 to 0.39; 30 of 30 gives roughly 0.89 to 1.00; 1,502 of 1,502 is tighter than 30 of 30; a total of zero is stated as undefined.
- **Kappa** is tested against a hand-computed two-by-two case, against perfect agreement (kappa 1), against a Judge that always passes on a 12-of-20 set (kappa 0), and the gate against a set where agreement clears the threshold but kappa does not.
- **Prior art**: `src/evals/stats.ts` has no tests of its own yet; `src/evals/evals.test.ts`, `stories.test.ts`, `summaries.test.ts`, `report.test.ts`, and `charts.test.ts` read the fake run's report and are the models for the report-level assertions.

## Out of Scope

- Repeated live runs and their min-to-max spread; that is a decision about spend, and the report already supports committing several runs.
- Growing or relabelling the Calibration Sets.
- A second Judge from another model family.
- Any change to what the evals measure, to the Learners, or to the Coach.

## Further Notes

- The comparison research's section 3 has the arithmetic on why a 20-item gate at 80 percent is wide, and section 7's first three bullets are this spec.
- Keep the kappa floor as a named constant next to the agreement threshold so the write-up can quote both.
- The live eval will run after this merges, so the intervals are in the report the write-up cites.
