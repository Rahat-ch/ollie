/**
 * The shape both model routes share: check the body against the seam's own
 * schema, then run one Generation operation with the key the server holds.
 * The schema is the whole of what may be sent, so nothing personal can
 * reach a model by being added to a body (ADR 0002). Without a key the
 * route answers 503 at once and the browser falls back — the Baseline Plan
 * for the Coach, the template for the Summary — so play never stops; an
 * operation that throws is a 502, and the browser uses its own fallback.
 *
 * The operation is handed the request's abort signal, so a model call the
 * browser gave up on is cancelled rather than paid for with nobody waiting.
 * A route with a deadline also stops the call when the deadline passes and
 * answers with its own fallback instead, which says why: the route, not the
 * browser's patience, decides when a slow model is given up on.
 *
 * Every call the operation makes is priced into the day's spend, and once
 * the day has spent the cap the route answers 503 without calling at all,
 * as it does with no key, until midnight UTC (src/lib/spend-cap.ts).
 */
import { NextResponse } from "next/server";
import type { z } from "zod";
import { errorMessage } from "./errors";
import { readEnv, requireEnv } from "./env";
import { CAP_REACHED, modelSpend, spendTelemetry, type DailyAllowance } from "./spend-cap";
import type { Telemetry } from "@/generation/telemetry";

/** How long the route lets the operation run, and what it answers instead once that has passed. */
export type RouteDeadline<T> = {
  readonly ms: number;
  /** The route's own answer, given the checked body and why the call was stopped. */
  readonly answer: (input: T, reason: string) => unknown;
};

export type ModelRoute<T> = {
  /** What the body must be: the input type of the Generation operation. */
  readonly schema: z.ZodType<T>;
  /**
   * The operation, given the checked body, the key the server holds, and a
   * signal that aborts when the request does or the deadline passes, and
   * the telemetry that prices each call into the day's spend. The operation
   * passes the signal into the model call and the telemetry to the adapter.
   */
  readonly run: (input: T, apiKey: string, signal: AbortSignal, telemetry: Telemetry) => Promise<unknown>;
  readonly deadline?: RouteDeadline<T>;
  /** The day's spend the cap is checked against; the server's shared one unless a test passes its own. */
  readonly spend?: () => DailyAllowance;
};

/** Why a call past the route's deadline was stopped, as the route's own answer says it. */
export const deadlineReason = (ms: number): string => `the model did not answer within the server's deadline of ${Math.round(ms / 1000)} s`;

/** Marks the deadline winning the race against the operation. */
const PASSED = Symbol("deadline passed");

export function modelRoute<T>({ schema, run, deadline, spend = modelSpend }: ModelRoute<T>): (request: Request) => Promise<Response> {
  return async function POST(request: Request): Promise<Response> {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`) }, { status: 400 });
    }
    let apiKey: string;
    try {
      apiKey = requireEnv(readEnv(), "anthropicApiKey");
    } catch (error) {
      return NextResponse.json({ error: errorMessage(error) }, { status: 503 });
    }
    const today = spend();
    if (today.exhausted()) return NextResponse.json({ error: CAP_REACHED }, { status: 503 });
    const stop = new AbortController();
    const signal = AbortSignal.any([request.signal, stop.signal]);
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Raced rather than left to the call to notice its signal, so the deadline holds even for a call that ignores it.
    const passed = new Promise<typeof PASSED>((resolve) => {
      if (deadline) timer = setTimeout(() => resolve(PASSED), deadline.ms);
    });
    try {
      const outcome = await Promise.race([run(parsed.data, apiKey, signal, spendTelemetry(today)), passed]);
      if (outcome !== PASSED) return NextResponse.json(outcome);
      const reason = deadlineReason(deadline!.ms);
      stop.abort(new Error(reason));
      return NextResponse.json(deadline!.answer(parsed.data, reason));
    } catch (error) {
      return NextResponse.json({ error: errorMessage(error) }, { status: 502 });
    } finally {
      clearTimeout(timer);
    }
  };
}
