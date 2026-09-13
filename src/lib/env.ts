/** The voice model Ollie is rendered on when ELEVENLABS_MODEL_ID says nothing: the one with audio tags (see THIRD_PARTY.md). */
export const DEFAULT_VOICE_MODEL_ID = "eleven_v3";

export type Env = {
  audioDir: string;
  /** Where the Content Pool grows at run time: on the same persistent volume as the audio it will be voiced with. */
  poolFile: string;
  anthropicApiKey: string | undefined;
  elevenLabsApiKey: string | undefined;
  /** The voice designed for Ollie in ElevenLabs Voice Design: configured, never hard-coded. */
  elevenLabsVoiceId: string | undefined;
  elevenLabsModelId: string;
};

export type SecretKey = "anthropicApiKey" | "elevenLabsApiKey" | "elevenLabsVoiceId";

const VARIABLE_NAME: Record<SecretKey, string> = {
  anthropicApiKey: "ANTHROPIC_API_KEY",
  elevenLabsApiKey: "ELEVENLABS_API_KEY",
  elevenLabsVoiceId: "ELEVENLABS_VOICE_ID",
};

export type EnvSource = Readonly<Record<string, string | undefined>>;

export function readEnv(source: EnvSource = process.env): Env {
  const audioDir = source.AUDIO_DIR ?? "./data/audio";
  return {
    audioDir,
    poolFile: source.POOL_FILE ?? `${audioDir}/stories.json`,
    anthropicApiKey: source.ANTHROPIC_API_KEY,
    elevenLabsApiKey: source.ELEVENLABS_API_KEY,
    elevenLabsVoiceId: source.ELEVENLABS_VOICE_ID,
    elevenLabsModelId: source.ELEVENLABS_MODEL_ID || DEFAULT_VOICE_MODEL_ID,
  };
}

export function requireEnv(env: Env, key: SecretKey): string {
  const value = env[key];
  if (value === undefined || value === "") {
    throw new Error(`${VARIABLE_NAME[key]} is not set`);
  }
  return value;
}
