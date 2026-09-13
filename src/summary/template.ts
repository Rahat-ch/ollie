/**
 * The hand-written Parent Summary, used when every attempt at the model's
 * was rejected. It says exactly what the engine tallied and nothing more,
 * so a Parent always gets a note and no Session ever blocks on a model.
 */
import type { SkillId } from "@/loop";
import type { SummaryInput, SummaryOutput, SummaryPractice } from "@/generation/types";

/** Five minutes with what is in the kitchen, one per Skill. Hand-written, never model-written. */
export const BEDTIME_ACTIVITY: Readonly<Record<SkillId, string>> = {
  "partners-to-10": "Put ten spoons on the table, hide some under a cloth, and take turns saying how many are hiding.",
  "teen-numbers": "Count out a teen number of buttons, group ten of them together, and say the number as ten and some more.",
  "counting-on": "Say a number, then count on two or three more together on your fingers without starting again at one.",
  "make-a-ten": "With a bowl of nine raisins, add some more and talk about how many it takes to fill the bowl to ten first.",
  "unknown-addend": "Hold a few socks behind your back, show the rest, and take turns working out how many are hidden.",
  "result-unknown": "Tell a two-sentence story at bedtime about toys arriving or leaving, and let your child say how many there are now.",
  "change-unknown": "Line up some crayons, take a few away when your child looks away, and work out together how many went missing.",
};

/** `1 first-try correct, 2 with a Hint, 1 Revealed`: only the states that happened. */
function evidenceLine(row: SummaryPractice): string {
  const parts = [
    row.firstTryCorrect > 0 ? `${row.firstTryCorrect} first-try correct` : "",
    row.hintAssisted > 0 ? `${row.hintAssisted} correct after a Hint` : "",
    row.revealed > 0 ? `${row.revealed} Revealed` : "",
    row.unresolved > 0 ? `${row.unresolved} left unanswered` : "",
  ].filter((part) => part !== "");
  return `${row.name}: ${parts.join(", ")}`;
}

export function templateSummary(input: SummaryInput): SummaryOutput {
  const practiced = [
    `Your child answered ${input.problems} Problems in this Session.`,
    ...input.practice.map((row) => `${evidenceLine(row)}.`),
    input.mastered.length > 0 ? `Mastered: ${input.mastered.join(", ")}.` : "",
    input.powers.length > 0 ? `Ollie learned ${input.powers.join(", ")}.` : "",
  ]
    .filter((part) => part !== "")
    .join(" ");
  const activity = input.weakest
    ? `${input.weakest.name} is the one to practise. ${BEDTIME_ACTIVITY[input.weakest.skill]}`
    : "Play a Session together tomorrow and let your child show you how Ollie asks the Problems.";
  return { practiced, activity };
}
