export type { FatigueCurve, SimulatedLearner, SimulatedLearnerId, WeaknessTag } from "./learners";
export {
  describeWeakness,
  firstTryProbability,
  getSimulatedLearner,
  matchesWeakness,
  SIMULATED_LEARNERS,
  simulatedLearner,
  WEAKNESS_PENALTY,
} from "./learners";
export type { LearnerRun, Planner, PlannerId, SessionTrace } from "./run";
export { baselinePlanner, coachPlanner, runLearner } from "./run";
export type { ConvergenceReport, LearnerConvergence, SessionPoint, SplitSummary } from "./convergence";
export { convergenceReport, scoreConvergence, TARGET_ACCURACY_BAND } from "./convergence";
export type { CitationCheck, CitationVerdict, ClaimPolarity, EvidenceIntegrity, LearnerHypotheses, PlanSources } from "./hypotheses";
export { checkEvidence, claimPolarity, namesWeakness, scoreHypotheses } from "./hypotheses";
export type { CoachGeneration, EvalOptions, EvalResults, HypothesisReport, HypothesisSplit } from "./evals";
export type { Split, SplitKey } from "./stats";
export { hypothesisReport, runEvals } from "./evals";
export type { EvalReport } from "./report";
export { describeGeneration, evalReport, EVALS_DIR, isReportFileName, reportFileName } from "./report";
export { renderConvergenceChart } from "./chart";
