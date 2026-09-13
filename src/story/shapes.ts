/**
 * One row per Unit 3 structure: what the Story tells (for the prompt), the
 * template sentence, and how the structure lays a whole and a part into an
 * equation, the way its Skill's generator does. Adding a structure to a
 * Unit 3 Skill is one row here beside its generator and Hint.
 */
import type { Equation, SkillId } from "@/loop";
import type { Thing } from "./themes";

export type StoryShape = {
  readonly skill: SkillId;
  /** What happens to the things, with the numbers the Learner is told and never the answer. */
  readonly describe: (equation: Equation) => string;
  /** The hand-written Story: `who` (the Nickname or its placeholder) and one of the Theme's things. */
  readonly template: (who: string, equation: Equation, thing: Thing) => string;
  /** The rich set's hand-written Story: the same numbers with the scene set where the Theme happens. */
  readonly rich: (who: string, equation: Equation, thing: Thing, where: string) => string;
  /** The equation for a whole and a part, as the Skill's generator builds it. */
  readonly equation: (whole: number, part: number) => Equation;
  /** The largest part the generator draws for a whole. */
  readonly maxPart: (whole: number) => number;
};

/** `7 puppies` or `1 puppy`. */
const count = (n: number, { one, many }: Thing): string => `${n} ${n === 1 ? one : many}`;

/** `7 more puppies come` or `1 more puppy comes`. */
const arrive = (n: number, { one, many }: Thing): string => `${n} more ${n === 1 ? `${one} comes` : `${many} come`}`;

/** The verb that goes with a count: `there is 1 puppy`, `there are 7 puppies`. */
const isOrAre = (n: number): string => (n === 1 ? "is" : "are");

const wholeMinusOne = (whole: number): number => whole - 1;
const changeUpToNine = (whole: number): number => Math.min(9, whole - 1);

const STORY_SHAPES: Readonly<Record<string, StoryShape>> = {
  "add-to": {
    skill: "result-unknown",
    describe: ({ left, right }) => `There are ${left} at the start. Then ${right} more come. Ask how many there are now.`,
    template: (who, { left, right }, thing) =>
      `${who} has ${count(left, thing)}. ${arrive(right, thing)}, so how many ${thing.many} are there now?`,
    rich: (who, { left, right }, thing, where) =>
      `${who} plays ${where} with ${count(left, thing)}. Then ${arrive(right, thing)} along, so how many ${thing.many} are there now?`,
    equation: (whole, part) => ({ left: part, op: "+", right: whole - part, result: whole, unknown: "result" }),
    maxPart: wholeMinusOne,
  },
  "take-from": {
    skill: "result-unknown",
    describe: ({ left, right }) => `There are ${left} at the start. Then ${right} go away. Ask how many are left.`,
    template: (who, { left, right }, thing) =>
      `${who} has ${count(left, thing)}. ${count(right, thing)} ${right === 1 ? "goes" : "go"} away, so how many ${thing.many} are left?`,
    rich: (who, { left, right }, thing, where) =>
      `${who} plays ${where} with ${count(left, thing)}. Then ${count(right, thing)} ${right === 1 ? "goes" : "go"} home, so how many ${thing.many} are left?`,
    equation: (whole, part) => ({ left: whole, op: "-", right: part, result: whole - part, unknown: "result" }),
    maxPart: wholeMinusOne,
  },
  "put-together": {
    skill: "result-unknown",
    describe: ({ left, right }) => `There are ${left} of one kind and ${right} of another kind. Ask how many there are altogether.`,
    template: (who, { left, right }, thing) =>
      `${who} sees ${count(left, thing)} and then ${count(right, thing)} more. How many ${thing.many} are there altogether?`,
    rich: (who, { left, right }, thing, where) =>
      `${who} sees ${count(left, thing)} ${where} and then ${count(right, thing)} more. How many ${thing.many} are there altogether?`,
    equation: (whole, part) => ({ left: part, op: "+", right: whole - part, result: whole, unknown: "result" }),
    maxPart: wholeMinusOne,
  },
  "add-to-change": {
    skill: "change-unknown",
    describe: ({ left, result }) =>
      `There are ${left} at the start. Some more come, and now there are ${result}. Ask how many came. Never say how many came.`,
    template: (who, { left, result }, thing) =>
      `${who} had ${count(left, thing)}. Now there are ${count(result, thing)}, so how many ${thing.many} came?`,
    rich: (who, { left, result }, thing, where) =>
      `${who} had ${count(left, thing)} ${where}. Now there ${isOrAre(result)} ${count(result, thing)}, so how many ${thing.many} came along?`,
    equation: (whole, part) => ({ left: whole - part, op: "+", right: part, result: whole, unknown: "right" }),
    maxPart: changeUpToNine,
  },
  "take-from-change": {
    skill: "change-unknown",
    describe: ({ left, result }) =>
      `There are ${left} at the start. Some go away, and now there are ${result}. Ask how many went away. Never say how many went away.`,
    template: (who, { left, result }, thing) =>
      `${who} had ${count(left, thing)}. Now there ${isOrAre(result)} ${count(result, thing)}, so how many ${thing.many} went away?`,
    rich: (who, { left, result }, thing, where) =>
      `${who} had ${count(left, thing)} ${where}. Now there ${isOrAre(result)} ${count(result, thing)}, so how many ${thing.many} went home?`,
    equation: (whole, part) => ({ left: whole, op: "-", right: part, result: whole - part, unknown: "right" }),
    maxPart: changeUpToNine,
  },
};

export const isStoryStructure = (structure: string): boolean => structure in STORY_SHAPES;

export function storyShape(structure: string): StoryShape {
  const shape = STORY_SHAPES[structure];
  if (!shape) throw new Error(`No Story shape for structure ${structure}`);
  return shape;
}
