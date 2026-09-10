import { describe, expect, it } from "vitest";
import { DIAGNOSTIC_PLAN, newProfile, runSession, scripted } from "@/loop";
import { formatEquation, formatSessionLog } from "@/loop/format";

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
