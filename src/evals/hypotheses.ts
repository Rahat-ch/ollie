/**
 * The Hypothesis evals, all deterministic: whether a Hypothesis names a
 * planted weakness, and whether its evidence has integrity (every cited ID
 * exists and its Assistance State is consistent with the claim).
 */
import type { CoachStep } from "@/coach";
import type { Hypothesis, LearnerNotes, LogEntry, ProblemId } from "@/loop";
import type { SimulatedLearnerId, WeaknessTag } from "./learners";
import type { LearnerRun } from "./run";
import { integrityRate, share } from "./stats";

/**
 * How each planted weakness is said in plain English. A Hypothesis names a
 * weakness when its claim says the pattern, not when it only names the
 * Skill: "make-a-ten" is a Skill, "crosses ten" is the pattern; "unknown
 * addend" is a Skill, "missing addend" is the structure the change-unknown
 * weakness is planted on. "Numbers above 10" is teen-number talk, so a sum
 * has to be the thing over ten.
 */
const WEAKNESS_PHRASES: Readonly<Record<WeaknessTag, readonly RegExp[]>> = {
  "crossing-ten": [
    /\bcross\w*\s+(?:over\s+|the\s+)?(?:ten|10)\b/,
    /\bbridg\w*\s+(?:through\s+|over\s+|across\s+|to\s+)?(?:ten|10)\b/,
    /\b(?:past|through|across)\s+(?:ten|10)\b/,
    /\b(?:sums?|totals?|adds?|adding|addition)\b[^.;]{0,40}?\b(?:over|above|beyond|more than|greater than|bigger than)\s+(?:ten|10)\b/,
    /\bregroup/,
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

/** "no hints", "never needs a Hint", "without a miss": a difficulty word negated is a strength. */
const NEGATED_DIFFICULTY =
  /\b(?:no|never|without|not)\s+(?:a\s+|an\s+|any\s+|needing\s+(?:a\s+)?)?(?:hints?|reveals?|misses|missed|mistakes?|errors?|struggl\w*|trouble|needs?\s+(?:a\s+)?hints?)\b/g;
const DIFFICULTY_WORDS =
  /\b(?:struggl\w*|miss(?:es|ed|ing)?|wrong|incorrect|error\w*|hint\w*|reveal\w*|unresolved|difficult\w*|hard|harder|trouble|confus\w*|not yet|needs?|weak\w*|mistak\w*|fail\w*)\b/;
const STRENGTH_WORDS =
  /\b(?:strong|solid|secure|fluent|confident|reliabl\w*|consistent\w*|mastered|knows|correct on the first try|first[\s-]try correct|every first try)\b/;

/**
 * What a claim is about, read from its words: a difficulty (the Learner
 * misses, needs a Hint, struggles), a strength (solid, reliable, no Hints),
 * or neither (a response-time pattern, say). A claim with both is a
 * difficulty: the Hypothesis is the thing under test, and strengths have
 * their own list.
 */
export function claimPolarity(claim: string): ClaimPolarity {
  const text = claim.toLowerCase();
  const negated = text.match(NEGATED_DIFFICULTY) !== null;
  const rest = text.replace(NEGATED_DIFFICULTY, " ");
  if (DIFFICULTY_WORDS.test(rest)) return "difficulty";
  if (negated || STRENGTH_WORDS.test(text)) return "strength";
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
  /** Problem citations checked, over every Notes the Coach wrote, accepted or rejected. */
  readonly citations: number;
  readonly unknownIds: number;
  readonly inconsistent: number;
  /** Consistent citations over all citations; 1 when there are none. */
  readonly integrity: number;
};

/** How many Sessions were planned by the Coach, by the Coach after a retry, or by the Baseline fallback. */
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
  readonly sources: PlanSources;
  readonly finalNotes: LearnerNotes;
};

/**
 * Every Notes the Coach wrote for a Session: each rejected attempt's, then
 * the accepted one's. After a double rejection the kept Notes are the prior
 * ones, which the Coach did not write this Session.
 */
function writtenNotes(step: CoachStep): LearnerNotes[] {
  const rejected = step.rejections.flatMap((r) => (r.output ? [r.output.notes] : []));
  return step.source === "baseline" ? rejected : [...rejected, step.notes];
}

/**
 * Score one Coach run. Detection and false positives read the Notes the
 * engine kept: a planted weakness is detected in the Session a supported
 * Hypothesis first names it, and a supported Hypothesis naming a weakness
 * that was not planted is a false positive. Evidence Integrity reads every
 * Notes the Coach wrote, rejected attempts included, against the Log so
 * far, so an invented Problem ID counts even though the engine refused it.
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
    for (const notes of writtenNotes(step)) {
      for (const { verdict } of checkEvidence(notes.hypotheses, entries)) {
        evidence.citations += 1;
        if (verdict === "unknown-id") evidence.unknownIds += 1;
        if (verdict === "inconsistent") evidence.inconsistent += 1;
      }
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
    evidence: { ...evidence, integrity: integrityRate(evidence.citations, evidence.unknownIds + evidence.inconsistent) },
    sources,
    finalNotes: last?.step.notes ?? { hypotheses: [], strengths: [] },
  };
}
