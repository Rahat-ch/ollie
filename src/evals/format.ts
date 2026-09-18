import { getSkill, SKILLS } from "@/loop";
import { table } from "@/loop/format";
import type { LearnerConvergence, SplitSummary } from "./convergence";
import type { EvalResults, HypothesisSplit } from "./evals";
import type { LearnerHypotheses, PlanSources } from "./hypotheses";
import { describeWeakness, type SimulatedLearnerId } from "./learners";
import type { Calibration } from "./judge";
import { describeGeneration } from "./report";
import type { Interval, SplitKey, Validity } from "./stats";
import type { StoryReport } from "./stories";
import type { SummaryReport } from "./summaries";

export const pct = (share: number): string => `${Math.round(share * 100)}%`;

/**
 * `95% CI 0.058 to 0.392`: how much of the range a rate's sample really
 * supports, printed to three places because at the ends of the scale two
 * would round the width away. Said as undefined when nothing was counted.
 */
export const ci = (interval: Interval | null): string =>
  interval === null ? "95% CI undefined" : `95% CI ${interval.lower.toFixed(3)} to ${interval.upper.toFixed(3)}`;

/** `17%, 95% CI 0.058 to 0.392`: a rate never printed without what it is worth. */
export const rate = (share: number, interval: Interval | null): string => `${pct(share)}, ${ci(interval)}`;

/** `C / B`: the Coach's number then the Baseline's, so the two planners read side by side. */
const pair = (coach: string, baseline: string): string => `${coach} / ${baseline}`;
const sessionOrDash = (session: number | null): string => session?.toString() ?? "-";

/** The Baseline run of the same Learner; a report without it is corrupt, not a Coach-only chart. */
export function baselineOf(coach: LearnerConvergence, baseline: readonly LearnerConvergence[]): LearnerConvergence {
  const run = baseline.find((l) => l.id === coach.id);
  if (!run) throw new Error(`the report has no Baseline run for ${coach.id}`);
  return run;
}

/**
 * "crossing ten: named after Session 3 · change unknown: not named", or
 * null when no weakness is planted.
 */
export function describeDetection(learner: LearnerHypotheses): string | null {
  if (learner.planted.length === 0) return null;
  return learner.planted
    .map((tag) => {
      const session = learner.sessionsToDetection[tag];
      return `${describeWeakness(tag)}: ${session ? `named after Session ${session}` : "not named"}`;
    })
    .join(" · ");
}

const describeSources = (s: PlanSources): string => `${s.coach} / ${s.retry} / ${s.baseline}`;

function convergenceRows(coach: readonly LearnerConvergence[], baseline: readonly LearnerConvergence[]): string[] {
  return table([
    ["Learner", ...SKILLS.map((s) => getSkill(s.id).name), "First-try", "In band"],
    ...coach.map((c) => {
      const b = baselineOf(c, baseline);
      return [
        c.name,
        ...SKILLS.map((s) => pair(sessionOrDash(c.sessionsToMastery[s.id]), sessionOrDash(b.sessionsToMastery[s.id]))),
        pair(pct(c.firstTryRate), pct(b.firstTryRate)),
        pair(pct(c.inBandShare), pct(b.inBandShare)),
      ];
    }),
  ]);
}

function hypothesisRows(learners: readonly LearnerHypotheses[]): string[] {
  return table([
    ["Learner", "Planted weakness: detected", "False positives", "Evidence Integrity", "Claim agreement", "Plans coach / retry / baseline"],
    ...learners.map((l) => [
      l.name,
      describeDetection(l) ?? "none planted",
      `${l.falsePositives} of ${l.supportedHypotheses} supported`,
      `${pct(l.evidence.integrity)} of ${l.evidence.citations} citations`,
      `${pct(l.evidence.claimAgreement)} of ${l.evidence.existing} that exist`,
      describeSources(l.sources),
    ]),
  ]);
}

function summaryLines(coach: SplitSummary, baseline: SplitSummary, hypotheses: HypothesisSplit): string[] {
  const detection = hypotheses.planted === 0
    ? "no weakness planted"
    : `${hypotheses.detected} of ${hypotheses.planted} planted weaknesses named (${rate(hypotheses.detectionRate, hypotheses.detectionRateInterval)})` +
      (hypotheses.meanSessionsToDetection === null ? "" : `, mean ${hypotheses.meanSessionsToDetection.toFixed(1)} Sessions to detection`);
  return [
    `Skills Mastered (mean) Coach / Baseline: ${coach.meanSkillsMastered.toFixed(2)} / ${baseline.meanSkillsMastered.toFixed(2)}`,
    `First-try (mean) Coach / Baseline: ${pct(coach.meanFirstTryRate)} / ${pct(baseline.meanFirstTryRate)}`,
    `In band (mean) Coach / Baseline: ${pct(coach.meanInBandShare)} / ${pct(baseline.meanInBandShare)}`,
    `Detection: ${detection}`,
    `False positives: ${hypotheses.falsePositives} of ${hypotheses.supportedHypotheses} supported Hypotheses (${rate(hypotheses.falsePositiveRate, hypotheses.falsePositiveRateInterval)})`,
    `Evidence Integrity: ${pct(hypotheses.evidenceIntegrity)} of ${hypotheses.citations} citations name a Problem in the Log (${ci(hypotheses.evidenceIntegrityInterval)})`,
    `Claim agreement: ${pct(hypotheses.claimAgreement)} of the ${hypotheses.existingCitations} citations that exist agree with their claim (${ci(hypotheses.claimAgreementInterval)})`,
    `Plans coach / retry / baseline: ${describeSources(hypotheses.sources)}`,
  ];
}

/** One split's section: the Learners the split lists, both planners side by side, the Hypothesis scores, the summary. */
function formatSplit(results: EvalResults, key: SplitKey): string {
  const { convergence, hypotheses } = results;
  const ids = hypotheses.splits[key].learners;
  const inSplit = <T extends { readonly id: SimulatedLearnerId }>(learners: readonly T[]) => learners.filter((l) => ids.includes(l.id));
  return [
    key === "heldOut" ? "Held-out Learners (never used to tune the Coach prompt)" : "Tuning Learners",
    "",
    "Sessions to Mastery per Skill, Coach / Baseline (- never)",
    ...convergenceRows(inSplit(convergence.coach.learners), inSplit(convergence.baseline.learners)),
    "",
    ...hypothesisRows(inSplit(hypotheses.learners)),
    "",
    ...summaryLines(convergence.coach.splits[key], convergence.baseline.splits[key], hypotheses.splits[key]),
  ].join("\n");
}

/** The validity lines both writers share: the sample, then each rate with the interval it is worth. */
function validityLines(validity: Validity): string[] {
  const reasons = validity.rejectionReasons.map((r) => `${r.reason} (${r.count})`).join("; ");
  return [
    `Valid on the first attempt: ${pct(validity.firstAttemptRate)} (${ci(validity.firstAttemptRateInterval)}); ` +
      `valid within the bounded attempts: ${pct(validity.validRate)} (${ci(validity.validRateInterval)}); template fallbacks: ${validity.templates}`,
    `Rejection reasons: ${reasons || "none"}`,
  ];
}

/**
 * The Judge's gate: what it agreed on and what that is worth, then how much
 * of the agreement is skill (kappa against the two trivial Judges), then the
 * score it earned or the condition that withheld it.
 */
function judgeLines(
  judge: { readonly name: string; readonly calibration: Calibration },
  noun: string,
  scoreName: string,
  score: { readonly judged: number; readonly passed: number; readonly passRate: number; readonly passRateInterval: Interval | null } | null,
): string[] {
  const { calibration } = judge;
  return [
    `Judge (${judge.name === "fake" ? "the fake Judge" : describeGeneration(judge.name)}): agreed with the Calibration Set on ` +
      `${calibration.agreements} of ${calibration.size} ${noun} (${rate(calibration.agreement, calibration.agreementInterval)}), threshold ${pct(calibration.threshold)}`,
    `Agreement beyond chance: kappa ${calibration.kappa.toFixed(2)}, floor ${calibration.kappaFloor.toFixed(2)} ` +
      `(an always-pass Judge would score ${pct(calibration.alwaysPassAgreement)}, an always-fail Judge ${pct(calibration.alwaysFailAgreement)})`,
    score
      ? `${scoreName}: ${score.passed} of ${score.judged} ${noun} pass (${rate(score.passRate, score.passRateInterval)})`
      : `${scoreName}: scores withheld — ${calibration.withheld}`,
  ];
}

/** The Story evals: validity over the sample, then the Judge, whose readability score is shown only when it cleared calibration. */
export function formatStories(stories: StoryReport): string {
  const { validity, judge } = stories;
  return [
    `Stories (${describeGeneration(stories.generation)}): ${validity.sample} written, one per Theme and Unit 3 structure, ${validity.attempts} attempts`,
    ...validityLines(validity),
    ...judgeLines(judge, "Stories", "Readability", judge.readability),
  ].join("\n");
}

/** The Parent Summary evals: validity, then the Judge, whose faithfulness score is shown only when it cleared calibration. */
export function formatSummaries(summaries: SummaryReport): string {
  const { validity, judge } = summaries;
  return [
    `Parent Summaries (${describeGeneration(summaries.generation)}): ${validity.sample} written, one for each Simulated Learner's last Session, ${validity.attempts} attempts`,
    ...validityLines(validity),
    ...judgeLines(judge, "Summaries", "Faithfulness", judge.faithfulness),
  ].join("\n");
}

/**
 * The Eval Run as text: the tuning Learners, then the held-out Learners in
 * their own section, each with convergence under the Coach and the Baseline
 * side by side, the Hypothesis scores, and the split's summary; then the
 * Stories and the Parent Summaries.
 */
export function formatEvalResults(results: EvalResults): string {
  const { min, max } = results.targetAccuracyBand;
  return [
    `Coach (${describeGeneration(results.coach.generation)}) vs Baseline, ${results.sessions} Sessions per Simulated Learner on identical seeds`,
    `In band: share of Problems whose true first-try chance is ${min} to ${max}. A planted weakness is detected when a supported Hypothesis names it.`,
    "",
    formatSplit(results, "tuning"),
    "",
    formatSplit(results, "heldOut"),
    "",
    formatStories(results.stories),
    "",
    formatSummaries(results.summaries),
  ].join("\n");
}
