import { z } from "zod";
import { SKILLS } from "@/loop";
import type { SkillId } from "@/loop";
import type { CoachOutput } from "./types";

const skillIds = SKILLS.map((s) => s.id) as [SkillId, ...SkillId[]];

export const HypothesisSchema = z.strictObject({
  id: z.string().min(1).describe("Stable short id, e.g. h1; keep it across Sessions"),
  claim: z.string().min(1).describe("One belief about how the Learner is learning, in plain English"),
  status: z.enum(["proposed", "supported", "refuted"]),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()).describe("Problem IDs from the Log only, e.g. p12"),
  nextTest: z.string().min(1).describe("What the next Session should show to move the status"),
});

export const LearnerNotesSchema = z.strictObject({
  hypotheses: z.array(HypothesisSchema),
  strengths: z.array(z.string()),
});

export const PlanSkillSchema = z.strictObject({
  skill: z.enum(skillIds),
  weight: z.number().describe("Relative share of the Session's Problems"),
  numberRange: z.strictObject({ min: z.int(), max: z.int() }).optional(),
  structures: z.array(z.string()).optional(),
});

export const SessionPlanSchema = z.strictObject({
  length: z.int(),
  skills: z.array(PlanSkillSchema),
  reviewShare: z.number(),
  hypothesisUnderTest: z.string().nullable().describe("The id of one Hypothesis in the Notes, or null"),
});

export const CoachEvidenceSchema = z.strictObject({
  id: z.string().min(1),
  skill: z.enum(skillIds),
  structure: z.string().min(1),
  equation: z.string().min(1).describe("The equation with its unknown blanked, e.g. 8 + 5 = ?"),
  review: z.boolean(),
  position: z.int().min(1),
  assistance: z.enum(["first-try-correct", "hint-assisted-correct", "revealed", "unresolved"]),
  firstTryMs: z.number().min(0).nullable(),
});

const SkillStateSchema = z.strictObject({
  estimate: z.number().min(0).max(1),
  recentFirstAttempts: z.array(z.boolean()),
  mastered: z.boolean(),
});

const NumberRangeSchema = z.strictObject({ min: z.int(), max: z.int() });

const PlanSpaceSchema = z.strictObject({
  skills: z.array(
    z.strictObject({
      skill: z.enum(skillIds),
      name: z.string().min(1),
      unit: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      structures: z.array(z.string()),
      numberRange: NumberRangeSchema,
      rangeOf: z.string(),
      mastered: z.boolean(),
    }),
  ),
  length: NumberRangeSchema,
  reviewShare: NumberRangeSchema,
});

/**
 * What the Coach is given, as one zod schema. The browser sends it to the
 * Coach route, so the route checks it here before any model call: the
 * Session's evidence, the Notes, the Knowledge Estimates, and the Plan
 * Space, and nothing else. There is no Nickname, Avatar, or Theme in it and
 * a body carrying one is rejected (ADR 0002).
 */
export const CoachInputSchema = z.strictObject({
  sessionNumber: z.int().min(1),
  evidence: z.array(CoachEvidenceSchema),
  notes: LearnerNotesSchema,
  estimates: z.record(z.enum(skillIds), SkillStateSchema),
  planSpace: PlanSpaceSchema,
  rejected: z
    .strictObject({
      output: z.lazy(() => CoachOutputSchema).optional(),
      reasons: z.array(z.string()),
    })
    .optional(),
});

/**
 * The shape the Coach must return, as one zod schema: it is sent to the model
 * as the structured-output format and run over whatever comes back, so a
 * malformed output is rejected before the engine sees it. Whether the output
 * is *allowed* (evidence IDs exist, the Plan is inside the Plan Space) is the
 * engine's check, not this one.
 */
export const CoachOutputSchema = z.strictObject({
  notes: LearnerNotesSchema,
  plan: SessionPlanSchema,
});

export type CoachOutputParse =
  | { readonly ok: true; readonly output: CoachOutput }
  | { readonly ok: false; readonly reasons: readonly string[] };

/** Check an unknown value against the schema; every issue is a reason. */
export function parseCoachOutput(value: unknown): CoachOutputParse {
  const result = CoachOutputSchema.safeParse(value);
  if (result.success) return { ok: true, output: result.data };
  return {
    ok: false,
    reasons: result.error.issues.map((issue) => `${issue.path.join(".") || "output"}: ${issue.message}`),
  };
}
