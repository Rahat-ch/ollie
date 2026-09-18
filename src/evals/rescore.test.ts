import { describe, expect, it } from "vitest";
import { fakeGeneration } from "@/generation";
import { fakeJudge } from "@/evals/judge";
import { runEvals } from "@/evals/evals";
import { evalReport, type EvalReport } from "@/evals/report";
import { rescoreReport, scoreNaming } from "@/evals/rescore";

const STORIES = { generation: fakeGeneration(), name: "fake", judge: fakeJudge, judgeName: "fake" };

const report = async () =>
  evalReport(
    await runEvals({ sessions: 2, coach: { generation: fakeGeneration(), name: "fake" }, stories: STORIES, summaries: STORIES }),
    new Date("2026-09-10T19:06:01Z"),
  );

describe("rescoring a written report", () => {
  it("scores a report's Notes to what the run itself was scored, when the scorer has not changed", async () => {
    for (const learner of rescoreReport(await report())) {
      expect(learner.rescored).toEqual(learner.stored);
    }
  });

  it("reads detection from the Notes' place in the run, and refuses a report with no Notes history", async () => {
    const notes = [
      { hypotheses: [], strengths: [] },
      {
        hypotheses: [
          {
            id: "h1",
            claim: "Items whose sum is 11 (the smallest crossing of ten) have drawn help every time",
            status: "supported" as const,
            confidence: 0.6,
            evidence: ["p1"] as const,
            nextTest: "More make-a-ten Problems",
          },
        ],
        strengths: [],
      },
    ];

    expect(scoreNaming(["crossing-ten"], notes)).toMatchObject({
      sessionsToDetection: { "crossing-ten": 2 },
      detected: 1,
      supportedHypotheses: 1,
      falsePositives: 0,
    });

    const stored = await report();
    // A report from before the Notes history, as it would come off disk.
    const stripped = JSON.parse(JSON.stringify(stored, (key, value) => (key === "notesBySession" ? undefined : value))) as EvalReport;

    expect(() => rescoreReport(stripped)).toThrow(/notesBySession/);
  });
});
