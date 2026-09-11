import type { Equation, NumberRange, SkillId, Unit, Visual } from "./types";
import type { Rng } from "./random";

/** Bayesian Knowledge Tracing parameters, hand-set per Skill. */
export type BktParams = {
  readonly prior: number;
  readonly learn: number;
  readonly guess: number;
  readonly slip: number;
};

export type ProblemDraft = {
  readonly structure: string;
  readonly equation: Equation;
  readonly answer: number;
  readonly spoken: string;
};

export type GenerateOptions = {
  readonly range: NumberRange;
  readonly structures: readonly string[];
};

/** A template family: the engine owns the type, the numbers, and the answer (ADR 0001). */
export type Skill = {
  readonly id: SkillId;
  readonly name: string;
  readonly unit: Unit;
  readonly standard: string;
  readonly visual: Visual;
  readonly structures: readonly string[];
  /** The widest range the Skill's standard allows. A Plan may only narrow it. */
  readonly standardRange: NumberRange;
  readonly defaultRange: NumberRange;
  /** Which number the range describes, in words, so a planner knows what it is narrowing. */
  readonly rangeOf: string;
  /** Hand-written, keyed to the strategy, with no numbers so it can be voiced once. */
  readonly hint: string;
  readonly bkt: BktParams;
  readonly generate: (rng: Rng, options: GenerateOptions) => ProblemDraft;
};

const partnersTo10: Skill = {
  id: "partners-to-10",
  name: "Partners to 10",
  unit: 1,
  standard: "K.OA.4, 1.OA.6",
  visual: "ten-frame",
  structures: ["missing-partner", "take-from-ten"],
  standardRange: { min: 0, max: 10 },
  defaultRange: { min: 1, max: 9 },
  rangeOf: "the partner the Learner is given",
  hint: "Look at the ten-frame. Count the empty spaces. That is how many more make ten.",
  bkt: { prior: 0.3, learn: 0.2, guess: 0.15, slip: 0.1 },
  generate(rng, { range, structures }) {
    const structure = rng.pick(structures);
    const a = rng.int(range.min, range.max);
    const partner = 10 - a;
    if (structure === "take-from-ten") {
      return {
        structure,
        equation: { left: 10, op: "-", right: a, result: partner, unknown: "result" },
        answer: partner,
        spoken: `There are 10 in the frame. Take away ${a}. How many are left?`,
      };
    }
    return {
      structure: "missing-partner",
      equation: { left: a, op: "+", right: partner, result: 10, unknown: "right" },
      answer: partner,
      spoken: `${a} and how many more make 10?`,
    };
  },
};

const teenNumbers: Skill = {
  id: "teen-numbers",
  name: "Teen numbers as 10 + n",
  unit: 1,
  standard: "1.NBT.2b",
  visual: "ten-frame",
  structures: ["compose", "decompose"],
  standardRange: { min: 11, max: 19 },
  defaultRange: { min: 11, max: 19 },
  rangeOf: "the teen number",
  hint: "Look at the ten-frames. One whole frame is ten. Count the extra ones and say ten and some more.",
  bkt: { prior: 0.3, learn: 0.2, guess: 0.15, slip: 0.1 },
  generate(rng, { range, structures }) {
    const structure = rng.pick(structures);
    const teen = rng.int(range.min, range.max);
    const ones = teen - 10;
    if (structure === "decompose") {
      return {
        structure,
        equation: { left: 10, op: "+", right: ones, result: teen, unknown: "right" },
        answer: ones,
        spoken: `${teen} is 10 and how many more?`,
      };
    }
    return {
      structure: "compose",
      equation: { left: 10, op: "+", right: ones, result: teen, unknown: "result" },
      answer: teen,
      spoken: `What is 10 and ${ones} more?`,
    };
  },
};

const countingOn: Skill = {
  id: "counting-on",
  name: "Counting on from the larger number",
  unit: 2,
  standard: "1.OA.5",
  visual: "number-line",
  structures: ["larger-first", "smaller-first"],
  standardRange: { min: 3, max: 19 },
  defaultRange: { min: 5, max: 15 },
  rangeOf: "the larger addend; the other addend is 1, 2, or 3",
  hint: "Start at the bigger number on the number line. Hop forward one at a time and count each hop.",
  bkt: { prior: 0.25, learn: 0.2, guess: 0.15, slip: 0.1 },
  generate(rng, { range, structures }) {
    const structure = rng.pick(structures);
    const larger = rng.int(range.min, range.max);
    const small = rng.int(1, Math.min(3, larger - 1, 20 - larger));
    const sum = larger + small;
    if (structure === "smaller-first") {
      return {
        structure,
        equation: { left: small, op: "+", right: larger, result: sum, unknown: "result" },
        answer: sum,
        spoken: `What is ${small} and ${larger} more?`,
      };
    }
    return {
      structure: "larger-first",
      equation: { left: larger, op: "+", right: small, result: sum, unknown: "result" },
      answer: sum,
      spoken: `What is ${larger} and ${small} more?`,
    };
  },
};

const makeATen: Skill = {
  id: "make-a-ten",
  name: "Make-a-ten within 20",
  unit: 2,
  standard: "1.OA.6",
  visual: "ten-frame",
  structures: ["larger-first", "smaller-first"],
  standardRange: { min: 6, max: 9 },
  defaultRange: { min: 7, max: 9 },
  rangeOf: "the larger addend; the sum always crosses ten",
  hint: "Fill the ten-frame first. Take just enough from the other number to make ten, then add on what is left.",
  bkt: { prior: 0.2, learn: 0.2, guess: 0.15, slip: 0.1 },
  generate(rng, { range, structures }) {
    const structure = rng.pick(structures);
    const larger = rng.int(range.min, range.max);
    const smaller = rng.int(11 - larger, larger);
    const sum = larger + smaller;
    if (structure === "smaller-first") {
      return {
        structure,
        equation: { left: smaller, op: "+", right: larger, result: sum, unknown: "result" },
        answer: sum,
        spoken: `What is ${smaller} and ${larger} more?`,
      };
    }
    return {
      structure: "larger-first",
      equation: { left: larger, op: "+", right: smaller, result: sum, unknown: "result" },
      answer: sum,
      spoken: `What is ${larger} and ${smaller} more?`,
    };
  },
};

const unknownAddend: Skill = {
  id: "unknown-addend",
  name: "Subtraction as unknown addend",
  unit: 2,
  standard: "1.OA.4",
  visual: "number-line",
  structures: ["subtract", "missing-addend"],
  standardRange: { min: 2, max: 20 },
  defaultRange: { min: 11, max: 18 },
  rangeOf: "the whole; the missing part is 1 to 5",
  hint: "Start at the number you know on the number line. Count up until you reach the bigger number. Your hops are the answer.",
  bkt: { prior: 0.2, learn: 0.2, guess: 0.15, slip: 0.1 },
  generate(rng, { range, structures }) {
    const structure = rng.pick(structures);
    const whole = rng.int(range.min, range.max);
    const part = rng.int(1, Math.min(5, whole - 1));
    const known = whole - part;
    if (structure === "missing-addend") {
      return {
        structure,
        equation: { left: known, op: "+", right: part, result: whole, unknown: "right" },
        answer: part,
        spoken: `${known} and how many more make ${whole}?`,
      };
    }
    return {
      structure: "subtract",
      equation: { left: whole, op: "-", right: known, result: part, unknown: "result" },
      answer: part,
      spoken: `What is ${whole} take away ${known}?`,
    };
  },
};

/** Every Skill, in progression order. Prerequisites are earlier in the list. */
export const SKILLS: readonly Skill[] = [partnersTo10, teenNumbers, countingOn, makeATen, unknownAddend];

export function getSkill(id: SkillId): Skill {
  const skill = SKILLS.find((s) => s.id === id);
  if (!skill) throw new Error(`Unknown Skill: ${id}`);
  return skill;
}
