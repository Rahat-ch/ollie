/**
 * The Coach step on the server, and the device's check of what it answers.
 * The server is authoritative: the Coach route runs the whole step — the
 * check, the one retry with every reason, the Baseline Plan — as a graph
 * (`serverCoachStep` in `./graph.ts`, server only), and only an
 * output the engine allowed leaves it. It checks against what it rebuilds
 * from the body, never against what the body claims: the Problem IDs from
 * the evidence and the Notes, the Plan Space from the Knowledge Estimates.
 * A rejected output never leaves the server; its reasons do, so the device
 * can say why the Baseline was used.
 *
 * The device still checks what the route answered against its own Session
 * and plans its own Baseline, so a route that is wrong, tampered with, or
 * not there at all leaves play exactly where the device alone would.
 */
import { z } from "zod";
import { LearnerNotesSchema, SessionPlanSchema } from "@/generation/coach-schema";
import type { CoachInput } from "@/generation/types";
import type { LearnerNotes, SessionResult } from "@/loop";
import { errorMessage, isUnavailable } from "@/lib/errors";
import { baselineStep, checkCoachOutput, coachInput, sessionBounds } from "./coach";
import type { CoachRejection, CoachStep } from "./types";

/** A rejection as the route answers it: why, and whether the Coach was reached, without the rejected output. */
export type ServerRejection = Omit<CoachRejection, "output">;

/** What the Coach route answers: a checked Coach output, a checked retry, or the Baseline Plan, and every rejection. */
export type ServerCoachStep = Omit<CoachStep, "rejections"> & { readonly rejections: readonly ServerRejection[] };

/** The rejection without the output it rejected, which stays on the server. */
export const withoutOutput = ({ attempt, reasons, unavailable }: CoachRejection): ServerRejection =>
  unavailable ? { attempt, reasons, unavailable } : { attempt, reasons };

const ServerCoachStepSchema = z.object({
  notes: LearnerNotesSchema,
  plan: SessionPlanSchema,
  source: z.enum(["coach", "retry", "baseline"]),
  rejections: z.array(
    z.object({
      attempt: z.union([z.literal(1), z.literal(2)]),
      reasons: z.array(z.string()),
      unavailable: z.boolean().optional(),
    }),
  ),
});

/**
 * The Coach step as the device runs it through the route, with the device's
 * own check of what came back. A route that could not be asked (no key, no
 * answer in time, the network) is one rejection and the Baseline Plan at
 * once, marked when the Coach could not be reached. A Coach output or a
 * retry is checked again against the Session, and kept with where it came
 * from and the route's reasons; one the device does not allow is rejected
 * as the attempt it was (the Coach's first, or the retry). When the route
 * used the Baseline, the device plans its own from its Profile and keeps the
 * Notes from before the Session, with the route's reasons, so the Notebook
 * says whether the Coach was rejected or could not be reached. An answer
 * that is not a Coach step at all is a rejection like any other. The route
 * has already retried, so nothing here asks it again.
 */
export async function coachThroughServer(
  ask: (input: CoachInput) => Promise<unknown>,
  result: SessionResult,
  notes: LearnerNotes,
): Promise<CoachStep> {
  let answer: unknown;
  try {
    answer = await ask(coachInput(result, notes));
  } catch (error) {
    const rejection = { attempt: 1 as const, reasons: [errorMessage(error)], ...(isUnavailable(error) ? { unavailable: true } : {}) };
    return baselineStep(sessionBounds(result, notes), notes, [rejection]);
  }
  return acceptServerStep(answer, result, notes);
}

/** What `coachThroughServer` does with an answer that came: check it, or plan the device's own Baseline. */
export function acceptServerStep(answer: unknown, result: SessionResult, notes: LearnerNotes): CoachStep {
  const bounds = sessionBounds(result, notes);
  const parsed = ServerCoachStepSchema.safeParse(answer);
  if (!parsed.success) {
    const reasons = parsed.error.issues.map((issue) => `/api/coach answered ${issue.path.join(".") || "a body"} that is not a Coach step: ${issue.message}`);
    return baselineStep(bounds, notes, [{ attempt: 1, reasons }]);
  }
  const step = parsed.data;
  if (step.source === "baseline") return baselineStep(bounds, notes, step.rejections);
  const output = { notes: step.notes, plan: step.plan };
  const check = checkCoachOutput(output, bounds);
  if (check.ok) return { ...check.output, source: step.source, rejections: step.rejections };
  const attempt = step.source === "coach" ? 1 : 2;
  return baselineStep(bounds, notes, [...step.rejections, { attempt, output, reasons: check.reasons }]);
}
