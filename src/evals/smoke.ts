/**
 * The live smoke check: the two conditions a short run on the real models
 * must meet. Evidence Integrity is 1.00 (every Problem ID the Coach cited,
 * rejected attempts included, is in the Log) and no Plan came from the
 * Baseline fallback. `pnpm coach --assert` applies it to one Simulated
 * Learner's run, and the hand-triggered smoke workflow runs that.
 */
import type { LearnerHypotheses } from "./hypotheses";

/** Every condition the run failed, in words; empty when it passed. */
export function smokeFailures(scored: Pick<LearnerHypotheses, "evidence" | "sources">): string[] {
  const { evidence, sources } = scored;
  const failures: string[] = [];
  if (evidence.integrity < 1) {
    failures.push(
      `Evidence Integrity ${evidence.integrity.toFixed(2)} is below 1.00: ${evidence.unknownIds} of ${evidence.citations} citations name a Problem not in the Log`,
    );
  }
  const plans = sources.coach + sources.retry + sources.baseline;
  if (sources.baseline > 0) {
    failures.push(`${sources.baseline} of ${plans} Plans came from the Baseline fallback`);
  }
  return failures;
}
