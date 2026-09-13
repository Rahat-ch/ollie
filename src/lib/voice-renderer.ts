/**
 * Ollie's voice, wherever it is asked for: the speech route and the
 * build-time render script both come here, so the voice and the model are
 * read from the environment in one place and named in none. The adapter is
 * imported only once a key and a voice ID are there, so nothing that runs
 * without them loads a network client.
 */
import type { Generation } from "@/generation/types";
import { requireEnv, type Env } from "./env";

export type VoiceRenderer = {
  readonly renderer: Pick<Generation, "renderSpeech">;
  /** What a run calls the voice in its log: the model and the voice it is on. */
  readonly name: string;
};

/** Throws naming the variable that is missing, so the caller can say which. */
export async function voiceRenderer(env: Env): Promise<VoiceRenderer> {
  const apiKey = requireEnv(env, "elevenLabsApiKey");
  const voiceId = requireEnv(env, "elevenLabsVoiceId");
  const { elevenLabsGeneration } = await import("@/generation/elevenlabs");
  return {
    renderer: elevenLabsGeneration({ apiKey, voiceId, modelId: env.elevenLabsModelId }),
    name: `${env.elevenLabsModelId} on voice ${voiceId}`,
  };
}
