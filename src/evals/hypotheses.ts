/**
 * The Hypothesis evals, all deterministic: whether a Hypothesis names a
 * planted weakness, whether its evidence has integrity (every cited Problem
 * ID exists in the Log the Coach was shown), and whether its citations agree
 * with the claim they are cited for (the Assistance State says what the
 * claim says). The two are scored and reported separately: a fabricated ID
 * is a different failure from a hard call read the other way.
 */
import type { CoachStep } from "@/coach";
import type { Hypothesis, LearnerNotes, LogEntry, ProblemId } from "@/loop";
import type { SimulatedLearnerId, WeaknessTag } from "./learners";
import type { LearnerRun } from "./run";
import { integrityRate, share, wilsonInterval, type Interval } from "./stats";

/**
 * How each planted weakness is said in plain English. A Hypothesis names a
 * weakness when its claim says the pattern, not when it only names the
 * Skill: "make-a-ten" is a Skill, "crosses ten" is the pattern; "unknown
 * addend" is a Skill, "missing addend" is the structure the change-unknown
 * weakness is planted on. "Numbers above 10" is teen-number talk, so a sum
 * has to be the thing over ten.
 *
 * The crossing is allowed up to two words before its ten, because a live
 * Coach writes the pattern with the words in the way — "the smallest
 * crossing of ten", "crossing back over ten", "crosses the ten" — and the
 * Skill name is still refused: "make-a-ten" holds no crossing word at all.
 */
const WEAKNESS_PHRASES: Readonly<Record<WeaknessTag, readonly RegExp[]>> = {
  "crossing-ten": [
    /\bcross\w*(?:\s+\w+){0,2}\s+(?:ten|10)\b/,
    /\bbridg\w*(?:\s+\w+){0,2}\s+(?:ten|10)\b/,
    /\b(?:past|through|across)(?:\s+\w+){0,2}\s+(?:ten|10)\b/,
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

/** Every weakness a claim is read for: the planted ones and, for false positives, the others. */
export const WEAKNESS_TAGS = Object.keys(WEAKNESS_PHRASES) as readonly WeaknessTag[];

/** Whether a claim says the planted weakness in its own words (case-insensitive). */
export function namesWeakness(tag: WeaknessTag, claim: string): boolean {
  const text = claim.toLowerCase();
  return WEAKNESS_PHRASES[tag].some((phrase) => phrase.test(text));
}

export type ClaimPolarity = "difficulty" | "strength" | "neutral" | "contrastive";

/** "no hints", "never needs a Hint", "without a miss": a difficulty word negated is a strength. */
const NEGATED_DIFFICULTY =
  /\b(?:no|never|without|not)\s+(?:a\s+|an\s+|any\s+|needing\s+(?:a\s+)?)?(?:hints?|reveals?|help|misses|missed|mistakes?|errors?|struggl\w*|trouble|needs?\s+(?:a\s+)?(?:hints?|help))\b/g;
const DIFFICULTY_WORDS =
  /\b(?:struggl\w*|miss(?:es|ed|ing)?|wrong|incorrect|error\w*|hint\w*|reveal\w*|help|unresolved|difficult\w*|hard|harder|trouble|confus\w*|not yet|needs?|weak\w*|mistak\w*|fail\w*)\b/;
/**
 * "a missing change", "the missing addend", "missing-partner form": the name
 * of a Problem's form, which a strength claim says as readily as a
 * difficulty one. The miss word in it is not the Learner missing anything.
 */
const NAMED_FORM = /\bmissing[\s-](?:addend|part|partner|number|change|piece|whole)\b/g;
const STRENGTH_WORDS =
  /\b(?:strong|solid|secure|fluent|confident|reliabl\w*|consistent\w*|mastered|knows|correct on the first try|first[\s-]try correct|every first try)\b/;
/** "not yet secure", "is not reliable": a strength word negated is a difficulty, the mirror of the rule above. */
const NEGATED_STRENGTH =
  /\b(?:not\s+yet|not|never|isn't|aren't)\s+(?:quite\s+|fully\s+|always\s+|yet\s+)?(?:strong|solid|secure|fluent|confident|reliabl\w*|consistent\w*|mastered)\b/g;

/** "but", "while", "whereas": the Learner does one thing here and the other thing there. */
const CONTRAST_WORDS = /\b(?:but|while|whereas|except|although)\b/;

type ClaimReading = { readonly difficulty: boolean; readonly strength: boolean; readonly contrast: boolean };

/**
 * What the claim's words say, each of the three read independently: a
 * negated difficulty is a strength and a negated strength is a difficulty,
 * so "not yet secure" is one-sided rather than a claim saying both things.
 * The name of a Problem's form is taken out before the difficulty words are
 * looked for, so "a missing change ... is as secure at high wholes" reads as
 * the strength claim it is.
 */
function readClaim(claim: string): ClaimReading {
  const text = claim.toLowerCase().replace(NAMED_FORM, " ");
  const negatedDifficulty = text.match(NEGATED_DIFFICULTY) !== null;
  const negatedStrength = text.match(NEGATED_STRENGTH) !== null;
  return {
    difficulty: negatedStrength || DIFFICULTY_WORDS.test(text.replace(NEGATED_DIFFICULTY, " ")),
    strength: negatedDifficulty || STRENGTH_WORDS.test(text.replace(NEGATED_STRENGTH, " ")),
    contrast: CONTRAST_WORDS.test(text),
  };
}

/**
 * What a claim is about, read from its words: a difficulty (the Learner
 * misses, needs a Hint, struggles), a strength (solid, reliable, no Hints),
 * neither (a response-time pattern, say), or contrastive — a claim that says
 * both things at once, or sets one side against the other with a "but". The
 * Coach's best Hypotheses are the contrastive ones ("first try when the
 * smaller addend comes first, but a Hint when the larger does"), so they are
 * their own kind rather than a difficulty claim with an inconvenient half.
 */
export function claimPolarity(claim: string): ClaimPolarity {
  const { difficulty, strength, contrast } = readClaim(claim);
  if (!difficulty && !strength) return "neutral";
  if ((difficulty && strength) || contrast) return "contrastive";
  return difficulty ? "difficulty" : "strength";
}

/**
 * Whether a claim names a weakness the Learner has or has not got: it says
 * the pattern in its own words **and** it is a claim about a difficulty. A
 * strength claim and a claim with no polarity name nothing, however many
 * Skills they mention: "change-unknown holds when the change itself is
 * large" is the Coach saying the child can do it. A contrastive claim counts,
 * because its difficulty half is a difficulty claim.
 */
export function namesWeaknessAsDifficulty(tag: WeaknessTag, claim: string): boolean {
  if (!namesWeakness(tag, claim)) return false;
  const polarity = claimPolarity(claim);
  return polarity === "difficulty" || polarity === "contrastive";
}

export type CitationVerdict = "consistent" | "unknown-id" | "inconsistent";

export type CitationCheck = {
  readonly hypothesis: string;
  readonly problem: ProblemId;
  readonly verdict: CitationVerdict;
};

/**
 * What Assistance State a citation must show, or null when either will do.
 *
 * A claim that says both a difficulty and a strength cites either kind
 * legitimately: each citation backs one half of it. A one-sided claim with a
 * contrast in it ("needed a Hint on 9 + 3, but answers the smaller ones on
 * the first try") says both outcomes happened, so its cited set is what has
 * to show both: when it does, every citation agrees; when it shows one kind
 * only, the claim is read one-sided again and checked as it was before.
 */
function expectedFirstTry(hypothesis: Hypothesis, entries: ReadonlyMap<ProblemId, LogEntry>): boolean | null {
  if (hypothesis.status === "refuted") return null;
  const { difficulty, strength, contrast } = readClaim(hypothesis.claim);
  if (difficulty === strength) return null;
  const onesided = difficulty ? false : true;
  if (!contrast) return onesided;
  const outcomes = hypothesis.evidence.flatMap((id) => {
    const entry = entries.get(id);
    return entry ? [entry.assistance === "first-try-correct"] : [];
  });
  return outcomes.includes(true) && outcomes.includes(false) ? null : onesided;
}

/**
 * Evidence Integrity for every citation in the Notes against the Log: the
 * cited ID exists, and its Assistance State agrees with the claim. A
 * difficulty claim is backed by Problems that were not first-try correct,
 * a strength claim by ones that were; a refuted Hypothesis, a claim with no
 * polarity, and a contrastive claim whose citations show both outcomes
 * legitimately cite either, so only the ID is checked.
 */
export function checkEvidence(
  hypotheses: readonly Hypothesis[],
  entries: ReadonlyMap<ProblemId, LogEntry>,
): CitationCheck[] {
  return hypotheses.flatMap((hypothesis) => {
    const expected = expectedFirstTry(hypothesis, entries);
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

/** The three counts every citation falls into, from which both rates are made. */
export type CitationCounts = {
  /** Problem citations checked, over every Notes the Coach wrote, accepted or rejected. */
  readonly citations: number;
  readonly unknownIds: number;
  readonly inconsistent: number;
};

export type EvidenceIntegrity = CitationCounts & {
  /** Citations whose Problem ID is in the Log: the denominator of claim agreement. */
  readonly existing: number;
  /**
   * Evidence Integrity, the fabrication metric: citations whose Problem ID
   * exists in the Log the Coach was shown, over all citations; 1 when there
   * are none. This is the number that must be 1.00.
   */
  readonly integrity: number;
  /** What those citations support for that rate; null when there were none. */
  readonly integrityInterval: Interval | null;
  /** Of the citations that exist, the share whose outcome agrees with the claim; 1 when there are none. */
  readonly claimAgreement: number;
  readonly claimAgreementInterval: Interval | null;
};

/**
 * The two rates a citation tally supports, kept apart: whether the Coach
 * cited Problems that exist (fabrication, which no Coach may fail) and, of
 * those, whether each one says what its claim says (agreement, which a
 * careful Coach can fail on a hard call). One metric hid the other.
 */
export function evidenceIntegrity(counts: CitationCounts): EvidenceIntegrity {
  const existing = counts.citations - counts.unknownIds;
  return {
    ...counts,
    existing,
    integrity: integrityRate(counts.citations, counts.unknownIds),
    integrityInterval: wilsonInterval(existing, counts.citations),
    claimAgreement: integrityRate(existing, counts.inconsistent),
    claimAgreementInterval: wilsonInterval(existing - counts.inconsistent, existing),
  };
}

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
  readonly falsePositiveRateInterval: Interval | null;
  readonly evidence: EvidenceIntegrity;
  readonly sources: PlanSources;
  /**
   * The Notes the engine kept after each Session, in order, one per Session:
   * the Coach's when it was accepted, the Notes from before the Session when
   * both attempts were refused. Rejected attempts are not here; they are
   * scored for Evidence Integrity as they are written. The history is stored
   * so a later scorer can score a written report again.
   */
  readonly notesBySession: readonly LearnerNotes[];
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
 * Hypothesis first names it as a difficulty, and a supported Hypothesis
 * naming a weakness that was not planted, as a difficulty, is a false
 * positive. Both sides pass through the same gate, so a claim about what the
 * Learner can do is never read as a weakness. Evidence Integrity reads every
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
      for (const tag of WEAKNESS_TAGS) {
        if (!namesWeaknessAsDifficulty(tag, hypothesis.claim)) continue;
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
    falsePositiveRateInterval: wilsonInterval(falsePositives.size, supported.size),
    evidence: evidenceIntegrity(evidence),
    sources,
    notesBySession: run.sessions.map(({ step }) => step.notes),
    finalNotes: last?.step.notes ?? { hypotheses: [], strengths: [] },
  };
}
