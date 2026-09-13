import type { CoachOutput } from "@/generation/types";
import type { LearnerNotes, SessionPlan } from "@/loop";

export type CoachRejection = {
  /** 1 for the first Coach output, 2 for the retry. */
  readonly attempt: 1 | 2;
  readonly reasons: readonly string[];
  /** The Coach could not be reached at all, so there was nothing to retry. */
  readonly unavailable?: boolean;
  /** What the Coach wrote, kept so an eval can score it; absent when the call threw. */
  readonly output?: CoachOutput;
};

/**
 * What the engine settled on after a Session: the Notes and the next Plan,
 * where they came from, and every rejection on the way. `baseline` means the
 * Coach was rejected twice, or could not be reached at all; the Baseline Plan
 * is used and the Notes are the ones from before the Session, so play never
 * stops.
 */
export type CoachStep = {
  readonly notes: LearnerNotes;
  readonly plan: SessionPlan;
  readonly source: "coach" | "retry" | "baseline";
  readonly rejections: readonly CoachRejection[];
};
