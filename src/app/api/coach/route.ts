/**
 * The Coach for one completed Session, on Opus 5. The browser sends what
 * the engine hands the Coach — the Session's evidence, the Learner Notes,
 * the Knowledge Estimates, and the Plan Space — and never the Nickname, the
 * Avatar, or the Theme (ADR 0002): `CoachInputSchema` is the whole of what
 * may be sent. What comes back is the Coach's Notes and Plan, which the
 * browser, not this route, checks against the Log and the Plan Space.
 *
 * The model call is cancelled when the browser gives up on the request, and
 * stopped at the server's deadline (`COACH_SERVER_DEADLINE_MS`, below the
 * browser's own), when the route answers with the Baseline Plan itself and
 * the reason; the browser takes that as a Coach it could not reach.
 */
import { COACH_SERVER_DEADLINE_MS, serverBaseline } from "@/coach/deadline";
import { CoachInputSchema } from "@/generation/coach-schema";
import { modelRoute } from "@/lib/model-route";

export const POST = modelRoute({
  schema: CoachInputSchema,
  run: async (input, apiKey, signal) => {
    const { anthropicGeneration } = await import("@/generation/anthropic");
    return anthropicGeneration({ apiKey }).runCoach(input, { signal });
  },
  deadline: { ms: COACH_SERVER_DEADLINE_MS, answer: serverBaseline },
});
