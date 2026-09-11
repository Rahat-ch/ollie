/**
 * The Hypothesis evals, all deterministic: whether a Hypothesis names a
 * planted weakness, and whether its evidence has integrity (every cited ID
 * exists and its Assistance State is consistent with the claim).
 */
import type { CoachStep } from "@/coach";
import type { Hypothesis, LearnerNotes, LogEntry, ProblemId } from "@/loop";
import type { SimulatedLearnerId, WeaknessTag } from "./learners";
import type { LearnerRun } from "./run";

/**
 * How each planted weakness is said in plain English. A Hypothesis names a
 * weakness when its claim says the pattern, not when it only names the
 * Skill: "make-a-ten" is a Skill, "crosses ten" is the pattern; "unknown
 * addend" is a Skill, "missing addend" is the structure the change-unknown
 * weakness is planted on.
 */
const WEAKNESS_PHRASES: Readonly<Record<WeaknessTag, readonly RegExp[]>> = {
  "crossing-ten": [
    /cross(?:es|ing|ed)?\s+(?:over\s+)?(?:ten|10)\b/,
    /bridg(?:e|es|ing|ed)\s+(?:through\s+|over\s+|across\s+)?(?:ten|10)\b/,
    /(?:over|past|through|above|beyond|more than|greater than)\s+(?:ten|10)\b/,
    /regroup/,
  ],
  "change-unknown": [
    /missing[\s-]addend/,
    /missing[\s-](?:part|number|change)/,
    /change[\s-]unknown/,
    /unknown[\s-]change/,
    /how many more/,
    /what was added/,
  ],
};

const ALL_WEAKNESS_TAGS = Object.keys(WEAKNESS_PHRASES) as WeaknessTag[];

/** Whether a claim says the planted weakness in its own words (case-insensitive). */
export function namesWeakness(tag: WeaknessTag, claim: string): boolean {
  const text = claim.toLowerCase();
  return WEAKNESS_PHRASES[tag].some((phrase) => phrase.test(text));
}

export type ClaimPolarity = "difficulty" | "strength" | "neutral";

const DIFFICULTY_WORDS =
  /\b(?:struggl\w*|miss(?:es|ed|ing)?|wrong|incorrect|error\w*|hint\w*|reveal\w*|unresolved|difficult\w*|hard|harder|trouble|confus\w*|not yet|needs?|weak\w*|mistak\w*|fail\w*)\b/;
const STRENGTH_WORDS =
  /\b(?:strong|solid|secure|fluent|confident|reliabl\w*|consistent\w*|mastered|knows|correct on the first try|first[\s-]try correct|every first try|no hints?)\b/;

/**
 * What a claim is about, read from its words: a difficulty (the Learner
 * misses, needs a Hint, struggles), a strength (solid, reliable), or neither
 * (a response-time pattern, say). A claim with both is a difficulty: the
 * Hypothesis is the thing under test, and strengths have their own list.
 */
export function claimPolarity(claim: string): ClaimPolarity {
  const text = claim.toLowerCase();
  if (DIFFICULTY_WORDS.test(text)) return "difficulty";
  if (STRENGTH_WORDS.test(text)) return "strength";
  return "neutral";
}

export type CitationVerdict = "consistent" | "unknown-id" | "inconsistent";

export type CitationCheck = {
  readonly hypothesis: string;
  readonly problem: ProblemId;
  readonly verdict: CitationVerdict;
};

/** What Assistance State a citation must show, or null when either will do. */
function expectedFirstTry(hypothesis: Hypothesis): boolean | null {
  if (hypothesis.status === "refuted") return null;
  const polarity = claimPolarity(hypothesis.claim);
  if (polarity === "difficulty") return false;
  if (polarity === "strength") return true;
  return null;
}

/**
 * Evidence Integrity for every citation in the Notes against the Log: the
 * cited ID exists, and its Assistance State agrees with the claim. A
 * difficulty claim is backed by Problems that were not first-try correct,
 * a strength claim by ones that were; a refuted Hypothesis or a claim with
 * no polarity legitimately cites either, so only the ID is checked.
 */
export function checkEvidence(
  hypotheses: readonly Hypothesis[],
  entries: ReadonlyMap<ProblemId, LogEntry>,
): CitationCheck[] {
  return hypotheses.flatMap((hypothesis) => {
    const expected = expectedFirstTry(hypothesis);
    return hypothesis.evidence.map((problem) => {
      const entry = entries.get(problem);
      const firstTry = entry?.assistance === "first-try-correct";
      const verdict: CitationVerdict = !entry
        ? "unknown-id"
        : expected === null || firstTry === expected
          ? "consistent"
          : "inconsistent";
      return { hypothesis: hypothesis.id, problem, verdict };
    });
  });
}

export type EvidenceIntegrity = {
  /** Problem citations checked, over every Session's Notes. */
  readonly citations: number;
  readonly unknownIds: number;
  readonly inconsistent: number;
  /** Consistent citations over all citations; 1 when there are none. */
  readonly integrity: number;
};

export type PlanSources = Readonly<Record<CoachStep["source"], number>>;

export type LearnerHypotheses = {
  readonly id: SimulatedLearnerId;
  readonly name: string;
  readonly heldOut: boolean;
  readonly planted: readonly WeaknessTag[];
  /** The Session after which a supported Hypothesis first named the planted weakness; null if never. */
  readonly sessionsToDetection: Readonly<Partial<Record<WeaknessTag, number | null>>>;
  readonly detected: number;
  /** Distinct Hypotheses that were supported at some point in the run. */
  readonly supportedHypotheses: number;
  /** Of those, the ones that named a weakness the Learner does not have. */
  readonly falsePositives: number;
  readonly falsePositiveRate: number;
  readonly evidence: EvidenceIntegrity;
  /** How many Sessions were planned by the Coach, by the Coach after a retry, or by the Baseline fallback. */
  readonly sources: PlanSources;
  readonly finalNotes: LearnerNotes;
};

const share = (hits: number, total: number): number => (total === 0 ? 0 : hits / total);

/**
 * Score one Coach run: which planted weaknesses a supported Hypothesis
 * named and when, which supported Hypotheses named a weakness that was not
 * planted, Evidence Integrity over every citation in every Session's Notes
 * against the Log so far, and where each Plan came from.
 */
export function scoreHypotheses(run: LearnerRun): LearnerHypotheses {
  const { learner } = run;
  const planted = learner.weaknesses;
  const detection: Partial<Record<WeaknessTag, number | null>> = Object.fromEntries(planted.map((tag) => [tag, null]));
  const supported = new Set<string>();
  const falsePositives = new Set<string>();
  const entries = new Map<ProblemId, LogEntry>();
  const evidence = { citations: 0, unknownIds: 0, inconsistent: 0 };
  const sources = { coach: 0, retry: 0, baseline: 0 };

  for (const { result, step } of run.sessions) {
    for (const entry of result.log.entries) entries.set(entry.problem.id, entry);
    sources[step.source] += 1;
    for (const hypothesis of step.notes.hypotheses) {
      if (hypothesis.status !== "supported") continue;
      supported.add(hypothesis.id);
      for (const tag of ALL_WEAKNESS_TAGS) {
        if (!namesWeakness(tag, hypothesis.claim)) continue;
        if (planted.includes(tag)) detection[tag] ??= result.log.sessionNumber;
        else falsePositives.add(hypothesis.id);
      }
    }
    for (const { verdict } of checkEvidence(step.notes.hypotheses, entries)) {
      evidence.citations += 1;
      if (verdict === "unknown-id") evidence.unknownIds += 1;
      if (verdict === "inconsistent") evidence.inconsistent += 1;
    }
  }

  const last = run.sessions[run.sessions.length - 1];
  return {
    id: learner.id,
    name: learner.name,
    heldOut: learner.heldOut,
    planted,
    sessionsToDetection: detection,
    detected: planted.filter((tag) => detection[tag] !== null).length,
    supportedHypotheses: supported.size,
    falsePositives: falsePositives.size,
    falsePositiveRate: share(falsePositives.size, supported.size),
    evidence: {
      ...evidence,
      integrity: evidence.citations === 0 ? 1 : 1 - (evidence.unknownIds + evidence.inconsistent) / evidence.citations,
    },
    sources,
    finalNotes: last?.step.notes ?? { hypotheses: [], strengths: [] },
  };
}
