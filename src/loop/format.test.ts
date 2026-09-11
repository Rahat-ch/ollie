import { describe, expect, it } from "vitest";
import { DIAGNOSTIC_PLAN, newProfile, runSession, scripted } from "@/loop";
import { formatEquation, formatNotes, formatPlan, formatSessionLog, formatSessionLine } from "@/loop/format";
import type { LearnerNotes, SessionPlan } from "@/loop";
import { profileWithMastered } from "@/loop/testing";

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

describe("formatSessionLine", () => {
  it("names the Session, the mix, the Review count, first-try count, and every transition", () => {
    const profile = profileWithMastered("partners-to-10");
    const plan = {
      length: 10,
      skills: [{ skill: "teen-numbers" as const, weight: 1 }],
      reviewShare: 0.2,
      hypothesisUnderTest: null,
    };
    const result = runSession(plan, profile, "seed-s", scripted("f"));
    const line = formatSessionLine(result);
    expect(line).toBe(
      "Session 1: teen-numbers x8, review x2; first-try 10/10; Mastered teen-numbers; Unit 2 unlocked",
    );
  });

  it("says when nothing changed", () => {
    const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-s", scripted("fhr"));
    expect(formatSessionLine(result)).toBe(
      "Session 1: partners-to-10 x3, teen-numbers x3, counting-on x3; first-try 1/9; no change",
    );
  });
});

describe("formatSessionLog with Review Problems", () => {
  it("marks each Review Problem", () => {
    const profile = profileWithMastered("partners-to-10");
    const plan = { length: 8, skills: [{ skill: "teen-numbers" as const, weight: 1 }], reviewShare: 0.25, hypothesisUnderTest: null };
    const text = formatSessionLog(runSession(plan, profile, "seed-s", scripted("f")));
    expect(text.match(/partners-to-10 +review/g)).toHaveLength(2);
  });
});

describe("formatNotes", () => {
  const notes: LearnerNotes = {
    hypotheses: [
      {
        id: "h1",
        claim: "Crossing ten is where first attempts fail",
        status: "supported",
        confidence: 0.75,
        evidence: ["p2", "p3"],
        nextTest: "Ask counting-on past 10",
      },
      { id: "h2", claim: "Partners to 10 are automatic", status: "proposed", confidence: 0.4, evidence: [], nextTest: "Mix in partners-to-10" },
    ],
    strengths: ["Answers partners to 10 quickly", "Uses the ten frame"],
  };

  it("prints a row per Hypothesis with its status, confidence, evidence, claim, and next test", () => {
    const text = formatNotes(notes);
    expect(text).toMatch(/^Learner Notes/);
    expect(text).toMatch(/h1 +supported +0\.75 +p2, p3 +Crossing ten is where first attempts fail +Ask counting-on past 10/);
    expect(text).toMatch(/h2 +proposed +0\.40 +- +Partners to 10 are automatic +Mix in partners-to-10/);
  });

  it("lists each strength", () => {
    const text = formatNotes(notes);
    expect(text).toMatch(/Strengths\n- Answers partners to 10 quickly\n- Uses the ten frame/);
  });

  it("says when there are no Hypotheses yet", () => {
    expect(formatNotes({ hypotheses: [], strengths: [] })).toMatch(/no Hypotheses yet/);
  });
});

describe("formatPlan", () => {
  const plan: SessionPlan = {
    length: 8,
    skills: [
      { skill: "counting-on", weight: 2, numberRange: { min: 5, max: 12 }, structures: ["smaller-first"] },
      { skill: "make-a-ten", weight: 1 },
    ],
    reviewShare: 0.25,
    hypothesisUnderTest: "h1",
  };

  it("prints the length, the review share as a percentage, and the Hypothesis under test", () => {
    const text = formatPlan(plan);
    expect(text).toMatch(/Session Plan/);
    expect(text).toMatch(/8 Problems/);
    expect(text).toMatch(/review share 25%/);
    expect(text).toMatch(/Hypothesis under test: h1/);
  });

  it("prints a row per Skill with its weight, range, and structures", () => {
    const text = formatPlan(plan);
    expect(text).toMatch(/counting-on +2 +5 to 12 +smaller-first/);
    expect(text).toMatch(/make-a-ten +1 +default +all/);
  });

  it("says none when no Hypothesis is under test", () => {
    expect(formatPlan({ ...plan, hypothesisUnderTest: null })).toMatch(/Hypothesis under test: none/);
  });
});
