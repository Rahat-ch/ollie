import { describe, expect, it } from "vitest";
import { DIAGNOSTIC_PLAN, newProfile, runSession, scripted } from "@/loop";
import { summaryInput } from "./summary";
import { ASSISTANCE_WORDS } from "./assistance";
import { SUMMARY_SYSTEM_PROMPT, summaryUserMessage } from "./prompt";

const notes = {
  hypotheses: [
    {
      id: "h1",
      claim: "May need more practice with partners to 10",
      status: "proposed" as const,
      confidence: 0.4,
      evidence: ["p3", "p4"],
      nextTest: "Give 3 more partners to 10 Problems",
    },
  ],
  strengths: ["Counting on: every first try correct"],
};

const input = summaryInput(runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-s", scripted("ffhrfffhf")), notes, ["Count-On Flight"]);

describe("summaryUserMessage", () => {
  it("gives the writer the engine's tally by Assistance State, the Power, and the Notes", () => {
    const message = summaryUserMessage(input);

    expect(message).toContain("# Session 1");
    expect(message).toContain("9 Problems.");
    expect(message).toContain("- Partners to 10: 1 first-try correct, 1 correct after a Hint, 1 Revealed, 0 left unanswered");
    expect(message).toContain("Powers earned this Session: Count-On Flight");
    expect(message).toContain("Weakest Skill practiced, for the activity: Partners to 10");
    expect(message).toContain("May need more practice with partners to 10");
  });

  it("names every Assistance State, so a Summary can tell them apart", () => {
    const message = summaryUserMessage(input);

    for (const word of Object.values(ASSISTANCE_WORDS)) expect(message, word).toContain(word);
  });

  it("sends no Nickname, no Problem, and no answer", () => {
    const message = summaryUserMessage(input);

    expect(message).not.toContain("nickname");
    expect(message).not.toContain('"answer"');
    expect(message).not.toContain('"spoken"');
  });

  it("says nothing was Mastered and no Power was earned when none was", () => {
    const plain = summaryUserMessage({ ...input, mastered: [], powers: [] });

    expect(plain).toContain("Mastered this Session: nothing new");
    expect(plain).toContain("Powers earned this Session: none");
  });
});

describe("SUMMARY_SYSTEM_PROMPT", () => {
  it("names every Assistance State in the words the Parent will read them in", () => {
    for (const word of Object.values(ASSISTANCE_WORDS)) expect(SUMMARY_SYSTEM_PROMPT, word).toContain(word);
  });

  it("asks for the two parts the seam expects and for no name it was not given", () => {
    for (const part of ["practiced", "activity"] as const) expect(SUMMARY_SYSTEM_PROMPT, part).toContain(`${part}:`);
    expect(SUMMARY_SYSTEM_PROMPT).toContain("your child");
    expect(SUMMARY_SYSTEM_PROMPT.toLowerCase()).not.toContain("nickname");
  });
});
