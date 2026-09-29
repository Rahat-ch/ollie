/** The only I/O in the evals: reading and writing dated reports, the charts and re-judges under docs/evals. */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { renderConvergenceChart } from "./chart";
import { EVAL_CHARTS } from "./charts";
import type { RejudgeRun } from "./rejudge";
import { EVALS_DIR, isReportFileName, reportFileName, type EvalReport } from "./report";

export const CHART_FILE = "convergence.svg";

/** Every chart an Eval Run leaves under docs/evals, the convergence chart first. */
export const CHART_FILES: readonly string[] = [CHART_FILE, ...EVAL_CHARTS.map((chart) => chart.file)];

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

/** A report from disk. The first report (ticket 05) had the Baseline alone and cannot be charted against the Coach. */
export function readReport(file: string): EvalReport {
  const report = JSON.parse(readFileSync(file, "utf8")) as Partial<EvalReport>;
  if (!report.convergence?.coach || !report.hypotheses) {
    throw new Error(`${file} has no Coach section (it predates the Coach evals); the chart needs a report from pnpm eval`);
  }
  return report as EvalReport;
}

/**
 * Regenerate every chart from a report file on disk, never from a live run:
 * the convergence chart, then one per eval score. Returns the files written,
 * in the order of `CHART_FILES`.
 */
export function writeCharts(reportFile: string, dir = EVALS_DIR): string[] {
  const report = readReport(reportFile);
  const name = path.basename(reportFile);
  const written = [{ file: CHART_FILE, svg: renderConvergenceChart(report, name) }, ...EVAL_CHARTS.map((chart) => ({ file: chart.file, svg: chart.render(report, name) }))];
  return written.map(({ file, svg }) => {
    const target = path.join(dir, file);
    writeFileSync(target, svg);
    return target;
  });
}

/** `rejudge-2026-09-29T20-00-00Z`: the dated name a re-judge's JSON and text share, never taken for an Eval Run's report. */
export const rejudgeFileStem = (generatedAt: Date): string => `rejudge-${reportFileName(generatedAt).replace(/\.json$/, "")}`;

/** A re-judge's JSON and the text it printed, side by side under one dated name. Returns both files. */
export function writeRejudge(run: RejudgeRun, text: string, dir = EVALS_DIR): { readonly json: string; readonly text: string } {
  mkdirSync(dir, { recursive: true });
  const stem = path.join(dir, rejudgeFileStem(new Date(run.generatedAt)));
  writeFileSync(`${stem}.json`, JSON.stringify(run, null, 2) + "\n");
  writeFileSync(`${stem}.txt`, text + "\n");
  return { json: `${stem}.json`, text: `${stem}.txt` };
}
