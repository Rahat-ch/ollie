/**
 * The Coach's prompt, in the glossary's words. Pure text over a CoachInput:
 * no SDK here, so it is unit-tested without a network. The input already
 * carries no Problem, no number to ask, and no answer (see CoachEvidence);
 * the prompt renders what it is given and nothing else.
 */
import { describeRange } from "@/loop";
import type { CoachEvidence, CoachInput } from "./types";

export const COACH_SYSTEM_PROMPT = `You are the Coach in a Grade 1 math game. You run once, after a Session, and you never speak to the Learner.

You are given:
- The Session's evidence, one line per Problem: its ID, Skill, structure, the equation with its unknown blanked, whether it was planned or a Review Problem, its position, its Assistance State, and the first-try response time.
- The Learner Notes as they stood before this Session: Hypotheses and strengths.
- The Knowledge Estimates: the engine's per-Skill probability that the Learner knows the Skill, updated from first attempts only.
- The Plan Space: the only levers you may set and their bounds.

You do two things: rewrite the Learner Notes, and write the next Session Plan.

Learner Notes
- A Hypothesis is one belief about how the Learner is learning: a claim, a status, a confidence from 0 to 1, evidence, and a next test.
- Evidence is Problem IDs only, taken from this Session's evidence or already cited in the Notes. Never cite anything else. A Hypothesis citing an unknown Problem is rejected.
- Keep Hypothesis ids stable across Sessions. Update a Hypothesis's status, confidence, evidence, and next test rather than writing a duplicate. Never delete a Hypothesis; mark it refuted instead.
- Status: proposed means the pattern was seen once or twice; supported means it repeated on the first try under a test; refuted means the test showed the opposite.
- A first-try miss, a Hint-assisted success, and a Reveal are different kinds of evidence. Say which one you are relying on. Only the first attempt reaches the Knowledge Estimate; the rest is evidence for you.
- Response time is context only. It is never a claim about ability, and it never lowers Mastery.
- Never claim to know how the Learner was thinking. Describe what the evidence shows.
- Strengths are plain English and need no evidence; they are not claims under test.

Session Plan
- Use only the levers in the Plan Space, inside the bounds given. The Skills listed are the only ones unlocked.
- A number range may only narrow a Skill's standard range. Structures come only from the Skill's list. Leave a range or structures out to allow all of them.
- Length is 6 to 10. Review share is 0 to 1. At most one entry per Skill; a weight is a positive number giving that Skill's relative share.
- hypothesisUnderTest is the id of one Hypothesis in the Notes, or null.
- A Plan outside the Plan Space is rejected with reasons. If your previous output was rejected, the message says so and lists every reason; fix all of them.

You never write a Problem, choose a number to ask, or give an answer. The engine does that.`;

function evidenceLine(entry: CoachEvidence): string {
  const kind = entry.review ? "review" : "planned";
  const time = entry.firstTryMs === null ? "no first try" : `first try ${entry.firstTryMs} ms`;
  return `- ${entry.id} | ${entry.skill} | ${entry.structure} | ${entry.equation} | ${kind} | position ${entry.position} | ${entry.assistance} | ${time}`;
}

function rejectedSection(rejected: NonNullable<CoachInput["rejected"]>): string {
  return [
    "## Your previous output was rejected",
    "The engine rejected the output below for these reasons:",
    ...rejected.reasons.map((reason) => `- ${reason}`),
    "",
    ...(rejected.output
      ? ["Rejected output:", JSON.stringify(rejected.output, null, 2)]
      : ["The call failed before any output was returned."]),
    "",
    "Write a corrected output that fixes every reason.",
    "",
  ].join("\n");
}

export function coachUserMessage(input: CoachInput): string {
  const evidence = input.evidence.map(evidenceLine);
  const estimates = Object.entries(input.estimates).map(
    ([skill, state]) =>
      `- ${skill}: estimate ${state.estimate.toFixed(2)}, last first attempts ${state.recentFirstAttempts.length === 0 ? "none" : state.recentFirstAttempts.map((ok) => (ok ? "correct" : "miss")).join(", ")}, ${state.mastered ? "Mastered" : "not Mastered"}`,
  );
  const planSpace = input.planSpace.skills.map(
    (skill) =>
      `- ${skill.skill} (${skill.name}, Unit ${skill.unit}, ${skill.mastered ? "Mastered" : "not Mastered"}): structures ${skill.structures.join(", ")}; number range ${describeRange(skill.numberRange)} for ${skill.rangeOf}`,
  );
  const sections = [
    `# Session ${input.sessionNumber}`,
    "",
    "## Evidence",
    "One line per Problem: ID | Skill | structure | equation | planned or review | position | Assistance State | first-try response time (context only).",
    ...evidence,
    "",
    "## Learner Notes before this Session",
    JSON.stringify(input.notes, null, 2),
    "",
    "## Knowledge Estimates",
    ...estimates,
    "",
    "## Plan Space",
    ...planSpace,
    `- Length: ${describeRange(input.planSpace.length)} Problems`,
    `- Review share: ${describeRange(input.planSpace.reviewShare)}`,
    "",
  ];
  if (input.rejected) sections.push(rejectedSection(input.rejected));
  sections.push("Rewrite the Learner Notes and write the next Session Plan.");
  return sections.join("\n");
}
