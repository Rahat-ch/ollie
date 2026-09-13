import { z } from "zod";
import { POWERS, SKILLS } from "@/loop";
import type { PowerId, SkillId } from "@/loop";
import { LearnerNotesSchema, SessionPlanSchema } from "@/generation/coach-schema";
import { SummaryOutputSchema, SummaryPracticeSchema } from "@/generation/summary-schema";
import { emptyRecord, SUMMARIES_KEPT, type CoachRecord } from "./record";

const skillIds = SKILLS.map((s) => s.id) as [SkillId, ...SkillId[]];
const powerIds = POWERS.map((power) => power.id) as [PowerId, ...PowerId[]];

const AssistanceSchema = z.enum(["first-try-correct", "hint-assisted-correct", "revealed", "unresolved"]);

const CitedProblemSchema = z.strictObject({
  id: z.string().min(1),
  skill: z.enum(skillIds),
  equation: z.string().min(1),
  assistance: AssistanceSchema,
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

const number = z.int().min(0).max(20);

const EquationSchema = z.strictObject({
  left: number,
  op: z.enum(["+", "-"]),
  right: number,
  result: number,
  unknown: z.enum(["left", "right", "result"]),
});

const SkillStateSchema = z.strictObject({
  estimate: z.number().min(0).max(1),
  recentFirstAttempts: z.array(z.boolean()),
  mastered: z.boolean(),
});

const ProfileStateSchema = z.strictObject({
  nextProblemNumber: z.int().min(1),
  sessionsCompleted: z.int().min(0),
  skills: z.record(z.enum(skillIds), SkillStateSchema),
});

/** The Session a Coach run still needs: the engine's own result, as `finishSession` returned it. */
const SessionResultSchema = z.strictObject({
  log: z.strictObject({
    sessionNumber: z.int().min(1),
    seed: z.string(),
    plan: SessionPlanSchema,
    entries: z.array(
      z.strictObject({
        problem: z.strictObject({
          id: z.string().min(1),
          skill: z.enum(skillIds),
          structure: z.string().min(1),
          equation: EquationSchema,
          answer: number,
          spoken: z.string(),
          review: z.boolean(),
        }),
        position: z.int().min(1),
        attempts: z.array(z.strictObject({ answer: number, correct: z.boolean(), responseMs: z.number().min(0) })),
        assistance: AssistanceSchema,
      }),
    ),
  }),
  profile: ProfileStateSchema,
  newlyMastered: z.array(z.enum(skillIds)),
  newlyUnlockedUnits: z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])),
  // A record written before Powers existed has none on the Session it kept;
  // the Parent Summary then names none, which is what was true at the time.
  powersEarned: z.array(z.enum(powerIds)).default([]),
});

/**
 * What a stored Coach record must look like before the browser trusts it.
 * The Notes and the Plan reuse the Coach's own schemas, so a record that
 * survives a reload is exactly what the engine allowed when it was written;
 * a hand-edited store loses the record alone instead of putting an invented
 * Hypothesis in front of a Parent.
 */
export const CoachRecordSchema = z.strictObject({
  notes: LearnerNotesSchema,
  plan: SessionPlanSchema.nullable(),
  source: z.enum(["coach", "retry", "baseline"]).nullable(),
  reasons: z.array(z.string()),
  unavailable: z.boolean(),
  lastSessionCoached: z.int().min(0),
  cited: z.array(CitedProblemSchema),
  changed: z.array(z.string()),
  summaries: z.array(ParentSummarySchema).max(SUMMARIES_KEPT),
  awaiting: SessionResultSchema.nullable(),
});

/**
 * The stored value as a record. A Profile stored before the Coach reached
 * the app, and one whose record is not a shape this version knows, both get
 * a fresh record: the record alone is lost, and the identity, the progress,
 * and the rewards beside it are kept.
 */
export function parseCoachRecord(value: unknown, version: number): CoachRecord {
  if (version < 5) return emptyRecord();
  const result = CoachRecordSchema.safeParse(value);
  return result.success ? result.data : emptyRecord();
}
