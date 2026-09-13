/**
 * The Story for one Unit 3 Problem the browser's Content Pool lacks: from
 * the Pool as it has grown on this server, else written live on Sonnet 5
 * and added, else the template sentence. The browser sends the engine's
 * numbers and never the Nickname; the Story comes back in placeholder form
 * and the Nickname is filled in on the device (ADR 0002). Without an API
 * key the route still answers, with the template, so play never blocks.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Generation } from "@/generation";
import { readEnv, requireEnv } from "@/lib/env";
import { readPoolFile, writePoolFile } from "@/lib/pool-file";
import { THEMES } from "@/profile/identity";
import { BUNDLED_POOL } from "@/story/bundled";
import { addToPool, fillStory, type PoolInput } from "@/story/pool";

export const dynamic = "force-dynamic";

const themeIds = THEMES.map((t) => t.id) as [PoolInput["theme"], ...PoolInput["theme"][]];
const number = z.int().min(0).max(20);

const StoryRequestSchema = z.strictObject({
  theme: z.enum(themeIds),
  skill: z.enum(["result-unknown", "change-unknown"]),
  structure: z.string().min(1),
  equation: z.strictObject({
    left: number,
    op: z.enum(["+", "-"]),
    right: number,
    result: number,
    unknown: z.enum(["left", "right", "result"]),
  }),
  answer: number,
  variant: z.int().min(0).optional(),
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
  const grown = await readPoolFile(poolFile);
  const filled = await fillStory({ ...BUNDLED_POOL, ...grown }, await storyWriter(), input, variant);
  if (filled.source === "generated") {
    // The file keeps only what grew here; the bundled Pool ships with the app.
    await writePoolFile(poolFile, addToPool(grown, input, filled.text));
  }
  return NextResponse.json({ text: filled.text, source: filled.source });
}
