import { describe, expect, it } from "vitest";
import { alwaysFirstTry, alwaysRevealed, getSkill, newProfile, runSession, type ProfileState, type SessionPlan } from "@/loop";
import { profileWithMastered } from "@/loop/testing";
import { getSimulatedLearner, simulatedLearner } from "@/evals/learners";
import { POWERS, powerFor, powersEarned, powersFor, powerUsedOn, withPowers } from "./powers";

const plan = (skill: SessionPlan["skills"][number]["skill"], length = 10): SessionPlan => ({
  length,
  skills: [{ skill, weight: 1 }],
  reviewShare: 0,
  hypothesisUnderTest: null,
});

/** Units 1 and 2 behind the Learner, so a Plan for a Unit 2 or Unit 3 Skill is inside the Plan Space. */
const unit1 = () => profileWithMastered("partners-to-10", "teen-numbers");
const unit2 = () => profileWithMastered("partners-to-10", "teen-numbers", "counting-on", "make-a-ten", "unknown-addend");

const problem = (skill: Parameters<typeof plan>[0], id = "p1") => ({ id, skill, structure: "", equation: { left: 1, op: "+" as const, right: 1, result: 2, unknown: "result" as const }, answer: 2, spoken: "", review: false });

describe("the four Powers", () => {
  it("is Count-On Flight, Make-Ten Magic, Missing Number Detective, and Story Solver, in the order they are learned", () => {
    expect(POWERS.map((power) => power.name)).toEqual([
      "Count-On Flight",
      "Make-Ten Magic",
      "Missing Number Detective",
      "Story Solver",
    ]);
  });

  it("belongs to the Unit that teaches it, so the Path stop and the catalogue can never drift apart", () => {
    for (const power of POWERS) {
      const unit = power.mastery.kind === "skill" ? getSkill(power.mastery.skill).unit : power.mastery.unit;
      expect(power.unit).toBe(unit);
    }
  });

  it("is taught by Mastering counting on, make-a-ten, unknown addend, and Unit 3", () => {
    expect(POWERS.map((power) => power.mastery)).toEqual([
      { kind: "skill", skill: "counting-on" },
      { kind: "skill", skill: "make-a-ten" },
      { kind: "skill", skill: "unknown-addend" },
      { kind: "unit", unit: 3 },
    ]);
  });
});

describe("powersFor", () => {
  it("is empty for a fresh Profile: a Power is never held before the Skill is Mastered", () => {
    expect(powersFor(newProfile())).toEqual([]);
  });

  it("holds the Power of every Mastered Skill", () => {
    expect(powersFor(profileWithMastered("counting-on"))).toEqual(["count-on-flight"]);
    expect(powersFor(profileWithMastered("make-a-ten", "unknown-addend"))).toEqual([
      "make-ten-magic",
      "missing-number-detective",
    ]);
  });

  it("holds no Power for Mastering a Skill that teaches none", () => {
    expect(powersFor(profileWithMastered("partners-to-10", "teen-numbers"))).toEqual([]);
  });

  it("holds Story Solver only once both Unit 3 Skills are Mastered", () => {
    expect(powersFor(profileWithMastered("result-unknown"))).toEqual([]);
    expect(powersFor(profileWithMastered("result-unknown", "change-unknown"))).toEqual(["story-solver"]);
  });
});

describe("finishSession returns the Powers the Session earned", () => {
  it("earns Count-On Flight on the Session that Masters counting on", () => {
    const result = runSession(plan("counting-on"), unit1(), "seed-power", alwaysFirstTry);
    expect(result.newlyMastered).toEqual(["counting-on"]);
    expect(result.powersEarned).toEqual(["count-on-flight"]);
  });

  it("earns nothing on a Session that Masters nothing", () => {
    const result = runSession(plan("counting-on"), unit1(), "seed-power", alwaysRevealed);
    expect(result.profile.skills["counting-on"].mastered).toBe(false);
    expect(result.powersEarned).toEqual([]);
  });

  it("earns a Power exactly once: the next Session with the Skill already Mastered earns nothing", () => {
    const first = runSession(plan("make-a-ten"), unit1(), "seed-power", alwaysFirstTry);
    expect(first.powersEarned).toEqual(["make-ten-magic"]);
    const second = runSession(plan("make-a-ten"), first.profile, "seed-power", alwaysFirstTry);
    expect(second.profile.skills["make-a-ten"].mastered).toBe(true);
    expect(second.powersEarned).toEqual([]);
  });

  it("earns nothing when a Session of misses leaves an already Mastered Skill Mastered: a Power is never lost", () => {
    const mastered = profileWithMastered("partners-to-10", "teen-numbers", "unknown-addend");
    const result = runSession(plan("unknown-addend"), mastered, "seed-power", alwaysRevealed);
    expect(result.profile.skills["unknown-addend"].mastered).toBe(true);
    expect(powersFor(result.profile)).toEqual(["missing-number-detective"]);
    expect(result.powersEarned).toEqual([]);
  });

  it("earns Story Solver on the Session that Masters the second Unit 3 Skill, not the first", () => {
    const first = runSession(plan("result-unknown"), unit2(), "seed-power", alwaysFirstTry);
    expect(first.newlyMastered).toEqual(["result-unknown"]);
    expect(first.powersEarned).toEqual([]);
    const second = runSession(plan("change-unknown"), first.profile, "seed-power", alwaysFirstTry);
    expect(second.powersEarned).toEqual(["story-solver"]);
  });
});

describe("a Simulated Learner's Mastery transitions", () => {
  /** Sessions of one Skill, as the eval command runs them: the Powers earned, in the Session each was earned on. */
  function playOut(id: Parameters<typeof getSimulatedLearner>[0], skill: Parameters<typeof plan>[0], sessions: number) {
    const policy = simulatedLearner(getSimulatedLearner(id));
    let profile: ProfileState = unit1();
    const earned: { session: number; power: string }[] = [];
    for (let session = 1; session <= sessions; session++) {
      const result = runSession(plan(skill), profile, `seed-${id}`, policy);
      for (const power of result.powersEarned) earned.push({ session, power });
      profile = result.profile;
    }
    return { profile, earned };
  }

  it("teaches Ollie Count-On Flight once, however many Sessions the strong Learner plays after it", () => {
    const { profile, earned } = playOut("strong", "counting-on", 20);
    expect(profile.skills["counting-on"].mastered).toBe(true);
    expect(earned).toEqual([{ session: 1, power: "count-on-flight" }]);
  });

  it("teaches Ollie nothing over the Sessions the weak Learner takes to Master the Skill, and the Power on the one that does", () => {
    // The weak Learner Masters make-a-ten on the eighth Session of it.
    const before = playOut("weak", "make-a-ten", 7);
    expect(before.profile.skills["make-a-ten"].mastered).toBe(false);
    expect(before.earned).toEqual([]);

    const after = playOut("weak", "make-a-ten", 20);
    expect(after.profile.skills["make-a-ten"].mastered).toBe(true);
    expect(after.earned).toEqual([{ session: 8, power: "make-ten-magic" }]);
  });
});

describe("the Powers the Profile holds", () => {
  it("keeps what it held and adds what was earned, once each, in the order they were learned", () => {
    expect(withPowers([], ["count-on-flight"])).toEqual(["count-on-flight"]);
    expect(withPowers(["count-on-flight"], ["make-ten-magic"])).toEqual(["count-on-flight", "make-ten-magic"]);
    expect(withPowers(["count-on-flight"], ["count-on-flight"])).toEqual(["count-on-flight"]);
  });

  it("is what a Profile's Mastery says it should be, so a Profile stored before Powers existed can be filled in", () => {
    expect(powersEarned(newProfile(), profileWithMastered("counting-on", "make-a-ten"))).toEqual([
      "count-on-flight",
      "make-ten-magic",
    ]);
  });
});

describe("the Power Ollie uses on a Problem", () => {
  it("is the one whose strategy the Problem asks for, and only when the Learner has taught it", () => {
    expect(powerUsedOn(["count-on-flight"], problem("counting-on"))).toBe("count-on-flight");
    expect(powerUsedOn([], problem("counting-on"))).toBeNull();
    expect(powerUsedOn(["count-on-flight"], problem("make-a-ten"))).toBeNull();
  });

  it("is Story Solver on both Unit 3 Skills, and nothing on Unit 1", () => {
    expect(powerUsedOn(["story-solver"], problem("result-unknown"))).toBe("story-solver");
    expect(powerUsedOn(["story-solver"], problem("change-unknown"))).toBe("story-solver");
    expect(powerUsedOn(["story-solver", "make-ten-magic"], problem("partners-to-10"))).toBeNull();
  });
});

describe("powerFor", () => {
  it("names the Power by its id", () => {
    expect(powerFor("missing-number-detective").name).toBe("Missing Number Detective");
  });
});
