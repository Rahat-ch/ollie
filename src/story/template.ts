/**
 * The template sentence: the hand-written Story used when no valid model
 * Story is available, so a Session never waits on generation. One shape per
 * structure (see shapes.ts), counting one of the Theme's things, in the
 * singular where the number is 1. The rich set, which the Story Solver
 * Power opens, has its own sentence per structure, setting the scene where
 * the Theme happens. Never model-written.
 */
import type { StoryInput } from "@/generation/types";
import { storyShape } from "./shapes";
import { themeVocabulary } from "./themes";

/** The Story for `input`, counting the Theme's `thing`-th thing (0 is its first). */
export function templateStory(input: StoryInput, thing = 0): string {
  const { things, where } = themeVocabulary(input.theme);
  const shape = storyShape(input.structure);
  const counted = things[thing % things.length];
  return input.set === "rich"
    ? shape.rich(input.nickname, input.equation, counted, where)
    : shape.template(input.nickname, input.equation, counted);
}
