import type { Hypothesis, HypothesisStatus, LearnerNotes, ProblemId, SessionLog } from "./types";

/** The Notes before any Coach has run: nothing believed yet. */
export function emptyNotes(): LearnerNotes {
  return { hypotheses: [], strengths: [] };
}

/**
 * The Problem IDs the Coach was shown: this Session's Log and the evidence
 * in the prior Notes, which was validated when it was written. Anything
 * else is an invented observation.
 */
export function knownProblemIds(log: SessionLog, priorNotes: LearnerNotes): ReadonlySet<ProblemId> {
  return new Set([
    ...log.entries.map((entry) => entry.problem.id),
    ...priorNotes.hypotheses.flatMap((hypothesis) => hypothesis.evidence),
  ]);
}

export type NotesValidation = { readonly ok: true } | { readonly ok: false; readonly reasons: readonly string[] };

const STATUSES: readonly HypothesisStatus[] = ["proposed", "supported", "refuted"];
const CONFIDENCE = { min: 0, max: 1 };

const isBlank = (text: string): boolean => text.trim() === "";

function hypothesisReasons(hypothesis: Hypothesis, position: number, known: ReadonlySet<ProblemId>): string[] {
  const reasons: string[] = [];
  const name = isBlank(hypothesis.id) ? `Hypothesis ${position}` : hypothesis.id;
  if (isBlank(hypothesis.id)) reasons.push(`${name} has no id; give each Hypothesis a short stable id like h1`);
  if (isBlank(hypothesis.claim)) reasons.push(`${name} has no claim`);
  const { confidence, status } = hypothesis;
  if (!(Number.isFinite(confidence) && confidence >= CONFIDENCE.min && confidence <= CONFIDENCE.max)) {
    reasons.push(`${name} has confidence ${confidence}; confidence is a number from ${CONFIDENCE.min} to ${CONFIDENCE.max}`);
  }
  if (!STATUSES.includes(status)) {
    reasons.push(`${name} has status "${status}"; a status is one of ${STATUSES.join(", ")}`);
  } else if (status !== "proposed" && hypothesis.evidence.length === 0) {
    reasons.push(`${name} is ${status} but cites no evidence; only a proposed Hypothesis may wait for some`);
  }
  const cited = new Set<ProblemId>();
  for (const id of hypothesis.evidence) {
    if (cited.has(id)) {
      reasons.push(`${name} cites "${id}" more than once`);
      continue;
    }
    cited.add(id);
    if (!known.has(id)) {
      reasons.push(`${name} cites "${id}", which is not a Problem the Coach was shown`);
    }
  }
  return reasons;
}

/**
 * Check rewritten Learner Notes before the engine keeps them. A Hypothesis
 * may cite only Problems the Coach was shown (ADR 0003); every reason is
 * reported so the Coach can fix the whole document in one retry.
 */
export function validateNotes(notes: LearnerNotes, known: ReadonlySet<ProblemId>): NotesValidation {
  const reasons: string[] = [];
  const seen = new Set<string>();
  notes.hypotheses.forEach((hypothesis, index) => {
    if (seen.has(hypothesis.id)) reasons.push(`${hypothesis.id} appears more than once`);
    seen.add(hypothesis.id);
    reasons.push(...hypothesisReasons(hypothesis, index + 1, known));
  });
  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}
