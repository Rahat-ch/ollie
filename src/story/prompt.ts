/**
 * The Story writer's prompt, in the glossary's words. Pure text over a
 * StoryInput: no SDK here, so it is unit-tested without a network. The
 * model is told the numbers and what happens to them, never the answer.
 */
import type { StoryInput } from "@/generation/types";
import { storyShape } from "./shapes";
import { CORE_WORDS, themeVocabulary } from "./themes";
import { MAX_STORY_WORDS, STORY_SENTENCES } from "./validate";

export const STORY_SYSTEM_PROMPT = `You write one word problem for a Grade 1 child, age 6 or 7, who will hear it read aloud and cannot read it.

Rules, every one checked by a program:
- Exactly ${STORY_SENTENCES === 2 ? "two sentences" : `${STORY_SENTENCES} sentences`}. The second sentence is the question and ends with a question mark.
- Fewer than ${MAX_STORY_WORDS} words in all.
- Use the child's Nickname exactly as given, once or more, spelled exactly the same.
- Write every number as digits (7, not seven). Use exactly the numbers given, each once, and no other number. Never say or hint at the answer.
- Use only the allowed words listed, plus the Nickname and the digits. No other word, in any form. No made-up names for anyone or anything.
- Simple sentences, present or past tense, things a 6-year-old knows.

Return only the Story text.`;

/** What happens to the things, with the numbers the Learner is told and never the answer. */
export const describeProblem = (input: StoryInput): string => storyShape(input.structure).describe(input.equation);

export function storyUserMessage(input: StoryInput): string {
  const { things, words, where } = themeVocabulary(input.theme);
  return [
    `Theme: ${input.theme}. Count ${things.map((t) => t.many).join(" or ")}, or another thing from the Theme's words.`,
    // The rich set is the same Problem told as a scene: the Story Solver
    // Power opens it, and it is pooled apart from the plain set.
    ...(input.set === "rich" ? [`Say where it happens (${where}) and what the things are doing, inside the same rules.`] : []),
    `The child's Nickname, to write exactly: ${input.nickname}`,
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
