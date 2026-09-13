import { describe, expect, it } from "vitest";
import { abandonSession, DIAGNOSTIC_PLAN, emptyNotes, finishSession, newProfile, runSession, scripted, startSession } from "@/loop";
import { summaryInput } from "./summary";

/**
 * A Diagnostic Session with p3 Hint-assisted (partners to 10), p4 Revealed
 * (partners to 10), and p8 Hint-assisted (teen numbers); every other
 * Problem first-try correct.
 */
const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-s", scripted("ffhrfffhf"));

const notes = {
  hypotheses: [
    {
      id: "h1",
      claim: "May need more practice with partners to 10",
      status: "proposed" as const,
      confidence: 0.4,
      evidence: ["p3", "p4"],
      nextTest: "Give 3 more partners to 10 Problems and watch the first try",
    },
  ],
  strengths: ["Counting on: every first try correct this Session"],
};

describe("summaryInput", () => {
  it("tallies the Session's evidence by Assistance State per Skill, in progression order", () => {
    const input = summaryInput(result, notes, []);

    expect(input.sessionNumber).toBe(1);
    expect(input.problems).toBe(9);
    expect(input.practice).toEqual([
      { skill: "partners-to-10", name: "Partners to 10", firstTryCorrect: 1, hintAssisted: 1, revealed: 1, unresolved: 0 },
      { skill: "teen-numbers", name: "Teen numbers as 10 + n", firstTryCorrect: 2, hintAssisted: 1, revealed: 0, unresolved: 0 },
      { skill: "counting-on", name: "Counting on from the larger number", firstTryCorrect: 3, hintAssisted: 0, revealed: 0, unresolved: 0 },
    ]);
  });

  it("carries what was Mastered, the Powers earned, and the Notes, and never a Nickname", () => {
    const input = summaryInput(result, notes, ["Count-On Flight"]);

    expect(input.mastered).toEqual([]);
    expect(input.powers).toEqual(["Count-On Flight"]);
    expect(input.notes).toBe(notes);
    expect(JSON.stringify(input)).not.toContain("nickname");
  });

  it("names the weakest Skill practiced as the one to give the Parent an activity for", () => {
    // Partners to 10 ends the Session at the lowest Knowledge Estimate of the three practiced.
    expect(summaryInput(result, notes, []).weakest).toEqual({ skill: "partners-to-10", name: "Partners to 10" });
  });

  it("counts a Problem left unresolved when the Session was abandoned", () => {
    const abandoned = finishSession(abandonSession(startSession(DIAGNOSTIC_PLAN, newProfile(), "seed-s")));
    const input = summaryInput(abandoned, emptyNotes(), []);

    expect(input.problems).toBe(1);
    expect(input.practice).toEqual([
      { skill: "counting-on", name: "Counting on from the larger number", firstTryCorrect: 0, hintAssisted: 0, revealed: 0, unresolved: 1 },
    ]);
  });
});
