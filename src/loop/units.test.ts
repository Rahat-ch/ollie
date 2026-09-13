import { describe, expect, it } from "vitest";
import { isUnitUnlocked, newProfile, runSession, alwaysFirstTry, UNITS } from "@/loop";
import { profileWithMastered as mastered } from "@/loop/testing";

describe("Unit unlocking", () => {
  it("has Unit 1 open from the start and Unit 2 closed", () => {
    expect(isUnitUnlocked(1, newProfile())).toBe(true);
    expect(isUnitUnlocked(2, newProfile())).toBe(false);
  });

  it("keeps Unit 2 closed while only one of Skills a and b is Mastered", () => {
    expect(isUnitUnlocked(2, mastered("partners-to-10"))).toBe(false);
    expect(isUnitUnlocked(2, mastered("teen-numbers"))).toBe(false);
  });

  it("opens Unit 2 once Skills a and b are both Mastered", () => {
    expect(isUnitUnlocked(2, mastered("partners-to-10", "teen-numbers"))).toBe(true);
  });

  it("opens Unit 3 only once every Skill of Units 1 and 2 is Mastered", () => {
    expect(isUnitUnlocked(3, mastered("partners-to-10", "teen-numbers", "counting-on", "make-a-ten"))).toBe(false);
    expect(isUnitUnlocked(3, mastered("partners-to-10", "teen-numbers", "counting-on", "make-a-ten", "unknown-addend"))).toBe(true);
  });

  it("lists the three Units in order", () => {
    expect(UNITS.map((u) => u.unit)).toEqual([1, 2, 3]);
    expect(UNITS.map((u) => u.name)).toEqual(["Partners to 10", "Counting on and make-a-ten", "Word problems"]);
  });

  it("reports the Unit a Session unlocked", () => {
    const plan = {
      length: 10,
      skills: [{ skill: "teen-numbers" as const, weight: 1 }],
      reviewShare: 0,
      hypothesisUnderTest: null,
    };
    const result = runSession(plan, mastered("partners-to-10"), "seed-u", alwaysFirstTry);
    expect(result.newlyMastered).toEqual(["teen-numbers"]);
    expect(result.newlyUnlockedUnits).toEqual([2]);

    const again = runSession(plan, result.profile, "seed-u", alwaysFirstTry);
    expect(again.newlyUnlockedUnits).toEqual([]);
  });
});
