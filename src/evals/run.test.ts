import { describe, expect, it } from "vitest";
import { DIAGNOSTIC_PLAN } from "@/loop";
import { fakeGeneration } from "@/generation";
import { getSimulatedLearner } from "@/evals/learners";
import { baselinePlanner, coachPlanner, runLearner } from "@/evals/run";

describe("runLearner", () => {
  const learner = getSimulatedLearner("crossing-ten-weakness");

  it("plays the Diagnostic Session first and then one Session per Plan the planner returns", async () => {
    const run = await runLearner(learner, baselinePlanner, 3);

    expect(run.planner).toBe("baseline");
    expect(run.sessions.map((s) => s.result.log.sessionNumber)).toEqual([1, 2, 3]);
    expect(run.sessions[0].result.log.plan).toBe(DIAGNOSTIC_PLAN);
    expect(run.sessions[1].result.log.plan.length).toBe(6);
    expect(run.sessions[2].result.profile.sessionsCompleted).toBe(3);
  });

  it("under the Coach plays the Coach's Plans and carries the Notes from Session to Session", async () => {
    const run = await runLearner(learner, coachPlanner(fakeGeneration()), 3);

    expect(run.planner).toBe("coach");
    expect(run.sessions.map((s) => s.step.source)).toEqual(["coach", "coach", "coach"]);
    expect(run.sessions[1].result.log.plan).toBe(run.sessions[0].step.plan);
    expect(run.sessions[1].result.log.plan.length).toBe(8);
    expect(run.sessions[2].step.notes.hypotheses.length).toBeGreaterThanOrEqual(
      run.sessions[0].step.notes.hypotheses.length,
    );
  });

  it("runs the Coach and the Baseline on the same seed, so their Diagnostic Sessions are identical", async () => {
    const baseline = await runLearner(learner, baselinePlanner, 2);
    const coach = await runLearner(learner, coachPlanner(fakeGeneration()), 2);

    expect(JSON.stringify(coach.sessions[0].result.log)).toBe(JSON.stringify(baseline.sessions[0].result.log));
    expect(coach.sessions[0].result.log.seed).toBe("sim-crossing-ten");
  });
});
