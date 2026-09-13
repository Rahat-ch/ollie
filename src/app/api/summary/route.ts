/**
 * The Parent Summary for one completed Session, on Opus 5. The browser
 * sends the Session Log tallied by Skill and Assistance State and the
 * Learner Notes, and never the Nickname (ADR 0002), so the Summary speaks
 * of "your child"; the body is checked against that shape before any call.
 * What comes back is checked on the device by the Summary validator, which
 * falls back to the hand-written template, so a Parent always gets a note.
 *
 * Without an API key it fails at once, and the template is what the Parent
 * reads.
 */
import { NextResponse } from "next/server";
import { SummaryInputSchema } from "@/generation/summary-schema";
import { readEnv, requireEnv } from "@/lib/env";

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export async function POST(request: Request) {
  const parsed = SummaryInputSchema.safeParse(await request.json().catch(() => null));
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
    return NextResponse.json(await anthropicGeneration({ apiKey }).writeSummary(parsed.data));
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 502 });
  }
}
