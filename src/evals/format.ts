import { getSkill, SKILLS } from "@/loop";
import { table } from "@/loop/format";
import type { LearnerConvergence, SplitSummary } from "./convergence";
import type { EvalResults, HypothesisSplit } from "./evals";
import type { LearnerHypotheses, PlanSources } from "./hypotheses";
import { describeWeakness, type SimulatedLearnerId } from "./learners";
import { describeGeneration } from "./report";
import type { SplitKey } from "./stats";

export const pct = (share: number): string => `${Math.round(share * 100)}%`;

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
    ["Learner", "Planted weakness: detected", "False positives", "Evidence Integrity", "Plans coach / retry / baseline"],
    ...learners.map((l) => [
      l.name,
      describeDetection(l) ?? "none planted",
      `${l.falsePositives} of ${l.supportedHypotheses} supported`,
      `${pct(l.evidence.integrity)} of ${l.evidence.citations} citations`,
      describeSources(l.sources),
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
    formatSplit(results, "heldOut"),
  ].join("\n");
}
