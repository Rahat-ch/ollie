import { describe, expect, it } from "vitest";
import { newProfile, planSpace, validatePlan } from "@/loop";
import type { ProfileState, SessionPlan, SkillId } from "@/loop";

function mastered(...skills: SkillId[]): ProfileState {
  const profile = newProfile();
  const states = { ...profile.skills };
  for (const id of skills) {
    states[id] = { estimate: 0.99, recentFirstAttempts: Array(10).fill(true), mastered: true };
  }
  return { ...profile, skills: states };
}

const unit1Done = mastered("partners-to-10", "teen-numbers");

const valid: SessionPlan = {
  length: 8,
  skills: [
    { skill: "counting-on", weight: 2, numberRange: { min: 5, max: 12 }, structures: ["smaller-first"] },
    { skill: "make-a-ten", weight: 1 },
  ],
  reviewShare: 0.25,
  hypothesisUnderTest: "h1",
};

function reasons(plan: SessionPlan, profile: ProfileState = unit1Done): string {
  const verdict = validatePlan(plan, profile);
  return verdict.ok ? "" : verdict.reasons.join("\n");
}

describe("validatePlan", () => {
  it("accepts a Plan inside the Plan Space", () => {
    expect(validatePlan(valid, unit1Done)).toEqual({ ok: true });
  });

  it("rejects a skipped prerequisite: a Unit 2 Skill before Unit 1 is Mastered", () => {
    expect(reasons(valid, mastered("partners-to-10"))).toMatch(/counting-on.*Unit 2.*not unlocked/);
  });

  it("rejects a range beyond the Skill's standard", () => {
    const plan = { ...valid, skills: [{ skill: "counting-on" as const, weight: 1, numberRange: { min: 5, max: 20 } }] };
    expect(reasons(plan)).toMatch(/counting-on.*5 to 20.*outside.*3 to 19/);
  });

  it("rejects an inverted or fractional range", () => {
    expect(reasons({ ...valid, skills: [{ skill: "counting-on", weight: 1, numberRange: { min: 9, max: 5 } }] })).toMatch(/range/);
    expect(reasons({ ...valid, skills: [{ skill: "counting-on", weight: 1, numberRange: { min: 5.5, max: 9 } }] })).toMatch(/range/);
  });

  it("rejects length 5 and length 11", () => {
    expect(reasons({ ...valid, length: 5 })).toMatch(/length 5.*6 to 10/);
    expect(reasons({ ...valid, length: 11 })).toMatch(/length 11.*6 to 10/);
    expect(reasons({ ...valid, length: 7.5 })).toMatch(/length/);
  });

  it("rejects an unknown Skill", () => {
    const plan = { ...valid, skills: [{ skill: "near-doubles" as SkillId, weight: 1 }] };
    expect(reasons(plan)).toMatch(/unknown Skill "near-doubles"/);
  });

  it("rejects a structure the Skill does not have", () => {
    const plan = { ...valid, skills: [{ skill: "counting-on" as const, weight: 1, structures: ["decompose"] }] };
    expect(reasons(plan)).toMatch(/counting-on.*structure "decompose"/);
    expect(reasons({ ...valid, skills: [{ skill: "counting-on", weight: 1, structures: [] }] })).toMatch(/structure/);
  });

  it("rejects a review share outside 0 to 1", () => {
    expect(reasons({ ...valid, reviewShare: 1.5 })).toMatch(/review share 1.5.*0 to 1/);
    expect(reasons({ ...valid, reviewShare: -0.1 })).toMatch(/review share/);
    expect(reasons({ ...valid, reviewShare: 0 })).toBe("");
    expect(reasons({ ...valid, reviewShare: 1 })).toBe("");
  });

  it("rejects an empty mix, a repeated Skill, and a weight that is not positive", () => {
    expect(reasons({ ...valid, skills: [] })).toMatch(/at least one Skill/);
    expect(
      reasons({ ...valid, skills: [{ skill: "counting-on", weight: 1 }, { skill: "counting-on", weight: 1 }] }),
    ).toMatch(/counting-on.*more than once/);
    expect(reasons({ ...valid, skills: [{ skill: "counting-on", weight: 0 }] })).toMatch(/weight/);
  });

  it("lists every reason at once", () => {
    const plan = { ...valid, length: 11, reviewShare: 2 };
    const verdict = validatePlan(plan, newProfile());
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reasons).toHaveLength(4);
  });
});

describe("planSpace", () => {
  it("offers only the Skills of unlocked Units, with their bounds", () => {
    const fresh = planSpace(newProfile());
    expect(fresh.skills.map((s) => s.skill)).toEqual(["partners-to-10", "teen-numbers"]);
    expect(fresh.length).toEqual({ min: 6, max: 10 });
    expect(fresh.reviewShare).toEqual({ min: 0, max: 1 });

    const opened = planSpace(unit1Done);
    expect(opened.skills.map((s) => s.skill)).toEqual([
      "partners-to-10",
      "teen-numbers",
      "counting-on",
      "make-a-ten",
      "unknown-addend",
    ]);
    const countingOn = opened.skills.find((s) => s.skill === "counting-on")!;
    expect(countingOn.structures).toEqual(["larger-first", "smaller-first"]);
    expect(countingOn.numberRange).toEqual({ min: 3, max: 19 });
    expect(countingOn.rangeOf).toMatch(/larger addend/);
    expect(countingOn.mastered).toBe(false);
  });
});
