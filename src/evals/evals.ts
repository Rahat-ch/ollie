/**
 * One Eval Run over the simulation: every Simulated Learner under the Coach
 * and under the Baseline on identical seeds, scored for convergence side by
 * side and, for the Coach, for its Hypotheses. The held-out Learners are
 * scored in their own split and are never used to tune the Coach prompt.
 * Pure over its inputs: on the fake the same options give the same results.
 */
import type { Generation } from "@/generation";
import { convergenceReport, mean, TARGET_ACCURACY_BAND, type ConvergenceReport } from "./convergence";
import { scoreHypotheses, type LearnerHypotheses, type PlanSources } from "./hypotheses";
import { SIMULATED_LEARNERS, type SimulatedLearnerId } from "./learners";
import { baselinePlanner, coachPlanner, runLearner, type LearnerRun, type SessionTrace } from "./run";

export type HypothesisSplit = {
  readonly split: "tuning" | "held-out";
  readonly learners: readonly SimulatedLearnerId[];
  /** Planted weaknesses across the split's Learners, and how many a supported Hypothesis named. */
  readonly planted: number;
  readonly detected: number;
  readonly detectionRate: number;
  /** Over the detected weaknesses; null when none was. */
  readonly meanSessionsToDetection: number | null;
  readonly supportedHypotheses: number;
  readonly falsePositives: number;
  readonly falsePositiveRate: number;
  readonly citations: number;
  readonly evidenceIntegrity: number;
  readonly sources: PlanSources;
};

export type HypothesisReport = {
  readonly learners: readonly LearnerHypotheses[];
  readonly splits: { readonly tuning: HypothesisSplit; readonly heldOut: HypothesisSplit };
};

export type EvalResults = {
  readonly sessions: number;
  readonly targetAccuracyBand: typeof TARGET_ACCURACY_BAND;
  /** Which Generation ran the Coach: the fake, or a model id. */
  readonly coach: { readonly generation: string };
  readonly convergence: { readonly baseline: ConvergenceReport; readonly coach: ConvergenceReport };
  readonly hypotheses: HypothesisReport;
};

export type EvalOptions = {
  readonly sessions: number;
  readonly generation: Generation;
  readonly generationName: string;
  /** Called after every Session of every Coach run, so a long run can show progress. */
  readonly onSession?: (run: { learner: SimulatedLearnerId; planner: "coach" }, trace: SessionTrace) => void;
};

const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);
const share = (hits: number, total: number): number => (total === 0 ? 0 : hits / total);

function summariseHypotheses(split: HypothesisSplit["split"], learners: readonly LearnerHypotheses[]): HypothesisSplit {
  const planted = sum(learners.map((l) => l.planted.length));
  const detected = sum(learners.map((l) => l.detected));
  const detections = learners.flatMap((l) =>
    Object.values(l.sessionsToDetection).filter((s): s is number => s !== null),
  );
  const supported = sum(learners.map((l) => l.supportedHypotheses));
  const falsePositives = sum(learners.map((l) => l.falsePositives));
  const citations = sum(learners.map((l) => l.evidence.citations));
  const bad = sum(learners.map((l) => l.evidence.unknownIds + l.evidence.inconsistent));
  return {
    split,
    learners: learners.map((l) => l.id),
    planted,
    detected,
    detectionRate: share(detected, planted),
    meanSessionsToDetection: detections.length === 0 ? null : mean(detections),
    supportedHypotheses: supported,
    falsePositives,
    falsePositiveRate: share(falsePositives, supported),
    citations,
    evidenceIntegrity: citations === 0 ? 1 : 1 - bad / citations,
    sources: {
      coach: sum(learners.map((l) => l.sources.coach)),
      retry: sum(learners.map((l) => l.sources.retry)),
      baseline: sum(learners.map((l) => l.sources.baseline)),
    },
  };
}

export function hypothesisReport(runs: readonly LearnerRun[]): HypothesisReport {
  const learners = runs.map(scoreHypotheses);
  return {
    learners,
    splits: {
      tuning: summariseHypotheses("tuning", learners.filter((l) => !l.heldOut)),
      heldOut: summariseHypotheses("held-out", learners.filter((l) => l.heldOut)),
    },
  };
}

/**
 * Run every Simulated Learner from a fresh Profile for `sessions` Sessions
 * under the Baseline and under the Coach on the same seed. The Coach runs
 * are concurrent across Learners (each Learner's Sessions are sequential),
 * so a real adapter finishes in the time of one Learner.
 */
export async function runEvals(options: EvalOptions): Promise<EvalResults> {
  const { sessions, generation, onSession } = options;
  const baseline = await Promise.all(SIMULATED_LEARNERS.map((learner) => runLearner(learner, baselinePlanner, sessions)));
  const coach = await Promise.all(
    SIMULATED_LEARNERS.map((learner) =>
      runLearner(learner, coachPlanner(generation), sessions, (trace) =>
        onSession?.({ learner: learner.id, planner: "coach" }, trace),
      ),
    ),
  );
  return {
    sessions,
    targetAccuracyBand: TARGET_ACCURACY_BAND,
    coach: { generation: options.generationName },
    convergence: {
      baseline: convergenceReport("baseline", baseline),
      coach: convergenceReport("coach", coach),
    },
    hypotheses: hypothesisReport(coach),
  };
}
