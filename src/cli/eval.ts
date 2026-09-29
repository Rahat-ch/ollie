/**
 * The eval command: run every Simulated Learner for 20 Sessions under the
 * Coach and under the Baseline on identical seeds, score convergence side
 * by side and the Coach's Hypotheses (detection of planted weaknesses,
 * false positives, Evidence Integrity); write a Story per Theme and Unit 3
 * structure and score validity and, once the Judge clears the Calibration
 * Set, readability; write a Parent Summary for each Learner's last Session
 * and score validity and, once the Judge clears the Calibration Set,
 * faithfulness; write a dated JSON report under docs/evals, and
 * regenerate every chart from that file. Run it before any prompt
 * or Plan Space change so the numbers can be compared.
 *
 *   pnpm eval                 # Sonnet 5.5 Coach, Summary, Stories and Judge; needs ANTHROPIC_API_KEY
 *   pnpm eval --fake          # the Generation fake and the fake Judge; no network
 *   pnpm eval --sessions 10
 *
 * The real adapters read ANTHROPIC_API_KEY from the environment, or from
 * .env.local at the repo root when that file exists.
 *
 * With LANGSMITH_TRACING=true and LANGSMITH_API_KEY set (in the shell or
 * .env.local), the run's model calls are traced to LangSmith and the report
 * it writes becomes an experiment there (docs/evals/README.md, "LangSmith").
 * Without both, LangSmith is never loaded. Never set in production (ADR 0002).
 */
import path from "node:path";
import { parseArgs } from "node:util";
import { EVAL_RUN_ACCESS, runEvals } from "@/evals/evals";
import { readReport, writeCharts, writeReport } from "@/evals/files";
import { tracingDecision } from "@/evals/langsmith/tracing-config";
import { readLabelFiles } from "@/evals/label-files";
import { formatEvalResults } from "@/evals/format";
import { describeGeneration, evalReport } from "@/evals/report";
import { createRecorder } from "@/generation/telemetry";
import { formatSessionLine } from "@/loop/format";
import { chooseGeneration, chooseJudge, cliEnv } from "./generation";

const { values } = parseArgs({
  options: {
    sessions: { type: "string", default: "20" },
    fake: { type: "boolean", default: false },
  },
});

const sessions = Number(values.sessions);
if (!Number.isInteger(sessions) || sessions < 1) {
  console.error(`--sessions must be a positive integer, got "${values.sessions}"`);
  process.exit(1);
}

async function main(): Promise<void> {
  const mode = values.fake ? "fake" : "real";
  // LangSmith is loaded only when both LANGSMITH_TRACING and LANGSMITH_API_KEY
  // are set; otherwise the run is exactly what it was before tracing existed.
  const tracing = tracingDecision(cliEnv());
  if (!tracing.on && tracing.reason) console.log(tracing.reason);
  const tracer = tracing.on ? (await import("@/evals/langsmith/tracing")).langsmithTracer(tracing.project) : undefined;
  // One recorder for the run: the Coach, the Story writer, the Summary
  // writer and the Judge all report to it, and the report reads it at the end.
  const recorder = createRecorder();
  const telemetry = tracer ? tracer.telemetry(recorder) : recorder;
  const chosen = await chooseGeneration(mode, telemetry);
  const chosenJudge = await chooseJudge(mode, telemetry);
  const coach = tracer ? { ...chosen, generation: tracer.generation(chosen.generation) } : chosen;
  const judge = tracer ? { ...chosenJudge, judge: tracer.judge(chosenJudge.judge) } : chosenJudge;
  console.log(`Coach: ${describeGeneration(coach.name)}${values.fake ? " (no network)" : ""}`);
  console.log(`Stories: ${describeGeneration(coach.storyName)}; Parent Summaries: ${describeGeneration(coach.name)}; Judge: ${describeGeneration(judge.name)}`);
  if (values.fake) {
    console.log("The fake plans like a slightly smarter Baseline and never names a pattern: its columns show the seams, not the Coach's judgement.");
    console.log("The fake Judge is the validators' opinion and fails calibration by design, so its scores are withheld.");
  }
  console.log("");
  const started = performance.now();
  const results = await runEvals({
    sessions,
    coach,
    recorder,
    labels: readLabelFiles(EVAL_RUN_ACCESS),
    stories: { generation: coach.generation, name: coach.storyName, judge: judge.judge, judgeName: judge.name },
    summaries: { generation: coach.generation, name: coach.name, judge: judge.judge, judgeName: judge.name },
    onSession: values.fake
      ? undefined
      : (learner, { result, step }) => console.log(`${learner}: ${formatSessionLine(result)}; Plan from ${step.source}`),
    span: tracer?.span,
  });
  const elapsed = Math.round(performance.now() - started);
  const report = evalReport(results, new Date());
  const reportFile = writeReport(report);
  const chartFiles = writeCharts(reportFile);

  if (!values.fake) console.log("");
  console.log(formatEvalResults(results));
  console.log("");
  console.log(`Ran ${results.convergence.coach.learners.length} Simulated Learners for ${sessions} Sessions under both planners in ${elapsed} ms.`);
  console.log(`Report: ${reportFile}`);
  console.log(`Charts: ${chartFiles.join(", ")}`);

  if (tracer) {
    // The report is written first and is the record; the experiment is made from that file, as a replay would be.
    try {
      const { publishReport } = await import("@/evals/langsmith/publish");
      const experiment = await publishReport(tracer.client, readReport(reportFile), { file: path.basename(reportFile), source: "live" });
      await tracer.flush();
      console.log(`LangSmith: the calls traced in project ${tracer.project}, and experiment ${experiment.experimentName} made from the report.`);
    } catch (error: unknown) {
      console.error(`LangSmith: the report is written, but the experiment was not made: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
