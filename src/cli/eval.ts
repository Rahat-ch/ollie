/**
 * The eval command: run every Simulated Learner for 20 Sessions under the
 * Coach and under the Baseline on identical seeds, score convergence side
 * by side and the Coach's Hypotheses (detection of planted weaknesses,
 * false positives, Evidence Integrity), write a dated JSON report under
 * docs/evals, and regenerate the convergence chart from that file. Run it
 * before any prompt or Plan Space change so the numbers can be compared.
 *
 *   pnpm eval                 # the Coach on Opus 5; needs ANTHROPIC_API_KEY
 *   pnpm eval --fake          # the Coach on the Generation fake; no network
 *   pnpm eval --sessions 10
 *
 * The real Coach reads ANTHROPIC_API_KEY from the environment, or from
 * .env.local at the repo root when that file exists.
 */
import { parseArgs } from "node:util";
import { runEvals } from "@/evals/evals";
import { writeChart, writeReport } from "@/evals/files";
import { formatEvalResults } from "@/evals/format";
import { evalReport } from "@/evals/report";
import { formatSessionLine } from "@/loop/format";
import { chooseGeneration } from "./generation";

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
  const { generation, name, description } = await chooseGeneration(!values.fake);
  console.log(`Coach: ${description}`);
  if (values.fake) {
    console.log("The fake plans like a slightly smarter Baseline and never names a pattern: its columns show the seams, not the Coach's judgement.");
  }
  console.log("");
  const started = performance.now();
  const results = await runEvals({
    sessions,
    generation,
    generationName: name,
    onSession: values.fake
      ? undefined
      : ({ learner }, { result, step }) => console.log(`${learner}: ${formatSessionLine(result)}; Plan from ${step.source}`),
  });
  const elapsed = Math.round(performance.now() - started);
  const report = evalReport(results, new Date());
  const reportFile = writeReport(report);
  const chartFile = writeChart(reportFile);

  if (!values.fake) console.log("");
  console.log(formatEvalResults(results));
  console.log("");
  console.log(`Ran 6 Simulated Learners for ${sessions} Sessions under both planners in ${elapsed} ms.`);
  console.log(`Report: ${reportFile}`);
  console.log(`Chart:  ${chartFile}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
