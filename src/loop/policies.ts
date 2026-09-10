import type { Problem } from "./types";
import type { Rng } from "./random";

/**
 * How a Session gets its answers: a scripted policy in tests and the CLI, a
 * Simulated Learner in evals. The browser is not a policy; it drives the
 * step functions directly.
 */
export type PolicyAnswer = { readonly answer: number; readonly responseMs: number };

export type PolicyContext = {
  /** 1 for the first attempt, 2 for the retry after the Hint. */
  readonly attempt: 1 | 2;
  /** 1-based position of the Problem in the Session. */
  readonly position: number;
  readonly rng: Rng;
};

export type AnswerPolicy = (problem: Problem, context: PolicyContext) => PolicyAnswer;

/** One letter per Problem: f first-try, h Hint-assisted, r Revealed. */
export type Outcome = "f" | "h" | "r";

const wrongAnswer = (problem: Problem): number =>
  problem.answer === 0 ? 1 : problem.answer - 1;

function answerFor(problem: Problem, outcome: Outcome, attempt: 1 | 2): number {
  if (outcome === "f") return problem.answer;
  if (outcome === "h") return attempt === 1 ? wrongAnswer(problem) : problem.answer;
  return wrongAnswer(problem);
}

/**
 * Follow a script such as "ffhrf", one outcome per position. Positions past
 * the end of the script repeat its last letter.
 */
export function scripted(script: string, responseMs = 3000): AnswerPolicy {
  const outcomes = [...script] as Outcome[];
  if (outcomes.length === 0 || outcomes.some((o) => !"fhr".includes(o))) {
    throw new Error(`A script uses only the letters f, h, and r: got "${script}"`);
  }
  return (problem, { attempt, position }) => {
    const outcome = outcomes[Math.min(position, outcomes.length) - 1];
    return { answer: answerFor(problem, outcome, attempt), responseMs };
  };
}

export const alwaysFirstTry: AnswerPolicy = scripted("f");
export const alwaysHintAssisted: AnswerPolicy = scripted("h");
export const alwaysRevealed: AnswerPolicy = scripted("r");
