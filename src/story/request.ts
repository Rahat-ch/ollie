/**
 * What a browser may ask the server about a Unit 3 Problem: the Theme, the
 * Skill and structure, and the engine's numbers. One place decides it,
 * because two routes ask (the Story itself, and the Story's audio), and
 * because a request the engine would never set must not reach a model or a
 * voice (ADR 0001).
 */
import { z } from "zod";
import { getSkill, type Equation, type SkillId } from "@/loop";
import { cleanNickname, NICKNAME_MAX, THEMES } from "@/profile/identity";
import type { PoolInput } from "./pool";
import { isStoryStructure, storyShape } from "./shapes";

const themeIds = THEMES.map((t) => t.id) as [PoolInput["theme"], ...PoolInput["theme"][]];
const number = z.int().min(0).max(20);

/** The fields of a Unit 3 Problem as a browser sends them. Never the Nickname: a Story is written in placeholder form. */
export const storyProblemShape = {
  theme: z.enum(themeIds),
  skill: z.enum(["result-unknown", "change-unknown"]),
  structure: z.string().min(1),
  equation: z.strictObject({
    left: number,
    op: z.enum(["+", "-"]),
    right: number,
    result: number,
    unknown: z.enum(["left", "right", "result"]),
  }),
  answer: number,
} as const;

export type StoryProblem = {
  readonly skill: SkillId;
  readonly structure: string;
  readonly equation: Equation;
  readonly answer: number;
};

export type StoryProblemIssue = { readonly path: "structure" | "equation"; readonly message: string };

/** Why this is not a Problem the engine sets, or nothing when it is one. */
export function storyProblemIssue({ skill, structure, equation, answer }: StoryProblem): StoryProblemIssue | null {
  if (!isStoryStructure(structure) || !getSkill(skill).structures.includes(structure)) {
    return { path: "structure", message: `${skill} has no structure "${structure}"` };
  }
  // Lay the whole and the part out the way the structure does and require the same equation back.
  const whole = equation.op === "+" ? equation.result : equation.left;
  const part = equation.op === "-" || structure === "add-to-change" ? equation.right : equation.left;
  const laidOut = storyShape(structure).equation(whole, part);
  const same = (["left", "op", "right", "result", "unknown"] as const).every((field) => laidOut[field] === equation[field]);
  if (!same || part < 1 || answer !== equation[equation.unknown]) {
    return { path: "equation", message: "not a Problem the engine sets for this structure" };
  }
  return null;
}

/** The Nickname as the Parent set it: one line, no stray spaces, at most NICKNAME_MAX characters. */
export const nicknameField = z
  .string()
  .min(1)
  .max(NICKNAME_MAX)
  .refine((value) => cleanNickname(value) === value, "not a Nickname the app sets");
