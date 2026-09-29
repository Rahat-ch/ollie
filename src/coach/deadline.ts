/**
 * How long a Coach run may take, and what the route answers when it takes
 * longer. Two clocks run on one call: the route's, which stops the model
 * call and answers with the Baseline Plan itself, and the device's, which
 * gives up on the route. The route's is the shorter, so it is the one that
 * decides: the model call is cancelled rather than left running for nobody,
 * and the device hears why instead of hearing nothing. The Coach is not on
 * any screen's critical path — the Learner is at the celebration and then
 * gone — so both are set to let a slow Coach through, not to keep anyone
 * waiting.
 */
import { baselinePlan } from "@/loop";
import type { CoachInput } from "@/generation/types";
import { profileFromInput } from "./coach";
import type { ServerCoachStep } from "./server";

/** The route stops the model call here and answers with the Baseline Plan. */
export const COACH_SERVER_DEADLINE_MS = 75_000;

/**
 * What the route answers when the Coach passed its deadline: the Baseline
 * Plan, the Notes as they came, and why, as a Coach that could not be
 * reached. The Baseline depends only on which Skills are Mastered and
 * whether any Session has been played, so the Plan built from the body is
 * the one the device would build from its own Profile.
 */
export function serverBaseline(input: CoachInput, reason: string): ServerCoachStep {
  const plan = baselinePlan(profileFromInput(input));
  return { notes: input.notes, plan, source: "baseline", rejections: [{ attempt: 1, reasons: [reason], unavailable: true }] };
}
