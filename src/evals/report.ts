import type { EvalResults } from "./evals";

/** Where every Eval Run writes its dated JSON report, relative to the repo root. */
export const EVALS_DIR = "docs/evals";

/** The JSON written by one Eval Run: when it ran, then everything it scored. Sections are added as evals are built. */
export type EvalReport = EvalResults & { readonly generatedAt: string };

export function evalReport(results: EvalResults, generatedAt: Date): EvalReport {
  return { generatedAt: generatedAt.toISOString(), ...results };
}

/** `2026-09-10T19-06-01Z.json`: UTC to the second, colons replaced so it is a safe file name. */
export function reportFileName(generatedAt: Date): string {
  return `${generatedAt.toISOString().slice(0, 19).replace(/:/g, "-")}Z.json`;
}

export const isReportFileName = (name: string): boolean =>
  /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/.test(name);

/** How the report names the Generation that ran the Coach, in prose. */
export const describeGeneration = (generation: string): string =>
  generation === "fake" ? "the Generation fake" : `the Anthropic adapter on ${generation}`;
