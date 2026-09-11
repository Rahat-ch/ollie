/**
 * Regenerate the convergence chart from a report file, never from a live run.
 *
 *   pnpm eval:chart                                   # the latest report under docs/evals
 *   pnpm eval:chart --report docs/evals/<date>.json
 */
import { parseArgs } from "node:util";
import { latestReportFile, writeChart } from "@/evals/files";
import { EVALS_DIR } from "@/evals/report";

const { values } = parseArgs({
  options: { report: { type: "string" } },
});

const reportFile = values.report ?? latestReportFile();
if (!reportFile) {
  console.error(`No report found under ${EVALS_DIR}; run pnpm eval first`);
  process.exit(1);
}
console.log(`Chart: ${writeChart(reportFile)} (from ${reportFile})`);
