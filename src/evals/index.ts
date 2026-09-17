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
export type { Split, SplitKey, Validity, WrittenTrace } from "./stats";
export { hypothesisReport, runEvals } from "./evals";
export type { EvalReport } from "./report";
export { describeGeneration, evalReport, EVALS_DIR, isReportFileName, reportFileName } from "./report";
export { renderConvergenceChart } from "./chart";
export {
  EVAL_CHARTS,
  renderDetectionChart,
  renderEvidenceIntegrityChart,
  renderFalsePositivesChart,
  renderPlanSourcesChart,
  renderStoryValidityChart,
  renderSummaryValidityChart,
} from "./charts";
export type { Calibrated, Calibration, CalibrationStory, CalibrationSummary, Judge, Judgement, StoryToJudge, SummaryToJudge } from "./judge";
export {
  calibrateJudge,
  fakeJudge,
  JUDGE_AGREEMENT_THRESHOLD,
  STORY_JUDGE_SYSTEM_PROMPT,
  storyJudgeUserMessage,
  SUMMARY_JUDGE_SYSTEM_PROMPT,
  summaryJudgeUserMessage,
} from "./judge";
export { STORY_CALIBRATION_SET, SUMMARY_CALIBRATION_SET } from "./calibration";
export type { StoryEvalOptions, StoryReadability, StoryReport, StoryTrace, StoryValidity } from "./stories";
export { runStoryEvals, storySample } from "./stories";
export type { SummaryEvalOptions, SummaryFaithfulness, SummaryReport, SummaryTrace } from "./summaries";
export { runSummaryEvals, summarySample } from "./summaries";
