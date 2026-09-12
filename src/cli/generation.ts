/**
 * Which Generation a CLI runs the Coach on: the fake, or the Anthropic
 * adapter. The adapter is imported only when asked for, so a fake run never
 * loads the SDK; it reads ANTHROPIC_API_KEY from the environment, or from
 * .env.local at the repo root when that file exists.
 */
import { existsSync } from "node:fs";
import type { CoachGeneration } from "@/evals/evals";
import { fakeGeneration } from "@/generation";
import { readEnv, requireEnv } from "@/lib/env";

/** The fake, or the real adapter, with the name a report records for it. */
export async function chooseGeneration(mode: "fake" | "real"): Promise<CoachGeneration> {
  if (mode === "fake") return { generation: fakeGeneration(), name: "fake" };
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const apiKey = requireEnv(readEnv(), "anthropicApiKey");
  const { anthropicGeneration, COACH_MODEL } = await import("@/generation/anthropic");
  return { generation: anthropicGeneration({ apiKey }), name: COACH_MODEL };
}
