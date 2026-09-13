/**
 * Ollie saying one line that has the Nickname in it: a Story, or the home
 * greeting. Every other line is the same for every Learner and is bundled
 * with the app, so it never comes here. The line is rendered once on
 * ElevenLabs and kept on the persistent volume under a name that is a hash
 * of what is said, so a repeat costs nothing and no Nickname is written to
 * disk (ADR 0002). The Nickname is the one personal word sent off the
 * device, and onboarding says so.
 *
 * Nothing here is free text: a greeting is built from the Nickname by the
 * app's own line, and a Story must be one the deterministic validator
 * accepts for the engine's numbers in the Learner's Theme (ADR 0001). With
 * no key, no voice ID, or no answer from ElevenLabs the route says so and
 * the browser falls through the chain, so no Session ever blocks.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Generation } from "@/generation";
import { readEnv, requireEnv, type Env } from "@/lib/env";
import { speechFor } from "@/lib/speech-service";
import { greeting } from "@/play/lines";
import { nicknameField, storyProblemIssue, storyProblemShape } from "@/story/request";
import { validateStory } from "@/story/validate";
import { AUDIO_MIME } from "@/voice/key";

/** A Story is under 25 words; this is the outside of that, so nothing long is ever sent to be voiced. */
const MAX_SPOKEN_CHARS = 400;

const SpeechRequestSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("greeting"), nickname: nicknameField }),
  z
    .strictObject({
      kind: z.literal("story"),
      nickname: nicknameField,
      text: z.string().min(1).max(MAX_SPOKEN_CHARS),
      ...storyProblemShape,
    })
    .check((ctx) => {
      const issue = storyProblemIssue(ctx.value);
      if (issue) {
        ctx.issues.push({ code: "custom", input: ctx.value, path: [issue.path], message: issue.message });
        return;
      }
      const { text, nickname, ...problem } = ctx.value;
      const verdict = validateStory(text, { ...problem, nickname });
      if (!verdict.ok) {
        ctx.issues.push({ code: "custom", input: text, path: ["text"], message: `not a Story for these numbers: ${verdict.reasons.join("; ")}` });
      }
    }),
]);

type SpeechRequest = z.infer<typeof SpeechRequestSchema>;

/** The line itself, built here: the browser says which line, never what Ollie says. */
const lineFor = (request: SpeechRequest): string => (request.kind === "greeting" ? greeting(request.nickname) : request.text);

/** The ElevenLabs adapter, or the reason there is none. */
async function voiceRenderer(env: Env): Promise<Pick<Generation, "renderSpeech">> {
  const apiKey = requireEnv(env, "elevenLabsApiKey");
  const voiceId = requireEnv(env, "elevenLabsVoiceId");
  const { elevenLabsGeneration } = await import("@/generation/elevenlabs");
  return elevenLabsGeneration({ apiKey, voiceId, modelId: env.elevenLabsModelId });
}

const problem = (error: readonly string[], status: number) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  const parsed = SpeechRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return problem(
      parsed.error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`),
      400,
    );
  }

  const env = readEnv();
  let renderer: Pick<Generation, "renderSpeech">;
  try {
    renderer = await voiceRenderer(env);
  } catch (error) {
    return problem([error instanceof Error ? error.message : "Ollie has no voice configured"], 503);
  }

  try {
    const { audio, mimeType, source } = await speechFor({ audioDir: env.audioDir, renderer }, lineFor(parsed.data));
    return new NextResponse(new Blob([audio as BlobPart], { type: mimeType || AUDIO_MIME }), {
      headers: {
        // The name is a hash of the line, so the audio at this body never changes.
        "cache-control": "private, max-age=31536000, immutable",
        "x-ollie-speech": source,
      },
    });
  } catch {
    // The reason is the vendor's; the browser only needs to know to fall through.
    return problem(["Ollie's voice could not render this line"], 503);
  }
}
