import { describe, expect, it } from "vitest";
import { fakeGeneration } from "@/generation";
import { createRecorder, TELEMETRY_OPERATIONS } from "@/generation/telemetry";
import { fakeJudge, recordedFakeJudge } from "@/evals/judge";
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

  it("carry a telemetry section the fake run filled in: every operation present, every model named, nothing spent", async () => {
    const recorder = createRecorder();
    const generation = fakeGeneration({}, recorder);
    const judge = recordedFakeJudge(recorder);
    const written = { generation, name: "fake", judge, judgeName: "fake" };
    const results = await runEvals({ sessions: 2, coach: { generation, name: "fake" }, stories: written, summaries: written, recorder });
    const { telemetry } = evalReport(results, new Date("2026-09-10T19:06:01Z"));

    for (const operation of TELEMETRY_OPERATIONS) {
      expect(telemetry.byOperation[operation].calls).toBeGreaterThan(0);
      expect(telemetry.byOperation[operation]).toMatchObject({ tokens: 0, ms: 0, dollars: 0, models: ["fake"] });
    }
    expect(telemetry.byModel.map((m) => m.model)).toEqual(["fake"]);
    expect(telemetry.total.calls).toBe(recorder.calls().length);
    expect(telemetry.total).toMatchObject({ tokens: 0, ms: 0, dollars: 0 });
    // Six Simulated Learners for two Sessions each, one Coach call apiece.
    expect(telemetry.perSession).toEqual({ sessions: 12, coachCalls: 12, dollarsPerCoachCall: 0, dollarsPerSession: 0 });
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
