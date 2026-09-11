import { describe, expect, it } from "vitest";
import { renderConvergenceChart } from "@/evals/chart";
import { runConvergence } from "@/evals/convergence";
import { evalReport } from "@/evals/report";

describe("renderConvergenceChart", () => {
  const report = evalReport(runConvergence({ sessions: 20 }), new Date("2026-09-10T19:06:01Z"));
  const svg = renderConvergenceChart(report, "2026-09-10T19-06-01Z.json");

  it("draws one facet per Simulated Learner with a line of Skills Mastered by Session", () => {
    expect(svg.startsWith("<svg")).toBe(true);
    for (const learner of report.convergence.learners) {
      expect(svg).toContain(learner.name);
    }
    expect(svg.match(/<polyline/g)).toHaveLength(6);
  });

  it("marks the held-out Learners and names the report it came from", () => {
    expect(svg.match(/held out/g)).toHaveLength(2);
    expect(svg).toContain("2026-09-10T19-06-01Z.json");
  });
});
