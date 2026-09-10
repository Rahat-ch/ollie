import type { BktParams } from "./skills";

/**
 * One Bayesian Knowledge Tracing step: condition the estimate on a first
 * attempt, then apply the chance of learning. The only thing that moves a
 * Knowledge Estimate.
 */
export function bktUpdate(
  estimate: number,
  correct: boolean,
  { learn, guess, slip }: BktParams,
): number {
  const known = correct ? estimate * (1 - slip) : estimate * slip;
  const unknown = correct ? (1 - estimate) * guess : (1 - estimate) * (1 - guess);
  const posterior = known / (known + unknown);
  return posterior + (1 - posterior) * learn;
}
