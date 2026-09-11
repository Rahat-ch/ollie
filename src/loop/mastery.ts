import type { SkillState } from "./types";

export const MASTERY_ESTIMATE = 0.95;
export const MASTERY_WINDOW = 10;
export const MASTERY_REQUIRED_CORRECT = 8;

/** Mastered: Estimate at or above 0.95 and 8 of the last 10 first attempts correct. */
export function meetsMastery(state: SkillState): boolean {
  const recent = state.recentFirstAttempts.slice(-MASTERY_WINDOW);
  const correct = recent.filter(Boolean).length;
  return state.estimate >= MASTERY_ESTIMATE && correct >= MASTERY_REQUIRED_CORRECT;
}
