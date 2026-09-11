import { describe, expect, it } from "vitest";
import { fakeGeneration } from "@/generation";
import { runEvals } from "@/evals/evals";
import type { SimulatedLearnerId } from "@/evals/learners";

describe("runEvals", () => {
  const options = { sessions: 20, coach: { generation: fakeGeneration(), name: "fake" } };
  const promise = runEvals(options);
  const baseline = async (id: SimulatedLearnerId) => (await promise).convergence.baseline.learners.find((l) => l.id === id)!;
  const coach = async (id: SimulatedLearnerId) => (await promise).convergence.coach.learners.find((l) => l.id === id)!;

  it("runs every Simulated Learner for 20 Sessions under both planners in well under a second on the fake", async () => {
    const started = performance.now();
    const results = await runEvals(options);
    expect(performance.now() - started).toBeLessThan(1000);
    const ids = ["strong", "average", "weak", "crossing-ten-weakness", "change-unknown-weakness", "fast-fatigue"];
    expect(results.convergence.baseline.learners.map((l) => l.id)).toEqual(ids);
    expect(results.convergence.coach.learners.map((l) => l.id)).toEqual(ids);
    expect(results.hypotheses.learners.map((l) => l.id)).toEqual(ids);
    expect(results.convergence.baseline.learners.every((l) => l.perSession.length === 20)).toBe(true);
    expect(results.convergence.coach.learners.every((l) => l.perSession.length === 20)).toBe(true);
    expect(results.coach.generation).toBe("fake");
  });

  it("reports the Baseline as before: Sessions to Mastery per Skill in progression order for a strong Learner", async () => {
    expect((await baseline("strong")).sessionsToMastery).toEqual({
      "partners-to-10": 2,
      "teen-numbers": 3,
      "counting-on": 4,
      "make-a-ten": 6,
      "unknown-addend": 8,
    });
    expect((await baseline("weak")).sessionsToMastery["unknown-addend"]).toBeNull();
    expect((await baseline("average")).inBandShare).toBe(1);
  });

  it("runs the Coach on the same seeds, so its first Session is the Baseline's Diagnostic Session", async () => {
    const results = await promise;
    for (const learner of results.convergence.baseline.learners) {
      const other = results.convergence.coach.learners.find((l) => l.id === learner.id)!;
      expect(other.perSession[0]).toEqual(learner.perSession[0]);
    }
    expect((await coach("strong")).problems).not.toBe((await baseline("strong")).problems);
  });

  it("scores the tuning and held-out splits separately for both planners and for the Hypotheses", async () => {
    const { convergence, hypotheses } = await promise;
    for (const report of [convergence.baseline, convergence.coach]) {
      expect(report.splits.tuning.learners).toEqual(["strong", "average", "weak", "crossing-ten-weakness"]);
      expect(report.splits.heldOut.learners).toEqual(["change-unknown-weakness", "fast-fatigue"]);
    }
    expect(hypotheses.splits.tuning).toMatchObject({ learners: ["strong", "average", "weak", "crossing-ten-weakness"], planted: 1 });
    expect(hypotheses.splits.heldOut).toMatchObject({ learners: ["change-unknown-weakness", "fast-fatigue"], planted: 1 });
    expect(hypotheses.splits.tuning.evidenceIntegrity).toBe(1);
    expect(hypotheses.splits.heldOut.sources).toEqual({ coach: 40, retry: 0, baseline: 0 });
  });

  it("is reproducible byte for byte on the fake", async () => {
    expect(JSON.stringify(await runEvals(options))).toBe(JSON.stringify(await promise));
  });
});
