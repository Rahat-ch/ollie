/**
 * Play a Simulated Learner through Sessions under a planner and keep the
 * whole trace, so the evals can score the Log and the Notes afterwards.
 * Pure over its inputs: the Learner's own seed is the seed, and the same
 * planner gives the same run.
 */
import { coachSession, type CoachStep } from "@/coach";
import type { Generation } from "@/generation";
import { baselinePlan, DIAGNOSTIC_PLAN, emptyNotes, newProfile, runSession } from "@/loop";
import type { LearnerNotes, SessionPlan, SessionResult } from "@/loop";
import { simulatedLearner, type SimulatedLearner } from "./learners";

export type PlannerId = "baseline" | "coach";

/** What decides the next Session Plan after a Session: the Baseline rule or the Coach step. */
export type Planner = {
  readonly id: PlannerId;
  readonly plan: (result: SessionResult, notes: LearnerNotes) => Promise<CoachStep>;
};

/** The Baseline: the fixed rule, no Notes, never a rejection. */
export const baselinePlanner: Planner = {
  id: "baseline",
  plan: async (result) => ({
    notes: emptyNotes(),
    plan: baselinePlan(result.profile),
    source: "baseline",
    rejections: [],
  }),
};

/** The Coach step behind the given Generation, with its one retry and Baseline fallback. */
export const coachPlanner = (generation: Generation): Planner => ({
  id: "coach",
  plan: (result, notes) => coachSession(generation, result, notes),
});

export type SessionTrace = {
  readonly result: SessionResult;
  /** What the planner settled on after this Session: the Notes and the next Plan. */
  readonly step: CoachStep;
};

export type LearnerRun = {
  readonly learner: SimulatedLearner;
  readonly planner: PlannerId;
  readonly sessions: readonly SessionTrace[];
};

/**
 * The Diagnostic Session first, then one Session per Plan the planner
 * returns, `sessions` in all. `onSession` is called after each, so a long
 * run can show progress.
 */
export async function runLearner(
  learner: SimulatedLearner,
  planner: Planner,
  sessions: number,
  onSession?: (trace: SessionTrace) => void,
): Promise<LearnerRun> {
  const policy = simulatedLearner(learner);
  const traces: SessionTrace[] = [];
  let profile = newProfile();
  let notes = emptyNotes();
  let plan: SessionPlan = DIAGNOSTIC_PLAN;
  for (let i = 0; i < sessions; i++) {
    const result = runSession(plan, profile, learner.seed, policy);
    const step = await planner.plan(result, notes);
    const trace = { result, step };
    traces.push(trace);
    onSession?.(trace);
    ({ notes, plan } = step);
    profile = result.profile;
  }
  return { learner, planner: planner.id, sessions: traces };
}
