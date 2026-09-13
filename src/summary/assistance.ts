/**
 * The Parent's words for the four Assistance States, written once and used
 * wherever a Parent (or the Judge reading for one) meets a piece of
 * evidence: the Summary's prose and its template, the prompt and the Judge's
 * rubric message, and Ollie's Notebook. The Learner never reads these; they
 * are the glossary's states put into a sentence for an adult.
 */
import type { AssistanceState } from "@/loop";
import type { SummaryPractice } from "@/generation/types";

export const ASSISTANCE_WORDS: Readonly<Record<AssistanceState, string>> = {
  "first-try-correct": "first-try correct",
  "hint-assisted-correct": "correct after a Hint",
  revealed: "Revealed",
  unresolved: "left unanswered",
};

/** Which count of a practice row each Assistance State is kept in. */
export const COUNT_OF: Readonly<Record<AssistanceState, keyof Omit<SummaryPractice, "skill" | "name">>> = {
  "first-try-correct": "firstTryCorrect",
  "hint-assisted-correct": "hintAssisted",
  revealed: "revealed",
  unresolved: "unresolved",
};

const STATES = Object.keys(ASSISTANCE_WORDS) as AssistanceState[];

/**
 * `4 first-try correct`, `1 correct after a Hint`: one part per Assistance
 * State the Session actually had, or every state when `all` is set, which is
 * what the model and the Judge are shown so that a zero is said out loud.
 */
export function evidenceParts(row: SummaryPractice, all = false): string[] {
  return STATES.flatMap((state) => {
    const count = row[COUNT_OF[state]];
    return all || count > 0 ? [`${count} ${ASSISTANCE_WORDS[state]}`] : [];
  });
}
