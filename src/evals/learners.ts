import type { AnswerPolicy, Problem, Rng, SkillId } from "@/loop";
import { createRng } from "@/loop";

/**
 * A Simulated Learner: a hand-designed synthetic Learner with a seeded true
 * ability per Skill, weakness tags, and a fatigue curve. Answers are sampled
 * from these numbers; no model plays the child. Never a real child's data.
 */
export type SimulatedLearnerId =
  | "strong"
  | "average"
  | "weak"
  | "crossing-ten-weakness"
  | "change-unknown-weakness"
  | "fast-fatigue";

export type SimulatedLearner = {
  readonly id: SimulatedLearnerId;
  readonly name: string;
  /** Seeds every run of this Learner; the same seed reproduces the run byte for byte. */
  readonly seed: string;
  /** Held out of prompt tuning and scored only at the end, so the chart is evidence. */
  readonly heldOut: boolean;
  /** True probability of a first-try correct answer per Skill, before weakness and fatigue. */
  readonly ability: Readonly<Record<SkillId, number>>;
  readonly weaknesses: readonly WeaknessTag[];
  readonly fatigue: FatigueCurve;
  /** Probability of answering correctly on the retry after the Hint. */
  readonly hintRecovery: number;
};

export type WeaknessTag = "crossing-ten" | "change-unknown";

/** The weakness in plain words, for reports and the chart. */
export const describeWeakness = (tag: WeaknessTag): string => WEAKNESS_LABEL[tag];

const WEAKNESS_LABEL: Readonly<Record<WeaknessTag, string>> = {
  "crossing-ten": "crossing ten",
  "change-unknown": "change unknown",
};

/** How much a weakness tag lowers first-try accuracy on a matching Problem. */
export const WEAKNESS_PENALTY = 0.35;

const isPart = (n: number) => n < 10;

/** The structures where the missing number is the change: unknown addend now, Unit 3's change unknown once it exists. */
const CHANGE_UNKNOWN_STRUCTURES: readonly string[] = ["missing-addend", "change-unknown"];

const WEAKNESS_MATCHERS: Readonly<Record<WeaknessTag, (problem: Problem) => boolean>> = {
  "crossing-ten": ({ equation: { left, op, right, result } }) =>
    op === "+" ? result > 10 && isPart(left) && isPart(right) : left > 10 && isPart(right) && isPart(result),
  "change-unknown": ({ structure }) => CHANGE_UNKNOWN_STRUCTURES.includes(structure),
};

/**
 * Whether a Problem is what a weakness tag is about, so a planted weakness
 * lowers accuracy only there. `crossing-ten`: the whole is above ten and both
 * parts below it (8 + 5, 13 - 8), so the sum or difference has to bridge ten;
 * 10 + 3 and 7 + 3 do not. `change-unknown`: the Problem's structure asks for
 * the change (9 + ? = 13 as unknown addend, and Unit 3's change-unknown
 * Stories when ticket 10 adds them); partners to 10 and teen numbers are not
 * matched even though they also blank an addend.
 */
export const matchesWeakness = (tag: WeaknessTag, problem: Problem): boolean =>
  WEAKNESS_MATCHERS[tag](problem);

/**
 * Accuracy falls by `perProblem` for every Problem past `onset` in a Session,
 * so the eighth Problem of a fast-fatigue Learner is noticeably harder than
 * the first. Position is 1-based.
 */
export type FatigueCurve = { readonly onset: number; readonly perProblem: number };

const MILD_FATIGUE: FatigueCurve = { onset: 8, perProblem: 0.03 };

/** The six Simulated Learners, defined here and nowhere else. */
export const SIMULATED_LEARNERS: readonly SimulatedLearner[] = [
  {
    id: "strong",
    name: "Strong",
    seed: "sim-strong",
    heldOut: false,
    ability: { "partners-to-10": 0.97, "teen-numbers": 0.95, "counting-on": 0.93, "make-a-ten": 0.9, "unknown-addend": 0.9 },
    weaknesses: [],
    fatigue: MILD_FATIGUE,
    hintRecovery: 0.85,
  },
  {
    id: "average",
    name: "Average",
    seed: "sim-average",
    heldOut: false,
    ability: { "partners-to-10": 0.88, "teen-numbers": 0.85, "counting-on": 0.8, "make-a-ten": 0.75, "unknown-addend": 0.75 },
    weaknesses: [],
    fatigue: MILD_FATIGUE,
    hintRecovery: 0.7,
  },
  {
    id: "weak",
    name: "Weak",
    seed: "sim-weak",
    heldOut: false,
    ability: { "partners-to-10": 0.75, "teen-numbers": 0.7, "counting-on": 0.62, "make-a-ten": 0.55, "unknown-addend": 0.55 },
    weaknesses: [],
    fatigue: MILD_FATIGUE,
    hintRecovery: 0.55,
  },
  {
    id: "crossing-ten-weakness",
    name: "Crossing-ten weakness",
    seed: "sim-crossing-ten",
    heldOut: false,
    ability: { "partners-to-10": 0.9, "teen-numbers": 0.88, "counting-on": 0.85, "make-a-ten": 0.85, "unknown-addend": 0.82 },
    weaknesses: ["crossing-ten"],
    fatigue: MILD_FATIGUE,
    hintRecovery: 0.7,
  },
  {
    id: "change-unknown-weakness",
    name: "Change-unknown weakness",
    seed: "sim-change-unknown",
    heldOut: true,
    ability: { "partners-to-10": 0.9, "teen-numbers": 0.88, "counting-on": 0.85, "make-a-ten": 0.82, "unknown-addend": 0.85 },
    weaknesses: ["change-unknown"],
    fatigue: MILD_FATIGUE,
    hintRecovery: 0.7,
  },
  {
    id: "fast-fatigue",
    name: "Fast fatigue",
    seed: "sim-fast-fatigue",
    heldOut: true,
    ability: { "partners-to-10": 0.9, "teen-numbers": 0.88, "counting-on": 0.85, "make-a-ten": 0.8, "unknown-addend": 0.8 },
    weaknesses: [],
    fatigue: { onset: 4, perProblem: 0.12 },
    hintRecovery: 0.6,
  },
];

export function getSimulatedLearner(id: SimulatedLearnerId): SimulatedLearner {
  return SIMULATED_LEARNERS.find((l) => l.id === id)!;
}

/**
 * The answer policy. Every draw is seeded by the Learner's own seed, the
 * Problem ID, and the attempt, so the same Learner answers the same Problem
 * the same way whatever happened before it: a weakness tag changes only the
 * Problems it matches, and a run is reproducible byte for byte.
 */
export function simulatedLearner(learner: SimulatedLearner): AnswerPolicy {
  return (problem, { attempt, position }) => {
    const rng = createRng(`${learner.seed}:${problem.id}:${attempt}`);
    const p = attempt === 1 ? firstTryProbability(learner, problem, position) : learner.hintRecovery;
    const correct = rng.next() < p;
    const answer = correct ? problem.answer : wrongAnswer(problem, rng);
    return { answer, responseMs: responseTime(rng, correct, position) };
  };
}

/** The true chance this Learner answers `problem` correctly on the first try at `position`. */
export function firstTryProbability(
  learner: SimulatedLearner,
  problem: Problem,
  position: number,
): number {
  const weakness = learner.weaknesses.some((tag) => matchesWeakness(tag, problem)) ? WEAKNESS_PENALTY : 0;
  const { onset, perProblem } = learner.fatigue;
  const fatigue = Math.max(0, position - onset) * perProblem;
  return clamp(learner.ability[problem.skill] - weakness - fatigue);
}

const clamp = (p: number): number => Math.min(0.99, Math.max(0.02, p));

function wrongAnswer(problem: Problem, rng: Rng): number {
  const offset = rng.int(1, 2) * (rng.next() < 0.5 ? -1 : 1);
  const answer = problem.answer + offset;
  return answer < 0 || answer > 20 ? problem.answer - offset : answer;
}

function responseTime(rng: Rng, correct: boolean, position: number): number {
  return rng.int(2000, 4000) + (correct ? 0 : 1500) + position * 100;
}
