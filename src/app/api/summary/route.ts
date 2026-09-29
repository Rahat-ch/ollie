/**
 * The Parent Summary for one completed Session, on the server. The browser
 * sends the Session Log tallied by Skill and Assistance State and the
 * Learner Notes, and never the Nickname (the spec's onboarding note and
 * user story 32 send it for Stories and audio alone), so the Summary speaks
 * of "your child": `SummaryInputSchema` is the whole of what may be sent.
 *
 * The route runs the Summary validator and its template fallback itself
 * (`serverSummary`), so what it answers is a Summary the validator allowed
 * or the template, with every rejection's reasons; a rejected Summary never
 * leaves the server. The browser checks the answer again and keeps its own
 * template, so a Parent always gets a note.
 */
import { SummaryInputSchema } from "@/generation/summary-schema";
import { modelRoute } from "@/lib/model-route";
import { serverSummary } from "@/summary/server";

export const POST = modelRoute({
  schema: SummaryInputSchema,
  run: async (input, apiKey, signal) => {
    const { anthropicGeneration } = await import("@/generation/anthropic");
    // The signal cancels the call when the browser gives up on it.
    return serverSummary(anthropicGeneration({ apiKey }), input, signal);
  },
});
