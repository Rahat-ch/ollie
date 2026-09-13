/**
 * The deterministic check every Parent Summary passes before a Parent reads
 * it. Two things a rubric cannot be trusted with at run time: the Summary
 * may say no number the engine did not give it, and it may never claim to
 * know how the Learner was thinking (user stories 35 and 36). What is left
 * is prose, which the Judge grades in the eval command.
 *
 * The numbers are checked in `practiced` alone: that is where the claims
 * about the Session are. The activity is a thing to do together — "count
 * out ten spoons" is not a claim about the Log — so only the words are
 * checked there.
 */
import type { SummaryInput, SummaryOutput } from "@/generation/types";

export const MAX_PRACTICED_WORDS = 120;
export const MAX_ACTIVITY_WORDS = 60;

export type SummaryValidation = { readonly ok: true } | { readonly ok: false; readonly reasons: readonly string[] };

/**
 * Claims about the Learner's mind rather than her answers. A Summary
 * describes what the Log shows; anything here is the overreach the spec
 * forbids, whichever way round the sentence puts it.
 */
const MIND_READING = [
  "thinking",
  "thinks",
  "thought",
  "understands",
  "understood",
  "understanding",
  "knows",
  "knew",
  "realised",
  "realized",
  "figured out",
  "worked it out in her head",
  "worked it out in his head",
  "in her head",
  "in his head",
  "confused",
  "remembers",
  "remembered",
  "believes",
  "grasps",
  "grasped",
  "guessing",
  "counting on her fingers",
  "counting on his fingers",
];

const NUMBER_WORDS: Readonly<Record<string, number>> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

const words = (text: string): string[] => text.trim().split(/\s+/).filter((word) => word !== "");

/** The numbers a text says, as digits or as words up to twenty. */
function numbersIn(text: string): number[] {
  const digits = (text.match(/\d+/g) ?? []).map(Number);
  const spelled = words(text.toLowerCase()).flatMap((word) => {
    const value = NUMBER_WORDS[word.replace(/[^a-z]/g, "")];
    return value === undefined ? [] : [value];
  });
  return [...digits, ...spelled];
}

/**
 * Every number the input carried: its counts, the numbers inside the names
 * and claims it holds ("Partners to 10", "a sum that crosses ten"), and the
 * lengths of its lists, which is how a Summary may say "three strategies".
 * Every run of letters in the input is read for a number word, because in
 * JSON there is no whitespace to split on.
 */
export function supportedNumbers(input: SummaryInput): Set<number> {
  const text = JSON.stringify(input);
  const digits = (text.match(/\d+/g) ?? []).map(Number);
  const spelled = (text.toLowerCase().match(/[a-z]+/g) ?? []).flatMap((word) => {
    const value = NUMBER_WORDS[word];
    return value === undefined ? [] : [value];
  });
  // Zero is always supported: "0 Revealed" and "none Revealed" say the same true thing.
  return new Set([0, ...digits, ...spelled, input.practice.length, input.mastered.length, input.powers.length]);
}

function mindReading(text: string): string[] {
  const lower = text.toLowerCase();
  return MIND_READING.filter((phrase) => new RegExp(`\\b${phrase}\\b`).test(lower));
}

function partReasons(part: "practiced" | "activity", text: string, limit: number): string[] {
  const reasons: string[] = [];
  if (text.trim() === "") reasons.push(`${part} is empty`);
  const count = words(text).length;
  if (count > limit) reasons.push(`${part} is ${count} words; keep it to ${limit}`);
  for (const phrase of mindReading(text)) {
    reasons.push(`${part} says "${phrase}", which claims to know how the Learner was thinking`);
  }
  return reasons;
}

export function validateSummary(output: SummaryOutput, input: SummaryInput): SummaryValidation {
  const reasons = [
    ...partReasons("practiced", output.practiced, MAX_PRACTICED_WORDS),
    ...partReasons("activity", output.activity, MAX_ACTIVITY_WORDS),
  ];
  const supported = supportedNumbers(input);
  const unsupported = [...new Set(numbersIn(output.practiced).filter((n) => !supported.has(n)))];
  if (unsupported.length > 0) {
    reasons.push(`practiced says ${unsupported.join(", ")}, which the Session Log does not support`);
  }
  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}
