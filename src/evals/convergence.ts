import { baselinePlan, newProfile, runSession, SKILLS } from "@/loop";
import type { SkillId } from "@/loop";
import {
  firstTryProbability,
  SIMULATED_LEARNERS,
  simulatedLearner,
  type SimulatedLearner,
  type WeaknessTag,
} from "./learners";

/**
 * A Problem is at the right difficulty when the Learner's true chance of a
 * first-try correct answer sits in this band: neither too easy nor too hard.
 * Only a simulation can score this, because only it knows the true chance.
 */
export const TARGET_ACCURACY_BAND = { min: 0.7, max: 0.9 } as const;

export type SessionPoint = {
  readonly session: number;
  /** Skills Mastered by the end of this Session. */
  readonly mastered: number;
  readonly firstTryRate: number;
  readonly inBandShare: number;
};

export type LearnerConvergence = {
  readonly id: string;
  readonly name: string;
  readonly heldOut: boolean;
  readonly weaknesses: readonly WeaknessTag[];
  /** The Session in which each Skill became Mastered; null if it never did. */
  readonly sessionsToMastery: Readonly<Record<SkillId, number | null>>;
  readonly problems: number;
  readonly firstTryRate: number;
  readonly inBandShare: number;
  readonly perSession: readonly SessionPoint[];
};

export type ConvergenceReport = {
  readonly planner: "baseline";
  readonly sessions: number;
  readonly targetAccuracyBand: typeof TARGET_ACCURACY_BAND;
  readonly learners: readonly LearnerConvergence[];
};

export type ConvergenceOptions = {
  readonly sessions: number;
  readonly learners?: readonly SimulatedLearner[];
};

const inBand = (p: number): boolean => p >= TARGET_ACCURACY_BAND.min && p <= TARGET_ACCURACY_BAND.max;
const share = (hits: number, total: number): number => (total === 0 ? 0 : hits / total);

function converge(learner: SimulatedLearner, sessions: number): LearnerConvergence {
  const policy = simulatedLearner(learner);
  const sessionsToMastery = Object.fromEntries(SKILLS.map((s) => [s.id, null])) as Record<SkillId, number | null>;
  const perSession: SessionPoint[] = [];
  let profile = newProfile();
  let problems = 0;
  let firstTries = 0;
  let inBandCount = 0;

  for (let i = 1; i <= sessions; i++) {
    const result = runSession(baselinePlan(profile), profile, learner.seed, policy);
    for (const id of result.newlyMastered) sessionsToMastery[id] = i;
    const { entries } = result.log;
    const sessionFirstTries = entries.filter((e) => e.assistance === "first-try-correct").length;
    const sessionInBand = entries.filter((e) => inBand(firstTryProbability(learner, e.problem, e.position))).length;
    problems += entries.length;
    firstTries += sessionFirstTries;
    inBandCount += sessionInBand;
    profile = result.profile;
    perSession.push({
      session: i,
      mastered: SKILLS.filter((s) => profile.skills[s.id].mastered).length,
      firstTryRate: share(sessionFirstTries, entries.length),
      inBandShare: share(sessionInBand, entries.length),
    });
  }

  return {
    id: learner.id,
    name: learner.name,
    heldOut: learner.heldOut,
    weaknesses: learner.weaknesses,
    sessionsToMastery,
    problems,
    firstTryRate: share(firstTries, problems),
    inBandShare: share(inBandCount, problems),
    perSession,
  };
}

/**
 * Run every Simulated Learner from a fresh Profile through `sessions`
 * Sessions under the Baseline and score convergence: Sessions to Mastery per
 * Skill and the share of Problems in the target accuracy band. Pure: the same
 * options give the same report byte for byte.
 */
export function runConvergence(options: ConvergenceOptions): ConvergenceReport {
  const learners = options.learners ?? SIMULATED_LEARNERS;
  return {
    planner: "baseline",
    sessions: options.sessions,
    targetAccuracyBand: TARGET_ACCURACY_BAND,
    learners: learners.map((learner) => converge(learner, options.sessions)),
  };
}
