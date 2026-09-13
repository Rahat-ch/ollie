/**
 * The shape both model routes share: check the body against the seam's own
 * schema, then run one Generation operation with the key the server holds.
 * The schema is the whole of what may be sent, so nothing personal can
 * reach a model by being added to a body (ADR 0002). Without a key the
 * route answers 503 at once and the browser falls back — the Baseline Plan
 * for the Coach, the template for the Summary — so play never stops; a
 * failed call is a 502 the browser may retry.
 */
import { NextResponse } from "next/server";
import type { z } from "zod";
import { errorMessage } from "./errors";
import { readEnv, requireEnv } from "./env";

export type ModelRoute<T> = {
  /** What the body must be: the input type of the Generation operation. */
  readonly schema: z.ZodType<T>;
  /** The operation, given the checked body and the key the server holds. */
  readonly run: (input: T, apiKey: string) => Promise<unknown>;
};

export function modelRoute<T>({ schema, run }: ModelRoute<T>): (request: Request) => Promise<Response> {
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
    try {
      return NextResponse.json(await run(parsed.data, apiKey));
    } catch (error) {
      return NextResponse.json({ error: errorMessage(error) }, { status: 502 });
    }
  };
}
