import { DIAGNOSTIC_PLAN } from "./diagnostic";
import { SKILLS } from "./skills";
import type { ProfileState, SessionPlan } from "./types";

export const BASELINE_CURRENT_PROBLEMS = 6;
export const BASELINE_REVIEW_PROBLEMS = 2;

/**
 * The Baseline: the Coach replaced by a fixed rule. The Diagnostic Session
 * first; then 6 Problems from the current Skill plus 2 Review Problems, the
 * current Skill being the first unmastered one in progression order and
 * advancing once it is Mastered (the 8-of-10 rule with the Estimate). Until
 * some other Skill is Mastered there is nothing to review, so the Session is
 * the 6 alone. Once every Skill is Mastered it stays on the last one. Every
 * convergence number is reported against this.
 */
export function baselinePlan(profile: ProfileState): SessionPlan {
  if (profile.sessionsCompleted === 0) return DIAGNOSTIC_PLAN;
  const current = SKILLS.find((s) => !profile.skills[s.id].mastered) ?? SKILLS[SKILLS.length - 1];
  const reviewable = SKILLS.some((s) => s.id !== current.id && profile.skills[s.id].mastered);
  const review = reviewable ? BASELINE_REVIEW_PROBLEMS : 0;
  const length = BASELINE_CURRENT_PROBLEMS + review;
  return {
    length,
    skills: [{ skill: current.id, weight: 1 }],
    reviewShare: review / length,
    hypothesisUnderTest: null,
  };
}
