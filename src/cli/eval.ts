/**
 * The eval command: run every Simulated Learner for 20 Sessions under the
 * Coach and under the Baseline on identical seeds, score convergence side
 * by side and the Coach's Hypotheses (detection of planted weaknesses,
 * false positives, Evidence Integrity); write a Story per Theme and Unit 3
 * structure and score validity and, once the Judge clears the Calibration
 * Set, readability; write a Parent Summary for each Learner's last Session
 * and score validity and, once the Judge clears the Calibration Set,
 * faithfulness; write a dated JSON report under docs/evals, and
 * regenerate the convergence chart from that file. Run it before any prompt
 * or Plan Space change so the numbers can be compared.
 *
 *   pnpm eval                 # Opus 5 Coach and Judge, Sonnet 5 Stories; needs ANTHROPIC_API_KEY
 *   pnpm eval --fake          # the Generation fake and the fake Judge; no network
 *   pnpm eval --sessions 10
 *
 * The real adapters read ANTHROPIC_API_KEY from the environment, or from
 * .env.local at the repo root when that file exists.
 */
import { parseArgs } from "node:util";
import { runEvals } from "@/evals/evals";
import { writeChart, writeReport } from "@/evals/files";
import { formatEvalResults } from "@/evals/format";
import { describeGeneration, evalReport } from "@/evals/report";
import { formatSessionLine } from "@/loop/format";
import { chooseGeneration, chooseJudge } from "./generation";

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
  const coach = await chooseGeneration(mode);
  const judge = await chooseJudge(mode);
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
    stories: { generation: coach.generation, name: coach.storyName, judge: judge.judge, judgeName: judge.name },
    summaries: { generation: coach.generation, name: coach.name, judge: judge.judge, judgeName: judge.name },
    onSession: values.fake
      ? undefined
      : (learner, { result, step }) => console.log(`${learner}: ${formatSessionLine(result)}; Plan from ${step.source}`),
  });
  const elapsed = Math.round(performance.now() - started);
  const report = evalReport(results, new Date());
  const reportFile = writeReport(report);
  const chartFile = writeChart(reportFile);

  if (!values.fake) console.log("");
  console.log(formatEvalResults(results));
  console.log("");
  console.log(`Ran ${results.convergence.coach.learners.length} Simulated Learners for ${sessions} Sessions under both planners in ${elapsed} ms.`);
  console.log(`Report: ${reportFile}`);
  console.log(`Chart:  ${chartFile}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
