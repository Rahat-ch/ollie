/**
 * The Summary step on the server, and the device's check of what it
 * answers. The Summary route runs the validator and the template fallback
 * itself, so only a Summary the validator allowed, or the template, leaves
 * it; a rejected Summary stays on the server and only its reasons go back.
 * The device checks what it is given again against its own tally and falls
 * back to its own template, so a route that is wrong or not there leaves
 * the Parent with the note the device alone would write.
 */
import { z } from "zod";
import { SummaryOutputSchema } from "@/generation/summary-schema";
import type { Generation, SummaryInput } from "@/generation/types";
import { errorMessage } from "@/lib/errors";
import { templateSummary } from "./template";
import { validateSummary } from "./validate";
import { writeValidSummary, type SummaryRejection, type WrittenSummary } from "./write";

/** What the Summary route answers: a checked Summary or the template, with every rejection's reasons and none of its words. */
export type ServerSummary = Omit<WrittenSummary, "rejections"> & {
  readonly rejections: readonly Omit<SummaryRejection, "output">[];
};

/** The Summary step as the route runs it, with the signal passed into every model call. */
export async function serverSummary(
  generation: Pick<Generation, "writeSummary">,
  input: SummaryInput,
  signal?: AbortSignal,
): Promise<ServerSummary> {
  const written = await writeValidSummary(generation, input, signal ? { signal } : {});
  return { ...written, rejections: written.rejections.map(({ attempt, reasons }) => ({ attempt, reasons })) };
}

const ServerSummarySchema = SummaryOutputSchema.extend({
  source: z.enum(["summary", "template"]),
  rejections: z.array(z.object({ attempt: z.int().min(1), reasons: z.array(z.string()) })),
});

/**
 * The Summary step as the device runs it through the route. A route that
 * could not be asked (no key, no answer in time, the network) is one
 * rejection and the template at once; an answer is checked by
 * `acceptServerSummary`.
 */
export async function summaryThroughServer(ask: (input: SummaryInput) => Promise<unknown>, input: SummaryInput): Promise<WrittenSummary> {
  let answer: unknown;
  try {
    answer = await ask(input);
  } catch (error) {
    return { ...templateSummary(input), source: "template", rejections: [{ attempt: 1, reasons: [errorMessage(error)] }] };
  }
  return acceptServerSummary(answer, input);
}

/**
 * The device's own check of what the Summary route answered. A Summary is
 * validated again against the tally the device sent, and kept with the
 * route's reasons; one the device does not allow gives way to the template,
 * as the attempt after the route's last. When the route used the template,
 * the device writes its own from the same tally. The route has already
 * tried twice, so nothing here asks it again.
 */
export function acceptServerSummary(answer: unknown, input: SummaryInput): WrittenSummary {
  const template = (rejections: readonly SummaryRejection[]): WrittenSummary => ({ ...templateSummary(input), source: "template", rejections });
  const parsed = ServerSummarySchema.safeParse(answer);
  if (!parsed.success) {
    const reasons = parsed.error.issues.map((issue) => `/api/summary answered ${issue.path.join(".") || "a body"} that is not a Summary: ${issue.message}`);
    return template([{ attempt: 1, reasons }]);
  }
  const { practiced, activity, source, rejections } = parsed.data;
  if (source === "template") return template(rejections);
  const output = { practiced, activity };
  const verdict = validateSummary(output, input);
  if (verdict.ok) return { ...output, source: "summary", rejections };
  return template([...rejections, { attempt: rejections.length + 1, output, reasons: verdict.reasons }]);
}
