/**
 * Which Generation a CLI runs the Coach on: the fake, or the Anthropic
 * adapter. The adapter is imported only when asked for, so a fake run never
 * loads the SDK; it reads ANTHROPIC_API_KEY from the environment, or from
 * .env.local at the repo root when that file exists.
 */
import { existsSync } from "node:fs";
import { fakeGeneration, type Generation } from "@/generation";
import { readEnv, requireEnv } from "@/lib/env";

export type ChosenGeneration = {
  readonly generation: Generation;
  /** `fake`, or the model id the Coach runs on. */
  readonly name: string;
  readonly description: string;
};

export async function chooseGeneration(real: boolean): Promise<ChosenGeneration> {
  if (!real) {
    return { generation: fakeGeneration(), name: "fake", description: "the fake (no network)" };
  }
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const apiKey = requireEnv(readEnv(), "anthropicApiKey");
  const { anthropicGeneration, COACH_MODEL } = await import("@/generation/anthropic");
  return {
    generation: anthropicGeneration({ apiKey }),
    name: COACH_MODEL,
    description: `the Anthropic adapter on ${COACH_MODEL}`,
  };
}
