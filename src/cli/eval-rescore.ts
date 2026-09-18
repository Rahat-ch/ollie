/**
 * Score a written report's Hypotheses again with the scorer as it stands
 * now, from the Notes the report kept, and print the new detection and false
 * positives beside the stored ones. Nothing is written: the report on disk
 * is the record of the run that produced it.
 *
 *   pnpm eval:rescore                                   # the latest report under docs/evals
 *   pnpm eval:rescore --report docs/evals/<date>.json
 *
 * A report written before the Notes history was kept has nothing to score
 * again; the command says so and stops.
 */
import { parseArgs } from "node:util";
import { latestReportFile, readReport } from "@/evals/files";
import { EVALS_DIR, describeGeneration } from "@/evals/report";
import { formatRescore, rescoreReport } from "@/evals/rescore";

const { values } = parseArgs({
  options: { report: { type: "string" } },
});

const reportFile = values.report ?? latestReportFile();
if (!reportFile) {
  console.error(`No report found under ${EVALS_DIR}; run pnpm eval first`);
  process.exit(1);
}
try {
  const report = readReport(reportFile);
  const learners = rescoreReport(report);
  console.log(`${reportFile} (${describeGeneration(report.coach.generation)}, ${report.sessions} Sessions), stored -> rescored:\n`);
  console.log(formatRescore(learners));
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
