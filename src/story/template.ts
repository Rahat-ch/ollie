/**
 * The template sentence: the hand-written Story used when no valid model
 * Story is available, so a Session never waits on generation. One shape per
 * structure, counting one of the Theme's things. Never model-written.
 */
import type { StoryInput } from "@/generation/types";
import { themeVocabulary } from "./themes";

/** The Story for `input`, counting the Theme's `thing`-th thing (0 is its first), in the singular where the number is 1. */
export function templateStory(input: StoryInput, thing = 0): string {
  const { things } = themeVocabulary(input.theme);
  const { one, many } = things[thing % things.length];
  const n = (count: number): string => `${count} ${count === 1 ? one : many}`;
  const who = input.nickname;
  const { left, right, result } = input.equation;
  switch (input.structure) {
    case "add-to":
      return `${who} has ${n(left)}. ${right} more ${right === 1 ? `${one} comes` : `${many} come`}, so how many ${many} are there now?`;
    case "take-from":
      return `${who} has ${n(left)}. ${n(right)} ${right === 1 ? "goes" : "go"} away, so how many ${many} are left?`;
    case "put-together":
      return `${who} sees ${n(left)} and then ${n(right)} more. How many ${many} are there altogether?`;
    case "add-to-change":
      return `${who} had ${n(left)}. Now there are ${n(result)}, so how many ${many} came?`;
    case "take-from-change":
      return `${who} had ${n(left)}. Now there ${result === 1 ? "is" : "are"} ${n(result)}, so how many ${many} went away?`;
    default:
      throw new Error(`No template sentence for ${input.skill} structure ${input.structure}`);
  }
}
