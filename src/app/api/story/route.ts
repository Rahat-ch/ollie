/**
 * The Story for one Unit 3 Problem the browser's Content Pool lacks: from
 * the Pool as it has grown on this server, else written live on Sonnet 5
 * and added, else the template sentence. The browser sends the engine's
 * numbers and never the Nickname; the Story comes back in placeholder form
 * and the Nickname is filled in on the device (ADR 0002). The numbers are
 * checked to be a Problem the engine could have set (ADR 0001). Without an
 * API key the route still answers, with the template, so play never blocks;
 * so it does once the day's spend has reached the cap, until midnight UTC,
 * and every Story it writes is priced into that spend (src/lib/spend-cap.ts).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Generation } from "@/generation";
import { readEnv, requireEnv } from "@/lib/env";
import { CAP_REACHED, modelSpend, spendTelemetry } from "@/lib/spend-cap";
import { storyFor } from "@/lib/story-service";
import { storyProblemIssue, storyProblemShape } from "@/story/request";

const StoryRequestSchema = z
  .strictObject({ ...storyProblemShape, variant: z.int().min(0).optional(), set: z.enum(["plain", "rich"]).optional() })
  .check((ctx) => {
    const issue = storyProblemIssue(ctx.value);
    if (issue) ctx.issues.push({ code: "custom", input: ctx.value, path: [issue.path], message: issue.message });
  });

/** A writer that fails at once, so the template is used. */
const failing = (error: unknown): Pick<Generation, "writeStory"> => ({
  writeStory: async () => {
    throw error;
  },
});

/** The Story writer, or one that fails at once when there is no key or the day's spend is at the cap. */
async function storyWriter(): Promise<Pick<Generation, "writeStory">> {
  let apiKey: string;
  try {
    apiKey = requireEnv(readEnv(), "anthropicApiKey");
  } catch (error) {
    return failing(error);
  }
  const today = modelSpend();
  if (today.exhausted()) return failing(new Error(CAP_REACHED));
  const { anthropicGeneration } = await import("@/generation/anthropic");
  return anthropicGeneration({ apiKey, telemetry: spendTelemetry(today) });
}

export async function POST(request: Request) {
  const parsed = StoryRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`) }, { status: 400 });
  }
  const { variant = 0, ...input } = parsed.data;
  const { poolFile } = readEnv();
  return NextResponse.json(await storyFor({ poolFile, writer: await storyWriter() }, input, variant));
}
