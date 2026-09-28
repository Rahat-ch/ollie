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
import type { LearnerNotes, SessionPlan } from "@/loop";
import type { CoachInput } from "@/generation/types";

/** The route stops the model call here and answers with the Baseline Plan. */
export const COACH_SERVER_DEADLINE_MS = 75_000;

/** What the route answers when the Coach passed its deadline: the Baseline Plan, the Notes as they came, and why. */
export type ServerBaseline = {
  readonly source: "baseline";
  readonly reason: string;
  readonly notes: LearnerNotes;
  readonly plan: SessionPlan;
};

/**
 * The Baseline Plan as the route can build it from the body alone. The
 * Baseline depends only on which Skills are Mastered and whether any
 * Session has been played, and a Coach input is always for a completed
 * Session, so the Knowledge Estimates and the Session number are enough:
 * the Plan is the one the device would build from its own Profile.
 */
export function serverBaseline(input: CoachInput, reason: string): ServerBaseline {
  const plan = baselinePlan({ nextProblemNumber: 0, sessionsCompleted: input.sessionNumber, skills: input.estimates });
  return { source: "baseline", reason, notes: input.notes, plan };
}

/** Whether what the route answered is its own Baseline rather than a Coach output. */
export const isServerBaseline = (value: unknown): value is ServerBaseline =>
  typeof value === "object" && value !== null && "source" in value && value.source === "baseline" && "reason" in value && typeof value.reason === "string";
