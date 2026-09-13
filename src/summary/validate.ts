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
 * forbids, whichever way round the sentence puts it. The list grew from the
 * Parent Summary Calibration Set: every phrase a hand-labelled failure used
 * is here, so the Judge is left with what a word list cannot see.
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
  "realises",
  "realized",
  "realizes",
  "figured out",
  "figures out",
  "worked it out in her head",
  "worked it out in his head",
  "in her head",
  "in his head",
  "picturing",
  "pictures",
  "sees that",
  "gets it",
  "has learned",
  "have learned",
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
 * Every number the tally gave the writer: the counts by Skill and Assistance
 * State, the Session number, the Problems, the lengths of its lists (which is
 * how a Summary may say "three strategies"), and the numbers inside the names
 * it may repeat ("Partners to 10", "Make-a-ten within 20"). The Learner Notes
 * are deliberately not a source: a Hypothesis's confidence and the Problem IDs
 * it cites are not numbers a Parent should read as evidence of a Session.
 */
function supportedNumbers(input: SummaryInput): Set<number> {
  const names = [...input.practice.map((row) => row.name), ...input.mastered, ...input.powers, input.weakest?.name ?? ""];
  const counts = input.practice.flatMap((row) => [row.firstTryCorrect, row.hintAssisted, row.revealed, row.unresolved]);
  return new Set([
    // Zero is always supported: "0 Revealed" and "none Revealed" say the same true thing.
    0,
    input.sessionNumber,
    input.problems,
    input.practice.length,
    input.mastered.length,
    input.powers.length,
    ...counts,
    ...numbersIn(names.join(" ")),
  ]);
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
