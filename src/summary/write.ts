/**
 * Write one Parent Summary through the Generation seam and keep it only if
 * the validator allows it; otherwise try again, a bounded number of times,
 * and then use the hand-written template, so a Parent always gets a note
 * even when the model is unreachable. A writer that could not be reached at
 * all is not asked twice: the template stands in at once.
 */
import type { Generation, SummaryInput, SummaryOutput } from "@/generation/types";
import { errorMessage, isUnavailable } from "@/lib/errors";
import { templateSummary } from "./template";
import { validateSummary } from "./validate";

/** How many times the model is asked before the template Summary is used. */
export const SUMMARY_ATTEMPTS = 2;

export type SummaryRejection = {
  readonly attempt: number;
  /** What the model wrote; absent when the call threw. */
  readonly output?: SummaryOutput;
  readonly reasons: readonly string[];
};

export type WrittenSummary = SummaryOutput & {
  /** `summary` when the model's Summary passed; `template` when every attempt failed. */
  readonly source: "summary" | "template";
  readonly rejections: readonly SummaryRejection[];
};

export async function writeValidSummary(
  generation: Pick<Generation, "writeSummary">,
  input: SummaryInput,
): Promise<WrittenSummary> {
  const rejections: SummaryRejection[] = [];
  for (let attempt = 1; attempt <= SUMMARY_ATTEMPTS; attempt++) {
    let output: SummaryOutput;
    try {
      output = await generation.writeSummary(input);
    } catch (error) {
      rejections.push({ attempt, reasons: [errorMessage(error)] });
      if (isUnavailable(error)) break;
      continue;
    }
    const verdict = validateSummary(output, input);
    if (verdict.ok) return { ...output, source: "summary", rejections };
    rejections.push({ attempt, output, reasons: verdict.reasons });
  }
  return { ...templateSummary(input), source: "template", rejections };
}
