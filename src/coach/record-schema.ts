import { z } from "zod";
import { SKILLS } from "@/loop";
import type { SkillId } from "@/loop";
import { LearnerNotesSchema, SessionPlanSchema } from "@/generation/coach-schema";
import { SummaryOutputSchema, SummaryPracticeSchema } from "@/generation/summary-schema";
import type { CoachRecord } from "./record";

const skillIds = SKILLS.map((s) => s.id) as [SkillId, ...SkillId[]];

const CitedProblemSchema = z.strictObject({
  id: z.string().min(1),
  skill: z.enum(skillIds),
  equation: z.string().min(1),
  assistance: z.enum(["first-try-correct", "hint-assisted-correct", "revealed", "unresolved"]),
  sessionNumber: z.int().min(1),
});

const ParentSummarySchema = SummaryOutputSchema.extend({
  sessionNumber: z.int().min(1),
  at: z.string().min(1),
  source: z.enum(["summary", "template"]),
  problems: z.int().min(0),
  practice: z.array(SummaryPracticeSchema),
  mastered: z.array(z.string()),
  powers: z.array(z.string()),
});

/**
 * What a stored Coach record must look like before the browser trusts it.
 * The Notes and the Plan reuse the Coach's own schemas, so a record that
 * survives a reload is exactly what the engine allowed when it was written;
 * a hand-edited store starts fresh instead of putting an invented Hypothesis
 * in front of a Parent.
 */
export const CoachRecordSchema = z.strictObject({
  notes: LearnerNotesSchema,
  plan: SessionPlanSchema.nullable(),
  source: z.enum(["coach", "retry", "baseline"]).nullable(),
  reasons: z.array(z.string()),
  lastSessionCoached: z.int().min(0),
  cited: z.array(CitedProblemSchema),
  changed: z.array(z.string()),
  summaries: z.array(ParentSummarySchema),
});

/** The stored value as a record, or null when it is not one this version knows. */
export function parseCoachRecord(value: unknown): CoachRecord | null {
  const result = CoachRecordSchema.safeParse(value);
  return result.success ? result.data : null;
}
