export type Env = {
  audioDir: string;
  /** Where the Content Pool grows at run time: on the same persistent volume as the audio it will be voiced with. */
  poolFile: string;
  anthropicApiKey: string | undefined;
  elevenLabsApiKey: string | undefined;
};

export type SecretKey = "anthropicApiKey" | "elevenLabsApiKey";

const VARIABLE_NAME: Record<SecretKey, string> = {
  anthropicApiKey: "ANTHROPIC_API_KEY",
  elevenLabsApiKey: "ELEVENLABS_API_KEY",
};

export type EnvSource = Readonly<Record<string, string | undefined>>;

export function readEnv(source: EnvSource = process.env): Env {
  const audioDir = source.AUDIO_DIR ?? "./data/audio";
  return {
    audioDir,
    poolFile: source.POOL_FILE ?? `${audioDir}/stories.json`,
    anthropicApiKey: source.ANTHROPIC_API_KEY,
    elevenLabsApiKey: source.ELEVENLABS_API_KEY,
  };
}

export function requireEnv(env: Env, key: SecretKey): string {
  const value = env[key];
  if (value === undefined || value === "") {
    throw new Error(`${VARIABLE_NAME[key]} is not set`);
  }
  return value;
}
