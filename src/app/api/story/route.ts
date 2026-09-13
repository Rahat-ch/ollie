/**
 * The Story for one Unit 3 Problem the browser's Content Pool lacks: from
 * the Pool as it has grown on this server, else written live on Sonnet 5
 * and added, else the template sentence. The browser sends the engine's
 * numbers and never the Nickname; the Story comes back in placeholder form
 * and the Nickname is filled in on the device (ADR 0002). The numbers are
 * checked to be a Problem the engine could have set (ADR 0001). Without an
 * API key the route still answers, with the template, so play never blocks.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Generation } from "@/generation";
import { readEnv, requireEnv } from "@/lib/env";
import { storyFor } from "@/lib/story-service";
import { storyProblemIssue, storyProblemShape } from "@/story/request";

const StoryRequestSchema = z
  .strictObject({ ...storyProblemShape, variant: z.int().min(0).optional(), rich: z.boolean().optional() })
  .check((ctx) => {
    const issue = storyProblemIssue(ctx.value);
    if (issue) ctx.issues.push({ code: "custom", input: ctx.value, path: [issue.path], message: issue.message });
  });

/** The Story writer, or one that fails at once when there is no key, so the template is used. */
async function storyWriter(): Promise<Pick<Generation, "writeStory">> {
  let apiKey: string;
  try {
    apiKey = requireEnv(readEnv(), "anthropicApiKey");
  } catch (error) {
    return {
      writeStory: async () => {
        throw error;
      },
    };
  }
  const { anthropicGeneration } = await import("@/generation/anthropic");
  return anthropicGeneration({ apiKey });
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
