import { describe, expect, it } from "vitest";
import { fakeGeneration } from "@/generation";
import { fakeJudge } from "@/evals/judge";
import { renderConvergenceChart } from "@/evals/chart";
import { runEvals } from "@/evals/evals";
import { evalReport } from "@/evals/report";

describe("renderConvergenceChart", () => {
  const generation = fakeGeneration();
  const results = runEvals({
    sessions: 20,
    coach: { generation, name: "fake" },
    stories: { generation, name: "fake", judge: fakeJudge, judgeName: "fake" },
    summaries: { generation, name: "fake", judge: fakeJudge, judgeName: "fake" },
  });
  const svg = async () => renderConvergenceChart(evalReport(await results, new Date("2026-09-10T19:06:01Z")), "2026-09-10T19-06-01Z.json");

  it("draws one facet per Simulated Learner with a Coach line and a Baseline line, and a legend naming both", async () => {
    const chart = await svg();
    expect(chart.startsWith("<svg")).toBe(true);
    for (const learner of (await results).convergence.coach.learners) {
      expect(chart).toContain(learner.name);
    }
    expect(chart.match(/<polyline/g)).toHaveLength(12);
    expect(chart).toContain(">Coach<");
    expect(chart).toContain(">Baseline<");
  });

  it("marks the held-out Learners, says which Generation ran the Coach, and names the report it came from", async () => {
    const chart = await svg();
    expect(chart.match(/held out/g)).toHaveLength(2);
    expect(chart).toContain("the Generation fake");
    expect(chart).toContain("2026-09-10T19-06-01Z.json");
  });

  it("says in a tagged Learner's facet whether the Coach named the planted weakness", async () => {
    expect(await svg()).toContain("crossing ten: not named");
  });
});
