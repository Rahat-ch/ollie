/**
 * Write one Story through the Generation seam and keep it only if the
 * validator allows it; otherwise try again, a bounded number of times, and
 * then use the template sentence so play never waits on the model.
 */
import type { Generation, StoryInput } from "@/generation/types";
import { templateStory } from "./template";
import { validateStory } from "./validate";

/** How many times the model is asked before the template sentence is used. */
export const STORY_ATTEMPTS = 3;

export type StoryRejection = {
  readonly attempt: number;
  /** What the model wrote; absent when the call threw. */
  readonly text?: string;
  readonly reasons: readonly string[];
};

export type WrittenStory = {
  readonly text: string;
  /** `story` when the model's Story passed; `template` when every attempt failed. */
  readonly source: "story" | "template";
  readonly rejections: readonly StoryRejection[];
};

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export async function writeValidStory(generation: Pick<Generation, "writeStory">, input: StoryInput): Promise<WrittenStory> {
  const rejections: StoryRejection[] = [];
  for (let attempt = 1; attempt <= STORY_ATTEMPTS; attempt++) {
    let text: string;
    try {
      ({ text } = await generation.writeStory(input));
    } catch (error) {
      rejections.push({ attempt, reasons: [errorMessage(error)] });
      continue;
    }
    const verdict = validateStory(text, input);
    if (verdict.ok) return { text, source: "story", rejections };
    rejections.push({ attempt, text, reasons: verdict.reasons });
  }
  return { text: templateStory(input), source: "template", rejections };
}
