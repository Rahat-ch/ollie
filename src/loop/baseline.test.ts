import { describe, expect, it } from "vitest";
import { alwaysFirstTry, baselinePlan, DIAGNOSTIC_PLAN, isDiagnosticPlan, newProfile, runSession, scripted, validatePlan } from "@/loop";
import type { SkillId } from "@/loop";
import { profileWithMastered } from "@/loop/testing";

describe("baselinePlan", () => {
  it("is the Diagnostic Session while no Session has been completed", () => {
    expect(baselinePlan(newProfile())).toBe(DIAGNOSTIC_PLAN);
  });

  it("then gives 6 Problems from the first unmastered Skill, alone while nothing can be reviewed", () => {
    const after = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-b", alwaysFirstTry).profile;
    expect(baselinePlan(after)).toEqual({
      length: 6,
      skills: [{ skill: "partners-to-10", weight: 1 }],
      reviewShare: 0,
      hypothesisUnderTest: null,
    });
  });

  it("adds 2 Review Problems once another Skill is Mastered", () => {
    const profile = { ...profileWithMastered("partners-to-10"), sessionsCompleted: 1 };
    const plan = baselinePlan(profile);
    expect(plan).toEqual({
      length: 8,
      skills: [{ skill: "teen-numbers", weight: 1 }],
      reviewShare: 0.25,
      hypothesisUnderTest: null,
    });
    const problems = runSession(plan, profile, "seed-b", alwaysFirstTry).log.entries.map((e) => e.problem);
    expect(problems.filter((p) => p.skill === "teen-numbers" && !p.review)).toHaveLength(6);
    expect(problems.filter((p) => p.skill === "partners-to-10" && p.review)).toHaveLength(2);
  });

  it("advances to the next Skill only when the current one is Mastered", () => {
    let profile = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-b", alwaysFirstTry).profile;
    const current = () => baselinePlan(profile).skills[0].skill;

    profile = runSession(baselinePlan(profile), profile, "seed-b", scripted("frrrrr")).profile;
    expect(current()).toBe("partners-to-10");

    profile = runSession(baselinePlan(profile), profile, "seed-b", alwaysFirstTry).profile;
    expect(profile.skills["partners-to-10"].mastered).toBe(false);
    expect(current()).toBe("partners-to-10");

    profile = runSession(baselinePlan(profile), profile, "seed-b", alwaysFirstTry).profile;
    expect(profile.skills["partners-to-10"].mastered).toBe(true);
    expect(current()).toBe("teen-numbers");
  });

  it("walks every Skill in progression order and stays on the last one once all are Mastered", () => {
    let profile = newProfile();
    const visited: SkillId[] = [];
    for (let i = 0; i < 12; i++) {
      const plan = baselinePlan(profile);
      if (!isDiagnosticPlan(plan)) visited.push(plan.skills[0].skill);
      profile = runSession(plan, profile, `seed-walk-${i}`, alwaysFirstTry).profile;
    }
    expect([...new Set(visited)]).toEqual([
      "partners-to-10",
      "teen-numbers",
      "counting-on",
      "make-a-ten",
      "unknown-addend",
    ]);
    expect(visited.at(-1)).toBe("unknown-addend");
    expect(Object.values(profile.skills).every((s) => s.mastered)).toBe(true);
  });

  it("always plans inside the Plan Space after the Diagnostic", () => {
    let profile = newProfile();
    for (let i = 0; i < 15; i++) {
      const plan = baselinePlan(profile);
      if (!isDiagnosticPlan(plan)) expect(validatePlan(plan, profile)).toEqual({ ok: true });
      profile = runSession(plan, profile, `seed-space-${i}`, scripted(i % 3 === 0 ? "fhfffrff" : "f")).profile;
    }
  });
});
