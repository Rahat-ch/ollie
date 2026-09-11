import type { ConvergenceReport } from "./convergence";

/** Where every Eval Run writes its dated JSON report, relative to the repo root. */
export const EVALS_DIR = "docs/evals";

/** The JSON written by one Eval Run. Sections are added as evals are built. */
export type EvalReport = {
  readonly generatedAt: string;
  readonly convergence: ConvergenceReport;
};

export function evalReport(convergence: ConvergenceReport, generatedAt: Date): EvalReport {
  return { generatedAt: generatedAt.toISOString(), convergence };
}

/** `2026-09-10T19-06-01Z.json`: UTC to the second, colons replaced so it is a safe file name. */
export function reportFileName(generatedAt: Date): string {
  return `${generatedAt.toISOString().slice(0, 19).replace(/:/g, "-")}Z.json`;
}

export const isReportFileName = (name: string): boolean =>
  /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/.test(name);
