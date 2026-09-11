import type { LearnerNotes, SessionPlan } from "@/loop";

export type CoachRejection = {
  /** 1 for the first Coach output, 2 for the retry. */
  readonly attempt: 1 | 2;
  readonly reasons: readonly string[];
};

/**
 * What the engine settled on after a Session: the Notes and the next Plan,
 * where they came from, and every rejection on the way. `baseline` means both
 * Coach outputs were rejected, the Baseline Plan is used, and the Notes are
 * the ones from before the Session, so play never stops.
 */
export type CoachStep = {
  readonly notes: LearnerNotes;
  readonly plan: SessionPlan;
  readonly source: "coach" | "retry" | "baseline";
  readonly rejections: readonly CoachRejection[];
};
