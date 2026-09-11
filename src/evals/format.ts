import { getSkill, SKILLS } from "@/loop";
import { table } from "@/loop/format";
import type { LearnerConvergence, SplitSummary } from "./convergence";
import type { EvalResults, HypothesisSplit } from "./evals";
import type { LearnerHypotheses } from "./hypotheses";
import { describeGeneration } from "./report";

export const pct = (share: number): string => `${Math.round(share * 100)}%`;

type Split = "tuning" | "held-out";

/** `C / B`: the Coach's number then the Baseline's, so the two planners read side by side. */
const pair = (coach: string, baseline: string): string => `${coach} / ${baseline}`;
const sessionOrDash = (session: number | null): string => session?.toString() ?? "-";

function convergenceRows(coach: readonly LearnerConvergence[], baseline: readonly LearnerConvergence[]): string[] {
  return table([
    ["Learner", ...SKILLS.map((s) => getSkill(s.id).name), "First-try", "In band"],
    ...coach.map((c) => {
      const b = baseline.find((l) => l.id === c.id) ?? c;
      return [
        c.name,
        ...SKILLS.map((s) => pair(sessionOrDash(c.sessionsToMastery[s.id]), sessionOrDash(b.sessionsToMastery[s.id]))),
        pair(pct(c.firstTryRate), pct(b.firstTryRate)),
        pair(pct(c.inBandShare), pct(b.inBandShare)),
      ];
    }),
  ]);
}

const detection = (l: LearnerHypotheses): string =>
  l.planted.length === 0
    ? "none planted"
    : l.planted.map((tag) => `${tag}: ${l.sessionsToDetection[tag] ? `Session ${l.sessionsToDetection[tag]}` : "not named"}`).join("; ");

const sources = (s: { coach: number; retry: number; baseline: number }): string =>
  `${s.coach} / ${s.retry} / ${s.baseline}`;

function hypothesisRows(learners: readonly LearnerHypotheses[]): string[] {
  return table([
    ["Learner", "Planted weakness: detected", "False positives", "Evidence Integrity", "Plans coach / retry / baseline"],
    ...learners.map((l) => [
      l.name,
      detection(l),
      `${l.falsePositives} of ${l.supportedHypotheses} supported`,
      `${pct(l.evidence.integrity)} of ${l.evidence.citations} citations`,
      sources(l.sources),
    ]),
  ]);
}

function summaryLines(coach: SplitSummary, baseline: SplitSummary, hypotheses: HypothesisSplit): string[] {
  const detection = hypotheses.planted === 0
    ? "no weakness planted"
    : `${hypotheses.detected} of ${hypotheses.planted} planted weaknesses named (${pct(hypotheses.detectionRate)})` +
      (hypotheses.meanSessionsToDetection === null ? "" : `, mean ${hypotheses.meanSessionsToDetection.toFixed(1)} Sessions to detection`);
  return [
    `Skills Mastered (mean) Coach / Baseline: ${coach.meanSkillsMastered.toFixed(2)} / ${baseline.meanSkillsMastered.toFixed(2)}`,
    `First-try (mean) Coach / Baseline: ${pct(coach.meanFirstTryRate)} / ${pct(baseline.meanFirstTryRate)}`,
    `In band (mean) Coach / Baseline: ${pct(coach.meanInBandShare)} / ${pct(baseline.meanInBandShare)}`,
    `Detection: ${detection}`,
    `False positives: ${hypotheses.falsePositives} of ${hypotheses.supportedHypotheses} supported Hypotheses (${pct(hypotheses.falsePositiveRate)})`,
    `Evidence Integrity: ${pct(hypotheses.evidenceIntegrity)} of ${hypotheses.citations} citations`,
    `Plans coach / retry / baseline: ${sources(hypotheses.sources)}`,
  ];
}

function formatSplit(results: EvalResults, split: Split): string {
  const key = split === "tuning" ? "tuning" : "heldOut";
  const heldOut = split === "held-out";
  const coach = results.convergence.coach.learners.filter((l) => l.heldOut === heldOut);
  const baseline = results.convergence.baseline.learners.filter((l) => l.heldOut === heldOut);
  const hypotheses = results.hypotheses.learners.filter((l) => l.heldOut === heldOut);
  return [
    heldOut ? "Held-out Learners (never used to tune the Coach prompt)" : "Tuning Learners",
    "",
    "Sessions to Mastery per Skill, Coach / Baseline (- never)",
    ...convergenceRows(coach, baseline),
    "",
    ...hypothesisRows(hypotheses),
    "",
    ...summaryLines(results.convergence.coach.splits[key], results.convergence.baseline.splits[key], results.hypotheses.splits[key]),
  ].join("\n");
}

/**
 * The Eval Run as text: the tuning Learners, then the held-out Learners in
 * their own section, each with convergence under the Coach and the Baseline
 * side by side, the Hypothesis scores, and the split's summary.
 */
export function formatEvalResults(results: EvalResults): string {
  const { min, max } = results.targetAccuracyBand;
  return [
    `Coach (${describeGeneration(results.coach.generation)}) vs Baseline, ${results.sessions} Sessions per Simulated Learner on identical seeds`,
    `In band: share of Problems whose true first-try chance is ${min} to ${max}. A planted weakness is detected when a supported Hypothesis names it.`,
    "",
    formatSplit(results, "tuning"),
    "",
    formatSplit(results, "held-out"),
  ].join("\n");
}
