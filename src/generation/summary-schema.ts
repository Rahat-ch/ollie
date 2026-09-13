import { z } from "zod";
import { SKILLS } from "@/loop";
import type { SkillId } from "@/loop";
import { LearnerNotesSchema } from "./coach-schema";
import type { SummaryOutput } from "./types";

const skillIds = SKILLS.map((s) => s.id) as [SkillId, ...SkillId[]];

export const SummaryPracticeSchema = z.strictObject({
  skill: z.enum(skillIds),
  name: z.string().min(1),
  firstTryCorrect: z.int().min(0),
  hintAssisted: z.int().min(0),
  revealed: z.int().min(0),
  unresolved: z.int().min(0),
});

/**
 * What the Parent Summary writer is given, as one zod schema. The browser
 * sends it to the Summary route, so the route checks it here before any
 * model call: the Session Log tallied by Skill and Assistance State, what
 * was Mastered, the Powers earned, the weakest Skill, and the Learner
 * Notes. No Nickname, Avatar, or Theme is in it, and a body carrying one is
 * rejected (ADR 0002).
 */
export const SummaryInputSchema = z.strictObject({
  sessionNumber: z.int().min(1),
  problems: z.int().min(0),
  practice: z.array(SummaryPracticeSchema),
  mastered: z.array(z.string()),
  powers: z.array(z.string()),
  weakest: z.strictObject({ skill: z.enum(skillIds), name: z.string().min(1) }).nullable(),
  notes: LearnerNotesSchema,
});

/**
 * The shape the Parent Summary writer must return, as one zod schema: it is
 * sent to the model as the structured-output format and run over whatever
 * comes back, so a malformed output is rejected before a Parent sees it.
 * Whether the Summary is *allowed* (its numbers are the engine's, it claims
 * nothing about thinking) is the validator's check, not this one.
 */
export const SummaryOutputSchema = z.strictObject({
  practiced: z.string().min(1).describe("Two or three sentences: the strategies practiced and any Power earned, with the evidence"),
  activity: z.string().min(1).describe("One five-minute thing to do together, for the weakest Skill"),
});

export type SummaryOutputParse =
  | { readonly ok: true; readonly output: SummaryOutput }
  | { readonly ok: false; readonly reasons: readonly string[] };

/** Check an unknown value against the schema; every issue is a reason. */
export function parseSummaryOutput(value: unknown): SummaryOutputParse {
  const result = SummaryOutputSchema.safeParse(value);
  if (result.success) return { ok: true, output: result.data };
  return {
    ok: false,
    reasons: result.error.issues.map((issue) => `${issue.path.join(".") || "output"}: ${issue.message}`),
  };
}
