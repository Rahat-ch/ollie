/**
 * The deterministic check every Story passes before a Learner hears it:
 * the Nickname is there, it is two sentences ending in a question, under
 * the word limit, it says exactly the engine's numbers and no other, and
 * it uses only its Theme's words. The model dresses the numbers; it never
 * gets to change them (ADR 0001).
 */
import type { Equation } from "@/loop";
import type { StoryInput } from "@/generation/types";
import { allowedWords } from "./themes";

/** A Story has fewer words than this. */
export const MAX_STORY_WORDS = 25;

export const STORY_SENTENCES = 2;

export type StoryValidation = { readonly ok: true } | { readonly ok: false; readonly reasons: readonly string[] };

/** Stands in for the Nickname while the words are counted and checked, so a two-word Nickname is one word and never a vocabulary miss. */
const MARKER = "NICKNAME";

/** The values the Learner is told: every slot but the unknown. */
export function knownNumbers(equation: Equation): number[] {
  const slots = ["left", "right", "result"] as const;
  return slots.filter((slot) => slot !== equation.unknown).map((slot) => equation[slot]);
}

const ascending = (numbers: readonly number[]): number[] => [...numbers].sort((a, b) => a - b);
const list = (numbers: readonly number[]): string => (numbers.length === 0 ? "none" : numbers.join(", "));

const sentencesOf = (text: string): string[] =>
  text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

/** Lower case, outer punctuation gone, a possessive stripped: "Mia's," is "mia". */
const normalise = (token: string): string =>
  token
    .toLowerCase()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .replace(/'s$/, "");

export function validateStory(text: string, input: StoryInput): StoryValidation {
  const reasons: string[] = [];
  if (!text.includes(input.nickname)) reasons.push(`the Nickname ${input.nickname} is missing`);
  const marked = text.split(input.nickname).join(MARKER).trim();

  const sentences = sentencesOf(marked);
  if (sentences.length !== STORY_SENTENCES) {
    reasons.push(`${sentences.length} sentence${sentences.length === 1 ? "" : "s"} instead of ${STORY_SENTENCES}`);
  }
  if (marked.length > 0 && !marked.endsWith("?")) reasons.push("the second sentence is not a question");

  const tokens = marked.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length >= MAX_STORY_WORDS) reasons.push(`${tokens.length} words; a Story has fewer than ${MAX_STORY_WORDS}`);

  const found = ascending((marked.match(/\d+/g) ?? []).map(Number));
  const expected = ascending(knownNumbers(input.equation));
  if (found.join(",") !== expected.join(",")) reasons.push(`the numbers are ${list(found)} instead of ${list(expected)}`);

  const allowed = allowedWords(input.theme);
  const outside: string[] = [];
  for (const token of tokens) {
    const word = normalise(token);
    if (word === "" || word === MARKER.toLowerCase() || /^\d+$/.test(word) || allowed.has(word)) continue;
    if (!outside.includes(word)) outside.push(word);
  }
  if (outside.length > 0) reasons.push(`not in the ${input.theme} vocabulary: ${outside.join(", ")}`);

  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}
