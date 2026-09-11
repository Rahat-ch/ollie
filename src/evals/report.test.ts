import { describe, expect, it } from "vitest";
import { fakeGeneration } from "@/generation";
import { runEvals } from "./evals";
import { evalReport, reportFileName } from "./report";

describe("eval reports", () => {
  it("are named by their UTC date and time so they sort by run", () => {
    expect(reportFileName(new Date("2026-09-10T19:06:01.123Z"))).toBe("2026-09-10T19-06-01Z.json");
  });

  it("carry when they were generated alongside both planners' results and the Hypothesis scores", async () => {
    const results = await runEvals({ sessions: 2, generation: fakeGeneration(), generationName: "fake" });
    const report = evalReport(results, new Date("2026-09-10T19:06:01Z"));
    expect(report.generatedAt).toBe("2026-09-10T19:06:01.000Z");
    expect(report.sessions).toBe(2);
    expect(report.coach.generation).toBe("fake");
    expect(report.convergence.baseline.planner).toBe("baseline");
    expect(report.convergence.coach.planner).toBe("coach");
    expect(report.hypotheses.learners).toHaveLength(6);
  });
});
