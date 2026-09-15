import { describe, expect, it } from "vitest";
import { readEnv, requireEnv } from "@/lib/env";

describe("readEnv", () => {
  it("defaults audioDir to ./data/audio when AUDIO_DIR is unset, and the Pool file to a name inside it", () => {
    const env = readEnv({});
    expect(env.audioDir).toBe("./data/audio");
    expect(env.poolFile).toBe("./data/audio/stories.json");
    expect(readEnv({ POOL_FILE: "/tmp/pool.json" }).poolFile).toBe("/tmp/pool.json");
  });

  it("treats a blank AUDIO_DIR or POOL_FILE as unset, so a copied .env.example keeps the defaults", () => {
    const env = readEnv({ AUDIO_DIR: "", POOL_FILE: "" });
    expect(env.audioDir).toBe("./data/audio");
    expect(env.poolFile).toBe("./data/audio/stories.json");
  });

  it("reads audioDir and vendor keys from the source", () => {
    const env = readEnv({
      AUDIO_DIR: "/mnt/audio",
      ANTHROPIC_API_KEY: "anthropic-test-key",
      ELEVENLABS_API_KEY: "elevenlabs-test-key",
      ELEVENLABS_VOICE_ID: "ollie-voice-id",
      ELEVENLABS_MODEL_ID: "eleven_flash_v2_5",
    });
    expect(env).toEqual({
      audioDir: "/mnt/audio",
      poolFile: "/mnt/audio/stories.json",
      anthropicApiKey: "anthropic-test-key",
      elevenLabsApiKey: "elevenlabs-test-key",
      elevenLabsVoiceId: "ollie-voice-id",
      elevenLabsModelId: "eleven_flash_v2_5",
    });
  });

  it("defaults the voice model to eleven_v3 and leaves the voice ID unset, so the adapter hard-codes neither", () => {
    const env = readEnv({});
    expect(env.elevenLabsModelId).toBe("eleven_v3");
    expect(env.elevenLabsVoiceId).toBeUndefined();
  });

  it("leaves a vendor key undefined when it is unset so the app can boot without it", () => {
    const env = readEnv({ ELEVENLABS_API_KEY: "elevenlabs-test-key" });
    expect(env.anthropicApiKey).toBeUndefined();
  });
});

describe("requireEnv", () => {
  it("returns the value when the variable is set", () => {
    const env = readEnv({ ELEVENLABS_API_KEY: "elevenlabs-test-key" });
    expect(requireEnv(env, "elevenLabsApiKey")).toBe("elevenlabs-test-key");
  });

  it("treats an empty value as unset", () => {
    const env = readEnv({ ANTHROPIC_API_KEY: "" });
    expect(() => requireEnv(env, "anthropicApiKey")).toThrow(
      "ANTHROPIC_API_KEY is not set",
    );
  });

  it("throws naming the missing variable", () => {
    const env = readEnv({});
    expect(() => requireEnv(env, "anthropicApiKey")).toThrow(
      "ANTHROPIC_API_KEY is not set",
    );
    expect(() => requireEnv(env, "elevenLabsVoiceId")).toThrow(
      "ELEVENLABS_VOICE_ID is not set",
    );
  });

  it("never includes a secret value in the error it throws", () => {
    const env = readEnv({ ELEVENLABS_API_KEY: "elevenlabs-test-key" });
    let thrown: unknown;
    try {
      requireEnv(env, "anthropicApiKey");
    } catch (error) {
      thrown = error;
    }
    const serialized = [
      String(thrown),
      JSON.stringify(thrown),
      thrown instanceof Error ? thrown.stack : "",
    ].join("\n");
    expect(serialized).not.toContain("elevenlabs-test-key");
  });
});
