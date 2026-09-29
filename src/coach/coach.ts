import { baselinePlan, knownProblemIds, planSpace, validateNotes, validatePlan } from "@/loop";
import type { LearnerNotes, ProblemId, ProfileState, SessionResult } from "@/loop";
import { formatEquation } from "@/loop/format";
import { parseCoachOutput } from "@/generation/coach-schema";
import type { CallOptions, CoachEvidence, CoachInput, CoachOutput, Generation } from "@/generation/types";
import { errorMessage, isUnavailable } from "@/lib/errors";
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

/**
 * What a Coach output is checked against: the Problem IDs the Coach was
 * shown, and the Profile whose Plan Space bounds the Plan. The device has
 * both from the Session itself; the server rebuilds both from the Coach
 * input (`boundsFromInput`), so the two check the same thing.
 */
export type CoachBounds = {
  readonly known: ReadonlySet<ProblemId>;
  readonly profile: ProfileState;
};

/** The bounds as the device has them: the Session's Log and Profile, and the Notes from before it. */
export const sessionBounds = (result: SessionResult, notes: LearnerNotes): CoachBounds => ({
  known: knownProblemIds(result.log, notes),
  profile: result.profile,
});

/**
 * The Profile as far as a Coach input tells it, which is as far as the Plan
 * Space and the Baseline need: which Skills are Mastered, and how many
 * Sessions have been played. Unlocks depend only on Mastery, so the Plan
 * Space built from it is the one the device built from the whole Profile;
 * a Coach input is always for a completed Session, so its number is the
 * count of Sessions played. The next Problem number is not in the input and
 * nothing here allocates one.
 */
export const profileFromInput = (input: CoachInput): ProfileState => ({
  nextProblemNumber: 0,
  sessionsCompleted: input.sessionNumber,
  skills: input.estimates,
});

/**
 * The bounds as the server rebuilds them from the body alone: this
 * Session's evidence plus the Problems the Notes already cite, and the
 * Profile from the Knowledge Estimates. The Plan Space the body carries is
 * never trusted; it is what the device says it computed, not what the
 * engine allows.
 */
export const boundsFromInput = (input: CoachInput): CoachBounds => ({
  known: new Set([...input.evidence.map((entry) => entry.id), ...input.notes.hypotheses.flatMap((hypothesis) => hypothesis.evidence)]),
  profile: profileFromInput(input),
});

export type CoachCheck =
  | { readonly ok: true; readonly output: CoachOutput }
  | { readonly ok: false; readonly reasons: readonly string[] };

/**
 * Whether a Coach output is allowed: the schema first, so a malformed value
 * is rejected before the engine looks at it; then the Notes, the Plan, and
 * the Hypothesis under test together, so one retry can fix everything.
 */
export function checkCoachOutput(value: unknown, bounds: CoachBounds): CoachCheck {
  const parsed = parseCoachOutput(value);
  if (!parsed.ok) return parsed;
  const { output } = parsed;
  const reasons: string[] = [];
  const notesVerdict = validateNotes(output.notes, bounds.known);
  if (!notesVerdict.ok) reasons.push(...notesVerdict.reasons);
  const planVerdict = validatePlan(output.plan, bounds.profile);
  if (!planVerdict.ok) reasons.push(...planVerdict.reasons);
  const underTest = output.plan.hypothesisUnderTest;
  if (underTest !== null && !output.notes.hypotheses.some((h) => h.id === underTest)) {
    reasons.push(`the Plan tests "${underTest}", which is not a Hypothesis in the Notes`);
  }
  return reasons.length === 0 ? { ok: true, output } : { ok: false, reasons };
}

type CoachCall =
  | { readonly ok: true; readonly output: CoachOutput }
  | { readonly ok: false; readonly output?: CoachOutput; readonly reasons: readonly string[]; readonly unavailable?: boolean };

/**
 * One call to the Coach, checked. A thrown error (the network, the schema
 * gate in the adapter) is a rejection like any other, with the message as
 * its reason and no output to show the retry; a Coach that could not be
 * reached at all is marked, because there is nothing to retry.
 */
async function callCoach(
  generation: Pick<Generation, "runCoach">,
  input: CoachInput,
  bounds: CoachBounds,
  options: CallOptions,
): Promise<CoachCall> {
  // Typed by the seam; checked as unknown below, and shown back as it came.
  let output: CoachOutput;
  try {
    output = await generation.runCoach(input, options);
  } catch (error) {
    return { ok: false, reasons: [errorMessage(error)], unavailable: isUnavailable(error) };
  }
  const check = checkCoachOutput(output, bounds);
  if (check.ok) return check;
  return { ok: false, output, reasons: check.reasons };
}

/** A rejection carrying the rejected output when there was one. */
function rejected(attempt: CoachRejection["attempt"], call: CoachCall & { ok: false }): CoachRejection {
  const rejection = { attempt, reasons: call.reasons, ...(call.unavailable ? { unavailable: true } : {}) };
  return call.output ? { ...rejection, output: call.output } : rejection;
}

/** The Baseline Plan with the Notes as they stood before the Session, so play never stops. */
export function baselineStep(bounds: CoachBounds, notes: LearnerNotes, rejections: readonly CoachRejection[]): CoachStep {
  return { notes, plan: baselinePlan(bounds.profile), source: "baseline", rejections };
}

/**
 * The Coach step on a Coach input and what it is checked against: run the
 * Coach and keep its output if the engine allows it; otherwise retry once
 * with the rejected output and every reason. After a failed retry the engine
 * uses the Baseline Plan, keeps the Notes from before the Session, and
 * records both rejections, so play never stops. A Coach that could not be
 * reached at all is not retried: there is no output to fix and no reason to
 * think a second call would arrive, so the Baseline Plan is used at once.
 * Nor is a call whose caller has gone (its signal aborted): nobody is
 * waiting for the retry. `coachSession` runs it on the Session itself; the
 * Coach route runs it (`serverCoachStep`) on bounds rebuilt from the body.
 */
export async function coachStep(
  generation: Pick<Generation, "runCoach">,
  input: CoachInput,
  bounds: CoachBounds,
  options: CallOptions = {},
): Promise<CoachStep> {
  const first = await callCoach(generation, input, bounds, options);
  if (first.ok) return { ...first.output, source: "coach", rejections: [] };
  const rejection = rejected(1, first);
  if (first.unavailable || options.signal?.aborted) return baselineStep(bounds, input.notes, [rejection]);
  const retry = await callCoach(generation, { ...input, rejected: { output: first.output, reasons: first.reasons } }, bounds, options);
  if (retry.ok) return { ...retry.output, source: "retry", rejections: [rejection] };
  return baselineStep(bounds, input.notes, [rejection, rejected(2, retry)]);
}

/**
 * The Coach step for a completed Session, checked against the Session
 * itself: what the eval and the CLI run on a Generation. The Coach route
 * runs the same rule on the bounds it rebuilds (`serverCoachStep`), and the
 * device reaches it through the route (`coachThroughServer`).
 */
export function coachSession(
  generation: Pick<Generation, "runCoach">,
  result: SessionResult,
  notes: LearnerNotes,
): Promise<CoachStep> {
  return coachStep(generation, coachInput(result, notes), sessionBounds(result, notes));
}

