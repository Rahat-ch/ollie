import { SKILLS } from "@/loop";
import type { SkillId } from "@/loop";
import { firstTryProbability, type SimulatedLearnerId, type WeaknessTag } from "./learners";
import type { LearnerRun, PlannerId } from "./run";

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
  readonly id: SimulatedLearnerId;
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

/** The tuning and held-out Learners scored separately, so held-out numbers are never mixed into tuning ones. */
export type SplitSummary = {
  readonly split: "tuning" | "held-out";
  readonly learners: readonly SimulatedLearnerId[];
  /** Skills Mastered by the last Session, averaged over the split's Learners. */
  readonly meanSkillsMastered: number;
  readonly meanFirstTryRate: number;
  readonly meanInBandShare: number;
};

/** Convergence under one planner: per Learner, then per split. */
export type ConvergenceReport = {
  readonly planner: PlannerId;
  readonly learners: readonly LearnerConvergence[];
  readonly splits: { readonly tuning: SplitSummary; readonly heldOut: SplitSummary };
};

const inBand = (p: number): boolean => p >= TARGET_ACCURACY_BAND.min && p <= TARGET_ACCURACY_BAND.max;
const share = (hits: number, total: number): number => (total === 0 ? 0 : hits / total);

/**
 * Score one run for convergence: Sessions to Mastery per Skill, the first-try
 * rate, and the share of Problems in the target accuracy band, scored from
 * the simulation's own probabilities.
 */
export function scoreConvergence(run: LearnerRun): LearnerConvergence {
  const { learner } = run;
  const sessionsToMastery = Object.fromEntries(SKILLS.map((s) => [s.id, null])) as Record<SkillId, number | null>;
  const perSession: SessionPoint[] = [];
  let problems = 0;
  let firstTries = 0;
  let inBandCount = 0;

  for (const { result } of run.sessions) {
    const session = result.log.sessionNumber;
    for (const id of result.newlyMastered) sessionsToMastery[id] = session;
    const { entries } = result.log;
    const sessionFirstTries = entries.filter((e) => e.assistance === "first-try-correct").length;
    const sessionInBand = entries.filter((e) => inBand(firstTryProbability(learner, e.problem, e.position))).length;
    problems += entries.length;
    firstTries += sessionFirstTries;
    inBandCount += sessionInBand;
    perSession.push({
      session,
      mastered: SKILLS.filter((s) => result.profile.skills[s.id].mastered).length,
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

export const mean = (values: readonly number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

function summarise(split: SplitSummary["split"], learners: readonly LearnerConvergence[]): SplitSummary {
  return {
    split,
    learners: learners.map((l) => l.id),
    meanSkillsMastered: mean(learners.map((l) => l.perSession[l.perSession.length - 1]?.mastered ?? 0)),
    meanFirstTryRate: mean(learners.map((l) => l.firstTryRate)),
    meanInBandShare: mean(learners.map((l) => l.inBandShare)),
  };
}

/** The convergence of every run under one planner, with the two splits scored separately. */
export function convergenceReport(planner: PlannerId, runs: readonly LearnerRun[]): ConvergenceReport {
  const learners = runs.map(scoreConvergence);
  return {
    planner,
    learners,
    splits: {
      tuning: summarise("tuning", learners.filter((l) => !l.heldOut)),
      heldOut: summarise("held-out", learners.filter((l) => l.heldOut)),
    },
  };
}
