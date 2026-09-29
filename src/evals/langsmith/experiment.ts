/**
 * An Eval Run as a LangSmith experiment, in pure functions: the dataset of
 * Simulated Learners, what each Learner's run returns (read from the
 * report, never from a live call), and the evaluators, which are the
 * report's own numbers handed over under a feedback key. Nothing here
 * scores anything afresh: every number an evaluator returns is one the
 * JSON report already holds, so the committed report stays the record and
 * LangSmith is only the view of it (decision 21, ADR 0002).
 *
 * Only types come from `langsmith` here; the module that talks to it is
 * `./publish.ts`, and the eval command loads that only when tracing is on.
 */
import type { EvaluationResult } from "langsmith/evaluation";
import type { ComparisonEvaluationResult, ExampleCreate, Run } from "langsmith/schemas";
import type { EvalReport } from "../report";
import { SIMULATED_LEARNERS, type SimulatedLearnerId } from "../learners";

/**
 * The dataset every experiment runs over: one Example per Simulated
 * Learner. Change the name when the Learners change (ticket 18), so an
 * experiment is never compared with one run on different children.
 */
export const DATASET_NAME = "ollie-simulated-learners-v1";

export const DATASET_DESCRIPTION =
  "The six Simulated Learners of src/evals/learners.ts, one Example each: every Eval Run plays each of them for its Sessions under the Coach and the Baseline on the Learner's seed. Simulated Learners only; never a real child's data.";

/** What an Example is given: which Learner, on which seed, in which split. */
export type LearnerExampleInputs = {
  readonly learner: SimulatedLearnerId;
  readonly name: string;
  readonly seed: string;
  readonly heldOut: boolean;
};

/** One Example per Simulated Learner, its planted weaknesses as the reference output. */
export function learnerExamples(): (ExampleCreate & { inputs: LearnerExampleInputs })[] {
  return SIMULATED_LEARNERS.map((learner) => ({
    inputs: { learner: learner.id, name: learner.name, seed: learner.seed, heldOut: learner.heldOut },
    outputs: { planted: [...learner.weaknesses] },
    split: learner.heldOut ? "held-out" : "tuning",
  }));
}

/** Where a run came from: a stored report replayed, or the run `pnpm eval` has just written. */
export type RunSource = "replay" | "live";

/**
 * What one Learner's run returns in the experiment: the Learner's lines of
 * the report, compact. The Notes the Coach wrote are left in the report;
 * the experiment carries the numbers.
 */
export type LearnerOutputs = {
  readonly report: string;
  readonly arm: string;
  readonly source: RunSource;
  readonly learner: SimulatedLearnerId;
  readonly sessions: number;
  readonly planted: readonly string[];
  readonly sessionsToDetection: Readonly<Record<string, number | null>>;
  readonly detected: number;
  readonly supportedHypotheses: number;
  readonly falsePositives: number;
  readonly falsePositiveRate: number;
  readonly citations: number;
  readonly unknownIds: number;
  readonly inconsistent: number;
  readonly evidenceIntegrity: number;
  /** Absent from reports written before claim agreement was split out (2026-09-18T02-12-15Z). */
  readonly claimAgreement: number | null;
  readonly sources: { readonly coach: number; readonly retry: number; readonly baseline: number };
  /** Skills Mastered by the last Session, and the rates, under each planner. */
  readonly convergence: {
    readonly coach: PlannerConvergence;
    readonly baseline: PlannerConvergence;
  };
  /** The Parent Summary written after the Learner's last Coach Session; null when the report has none for it. */
  readonly summary: { readonly source: string; readonly rejections: number; readonly judgedPass: boolean | null } | null;
};

export type PlannerConvergence = {
  readonly skillsMastered: number;
  readonly firstTryRate: number;
  readonly inBandShare: number;
};

/** A report's number, or null when the report was written before the field existed. */
const numberOrNull = (value: unknown): number | null => (typeof value === "number" ? value : null);

function plannerConvergence(report: EvalReport, planner: "coach" | "baseline", learner: SimulatedLearnerId): PlannerConvergence {
  const found = report.convergence[planner].learners.find((l) => l.id === learner);
  if (!found) throw new Error(`The report has no ${planner} convergence for ${learner}`);
  return {
    skillsMastered: found.perSession[found.perSession.length - 1]?.mastered ?? 0,
    firstTryRate: found.firstTryRate,
    inBandShare: found.inBandShare,
  };
}

/**
 * The Learner's lines of a report. The Summaries are written one per
 * Learner in the Learners' order (`summarySample`), so the Learner's is
 * found by its place; a report with a different count has none per Learner.
 */
export function learnerOutputs(
  report: EvalReport,
  learner: SimulatedLearnerId,
  run: { readonly report: string; readonly arm: string; readonly source: RunSource },
): LearnerOutputs {
  const index = report.hypotheses.learners.findIndex((l) => l.id === learner);
  const hypotheses = report.hypotheses.learners[index];
  if (!hypotheses) throw new Error(`${run.report} has no Hypotheses for ${learner}`);
  const summaries = report.summaries?.summaries ?? [];
  const summary = summaries.length === report.hypotheses.learners.length ? summaries[index] : undefined;
  return {
    ...run,
    learner,
    sessions: report.sessions,
    planted: hypotheses.planted,
    sessionsToDetection: Object.fromEntries(Object.entries(hypotheses.sessionsToDetection).map(([tag, session]) => [tag, session ?? null])),
    detected: hypotheses.detected,
    supportedHypotheses: hypotheses.supportedHypotheses,
    falsePositives: hypotheses.falsePositives,
    falsePositiveRate: hypotheses.falsePositiveRate,
    citations: hypotheses.evidence.citations,
    unknownIds: hypotheses.evidence.unknownIds,
    inconsistent: hypotheses.evidence.inconsistent,
    evidenceIntegrity: hypotheses.evidence.integrity,
    claimAgreement: numberOrNull(hypotheses.evidence.claimAgreement),
    sources: { coach: hypotheses.sources.coach, retry: hypotheses.sources.retry, baseline: hypotheses.sources.baseline },
    convergence: {
      coach: plannerConvergence(report, "coach", learner),
      baseline: plannerConvergence(report, "baseline", learner),
    },
    summary: summary
      ? { source: summary.source, rejections: summary.rejections.length, judgedPass: summary.judged?.pass ?? null }
      : null,
  };
}

/** Every Learner in a report must be one of the dataset's, or the experiment would compare different children. */
export function checkReportLearners(report: EvalReport, file: string): void {
  const dataset = SIMULATED_LEARNERS.map((l) => l.id).join(", ");
  const reported = report.hypotheses.learners.map((l) => l.id).join(", ");
  if (dataset !== reported) {
    throw new Error(`${file} was run on the Learners ${reported}, not the dataset's ${dataset}; give it a dataset of its own`);
  }
  for (const learner of report.hypotheses.learners) {
    const planted = SIMULATED_LEARNERS.find((l) => l.id === learner.id)?.weaknesses.join(",");
    if (planted !== learner.planted.join(",")) {
      throw new Error(`${file} plants ${learner.planted.join(",") || "nothing"} in ${learner.id}, the dataset ${planted || "nothing"}`);
    }
  }
}

type Evaluated = { readonly outputs: Record<string, unknown> };

/** The evaluators receive what the target returned, which is a LearnerOutputs. */
const learner = ({ outputs }: Evaluated): LearnerOutputs => outputs as unknown as LearnerOutputs;

const plural = (n: number, one: string, many = `${one}s`): string => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/**
 * Evidence Integrity and claim agreement, as `scoreHypotheses` computed them
 * for this Learner: the fabrication metric and, over the citations that
 * exist, the reading one.
 */
export function evidenceEvaluator(args: Evaluated): EvaluationResult[] {
  const out = learner(args);
  const existing = out.citations - out.unknownIds;
  const results: EvaluationResult[] = [
    {
      key: "evidence_integrity",
      score: out.evidenceIntegrity,
      comment: `${plural(existing, "citation")} of ${out.citations.toLocaleString("en-US")} name a Problem in the Log; ${plural(out.unknownIds, "unknown Problem ID")}`,
    },
  ];
  if (out.claimAgreement !== null) {
    results.push({
      key: "claim_agreement",
      score: out.claimAgreement,
      comment: `${(existing - out.inconsistent).toLocaleString("en-US")} of ${plural(existing, "existing citation")} agree with their claim`,
    });
  }
  return results;
}

/** Where each of the Learner's Plans came from: the Coach, the Coach after its one retry, or the Baseline fallback. */
export function planSourcesEvaluator(args: Evaluated): EvaluationResult[] {
  const { sources } = learner(args);
  return [
    { key: "plans_from_coach", score: sources.coach },
    { key: "plans_after_retry", score: sources.retry },
    { key: "plans_from_baseline", score: sources.baseline },
  ];
}

/**
 * Detection and false positives as the report scored them: the Session
 * after which a supported Hypothesis first named each planted weakness
 * (no score, and the value `never`, when none did), and the supported
 * Hypotheses naming a weakness the Learner does not have.
 */
export function namingEvaluator(args: Evaluated): EvaluationResult[] {
  const out = learner(args);
  const detection: EvaluationResult[] = out.planted.map((tag) => {
    const session = out.sessionsToDetection[tag] ?? null;
    return session === null
      ? { key: `sessions_to_detection_${tag.replace(/-/g, "_")}`, value: "never", comment: `no supported Hypothesis named ${tag} in ${out.sessions} Sessions` }
      : { key: `sessions_to_detection_${tag.replace(/-/g, "_")}`, score: session };
  });
  return [
    ...detection,
    { key: "weaknesses_detected", score: out.detected, comment: `${out.detected} of ${out.planted.length} planted` },
    { key: "false_positives", score: out.falsePositives, comment: `of ${plural(out.supportedHypotheses, "supported Hypothesis", "supported Hypotheses")}` },
    { key: "false_positive_rate", score: out.falsePositiveRate },
  ];
}

/** Skills Mastered by the last Session, Coach and Baseline on the same seed, with the first-try rate and the share in the target band. */
export function convergenceEvaluator(args: Evaluated): EvaluationResult[] {
  const { convergence } = learner(args);
  return [
    { key: "skills_mastered", score: convergence.coach.skillsMastered },
    { key: "skills_mastered_baseline", score: convergence.baseline.skillsMastered },
    { key: "first_try_rate", score: convergence.coach.firstTryRate },
    { key: "in_band_share", score: convergence.coach.inBandShare },
  ];
}

/**
 * The Learner's Parent Summary: accepted on the model's first attempt, or
 * the template. The Judge's verdict is not given per Learner; whether it
 * counts depends on the gate, which is the run's (`judgeGateEvaluator`).
 */
export function summaryEvaluator(args: Evaluated): EvaluationResult[] {
  const { summary } = learner(args);
  if (summary === null) return [];
  return [
    { key: "summary_valid_first_attempt", score: summary.source === "summary" && summary.rejections === 0 },
    { key: "summary_template", score: summary.source === "template" },
  ];
}

/** Every per-Learner evaluator, in the order the report prints them. */
export const LEARNER_EVALUATORS = [evidenceEvaluator, planSourcesEvaluator, namingEvaluator, convergenceEvaluator, summaryEvaluator] as const;

/** A rate the report gives with its interval: the rate as the score, the interval in the comment. */
function rate(key: string, value: number | undefined, interval?: { lower: number; upper: number } | null): EvaluationResult | null {
  if (typeof value !== "number") return null;
  return { key, score: value, ...(interval ? { comment: `95% interval ${interval.lower.toFixed(3)} to ${interval.upper.toFixed(3)}` } : {}) };
}

/**
 * The Judge's gate for one Calibration Set: its agreement and kappa, and
 * the score it guards, reported as a number only when the gate opened. A
 * withheld score is never a number here either: it is the value
 * `withheld`, with the condition that failed.
 */
function judgeGate(
  prefix: "story" | "summary",
  scoreKey: string,
  judge: { calibration: { agreement: number; agreementInterval?: { lower: number; upper: number } | null; kappa?: number; passes: boolean; withheld?: string | null } },
  score: { passRate: number; passRateInterval?: { lower: number; upper: number } | null; passed: number; judged: number } | null,
): EvaluationResult[] {
  const { calibration } = judge;
  const results: EvaluationResult[] = [];
  const agreement = rate(`${prefix}_judge_agreement`, calibration.agreement, calibration.agreementInterval);
  if (agreement) results.push(agreement);
  if (typeof calibration.kappa === "number") results.push({ key: `${prefix}_judge_kappa`, score: calibration.kappa });
  results.push({ key: `${prefix}_judge_gate`, score: calibration.passes, value: calibration.passes ? "open" : "withheld", comment: calibration.withheld ?? undefined });
  results.push(
    score === null
      ? { key: scoreKey, value: "withheld", comment: calibration.withheld ?? "the Judge did not clear the Calibration Set" }
      : { ...rate(scoreKey, score.passRate, score.passRateInterval)!, comment: `${score.passed} of ${score.judged}` },
  );
  return results;
}

/**
 * The run's own numbers, which belong to no one Learner: each split's
 * Evidence Integrity, claim agreement, detection and false positives; Story
 * and Summary validity; the Judge's gate and the scores it guards; and the
 * run's measured cost. Every one is read from the report as written.
 */
export function runEvaluator(report: EvalReport): () => EvaluationResult[] {
  return function reportedRun(): EvaluationResult[] {
    const results: (EvaluationResult | null)[] = [];
    for (const [splitKey, split] of [["tuning", report.hypotheses.splits.tuning], ["held_out", report.hypotheses.splits.heldOut]] as const) {
      results.push(
        rate(`evidence_integrity_${splitKey}`, split.evidenceIntegrity, split.evidenceIntegrityInterval),
        rate(`claim_agreement_${splitKey}`, split.claimAgreement, split.claimAgreementInterval),
        rate(`detection_rate_${splitKey}`, split.detectionRate, split.detectionRateInterval),
        rate(`false_positive_rate_${splitKey}`, split.falsePositiveRate, split.falsePositiveRateInterval),
      );
    }
    const stories = report.stories;
    if (stories) {
      results.push(
        rate("story_valid_first_attempt_rate", stories.validity.firstAttemptRate, stories.validity.firstAttemptRateInterval),
        rate("story_valid_rate", stories.validity.validRate, stories.validity.validRateInterval),
        { key: "story_templates", score: stories.validity.templates },
        ...judgeGate("story", "story_readability", stories.judge, stories.judge.readability),
      );
    }
    const summaries = report.summaries;
    if (summaries) {
      results.push(
        rate("summary_valid_first_attempt_rate", summaries.validity.firstAttemptRate, summaries.validity.firstAttemptRateInterval),
        rate("summary_valid_rate", summaries.validity.validRate, summaries.validity.validRateInterval),
        { key: "summary_templates", score: summaries.validity.templates },
        ...judgeGate("summary", "summary_faithfulness", summaries.judge, summaries.judge.faithfulness),
      );
    }
    const telemetry = report.telemetry;
    if (telemetry) {
      results.push(
        { key: "cost_dollars", score: telemetry.total.dollars, comment: `${telemetry.total.calls} calls, ${telemetry.total.tokens.toLocaleString("en-US")} tokens; an estimate at published rates, not the invoice` },
        { key: "coach_dollars_per_session", score: telemetry.perSession.dollarsPerSession },
      );
      const p95 = telemetry.latency?.coach.p95Ms;
      if (typeof p95 === "number") results.push({ key: "coach_p95_ms", score: p95 });
    }
    return results.filter((r): r is EvaluationResult => r !== null);
  };
}

/** How the experiment names itself and what it records about the run. */
export function experimentMetadata(report: EvalReport, run: { readonly report: string; readonly arm: string; readonly source: RunSource }) {
  return {
    report: run.report,
    arm: run.arm,
    source: run.source,
    generatedAt: report.generatedAt,
    sessions: report.sessions,
    coach: report.coach.generation,
    stories: report.stories?.generation ?? null,
    summaries: report.summaries?.generation ?? null,
    judge: report.stories?.judge.name ?? null,
    dollars: report.telemetry?.total.dollars ?? null,
  };
}

/** `claude-opus-5-2026-09-18T19-09-56Z`: the Arm and the report's own name, which is its UTC time. */
export const experimentPrefix = (arm: string, report: string): string => `${arm}-${report.replace(/\.json$/, "")}`;

// The comparison of two Arms.

type Compared = { readonly runs: Run[] };

/**
 * For each run, the share of the other Arm's runs on the same Learner that
 * it beats, a tie counting half: the probability that a draw from this Arm
 * does better than a draw from the other. With one run per Arm it is 1, 0
 * or 0.5, a plain preference. `better` returns which of two values wins,
 * or 0 for a tie; a run with no value for the metric gets no score, and
 * neither is it counted against the other Arm.
 */
export function superiority(
  key: string,
  value: (out: LearnerOutputs) => number | null,
  better: (a: number, b: number) => number,
): (args: Compared) => ComparisonEvaluationResult {
  const evaluator = ({ runs }: Compared): ComparisonEvaluationResult => {
    const scored = runs
      .map((run) => ({ run, out: run.outputs as unknown as LearnerOutputs | undefined }))
      .flatMap(({ run, out }) => {
        const v = out ? value(out) : null;
        return out && v !== null ? [{ id: run.id, arm: out.arm, value: v }] : [];
      });
    const scores: Record<string, number> = {};
    for (const a of scored) {
      const others = scored.filter((b) => b.arm !== a.arm);
      if (others.length === 0) continue;
      const wins = others.reduce((sum, b) => sum + (better(a.value, b.value) > 0 ? 1 : better(a.value, b.value) === 0 ? 0.5 : 0), 0);
      scores[a.id] = wins / others.length;
    }
    return { key, scores };
  };
  Object.defineProperty(evaluator, "name", { value: key });
  return evaluator;
}

const higher = (a: number, b: number): number => Math.sign(a - b);
const lower = (a: number, b: number): number => Math.sign(b - a);

/** The Session a weakness was first named in, or past the run's end when it never was, so a detection beats a miss. */
const detectionSession = (out: LearnerOutputs): number | null => {
  if (out.planted.length === 0) return null;
  return Math.max(...out.planted.map((tag) => out.sessionsToDetection[tag] ?? out.sessions + 1));
};

/**
 * The Opus-against-Sonnet questions, per Learner: which Arm's runs name
 * fewer false positives, keep more citations real and agreeing, name the
 * planted weakness sooner, and reach more Skills Mastered. The
 * Pre-registration decides pass or fail from the JSON reports; this is the
 * side-by-side view of the same numbers.
 */
export const COMPARATIVE_EVALUATORS = [
  superiority("fewer_false_positives", (out) => out.falsePositiveRate, lower),
  superiority("higher_evidence_integrity", (out) => out.evidenceIntegrity, higher),
  superiority("higher_claim_agreement", (out) => out.claimAgreement, higher),
  superiority("earlier_detection", detectionSession, lower),
  superiority("more_skills_mastered", (out) => out.convergence.coach.skillsMastered, higher),
] as const;
