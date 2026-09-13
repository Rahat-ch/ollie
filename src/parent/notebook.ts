/**
 * Ollie's Notebook: the Learner Notes as the Parent reads them. Each
 * Hypothesis is a belief in prose with its evidence as the actual Problems
 * it rests on, then what changed after the last Session and what is being
 * tested next. Nothing here decides anything; it is the record turned into
 * rows a screen can render.
 */
import type { CitedProblem, CoachRecord } from "@/coach";
import type { HypothesisStatus, ProblemId } from "@/loop";

export type NotebookBelief = {
  readonly id: string;
  readonly claim: string;
  readonly status: HypothesisStatus;
  /** 0 to 1, as the Coach set it. */
  readonly confidence: number;
  readonly nextTest: string;
  /** The Problems the claim rests on, oldest first. */
  readonly evidence: readonly CitedProblem[];
  /** Cited Problems this device no longer holds; shown so the count is never quietly short. */
  readonly missing: readonly ProblemId[];
};

export type Notebook = {
  /** Whether the Coach has ever run on this device. */
  readonly coached: boolean;
  readonly beliefs: readonly NotebookBelief[];
  readonly strengths: readonly string[];
  /** What changed in the Notes after the last Session. */
  readonly changed: readonly string[];
  /** The Hypothesis the next Session is gathering evidence for. */
  readonly testingNext: { readonly claim: string; readonly nextTest: string } | null;
  /** Set when the Coach's output was rejected and the next Session is the Baseline's. */
  readonly baseline: { readonly reasons: readonly string[] } | null;
};

export function notebook(record: CoachRecord): Notebook {
  const held = new Map(record.cited.map((problem) => [problem.id, problem]));
  const beliefs = record.notes.hypotheses.map((hypothesis): NotebookBelief => ({
    id: hypothesis.id,
    claim: hypothesis.claim,
    status: hypothesis.status,
    confidence: hypothesis.confidence,
    nextTest: hypothesis.nextTest,
    evidence: hypothesis.evidence.flatMap((id) => held.get(id) ?? []),
    missing: hypothesis.evidence.filter((id) => !held.has(id)),
  }));
  const underTest = beliefs.find((belief) => belief.id === record.plan?.hypothesisUnderTest);
  return {
    coached: record.lastSessionCoached > 0,
    beliefs,
    strengths: record.notes.strengths,
    changed: record.changed,
    testingNext: underTest ? { claim: underTest.claim, nextTest: underTest.nextTest } : null,
    baseline: record.source === "baseline" ? { reasons: record.reasons } : null,
  };
}
