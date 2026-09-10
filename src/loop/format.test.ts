import { describe, expect, it } from "vitest";
import { DIAGNOSTIC_PLAN, newProfile, runSession, scripted } from "@/loop";
import { formatEquation, formatSessionLog, formatSessionSummary } from "@/loop/format";

describe("formatEquation", () => {
  it("blanks the unknown", () => {
    expect(formatEquation({ left: 7, op: "+", right: 3, result: 10, unknown: "right" })).toBe("7 + ? = 10");
    expect(formatEquation({ left: 10, op: "-", right: 4, result: 6, unknown: "result" })).toBe("10 - 4 = ?");
  });
});

describe("formatSessionLog", () => {
  const text = formatSessionLog(
    runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-r", scripted("fhr")),
  );

  it("prints every Problem ID with its Assistance State", () => {
    expect(text).toMatch(/p1 .*first-try correct/);
    expect(text).toMatch(/p2 .*Hint-assisted correct/);
    expect(text).toMatch(/p3 .*Revealed/);
    expect(text).toMatch(/p8 .*Revealed/);
  });

  it("prints an Estimate and a Mastery decision per Skill", () => {
    expect(text).toMatch(/Partners to 10 +0\.\d{3} +[01]+ +no/);
    expect(text).toMatch(/Teen numbers as 10 \+ n +0\.\d{3} +[01]+ +no/);
  });
});

describe("formatSessionSummary", () => {
  it("names the Session, the mix, the Review count, first-try count, and every transition", () => {
    const profile = newProfile();
    const skills = { ...profile.skills };
    skills["partners-to-10"] = { estimate: 0.99, recentFirstAttempts: Array(10).fill(true), mastered: true };
    const plan = {
      length: 10,
      skills: [{ skill: "teen-numbers" as const, weight: 1 }],
      reviewShare: 0.2,
      hypothesisUnderTest: null,
    };
    const result = runSession(plan, { ...profile, skills }, "seed-s", scripted("f"));
    const line = formatSessionSummary(result);
    expect(line).toBe(
      "Session 1: teen-numbers x8, review x2; first-try 10/10; Mastered teen-numbers; Unit 2 unlocked",
    );
  });

  it("says when nothing changed", () => {
    const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-s", scripted("fhr"));
    expect(formatSessionSummary(result)).toBe(
      "Session 1: partners-to-10 x3, teen-numbers x3, counting-on x3; first-try 1/9; no change",
    );
  });
});

describe("formatSessionLog with Review Problems", () => {
  it("marks each Review Problem", () => {
    const profile = newProfile();
    const skills = { ...profile.skills };
    skills["partners-to-10"] = { estimate: 0.99, recentFirstAttempts: Array(10).fill(true), mastered: true };
    const plan = { length: 8, skills: [{ skill: "teen-numbers" as const, weight: 1 }], reviewShare: 0.25, hypothesisUnderTest: null };
    const text = formatSessionLog(runSession(plan, { ...profile, skills }, "seed-s", scripted("f")));
    expect(text.match(/partners-to-10 +review/g)).toHaveLength(2);
  });
});
