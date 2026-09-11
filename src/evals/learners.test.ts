import { describe, expect, it } from "vitest";
import { baselinePlan, newProfile, runSession } from "@/loop";
import { getSimulatedLearner, matchesWeakness, SIMULATED_LEARNERS, simulatedLearner, type SimulatedLearner } from "@/evals/learners";
import type { Problem, SessionPlan } from "@/loop";
import { profileWithMastered } from "@/loop/testing";

describe("the six Simulated Learners", () => {
  it("are defined in one place with a seed each, and two are held out", () => {
    expect(SIMULATED_LEARNERS.map((l) => l.id)).toEqual([
      "strong",
      "average",
      "weak",
      "crossing-ten-weakness",
      "change-unknown-weakness",
      "fast-fatigue",
    ]);
    expect(new Set(SIMULATED_LEARNERS.map((l) => l.seed)).size).toBe(6);
    expect(SIMULATED_LEARNERS.filter((l) => l.heldOut).map((l) => l.id)).toEqual([
      "change-unknown-weakness",
      "fast-fatigue",
    ]);
  });

  it("reproduce the same run byte for byte from the same seed, and a different run from another", () => {
    const run = (seed: string) => {
      const learner = { ...getSimulatedLearner("average"), seed };
      let profile = newProfile();
      const logs = [];
      for (let i = 0; i < 5; i++) {
        const result = runSession(baselinePlan(profile), profile, learner.seed, simulatedLearner(learner));
        logs.push(result.log);
        profile = result.profile;
      }
      return JSON.stringify({ logs, profile });
    };
    expect(run("sim-average")).toBe(run("sim-average"));
    expect(run("sim-average")).not.toBe(run("sim-average-2"));
  });
});

describe("weakness tags", () => {
  const problem = (
    left: number,
    op: "+" | "-",
    right: number,
    result: number,
    unknown: "left" | "right" | "result" = "result",
    structure = "larger-first",
  ): Problem => ({
    id: "p1",
    skill: "counting-on",
    structure,
    equation: { left, op, right, result, unknown },
    answer: unknown === "result" ? result : unknown === "right" ? right : left,
    spoken: "",
    review: false,
  });

  it("crossing-ten matches sums and differences that cross ten, not those that stay on one side of it", () => {
    expect(matchesWeakness("crossing-ten", problem(8, "+", 5, 13))).toBe(true);
    expect(matchesWeakness("crossing-ten", problem(13, "-", 8, 5))).toBe(true);
    expect(matchesWeakness("crossing-ten", problem(7, "+", 3, 10))).toBe(false);
    expect(matchesWeakness("crossing-ten", problem(10, "+", 3, 13))).toBe(false);
    expect(matchesWeakness("crossing-ten", problem(15, "-", 12, 3))).toBe(false);
    expect(matchesWeakness("crossing-ten", problem(4, "+", 2, 6))).toBe(false);
  });

  it("change-unknown matches the structures that ask for the change, not partners or teens", () => {
    expect(matchesWeakness("change-unknown", problem(9, "+", 4, 13, "right", "missing-addend"))).toBe(true);
    expect(matchesWeakness("change-unknown", problem(13, "-", 9, 4, "result", "subtract"))).toBe(false);
    expect(matchesWeakness("change-unknown", problem(7, "+", 3, 10, "right", "missing-partner"))).toBe(false);
    expect(matchesWeakness("change-unknown", problem(10, "+", 3, 13, "right", "decompose"))).toBe(false);
  });

  it("lower first-try accuracy only on matching Problems", () => {
    const plain = { ...getSimulatedLearner("average"), weaknesses: [] };
    const weak = { ...plain, weaknesses: ["crossing-ten" as const] };
    const profile = profileWithMastered("partners-to-10", "teen-numbers");
    const plan: SessionPlan = {
      length: 10,
      skills: [
        { skill: "make-a-ten", weight: 1 },
        { skill: "partners-to-10", weight: 1 },
      ],
      reviewShare: 0,
      hypothesisUnderTest: null,
    };
    const firstTries = (learner: SimulatedLearner) => {
      const entries = [];
      let state = { ...profile, sessionsCompleted: 1 };
      for (let i = 0; i < 20; i++) {
        const result = runSession(plan, state, "weakness-seed", simulatedLearner(learner));
        entries.push(...result.log.entries);
        state = { ...result.profile, skills: profile.skills };
      }
      return entries.map((e) => ({ crossing: matchesWeakness("crossing-ten", e.problem), correct: e.attempts[0].correct }));
    };
    const a = firstTries(plain);
    const b = firstTries(weak);
    const rate = (xs: { correct: boolean }[]) => xs.filter((x) => x.correct).length / xs.length;

    expect(b.filter((x) => !x.crossing)).toEqual(a.filter((x) => !x.crossing));
    expect(a.filter((x) => x.crossing).length).toBe(100);
    expect(rate(b.filter((x) => x.crossing))).toBeLessThan(rate(a.filter((x) => x.crossing)) - 0.25);
  });
});

describe("the fatigue curve", () => {
  const plan: SessionPlan = {
    length: 10,
    skills: [{ skill: "partners-to-10", weight: 1 }],
    reviewShare: 0,
    hypothesisUnderTest: null,
  };
  const rateByPosition = (learner: SimulatedLearner, positions: number[]) => {
    let profile = { ...newProfile(), sessionsCompleted: 1 };
    const outcomes: boolean[] = [];
    for (let i = 0; i < 30; i++) {
      const result = runSession(plan, profile, "fatigue-seed", simulatedLearner(learner));
      outcomes.push(
        ...result.log.entries.filter((e) => positions.includes(e.position)).map((e) => e.attempts[0].correct),
      );
      profile = { ...result.profile, skills: profile.skills };
    }
    return outcomes.filter(Boolean).length / outcomes.length;
  };

  it("makes a fast-fatigue Learner miss far more at the end of a Session than at the start", () => {
    const learner = getSimulatedLearner("fast-fatigue");
    expect(rateByPosition(learner, [1, 2, 3])).toBeGreaterThan(0.8);
    expect(rateByPosition(learner, [8, 9, 10])).toBeLessThan(0.5);
  });

  it("barely moves an average Learner", () => {
    const learner = getSimulatedLearner("average");
    expect(rateByPosition(learner, [8, 9, 10])).toBeGreaterThan(rateByPosition(learner, [1, 2, 3]) - 0.15);
  });
});
