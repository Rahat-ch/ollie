/** The only I/O in the evals: reading and writing dated reports and the chart under docs/evals. */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { renderConvergenceChart } from "./chart";
import { EVALS_DIR, isReportFileName, reportFileName, type EvalReport } from "./report";

export const CHART_FILE = "convergence.svg";

export function writeReport(report: EvalReport, dir = EVALS_DIR): string {
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, reportFileName(new Date(report.generatedAt)));
  writeFileSync(file, JSON.stringify(report, null, 2) + "\n");
  return file;
}

/** The newest dated report in the directory by name, which is by UTC time. */
export function latestReportFile(dir = EVALS_DIR): string | undefined {
  const names = readdirSync(dir).filter(isReportFileName).sort();
  return names.length > 0 ? path.join(dir, names[names.length - 1]) : undefined;
}

export function readReport(file: string): EvalReport {
  return JSON.parse(readFileSync(file, "utf8")) as EvalReport;
}

/** Regenerate the chart from a report file on disk, never from a live run. */
export function writeChart(reportFile: string, dir = EVALS_DIR): string {
  const chart = renderConvergenceChart(readReport(reportFile), path.basename(reportFile));
  const file = path.join(dir, CHART_FILE);
  writeFileSync(file, chart);
  return file;
}
