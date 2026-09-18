import { describe, expect, it } from "vitest";
import { fakeGeneration } from "@/generation";
import { fakeJudge } from "@/evals/judge";
import { runEvals } from "@/evals/evals";
import { evalReport, reportFileName } from "@/evals/report";

const STORIES = { generation: fakeGeneration(), name: "fake", judge: fakeJudge, judgeName: "fake" };
const SUMMARIES = STORIES;

describe("eval reports", () => {
  it("are named by their UTC date and time so they sort by run", () => {
    expect(reportFileName(new Date("2026-09-10T19:06:01.123Z"))).toBe("2026-09-10T19-06-01Z.json");
  });

  it("carry when they were generated alongside both planners' results and the Hypothesis scores", async () => {
    const results = await runEvals({ sessions: 2, coach: { generation: fakeGeneration(), name: "fake" }, stories: STORIES, summaries: SUMMARIES });
    const report = evalReport(results, new Date("2026-09-10T19:06:01Z"));
    expect(report.generatedAt).toBe("2026-09-10T19:06:01.000Z");
    expect(report.sessions).toBe(2);
    expect(report.coach.generation).toBe("fake");
    expect(report.convergence.baseline.planner).toBe("baseline");
    expect(report.convergence.coach.planner).toBe("coach");
    expect(report.hypotheses.learners).toHaveLength(6);
    expect(report.stories.validity.sample).toBe(30);
    expect(report.stories.judge.readability).toBeNull();
  });

  it("carry each Learner's accepted Notes after every Session, so a later scorer can score the report again", async () => {
    const results = await runEvals({ sessions: 2, coach: { generation: fakeGeneration(), name: "fake" }, stories: STORIES, summaries: SUMMARIES });
    const report = evalReport(results, new Date("2026-09-10T19:06:01Z"));

    for (const learner of report.hypotheses.learners) {
      expect(learner.notesBySession).toHaveLength(report.sessions);
      expect(learner.notesBySession.at(-1)).toEqual(learner.finalNotes);
    }
  });
});
