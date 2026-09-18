/**
 * One Eval Run: every Simulated Learner under the Coach and under the
 * Baseline on identical seeds, scored for convergence side by side and, for
 * the Coach, for its Hypotheses; the Story evals, validity and Judge
 * readability, over a fixed sample of Problems; and the Parent Summary
 * evals, validity and Judge faithfulness, over the Coach run's own
 * Sessions. The held-out Learners are
 * scored in their own split and are never used to tune the Coach prompt.
 * Pure over its inputs: on the fake the same options give the same results.
 */
import { telemetrySection, type Recorder, type TelemetrySection } from "@/generation/telemetry";
import type { Generation } from "@/generation";
import { convergenceReport, TARGET_ACCURACY_BAND, type ConvergenceReport } from "./convergence";
import { evidenceIntegrity, scoreHypotheses, type LearnerHypotheses, type PlanSources } from "./hypotheses";
import { SIMULATED_LEARNERS, type SimulatedLearnerId } from "./learners";
import { baselinePlanner, coachPlanner, runLearner, type LearnerRun, type SessionTrace } from "./run";
import { mean, share, summariseSplits, wilsonInterval, type Interval, type Split } from "./stats";
import { runStoryEvals, type StoryEvalOptions, type StoryReport } from "./stories";
import { runSummaryEvals, summarySample, type SummaryEvalOptions, type SummaryReport } from "./summaries";

export type HypothesisSplit = {
  readonly split: Split;
  readonly learners: readonly SimulatedLearnerId[];
  /** Planted weaknesses across the split's Learners, and how many a supported Hypothesis named. */
  readonly planted: number;
  readonly detected: number;
  readonly detectionRate: number;
  /** What the planted weaknesses support for that share; null when none was planted. */
  readonly detectionRateInterval: Interval | null;
  /** Over the detected weaknesses; null when none was. */
  readonly meanSessionsToDetection: number | null;
  readonly supportedHypotheses: number;
  readonly falsePositives: number;
  readonly falsePositiveRate: number;
  readonly falsePositiveRateInterval: Interval | null;
  readonly citations: number;
  readonly unknownIds: number;
  readonly inconsistent: number;
  /** The citations whose Problem ID is in the Log, which claim agreement is taken over. */
  readonly existingCitations: number;
  /** Citations naming a Problem in the Log, over all citations: the fabrication metric. */
  readonly evidenceIntegrity: number;
  readonly evidenceIntegrityInterval: Interval | null;
  /** Of the citations that exist, the share agreeing with their claim. */
  readonly claimAgreement: number;
  readonly claimAgreementInterval: Interval | null;
  readonly sources: PlanSources;
};

/** The Coach run scored for its Hypotheses: per Learner, then per split. */
export type HypothesisReport = {
  readonly learners: readonly LearnerHypotheses[];
  readonly splits: { readonly tuning: HypothesisSplit; readonly heldOut: HypothesisSplit };
};

/** What one Eval Run scored: both planners' convergence, the Coach's Hypotheses, the Stories, and the Parent Summaries. */
export type EvalResults = {
  readonly sessions: number;
  readonly targetAccuracyBand: typeof TARGET_ACCURACY_BAND;
  /** Which Generation ran the Coach: `fake`, or a model id. */
  readonly coach: { readonly generation: string };
  readonly convergence: { readonly baseline: ConvergenceReport; readonly coach: ConvergenceReport };
  readonly hypotheses: HypothesisReport;
  readonly stories: StoryReport;
  readonly summaries: SummaryReport;
  /** What the run's model calls used and are estimated to have cost. Zero throughout on the fake. */
  readonly telemetry: TelemetrySection;
};

/** The Generation the Coach runs on and the name the report records for it. */
export type CoachGeneration = {
  readonly generation: Generation;
  /** `fake`, or the model id. */
  readonly name: string;
};

export type EvalOptions = {
  readonly sessions: number;
  readonly coach: CoachGeneration;
  /** The Story writer and the Judge, with the names the report records for them. */
  readonly stories: Omit<StoryEvalOptions, "sample" | "concurrency">;
  /** The Parent Summary writer and the Judge; the sample is the Coach run's own Sessions. */
  readonly summaries: Omit<SummaryEvalOptions, "sample" | "concurrency">;
  /**
   * Where the adapters report every model call. The run reads it once at the
   * end for the report's telemetry section; without one that section is
   * empty rather than absent.
   */
  readonly recorder?: Recorder;
  /** Called after every Session of every Coach run, so a long run can show progress. */
  readonly onSession?: (learner: SimulatedLearnerId, trace: SessionTrace) => void;
};

const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);

function summariseHypotheses(split: Split, learners: readonly LearnerHypotheses[]): HypothesisSplit {
  const planted = sum(learners.map((l) => l.planted.length));
  const detected = sum(learners.map((l) => l.detected));
  const detections = learners.flatMap((l) =>
    Object.values(l.sessionsToDetection).filter((s): s is number => s !== null),
  );
  const supported = sum(learners.map((l) => l.supportedHypotheses));
  const falsePositives = sum(learners.map((l) => l.falsePositives));
  const evidence = evidenceIntegrity({
    citations: sum(learners.map((l) => l.evidence.citations)),
    unknownIds: sum(learners.map((l) => l.evidence.unknownIds)),
    inconsistent: sum(learners.map((l) => l.evidence.inconsistent)),
  });
  return {
    split,
    learners: learners.map((l) => l.id),
    planted,
    detected,
    detectionRate: share(detected, planted),
    detectionRateInterval: wilsonInterval(detected, planted),
    meanSessionsToDetection: detections.length === 0 ? null : mean(detections),
    supportedHypotheses: supported,
    falsePositives,
    falsePositiveRate: share(falsePositives, supported),
    falsePositiveRateInterval: wilsonInterval(falsePositives, supported),
    citations: evidence.citations,
    unknownIds: evidence.unknownIds,
    inconsistent: evidence.inconsistent,
    existingCitations: evidence.existing,
    evidenceIntegrity: evidence.integrity,
    evidenceIntegrityInterval: evidence.integrityInterval,
    claimAgreement: evidence.claimAgreement,
    claimAgreementInterval: evidence.claimAgreementInterval,
    sources: {
      coach: sum(learners.map((l) => l.sources.coach)),
      retry: sum(learners.map((l) => l.sources.retry)),
      baseline: sum(learners.map((l) => l.sources.baseline)),
    },
  };
}

/** The Hypothesis scores of every Coach run, with the two splits scored separately. */
export function hypothesisReport(runs: readonly LearnerRun[]): HypothesisReport {
  const learners = runs.map(scoreHypotheses);
  return { learners, splits: summariseSplits(learners, summariseHypotheses) };
}

/**
 * Run every Simulated Learner from a fresh Profile for `sessions` Sessions
 * under the Baseline and under the Coach on the same seed. The Coach runs
 * are concurrent across Learners (each Learner's Sessions are sequential),
 * so a real adapter finishes in the time of one Learner.
 */
export async function runEvals(options: EvalOptions): Promise<EvalResults> {
  const { sessions, coach, onSession } = options;
  const baseline = await Promise.all(SIMULATED_LEARNERS.map((learner) => runLearner(learner, baselinePlanner, sessions)));
  const storiesPromise = runStoryEvals(options.stories);
  const coached = await Promise.all(
    SIMULATED_LEARNERS.map((learner) =>
      runLearner(learner, coachPlanner(coach.generation), sessions, (trace) => onSession?.(learner.id, trace)),
    ),
  );
  const stories = await storiesPromise;
  const summaries = await runSummaryEvals({ ...options.summaries, sample: summarySample(coached) });
  return {
    sessions,
    targetAccuracyBand: TARGET_ACCURACY_BAND,
    coach: { generation: coach.name },
    convergence: {
      baseline: convergenceReport("baseline", baseline),
      coach: convergenceReport("coach", coached),
    },
    hypotheses: hypothesisReport(coached),
    stories,
    summaries,
    // Read last, so every call the run made is in it.
    telemetry: telemetrySection(options.recorder?.calls() ?? [], sessions * SIMULATED_LEARNERS.length),
  };
}
