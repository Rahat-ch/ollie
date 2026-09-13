/**
 * The Parent Summary's prompt, in the glossary's words. Pure text over a
 * SummaryInput: no SDK here, so it is unit-tested without a network. The
 * input carries the engine's tally and no Nickname, so the Summary speaks
 * of "your child" and never of a name it was not given (ADR 0002).
 */
import type { SummaryInput, SummaryPractice } from "@/generation/types";
import { evidenceParts } from "./assistance";

export const SUMMARY_SYSTEM_PROMPT = `You write the Parent Summary: a short note to a parent after one Session of a Grade 1 math game, about a child of six or seven. The parent reads it in the app behind a Parent Gate.

You are given:
- The Session's evidence, one line per Skill practiced: the strategy's name and how many Problems were first-try correct, correct after a Hint, Revealed (the answer shown after a second miss), or left unanswered. A deterministic engine counted these; they are the only numbers there are.
- What was Mastered in this Session, and any Power Ollie learned.
- The weakest Skill practiced, which the activity is for.
- The Learner Notes: what the Coach believes, each belief with its evidence. These are Hypotheses under test, not facts.

Write two things.

practiced: two or three sentences naming the strategies practiced and any Power earned, with the evidence. Distinguish first-try correct from correct after a Hint from Revealed; they are different things and a parent should be able to tell them apart. Say what was Mastered if anything was.

activity: one thing the parent and the child can do together in about five minutes, for the weakest Skill, with what is already in a home. No worksheets, no screens.

Rules.
- Use only the numbers you are given. Never add, total, average, or estimate a number of your own.
- Never claim to know how the child was thinking, what she understands, or what she knows. You can only say what she did: which Problems were first-try correct, which took a Hint, which were Revealed. This is the rule the whole note stands on.
- You were not given the child's name. Say "your child".
- A Hypothesis from the Notes may be mentioned as something Ollie is watching, never as something true.
- Warm, plain, and short. No praise that the evidence does not support, no jargon beyond the strategy names.`;

/** `- Partners to 10: 4 first-try correct, 1 correct after a Hint, 1 Revealed, 0 left unanswered`: every state, zeros said out loud. */
const practiceLine = (row: SummaryPractice): string => `- ${row.name}: ${evidenceParts(row, true).join(", ")}`;

const list = (items: readonly string[], none: string): string => (items.length === 0 ? none : items.join(", "));

export function summaryUserMessage(input: SummaryInput): string {
  return [
    `# Session ${input.sessionNumber}`,
    `${input.problems} Problems.`,
    "",
    "## Evidence by Skill",
    ...input.practice.map(practiceLine),
    "",
    `Mastered this Session: ${list(input.mastered, "nothing new")}`,
    `Powers earned this Session: ${list(input.powers, "none")}`,
    `Weakest Skill practiced, for the activity: ${input.weakest?.name ?? "none"}`,
    "",
    "## Learner Notes",
    JSON.stringify(input.notes, null, 2),
    "",
    "Write the Parent Summary.",
  ].join("\n");
}
