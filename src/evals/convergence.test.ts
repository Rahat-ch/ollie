import { describe, expect, it } from "vitest";
import { runConvergence } from "@/evals/convergence";
import type { SimulatedLearnerId } from "@/evals/learners";

describe("runConvergence under the Baseline", () => {
  const report = runConvergence({ sessions: 20 });
  const learner = (id: SimulatedLearnerId) => report.learners.find((l) => l.id === id)!;

  it("runs every Simulated Learner for 20 Sessions in well under a second", () => {
    const started = performance.now();
    runConvergence({ sessions: 20 });
    expect(performance.now() - started).toBeLessThan(1000);
    expect(report.learners.map((l) => l.id)).toEqual([
      "strong",
      "average",
      "weak",
      "crossing-ten-weakness",
      "change-unknown-weakness",
      "fast-fatigue",
    ]);
    expect(report.learners.every((l) => l.perSession.length === 20)).toBe(true);
  });

  it("flags the held-out Learners and scores the two splits separately", () => {
    expect(report.learners.filter((l) => l.heldOut).map((l) => l.id)).toEqual([
      "change-unknown-weakness",
      "fast-fatigue",
    ]);
    expect(report.splits.heldOut.learners).toEqual(["change-unknown-weakness", "fast-fatigue"]);
    expect(report.splits.tuning.learners).toEqual(["strong", "average", "weak", "crossing-ten-weakness"]);
    expect(report.splits.heldOut.meanSkillsMastered).toBe(5);
  });

  it("reports Sessions to Mastery per Skill, in progression order for a strong Learner", () => {
    const strong = learner("strong").sessionsToMastery;
    expect(strong["partners-to-10"]).toBeLessThanOrEqual(3);
    expect(strong["teen-numbers"]).toBeGreaterThan(strong["partners-to-10"]!);
    expect(strong["unknown-addend"]).toBeGreaterThan(strong["make-a-ten"]!);
    expect(learner("weak").sessionsToMastery["unknown-addend"]).toBeNull();
  });

  it("scores the share of Problems in the target accuracy band from the true probabilities", () => {
    expect(learner("average").inBandShare).toBe(1);
    expect(learner("strong").inBandShare).toBeLessThan(learner("average").inBandShare);
    expect(learner("weak").inBandShare).toBeLessThan(learner("average").inBandShare);
  });

  it("is reproducible byte for byte", () => {
    expect(JSON.stringify(runConvergence({ sessions: 20 }))).toBe(JSON.stringify(report));
  });
});
