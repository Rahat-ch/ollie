import { describe, expect, it } from "vitest";
import { abandonSession, answerProblem, currentProblem, DIAGNOSTIC_PLAN, finishSession, getSkill, newProfile, startSession } from "@/loop";
import { profileWithMastered } from "@/loop/testing";
import { masteryRows } from "./mastery";

describe("masteryRows", () => {
  it("lists all seven Skills in progression order under their Units, not started on a fresh Profile", () => {
    const rows = masteryRows(newProfile());
    expect(rows.map((r) => [r.unit, r.name])).toEqual([
      [1, "Partners to 10"],
      [1, "Teen numbers"],
      [2, "Counting on from the larger number"],
      [2, "Make-a-ten within 20"],
      [2, "Subtraction as unknown addend"],
      [3, "Result or total unknown"],
      [3, "Change unknown"],
    ]);
    expect(rows.every((r) => r.state === "not-started")).toBe(true);
  });

  it("shows each Skill's Knowledge Estimate, the hand-set prior on a fresh Profile", () => {
    const rows = masteryRows(newProfile());
    expect(rows[0].estimate).toBe(0.3);
    expect(rows[5].estimate).toBe(0.2);
    expect(rows[6].estimate).toBe(0.15);
  });

  it("is in progress once the Skill has a first attempt, with the Estimate the Loop holds", () => {
    let session = startSession(DIAGNOSTIC_PLAN, newProfile(), "seed-1");
    const problem = currentProblem(session)!;
    session = answerProblem(session, problem.answer, 2000);
    const progress = finishSession(abandonSession(session)).profile;
    const row = masteryRows(progress).find((r) => r.name === getSkill(problem.skill).name)!;
    expect(row.state).toBe("in-progress");
    expect(row.estimate).toBe(progress.skills[problem.skill].estimate);
    expect(row.estimate).toBeGreaterThan(0.3);
  });

  it("marks a Mastered Skill", () => {
    const rows = masteryRows(profileWithMastered("partners-to-10"));
    expect(rows[0]).toMatchObject({ state: "mastered", estimate: 0.99 });
    expect(rows[1].state).toBe("not-started");
  });
});
