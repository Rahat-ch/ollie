import { describe, expect, it } from "vitest";
import { baselinePlan, DIAGNOSTIC_PLAN, emptyNotes, newProfile, runSession, scripted, validatePlan } from "@/loop";
import { getSimulatedLearner, simulatedLearner } from "@/evals/learners";
import { fakeGeneration } from "@/generation/fake";
import type { CoachInput, CoachOutput, Generation } from "@/generation/types";
import type { CoachStep } from "./types";
import { checkCoachOutput, coachInput, coachSession } from "./coach";

/** A Diagnostic Session with p3 Hint-assisted, p4 Revealed, and p8 Hint-assisted. */
const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-c", scripted("ffhrfffhf"));
const notes = emptyNotes();

/** The fake's own valid answer for this Session. */
const validOutput = (input: CoachInput): Promise<CoachOutput> => fakeGeneration().runCoach(input);

/** The fake's output with the first Hypothesis citing a Problem that is not in the Log. */
async function citingP99(input: CoachInput): Promise<CoachOutput> {
  const output = await validOutput(input);
  const [first, ...rest] = output.notes.hypotheses;
  return { ...output, notes: { ...output.notes, hypotheses: [{ ...first, evidence: ["p99"] }, ...rest] } };
}

/** The fake's output with a Plan longer than the Plan Space allows. */
async function planningTwelve(input: CoachInput): Promise<CoachOutput> {
  const output = await validOutput(input);
  return { ...output, plan: { ...output.plan, length: 12 } };
}

/** The fake's output with a Plan testing a Hypothesis the Notes do not hold. */
async function testingH9(input: CoachInput): Promise<CoachOutput> {
  const output = await validOutput(input);
  return { ...output, plan: { ...output.plan, hypothesisUnderTest: "h9" } };
}

/** A Coach that answers the first call one way and every later call another. */
function coachAnswering(
  first: (input: CoachInput) => Promise<CoachOutput>,
  then: (input: CoachInput) => Promise<CoachOutput>,
): Generation {
  let calls = 0;
  return fakeGeneration({ runCoach: (input) => (calls++ === 0 ? first(input) : then(input)) });
}

describe("coachInput", () => {
  it("gives the Coach evidence, never a Problem, a number to ask, or an answer", () => {
    const input = coachInput(result, notes);
    const serialized = JSON.stringify(input);

    expect(serialized).not.toContain('"answer"');
    expect(serialized).not.toContain('"spoken"');
    expect(input.evidence.every((e) => e.equation.includes("?"))).toBe(true);
    expect(input.evidence.map((e) => e.id)).toEqual(["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"]);
    expect(input.evidence[2]).toMatchObject({ id: "p3", assistance: "hint-assisted-correct", position: 3, firstTryMs: 3000 });
    expect(input.sessionNumber).toBe(1);
  });
});

describe("coachSession", () => {
  it("accepts a valid output from the fake and returns it as the Coach's", async () => {
    const step = await coachSession(fakeGeneration(), result, notes);

    expect(step.source).toBe("coach");
    expect(step.rejections).toEqual([]);
    expect(validatePlan(step.plan, result.profile)).toEqual({ ok: true });
    expect(step.notes.hypotheses.map((h) => h.evidence)).toEqual([["p3", "p4"], ["p8"]]);
  });
});

describe("coachSession rejects and retries once with the reason", () => {
  it("rejects a Hypothesis citing a Problem not in the Log, retries once with the reason, and accepts the corrected output", async () => {
    const retryInputs: CoachInput[] = [];
    const generation = coachAnswering(citingP99, (input) => {
      retryInputs.push(input);
      return validOutput(input);
    });

    const step = await coachSession(generation, result, notes);

    expect(step.source).toBe("retry");
    expect(step.rejections).toHaveLength(1);
    expect(step.rejections[0].attempt).toBe(1);
    expect(step.rejections[0].reasons).toEqual([expect.stringMatching(/p99/)]);
    expect(retryInputs).toHaveLength(1);
    expect(retryInputs[0].rejected?.reasons).toEqual([expect.stringMatching(/p99/)]);
    expect(retryInputs[0].rejected?.output?.notes.hypotheses[0].evidence).toEqual(["p99"]);
    expect(step.notes.hypotheses.map((h) => h.evidence)).toEqual([["p3", "p4"], ["p8"]]);
  });

  it("rejects a Plan outside the Plan Space with a reason", async () => {
    const retryInputs: CoachInput[] = [];
    const generation = coachAnswering(planningTwelve, (input) => {
      retryInputs.push(input);
      return validOutput(input);
    });

    const step = await coachSession(generation, result, notes);

    expect(step.source).toBe("retry");
    expect(step.rejections[0].reasons).toEqual(["length 12 is outside 6 to 10"]);
    expect(retryInputs[0].rejected?.reasons).toEqual(["length 12 is outside 6 to 10"]);
    expect(step.plan.length).toBe(8);
  });

  it("rejects a Plan that tests a Hypothesis not in the Notes", async () => {
    const retryInputs: CoachInput[] = [];
    const generation = coachAnswering(testingH9, (input) => {
      retryInputs.push(input);
      return validOutput(input);
    });

    const step = await coachSession(generation, result, notes);

    expect(step.source).toBe("retry");
    expect(step.rejections[0].reasons).toEqual(['the Plan tests "h9", which is not a Hypothesis in the Notes']);
    expect(retryInputs[0].rejected?.reasons).toEqual(['the Plan tests "h9", which is not a Hypothesis in the Notes']);
    expect(step.plan.hypothesisUnderTest).toBe("h-counting-on");
  });
});

describe("coachSession after a failed retry", () => {
  it("falls back to the Baseline Plan and keeps the prior Notes after a failed retry, and records both rejections", async () => {
    const priorNotes = {
      hypotheses: [{ id: "h1", claim: "Counts on from one", status: "proposed" as const, confidence: 0.4, evidence: [], nextTest: "Watch counting on" }],
      strengths: ["Partners to 10: quick"],
    };
    const generation = fakeGeneration({ runCoach: citingP99 });

    const step = await coachSession(generation, result, priorNotes);

    expect(step.source).toBe("baseline");
    expect(step.plan).toEqual(baselinePlan(result.profile));
    expect(step.notes).toEqual(priorNotes);
    expect(step.rejections.map((r) => r.attempt)).toEqual([1, 2]);
    expect(step.rejections.map((r) => r.reasons)).toEqual([
      [expect.stringMatching(/p99/)],
      [expect.stringMatching(/p99/)],
    ]);
  });

  it("treats a throwing adapter as a rejection so play never stops", async () => {
    const retryInputs: CoachInput[] = [];
    const generation = fakeGeneration({
      runCoach: (input) => {
        if (input.rejected) retryInputs.push(input);
        return Promise.reject(new Error("network down"));
      },
    });

    const step = await coachSession(generation, result, notes);

    expect(step.source).toBe("baseline");
    expect(step.plan).toEqual(baselinePlan(result.profile));
    expect(step.rejections).toEqual([
      { attempt: 1, reasons: ["network down"] },
      { attempt: 2, reasons: ["network down"] },
    ]);
    expect(retryInputs[0].rejected).toEqual({ reasons: ["network down"] });
  });

  it("rejects malformed output before the engine's checks run", async () => {
    const malformed = { notes: { hypotheses: [] } } as unknown as CoachOutput;
    const generation = fakeGeneration({ runCoach: async () => malformed });

    const step = await coachSession(generation, result, notes);

    expect(step.source).toBe("baseline");
    expect(step.rejections[0].reasons).toEqual([
      "notes.strengths: Invalid input: expected array, received undefined",
      "plan: Invalid input: expected object, received undefined",
    ]);
    expect(step.rejections[0].reasons.join(" ")).not.toMatch(/p\d/);
  });
});

describe("the Coach never produces a Problem", () => {
  it("accepts only Notes and a Plan, and the Plan carries no answer", async () => {
    const output = await validOutput(coachInput(result, notes));
    const check = checkCoachOutput(output, result, notes);
    const withProblems = { ...output, problems: [{ id: "p10", answer: 7 }] };

    expect(check.ok && Object.keys(check.output)).toEqual(["notes", "plan"]);
    expect(checkCoachOutput(withProblems, result, notes)).toEqual({
      ok: false,
      reasons: ['output: Unrecognized key: "problems"'],
    });
    const step = await coachSession(fakeGeneration(), result, notes);
    expect(JSON.stringify(step.plan)).not.toContain("answer");
  });
});

describe("the loop over many Sessions", () => {
  it("runs a Simulated Learner through five Coach Sessions with the fake and no network", async () => {
    const learner = getSimulatedLearner("crossing-ten-weakness");
    const policy = simulatedLearner(learner);
    const steps: CoachStep[] = [];
    const planChecks: boolean[] = [];
    const loggedIds = new Set<string>();
    let profile = newProfile();
    let step: CoachStep = { notes: emptyNotes(), plan: DIAGNOSTIC_PLAN, source: "coach", rejections: [] };

    for (let session = 1; session <= 5; session++) {
      const plan = session === 1 ? DIAGNOSTIC_PLAN : step.plan;
      const sessionResult = runSession(plan, profile, learner.seed, policy);
      for (const entry of sessionResult.log.entries) loggedIds.add(entry.problem.id);
      step = await coachSession(fakeGeneration(), sessionResult, step.notes);
      planChecks.push(validatePlan(step.plan, sessionResult.profile).ok);
      steps.push(step);
      profile = sessionResult.profile;
    }

    expect(steps.map((s) => s.source)).toEqual(["coach", "coach", "coach", "coach", "coach"]);
    expect(planChecks).toEqual([true, true, true, true, true]);
    expect(profile.sessionsCompleted).toBe(5);
    const grounded = step.notes.hypotheses.filter(
      (h) => h.evidence.length > 0 && h.evidence.every((id) => loggedIds.has(id)),
    );
    expect(grounded.length).toBeGreaterThanOrEqual(1);
  });
});
