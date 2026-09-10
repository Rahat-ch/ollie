import type { SessionPlan } from "./types";

/**
 * The fixed first Session, used when no Session Log exists. It samples Unit 1
 * so the Learner Notes begin with evidence; it looks like any other Session.
 * Ticket 04 adds counting on (Skill c) once that family exists.
 */
export const DIAGNOSTIC_PLAN: SessionPlan = {
  length: 8,
  skills: [
    { skill: "partners-to-10", weight: 1 },
    { skill: "teen-numbers", weight: 1 },
  ],
  reviewShare: 0,
  hypothesisUnderTest: null,
};
