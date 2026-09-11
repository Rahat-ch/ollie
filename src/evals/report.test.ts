import { describe, expect, it } from "vitest";
import { evalReport, reportFileName } from "@/evals/report";
import { runConvergence } from "@/evals/convergence";

describe("eval reports", () => {
  it("are named by their UTC date and time so they sort by run", () => {
    expect(reportFileName(new Date("2026-09-10T19:06:01.123Z"))).toBe("2026-09-10T19-06-01Z.json");
  });

  it("carry when they were generated alongside the convergence results", () => {
    const report = evalReport(runConvergence({ sessions: 2 }), new Date("2026-09-10T19:06:01Z"));
    expect(report.generatedAt).toBe("2026-09-10T19:06:01.000Z");
    expect(report.convergence.sessions).toBe(2);
  });
});
