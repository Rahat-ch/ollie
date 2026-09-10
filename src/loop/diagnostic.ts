import type { SessionPlan } from "./types";

/**
 * The fixed first Session, used while no Session has been completed. It
 * samples Unit 1 and the start of Unit 2 so the Learner Notes begin with
 * evidence; it looks like any other Session. It is the engine's own bundled
 * Plan, not a planner's, so it sits outside the Plan Space: counting on is
 * sampled before Unit 2 unlocks.
 */
export const DIAGNOSTIC_PLAN: SessionPlan = {
  length: 9,
  skills: [
    { skill: "partners-to-10", weight: 1 },
    { skill: "teen-numbers", weight: 1 },
    { skill: "counting-on", weight: 1 },
  ],
  reviewShare: 0,
  hypothesisUnderTest: null,
};
