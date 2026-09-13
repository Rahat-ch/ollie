/**
 * The Coach for one completed Session, on Opus 5. The browser sends what
 * the engine hands the Coach — the Session's evidence, the Learner Notes,
 * the Knowledge Estimates, and the Plan Space — and never the Nickname, the
 * Avatar, or the Theme (ADR 0002); the body is checked against that shape
 * before any call. What comes back is the Coach's Notes and Plan, which the
 * browser, not this route, checks against the Log and the Plan Space; this
 * route only refuses what is not a Coach output at all.
 *
 * Without an API key it fails at once, and the browser falls back to the
 * Baseline Plan with the reason in Ollie's Notebook, so play never stops.
 */
import { NextResponse } from "next/server";
import { CoachInputSchema } from "@/generation/coach-schema";
import { readEnv, requireEnv } from "@/lib/env";

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export async function POST(request: Request) {
  const parsed = CoachInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`) }, { status: 400 });
  }
  let apiKey: string;
  try {
    apiKey = requireEnv(readEnv(), "anthropicApiKey");
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 503 });
  }
  const { anthropicGeneration } = await import("@/generation/anthropic");
  try {
    return NextResponse.json(await anthropicGeneration({ apiKey }).runCoach(parsed.data));
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 502 });
  }
}
