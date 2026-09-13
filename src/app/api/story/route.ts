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
import { getSkill } from "@/loop";
import { THEMES } from "@/profile/identity";
import type { PoolInput } from "@/story/pool";
import { isStoryStructure, storyShape } from "@/story/shapes";

const themeIds = THEMES.map((t) => t.id) as [PoolInput["theme"], ...PoolInput["theme"][]];
const number = z.int().min(0).max(20);

const StoryRequestSchema = z
  .strictObject({
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
  })
  .check((ctx) => {
    const { skill, structure, equation, answer } = ctx.value;
    if (!isStoryStructure(structure) || !getSkill(skill).structures.includes(structure)) {
      ctx.issues.push({ code: "custom", input: structure, path: ["structure"], message: `${skill} has no structure "${structure}"` });
      return;
    }
    // Lay the whole and the part out the way the structure does and require the same equation back.
    const whole = equation.op === "+" ? equation.result : equation.left;
    const part = equation.op === "-" || structure === "add-to-change" ? equation.right : equation.left;
    const laidOut = storyShape(structure).equation(whole, part);
    const same = (["left", "op", "right", "result", "unknown"] as const).every((field) => laidOut[field] === equation[field]);
    if (!same || part < 1 || answer !== equation[equation.unknown]) {
      ctx.issues.push({ code: "custom", input: equation, path: ["equation"], message: "not a Problem the engine sets for this structure" });
    }
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
