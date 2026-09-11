import { baselinePlan, knownProblemIds, planSpace, validateNotes, validatePlan } from "@/loop";
import type { LearnerNotes, SessionResult } from "@/loop";
import { formatEquation } from "@/loop/format";
import { parseCoachOutput } from "@/generation/coach-schema";
import type { CoachEvidence, CoachInput, CoachOutput, Generation } from "@/generation/types";
import type { CoachRejection, CoachStep } from "./types";

/**
 * What the engine hands the Coach after a Session: the evidence, never the
 * Problem. Each entry has its equation blanked at the unknown and no answer
 * or spoken line at all, so the Coach can neither receive nor repeat a
 * number to ask or an answer (ADR 0001, ADR 0003).
 */
export function coachInput(result: SessionResult, notes: LearnerNotes): CoachInput {
  const evidence: CoachEvidence[] = result.log.entries.map((entry) => ({
    id: entry.problem.id,
    skill: entry.problem.skill,
    structure: entry.problem.structure,
    equation: formatEquation(entry.problem.equation),
    review: entry.problem.review,
    position: entry.position,
    assistance: entry.assistance,
    firstTryMs: entry.attempts[0]?.responseMs ?? null,
  }));
  return {
    sessionNumber: result.log.sessionNumber,
    evidence,
    notes,
    estimates: result.profile.skills,
    planSpace: planSpace(result.profile),
  };
}

export type CoachCheck =
  | { readonly ok: true; readonly output: CoachOutput }
  | { readonly ok: false; readonly reasons: readonly string[] };

/**
 * Whether a Coach output is allowed: the schema first, so a malformed value
 * is rejected before the engine looks at it; then the Notes, the Plan, and
 * the Hypothesis under test together, so one retry can fix everything.
 */
export function checkCoachOutput(value: unknown, result: SessionResult, notes: LearnerNotes): CoachCheck {
  const parsed = parseCoachOutput(value);
  if (!parsed.ok) return parsed;
  const { output } = parsed;
  const reasons: string[] = [];
  const notesVerdict = validateNotes(output.notes, knownProblemIds(result.log, notes));
  if (!notesVerdict.ok) reasons.push(...notesVerdict.reasons);
  const planVerdict = validatePlan(output.plan, result.profile);
  if (!planVerdict.ok) reasons.push(...planVerdict.reasons);
  const underTest = output.plan.hypothesisUnderTest;
  if (underTest !== null && !output.notes.hypotheses.some((h) => h.id === underTest)) {
    reasons.push(`the Plan tests "${underTest}", which is not a Hypothesis in the Notes`);
  }
  return reasons.length === 0 ? { ok: true, output } : { ok: false, reasons };
}

type CoachCall =
  | { readonly ok: true; readonly output: CoachOutput }
  | { readonly ok: false; readonly output?: CoachOutput; readonly reasons: readonly string[] };

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * One call to the Coach, checked. A thrown error (the network, the schema
 * gate in the adapter) is a rejection like any other, with the message as
 * its reason and no output to show the retry.
 */
async function callCoach(
  generation: Generation,
  input: CoachInput,
  result: SessionResult,
  notes: LearnerNotes,
): Promise<CoachCall> {
  // Typed by the seam; checked as unknown below, and shown back as it came.
  let output: CoachOutput;
  try {
    output = await generation.runCoach(input);
  } catch (error) {
    return { ok: false, reasons: [errorMessage(error)] };
  }
  const check = checkCoachOutput(output, result, notes);
  if (check.ok) return check;
  return { ok: false, output, reasons: check.reasons };
}

/**
 * The Coach step: run the Coach on the Session's evidence and keep its
 * output if the engine allows it; otherwise retry once with the rejected
 * output and every reason. After a failed retry the engine uses the
 * Baseline Plan, keeps the Notes from before the Session, and records both
 * rejections, so play never stops.
 */
export async function coachSession(
  generation: Generation,
  result: SessionResult,
  notes: LearnerNotes,
): Promise<CoachStep> {
  const input = coachInput(result, notes);
  const first = await callCoach(generation, input, result, notes);
  if (first.ok) return { ...first.output, source: "coach", rejections: [] };
  const rejection: CoachRejection = { attempt: 1, reasons: first.reasons };
  const retry = await callCoach(
    generation,
    { ...input, rejected: { output: first.output, reasons: first.reasons } },
    result,
    notes,
  );
  if (retry.ok) return { ...retry.output, source: "retry", rejections: [rejection] };
  return {
    notes,
    plan: baselinePlan(result.profile),
    source: "baseline",
    rejections: [rejection, { attempt: 2, reasons: retry.reasons }],
  };
}
