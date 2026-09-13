/**
 * Ollie saying one line that has the Nickname in it: a Story, or the home
 * greeting. Every other line is the same for every Learner and is bundled
 * with the app, so it never comes here. The line is rendered once on
 * ElevenLabs and added to the Content Pool on the persistent volume, so a
 * repeat costs nothing. The Nickname is the one personal word sent off the
 * device, and onboarding says so; the file it lands in is named after a
 * non-cryptographic hash of the whole line, which is not a hiding place —
 * the line has the Nickname in it and the audio says it out loud (ADR 0002).
 *
 * Nothing here is free text: a greeting is built from the Nickname by the
 * app's own line, and a Story must be one the deterministic validator
 * accepts for the engine's numbers in the Learner's Theme (ADR 0001). With
 * no key, no voice ID, or no answer from ElevenLabs the route says so and
 * the browser falls through the Speech Chain, so no Session ever blocks.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Generation } from "@/generation";
import { readEnv } from "@/lib/env";
import { speechFor } from "@/lib/speech-service";
import { voiceRenderer } from "@/lib/voice-renderer";
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
      if (issue) ctx.issues.push({ code: "custom", input: ctx.value, path: [issue.path], message: issue.message });
    }),
]);

type SpeechRequest = z.infer<typeof SpeechRequestSchema>;

type Line = { readonly ok: true; readonly text: string } | { readonly ok: false; readonly reasons: readonly string[] };

/**
 * The line itself, built here: the browser says which line, never what Ollie
 * says. A Story is the one thing whose words it sends, and the deterministic
 * validator that let a Learner see it has to let Ollie say it too.
 */
function lineFor(request: SpeechRequest): Line {
  if (request.kind === "greeting") return { ok: true, text: greeting(request.nickname) };
  const { text, nickname, skill, structure, equation, answer, theme } = request;
  const verdict = validateStory(text, { skill, structure, equation, answer, theme, nickname });
  return verdict.ok ? { ok: true, text } : { ok: false, reasons: verdict.reasons };
}

const refuse = (error: readonly string[], status: number) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  const parsed = SpeechRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return refuse(
      parsed.error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`),
      400,
    );
  }

  // Whether Ollie has a voice at all is settled before the line is checked:
  // until there is one, there is nothing to say the line with.
  const env = readEnv();
  let renderer: Pick<Generation, "renderSpeech">;
  try {
    ({ renderer } = await voiceRenderer(env));
  } catch (error) {
    return refuse([error instanceof Error ? error.message : "Ollie has no voice configured"], 503);
  }

  const line = lineFor(parsed.data);
  if (!line.ok) return refuse([`text: not a Story for these numbers: ${line.reasons.join("; ")}`], 400);

  try {
    const { audio, mimeType, source } = await speechFor({ audioDir: env.audioDir, renderer }, line.text);
    return new NextResponse(new Blob([audio as BlobPart], { type: mimeType || AUDIO_MIME }), {
      headers: { "x-ollie-speech": source },
    });
  } catch {
    // The reason is the vendor's; the browser only needs to know to fall through.
    return refuse(["Ollie's voice could not render this line"], 503);
  }
}
