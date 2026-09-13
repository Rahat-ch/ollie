/**
 * What the Coach leaves behind on the device: the Learner Notes, the next
 * Session Plan, where that Plan came from, the Problems the Notes cite (so
 * Ollie's Notebook can show the evidence as the actual Problems), what
 * changed after the last Session, and the last seven Parent Summaries.
 * Plain data and pure functions; the Profile stores it and the Parent Area
 * reads it.
 */
import { emptyNotes } from "@/loop";
import { formatEquation } from "@/loop/format";
import type { AssistanceState, LearnerNotes, ProblemId, SessionPlan, SessionResult, SkillId } from "@/loop";
import type { ParentSummary } from "@/summary/summary";
import type { CoachStep } from "./types";

/** The Parent Area lists this many Parent Summaries, newest first. */
export const SUMMARIES_KEPT = 7;

/** One Problem a Hypothesis cites, kept so the Parent can tap the evidence and see it. */
export type CitedProblem = {
  readonly id: ProblemId;
  readonly skill: SkillId;
  /** `8 + 5 = ?`, the unknown blanked as the Learner saw it. */
  readonly equation: string;
  readonly assistance: AssistanceState;
  readonly sessionNumber: number;
};

export type CoachRecord = {
  readonly notes: LearnerNotes;
  /** The Plan the next Session is built from; null until a Coach run has settled one. */
  readonly plan: SessionPlan | null;
  /** Where that Plan came from; null before any Coach run. */
  readonly source: CoachStep["source"] | null;
  /** Every reason the engine rejected a Coach output, so the Notebook can say why the Baseline is in use. */
  readonly reasons: readonly string[];
  /** The Session the Coach last ran on. 0 before any run; it keeps the run to one per Session. */
  readonly lastSessionCoached: number;
  /** The Problems the Notes cite, from this Session's Log and the Sessions before it. */
  readonly cited: readonly CitedProblem[];
  /** What changed in the Notes after the last Session, in plain English. */
  readonly changed: readonly string[];
  /** Newest first. */
  readonly summaries: readonly ParentSummary[];
};

export function emptyRecord(): CoachRecord {
  return { notes: emptyNotes(), plan: null, source: null, reasons: [], lastSessionCoached: 0, cited: [], changed: [], summaries: [] };
}

/** This Session's Problems as evidence: the same view the Coach was given. */
function citedFromSession(result: SessionResult): CitedProblem[] {
  return result.log.entries.map((entry) => ({
    id: entry.problem.id,
    skill: entry.problem.skill,
    equation: formatEquation(entry.problem.equation),
    assistance: entry.assistance,
    sessionNumber: result.log.sessionNumber,
  }));
}

/**
 * What changed after the Session, for the Parent: a Hypothesis whose status
 * moved, one that gathered more evidence, and one written for the first
 * time. Refuted and supported are the movements that matter; the rest is
 * detail the Notebook already shows.
 */
export function notesChanges(before: LearnerNotes, after: LearnerNotes): string[] {
  const changes: string[] = [];
  for (const hypothesis of after.hypotheses) {
    const previous = before.hypotheses.find((h) => h.id === hypothesis.id);
    if (!previous) {
      changes.push(`New: "${hypothesis.claim}"`);
      continue;
    }
    const moved = previous.status !== hypothesis.status;
    const grew = hypothesis.evidence.length > previous.evidence.length;
    if (moved) changes.push(`Now ${hypothesis.status}: "${hypothesis.claim}"${grew ? ", with more evidence" : ""}`);
    else if (grew) changes.push(`More evidence for "${hypothesis.claim}"`);
  }
  for (const strength of after.strengths) {
    if (!before.strengths.includes(strength)) changes.push(`Strength: ${strength}`);
  }
  return changes;
}

/**
 * The Coach step settled after a Session, written onto the record. The cited
 * Problems are pruned to what the new Notes cite, so the device keeps the
 * evidence a Hypothesis rests on for as long as it rests on it and no more.
 */
export function applyCoachStep(record: CoachRecord, step: CoachStep, result: SessionResult): CoachRecord {
  const cites = new Set(step.notes.hypotheses.flatMap((hypothesis) => hypothesis.evidence));
  const known = new Map([...record.cited, ...citedFromSession(result)].map((problem) => [problem.id, problem]));
  return {
    notes: step.notes,
    plan: step.plan,
    source: step.source,
    reasons: step.rejections.flatMap((rejection) => rejection.reasons),
    lastSessionCoached: result.log.sessionNumber,
    cited: [...cites].flatMap((id) => known.get(id) ?? []),
    changed: notesChanges(record.notes, step.notes),
    summaries: record.summaries,
  };
}

/** The Session's Parent Summary, newest first, the last seven kept. A Session has one Summary. */
export function addSummary(record: CoachRecord, summary: ParentSummary): CoachRecord {
  const others = record.summaries.filter((kept) => kept.sessionNumber !== summary.sessionNumber);
  return { ...record, summaries: [summary, ...others].slice(0, SUMMARIES_KEPT) };
}
