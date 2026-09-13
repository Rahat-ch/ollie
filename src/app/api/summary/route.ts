/**
 * The Parent Summary for one completed Session, on Opus 5. The browser
 * sends the Session Log tallied by Skill and Assistance State and the
 * Learner Notes, and never the Nickname (the spec's onboarding note and
 * user story 32 send it for Stories and audio alone), so the Summary speaks
 * of "your child": `SummaryInputSchema` is the whole of what may be sent.
 * What comes back is checked on the device by the Summary validator, which
 * falls back to the hand-written template, so a Parent always gets a note.
 */
import { SummaryInputSchema } from "@/generation/summary-schema";
import { modelRoute } from "@/lib/model-route";

export const POST = modelRoute({
  schema: SummaryInputSchema,
  run: async (input, apiKey) => {
    const { anthropicGeneration } = await import("@/generation/anthropic");
    return anthropicGeneration({ apiKey }).writeSummary(input);
  },
});
