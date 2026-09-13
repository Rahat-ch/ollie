/**
 * The Story writer's prompt, in the glossary's words. Pure text over a
 * StoryInput: no SDK here, so it is unit-tested without a network. The
 * model is told the numbers and what happens to them, never the answer.
 */
import type { StoryInput } from "@/generation/types";
import { MAX_STORY_WORDS, STORY_SENTENCES } from "./validate";
import { CORE_WORDS, themeVocabulary } from "./themes";

export const STORY_SYSTEM_PROMPT = `You write one word problem for a Grade 1 child, age 6 or 7, who will hear it read aloud and cannot read it.

Rules, every one checked by a program:
- Exactly ${STORY_SENTENCES === 2 ? "two sentences" : `${STORY_SENTENCES} sentences`}. The second sentence is the question and ends with a question mark.
- Fewer than ${MAX_STORY_WORDS} words in all.
- Use the child's name exactly as given, once or more, spelled exactly the same.
- Write every number as digits (7, not seven). Use exactly the numbers given, each once, and no other number. Never say or hint at the answer.
- Use only the allowed words listed, plus the child's name and the digits. No other word, in any form. No made-up names.
- Simple sentences, present or past tense, things a 6-year-old knows.

Return only the Story text.`;

/** What happens to the things, with the numbers the Learner is told and never the answer. */
export function describeProblem(input: StoryInput): string {
  const { left, right, result } = input.equation;
  switch (input.structure) {
    case "add-to":
      return `There are ${left} at the start. Then ${right} more come. Ask how many there are now.`;
    case "take-from":
      return `There are ${left} at the start. Then ${right} go away. Ask how many are left.`;
    case "put-together":
      return `There are ${left} of one kind and ${right} of another kind. Ask how many there are altogether.`;
    case "add-to-change":
      return `There are ${left} at the start. Some more come, and now there are ${result}. Ask how many came. Never say how many came.`;
    case "take-from-change":
      return `There are ${left} at the start. Some go away, and now there are ${result}. Ask how many went away. Never say how many went away.`;
    default:
      throw new Error(`No Story shape for ${input.skill} structure ${input.structure}`);
  }
}

export function storyUserMessage(input: StoryInput): string {
  const { things, words } = themeVocabulary(input.theme);
  return [
    `Theme: ${input.theme}. Count ${things.map((t) => t.many).join(" or ")}, or another thing from the Theme's words.`,
    `The child's name, to write exactly: ${input.nickname}`,
    "",
    "The problem:",
    describeProblem(input),
    "",
    "Allowed words (and no others):",
    [...CORE_WORDS, ...things.flatMap((t) => [t.one, t.many]), ...words].join(" "),
    "",
    "Write the Story.",
  ].join("\n");
}
