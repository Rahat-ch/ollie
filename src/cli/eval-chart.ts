/**
 * Regenerate every chart from a report file, never from a live run: the
 * convergence chart and one per eval score.
 *
 *   pnpm eval:chart                                   # the latest report under docs/evals
 *   pnpm eval:chart --report docs/evals/<date>.json
 */
import { parseArgs } from "node:util";
import { latestReportFile, writeCharts } from "@/evals/files";
import { EVALS_DIR } from "@/evals/report";

const { values } = parseArgs({
  options: { report: { type: "string" } },
});

const reportFile = values.report ?? latestReportFile();
if (!reportFile) {
  console.error(`No report found under ${EVALS_DIR}; run pnpm eval first`);
  process.exit(1);
}
try {
  const charts = writeCharts(reportFile);
  console.log(`Charts (from ${reportFile}):`);
  for (const chart of charts) console.log(`  ${chart}`);
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
