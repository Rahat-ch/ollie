import { describe, expect, it } from "vitest";
import { fakeGeneration } from "@/generation";
import type { CoachOutput } from "@/generation/types";
import { evidenceIntegrity, scoreHypotheses } from "@/evals/hypotheses";
import { getSimulatedLearner } from "@/evals/learners";
import { coachPlanner, runLearner } from "@/evals/run";
import { smokeFailures } from "@/evals/smoke";

const clean = { coach: 2, retry: 1, baseline: 0 };

describe("smokeFailures", () => {
  it("passes a run whose every citation exists and whose every Plan came from the Coach", () => {
    expect(smokeFailures({ evidence: evidenceIntegrity({ citations: 12, unknownIds: 0, inconsistent: 3 }), sources: clean })).toEqual([]);
  });

  it("fails on one citation naming a Problem not in the Log", () => {
    const failures = smokeFailures({ evidence: evidenceIntegrity({ citations: 12, unknownIds: 1, inconsistent: 0 }), sources: clean });
    expect(failures).toEqual(["Evidence Integrity 0.92 is below 1.00: 1 of 12 citations name a Problem not in the Log"]);
  });

  it("fails on one Plan from the Baseline fallback, and names both conditions when both fail", () => {
    const sources = { coach: 1, retry: 1, baseline: 1 };
    expect(smokeFailures({ evidence: evidenceIntegrity({ citations: 4, unknownIds: 0, inconsistent: 0 }), sources })).toEqual([
      "1 of 3 Plans came from the Baseline fallback",
    ]);
    expect(smokeFailures({ evidence: evidenceIntegrity({ citations: 4, unknownIds: 2, inconsistent: 0 }), sources })).toHaveLength(2);
  });

  it("passes one Simulated Learner's three Sessions on the fake, which is the run the smoke workflow makes live", async () => {
    const run = await runLearner(getSimulatedLearner("crossing-ten-weakness"), coachPlanner(fakeGeneration()), 3);
    expect(run.sessions).toHaveLength(3);
    expect(smokeFailures(scoreHypotheses(run))).toEqual([]);
  });

  it("fails the same run when the Coach's output is rejected twice every time", async () => {
    const malformed = { notes: { hypotheses: [] } } as unknown as CoachOutput;
    const broken = fakeGeneration({ runCoach: async () => malformed });
    const run = await runLearner(getSimulatedLearner("crossing-ten-weakness"), coachPlanner(broken), 3);
    expect(smokeFailures(scoreHypotheses(run))).toEqual(["3 of 3 Plans came from the Baseline fallback"]);
  });
});
