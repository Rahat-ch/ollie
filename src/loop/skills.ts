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

/** Every Skill, in progression order. Prerequisites are earlier in the list. */
export const SKILLS: readonly Skill[] = [partnersTo10, teenNumbers];

export function getSkill(id: SkillId): Skill {
  const skill = SKILLS.find((s) => s.id === id);
  if (!skill) throw new Error(`Unknown Skill: ${id}`);
  return skill;
}
