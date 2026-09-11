/**
 * The eval command: run every Simulated Learner for 20 Sessions under the
 * Baseline, write a dated JSON report under docs/evals, and regenerate the
 * convergence chart from that file. Run it before any prompt or Plan Space
 * change so the numbers can be compared.
 *
 *   pnpm eval
 *   pnpm eval --sessions 10
 */
import { parseArgs } from "node:util";
import { runConvergence } from "@/evals/convergence";
import { writeChart, writeReport } from "@/evals/files";
import { formatConvergence } from "@/evals/format";
import { evalReport } from "@/evals/report";

const { values } = parseArgs({
  options: { sessions: { type: "string", default: "20" } },
});

const sessions = Number(values.sessions);
if (!Number.isInteger(sessions) || sessions < 1) {
  console.error(`--sessions must be a positive integer, got "${values.sessions}"`);
  process.exit(1);
}

const started = performance.now();
const convergence = runConvergence({ sessions });
const elapsed = Math.round(performance.now() - started);
const report = evalReport(convergence, new Date());
const reportFile = writeReport(report);
const chartFile = writeChart(reportFile);

console.log(formatConvergence(convergence));
console.log("");
console.log(`Ran ${convergence.learners.length} Simulated Learners for ${sessions} Sessions in ${elapsed} ms.`);
console.log(`Report: ${reportFile}`);
console.log(`Chart:  ${chartFile}`);
