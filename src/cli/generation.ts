/**
 * Which Generation a CLI runs on: the fake, the Anthropic adapter, or the
 * ElevenLabs one; and which Judge. The adapters are imported only when asked
 * for, so a fake run never loads a network client; they read
 * ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, and ELEVENLABS_VOICE_ID from the
 * environment, or from .env.local at the repo root when that file exists.
 */
import { existsSync } from "node:fs";
import type { CoachGeneration } from "@/evals/evals";
import { fakeJudge, type Judge } from "@/evals/judge";
import { fakeGeneration } from "@/generation";
import { readEnv, requireEnv, type Env } from "@/lib/env";
import { voiceRenderer, type VoiceRenderer } from "@/lib/voice-renderer";

export type Mode = "fake" | "real";

/** The environment, with .env.local read over it when the repo has one. */
function localEnv(): Env {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  return readEnv();
}

/** ANTHROPIC_API_KEY from the environment or .env.local; throws when neither has it. */
export function anthropicApiKey(): string {
  return requireEnv(localEnv(), "anthropicApiKey");
}

/** ELEVENLABS_API_KEY from the environment or .env.local, for designing the voice in the first place. */
export function elevenLabsApiKey(): string {
  return requireEnv(localEnv(), "elevenLabsApiKey");
}

/** The fake, or the real adapter, with the names a report records for the Coach and the Story writer. */
export async function chooseGeneration(mode: Mode): Promise<CoachGeneration & { readonly storyName: string }> {
  if (mode === "fake") return { generation: fakeGeneration(), name: "fake", storyName: "fake" };
  const apiKey = anthropicApiKey();
  const { anthropicGeneration, COACH_MODEL, STORY_MODEL } = await import("@/generation/anthropic");
  return { generation: anthropicGeneration({ apiKey }), name: COACH_MODEL, storyName: STORY_MODEL };
}

/** The fake renderer, or the same ElevenLabs renderer the speech route uses, with the name a run records. */
export async function chooseRenderer(mode: Mode): Promise<VoiceRenderer> {
  if (mode === "fake") return { renderer: fakeGeneration(), name: "fake" };
  return voiceRenderer(localEnv());
}

/** The fake Judge (the validator's opinion, which fails calibration by design), or Opus 5 with the rubric. */
export async function chooseJudge(mode: Mode): Promise<{ readonly judge: Judge; readonly name: string }> {
  if (mode === "fake") return { judge: fakeJudge, name: "fake" };
  const apiKey = anthropicApiKey();
  const { anthropicJudge, JUDGE_MODEL } = await import("@/evals/judge-anthropic");
  return { judge: anthropicJudge({ apiKey }), name: JUDGE_MODEL };
}
