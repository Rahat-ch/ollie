/**
 * The Coach for one completed Session, on Opus 5. The browser sends what
 * the engine hands the Coach — the Session's evidence, the Learner Notes,
 * the Knowledge Estimates, and the Plan Space — and never the Nickname, the
 * Avatar, or the Theme (ADR 0002): `CoachInputSchema` is the whole of what
 * may be sent. What comes back is the Coach's Notes and Plan, which the
 * browser, not this route, checks against the Log and the Plan Space.
 */
import { CoachInputSchema } from "@/generation/coach-schema";
import { modelRoute } from "@/lib/model-route";

export const POST = modelRoute({
  schema: CoachInputSchema,
  run: async (input, apiKey) => {
    const { anthropicGeneration } = await import("@/generation/anthropic");
    return anthropicGeneration({ apiKey }).runCoach(input);
  },
});
