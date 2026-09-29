/**
 * The Coach step for one completed Session, on the server. The browser
 * sends what the engine hands the Coach — the Session's evidence, the
 * Learner Notes, the Knowledge Estimates, and the Plan Space — and never
 * the Nickname, the Avatar, or the Theme (ADR 0002): `CoachInputSchema` is
 * the whole of what may be sent.
 *
 * The route runs the whole step (`serverCoachStep`), as the compiled Coach
 * graph (ADR 0004, `src/coach/graph.ts`): it checks the Coach's
 * output against the Problem IDs and the Plan Space it rebuilt from the
 * body, retries once with every reason, and falls back to the Baseline
 * Plan. What it answers is only an output the engine allowed, or the
 * Baseline, with where the Plan came from and every rejection's reasons; a
 * rejected output never leaves the server. The browser checks the answer
 * again and keeps its own fallback, so play works offline.
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
  run: async (input, apiKey, signal, telemetry) => {
    // Loaded here, on the server, so LangGraph is never part of any page.
    const [{ anthropicGeneration }, { serverCoachStep }] = await Promise.all([import("@/generation/anthropic"), import("@/coach/graph")]);
    // The graph retries transport errors itself, so the SDK does not retry underneath it.
    return serverCoachStep(anthropicGeneration({ apiKey, telemetry, maxRetries: 0 }), input, signal);
  },
  deadline: { ms: COACH_SERVER_DEADLINE_MS, answer: serverBaseline },
});
