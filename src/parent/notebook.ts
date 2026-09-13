/**
 * Ollie's Notebook: the Learner Notes as the Parent reads them. Each
 * Hypothesis is a belief in prose with its evidence as the actual Problems
 * it rests on, then what changed after the last Session and what is being
 * tested next. Nothing here decides anything; it is the record turned into
 * rows a screen can render.
 */
import type { CitedProblem, CoachRecord } from "@/coach";
import { getSkill } from "@/loop";
import type { HypothesisStatus, ProblemId, SessionPlan } from "@/loop";

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
  /**
   * Set when the next Session is the Baseline's: either the Coach could not
   * be reached at all, or what it wrote was rejected twice. The Parent reads
   * a plain sentence and the Plan it fell back to; the reasons themselves
   * stay on the record, where they are for the developer.
   */
  readonly baseline: { readonly unavailable: boolean; readonly plan: string } | null;
};

/**
 * `6 Problems on Make-a-ten within 20, and 2 to keep an earlier Skill warm`:
 * a Session Plan in the Parent's words, counted from the Plan itself the way
 * the engine counts it, never written down twice.
 */
export function describePlan(plan: SessionPlan): string {
  const review = Math.round(plan.length * plan.reviewShare);
  const planned = plan.length - review;
  const mix = plan.skills.map((skill) => getSkill(skill.skill).name).join(" and ");
  const warm = review > 0 ? `, and ${review} to keep an earlier Skill warm` : "";
  return `${planned} ${planned === 1 ? "Problem" : "Problems"} on ${mix}${warm}`;
}

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
    baseline:
      record.source === "baseline" && record.plan
        ? { unavailable: record.unavailable, plan: describePlan(record.plan) }
        : null,
  };
}
