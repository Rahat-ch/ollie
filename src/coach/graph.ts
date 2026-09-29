/**
 * The Coach step as a LangGraph graph, which is what the Coach route runs
 * (ADR 0004). Server only: nothing the browser loads may import this file,
 * and `pnpm bundle:check` fails the build if LangGraph reaches the client.
 *
 * The graph owns none of the rules. Its nodes wrap the engine's functions
 * unchanged — `coachInput` or `boundsFromInput` to build the input,
 * `checkCoachOutput` to validate, `baselineStep` (over `baselinePlan`) for
 * the Baseline — and its edges are `coachStep`'s ladder: accept a checked
 * output, retry once with the rejected output and every reason, or use the
 * Baseline Plan. That retry is an edge back to the call, never LangGraph's
 * `retryPolicy`, which re-runs a node with the same input.
 *
 * What the graph adds is on the one impure node, the call to the Coach:
 * - a `retryPolicy` for transport errors only (rate limited, overloaded,
 *   the network), with the same input, so a blip is not a rejection;
 * - a timeout at the server's deadline, after which the call is cancelled
 *   and the Coach counts as not reached: no retry, the Baseline at once,
 *   and the same reason the route gives at its own deadline.
 *
 * No checkpointer (the device keeps the Session still waiting for its
 * Coach run, and a server store of Session evidence would break ADR 0002),
 * no interrupt, no agent, no LangChain chat model: the call goes through
 * the `Generation` seam, so the fake drives the graph with no network.
 * LangSmith tracing stays off: it runs only when `LANGSMITH_TRACING` is
 * set, and it is never set in production (ADR 0002).
 */
import { APIConnectionError, APIConnectionTimeoutError, APIError } from "@anthropic-ai/sdk";
import { Command, END, isNodeTimeoutError, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";
import { planSpace } from "@/loop";
import type { LearnerNotes, SessionResult } from "@/loop";
import type { CoachInput, CoachOutput, Generation } from "@/generation/types";
import { errorMessage, isUnavailable } from "@/lib/errors";
import { deadlineReason } from "@/lib/model-route";
import { baselineStep, boundsFromInput, checkCoachOutput, coachInput, rejected, sessionBounds } from "./coach";
import type { CoachBounds, CoachCall } from "./coach";
import { COACH_SERVER_DEADLINE_MS } from "./deadline";
import { withoutOutput, type ServerCoachStep } from "./server";
import type { CoachRejection, CoachStep } from "./types";

/**
 * An error worth sending the same request again for: rate limited (429),
 * overloaded (529), or the network. Not the SDK's own timeout (a slow
 * Coach is not retried), not an abort (nobody is waiting), not any other
 * status, and not a rejection: those go down the engine's ladder.
 */
export function isTransportError(error: unknown): boolean {
  if (error instanceof APIConnectionTimeoutError) return false;
  if (error instanceof APIConnectionError) return true;
  return error instanceof APIError && (error.status === 429 || error.status === 529);
}

/** What one call to the Coach gave, before the engine looked at it: an output, or why none came. */
type Called = { readonly ok: true; readonly output: CoachOutput } | { readonly ok: false; readonly reasons: readonly string[]; readonly unavailable: boolean };

const failed = (error: unknown): Called => ({ ok: false, reasons: [errorMessage(error)], unavailable: isUnavailable(error) });

const CoachState = new StateSchema({
  /** A completed Session and the Notes from before it, as the eval and the CLI have it. */
  session: z.custom<{ readonly result: SessionResult; readonly notes: LearnerNotes }>().optional(),
  /** A Coach route body: what the engine handed the Coach, trusted for nothing but itself. */
  body: z.custom<CoachInput>().optional(),
  input: z.custom<CoachInput>().optional(),
  bounds: z.custom<CoachBounds>().optional(),
  called: z.custom<Called>().optional(),
  verdict: z.custom<CoachCall>().optional(),
  rejections: z.array(z.custom<CoachRejection>()).default(() => []),
  step: z.custom<CoachStep>().optional(),
});

/** The caller's signal: the request, which the browser may abandon. The node's own signal adds the timeout. */
const CoachContext = z.object({ signal: z.custom<AbortSignal>().optional() });

type CoachState = typeof CoachState.State;

/** State a node only reaches after `buildInput`, or after `validate`. */
function built(state: CoachState): { input: CoachInput; bounds: CoachBounds } {
  if (!state.input || !state.bounds) throw new Error("the Coach graph ran a node before building its input");
  return { input: state.input, bounds: state.bounds };
}

export type CoachGraphOptions = {
  /** How long one call to the Coach may take; the route's own deadline unless a test passes a shorter one. */
  readonly deadlineMs?: number;
  /** The first wait before a transport retry, doubling after; tests pass a short one. */
  readonly backoffMs?: number;
};

/** The ladder after a call: which way the graph goes. */
type Route = "accept" | "retry" | "baseline";

/**
 * The Coach step as a compiled graph over a Generation. Invoke it with a
 * completed Session (`{ session: { result, notes } }`) or a Coach route body
 * (`{ body }`), and optionally the caller's signal as context; the Coach
 * step is `step` on the final state.
 */
export function coachGraph(generation: Pick<Generation, "runCoach">, options: CoachGraphOptions = {}) {
  const deadlineMs = options.deadlineMs ?? COACH_SERVER_DEADLINE_MS;
  return new StateGraph(CoachState, CoachContext)
    .addNode("buildInput", (state) => {
      if (state.session) {
        const { result, notes } = state.session;
        return { input: coachInput(result, notes), bounds: sessionBounds(result, notes) };
      }
      if (!state.body) throw new Error("the Coach graph needs a Session or a Coach input");
      // Checked against what the server rebuilds from the body, and the Coach is shown the Plan Space the server rebuilt.
      const bounds = boundsFromInput(state.body);
      return { input: { ...state.body, planSpace: planSpace(bounds.profile) }, bounds };
    })
    .addNode(
      "callCoach",
      async (state: CoachState, runtime) => {
        const { input } = built(state);
        const last = state.rejections.at(-1);
        // The engine's retry: the rejected output, when there was one, and every reason.
        const asked = last ? { ...input, rejected: { output: last.output, reasons: last.reasons } } : input;
        const caller = runtime.context?.signal;
        const signal = caller ? AbortSignal.any([caller, runtime.signal]) : runtime.signal;
        try {
          return { called: { ok: true, output: await generation.runCoach(asked, { signal }) } satisfies Called };
        } catch (error) {
          // A transport error goes to the retry policy; anything else is the engine's to judge.
          if (isTransportError(error)) throw error;
          return { called: failed(error) };
        }
      },
      {
        timeout: deadlineMs,
        retryPolicy: {
          maxAttempts: 3,
          initialInterval: options.backoffMs ?? 500,
          backoffFactor: 2,
          retryOn: isTransportError,
          logWarning: false,
        },
        // After the policy gives up, or at the deadline: the call failed, and the engine judges it like any other.
        errorHandler: (_state, { error }) => {
          const called: Called = isNodeTimeoutError(error) ? { ok: false, reasons: [deadlineReason(deadlineMs)], unavailable: true } : failed(error);
          return new Command({ update: { called }, goto: "validate" });
        },
        ends: ["validate"],
      },
    )
    .addNode("validate", (state) => {
      const { bounds } = built(state);
      const { called } = state;
      if (!called) throw new Error("the Coach graph validated before calling the Coach");
      const attempt = state.rejections.length === 0 ? 1 : 2;
      let verdict: CoachCall;
      if (!called.ok) {
        verdict = called.unavailable ? { ok: false, reasons: called.reasons, unavailable: true } : { ok: false, reasons: called.reasons };
      } else {
        const check = checkCoachOutput(called.output, bounds);
        verdict = check.ok ? check : { ok: false, output: called.output, reasons: check.reasons };
      }
      return verdict.ok ? { verdict } : { verdict, rejections: [...state.rejections, rejected(attempt, verdict)] };
    })
    .addNode("accept", (state) => {
      const { verdict, rejections } = state;
      if (!verdict?.ok) throw new Error("the Coach graph accepted a rejected output");
      return { step: { ...verdict.output, source: rejections.length === 0 ? "coach" : "retry", rejections } satisfies CoachStep };
    })
    .addNode("baseline", (state) => ({ step: baselineStep(built(state).bounds, built(state).input.notes, state.rejections) }))
    .addEdge(START, "buildInput")
    .addEdge("buildInput", "callCoach")
    .addEdge("callCoach", "validate")
    .addConditionalEdges(
      "validate",
      (state, config?: { context?: { signal?: AbortSignal } }): Route => {
        const { verdict } = state;
        if (verdict?.ok) return "accept";
        // Not reached at all, or the caller has gone: nothing to retry, or nobody waiting for it.
        if (verdict?.unavailable || config?.context?.signal?.aborted) return "baseline";
        return state.rejections.length >= 2 ? "baseline" : "retry";
      },
      { accept: "accept", retry: "callCoach", baseline: "baseline" },
    )
    .addEdge("accept", END)
    .addEdge("baseline", END)
    .compile({ name: "coach" });
}

/**
 * The Coach step as the route runs it: the graph on the body, with the
 * caller's signal, and every rejection without the output it rejected,
 * which stays on the server.
 */
export async function serverCoachStep(
  generation: Pick<Generation, "runCoach">,
  input: CoachInput,
  signal?: AbortSignal,
  options: CoachGraphOptions = {},
): Promise<ServerCoachStep> {
  const { step } = await coachGraph(generation, options).invoke({ body: input }, { context: { signal } });
  if (!step) throw new Error("the Coach graph ended without a Coach step");
  return { ...step, rejections: step.rejections.map(withoutOutput) };
}

/** The graph as Mermaid, drawn from the compiled graph itself: what the README shows. */
export async function coachGraphMermaid(): Promise<string> {
  const unused: Pick<Generation, "runCoach"> = { runCoach: () => Promise.reject(new Error("drawing only")) };
  return (await coachGraph(unused).getGraphAsync()).drawMermaid().trim();
}
