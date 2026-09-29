import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { coachInput } from "@/coach";
import { baselinePlan, DIAGNOSTIC_PLAN, emptyNotes, newProfile, planSpace, runSession, scripted } from "@/loop";
import { profileWithMastered } from "@/loop/testing";
import { CoachInputSchema } from "@/generation/coach-schema";
import { fakeGeneration } from "@/generation/fake";
import type { CoachInput, CoachOutput } from "@/generation/types";
import { modelRoute } from "@/lib/model-route";
import { POST } from "./route";

/**
 * The Coach behind the Anthropic adapter's name: the Generation fake, whose
 * answer a test may replace. Every input it is given is kept, so a test can
 * see what the route asked it and how many times.
 */
const coach = vi.hoisted(() => ({
  answer: null as ((input: CoachInput, call: number) => Promise<CoachOutput>) | null,
  inputs: [] as CoachInput[],
}));

vi.mock("@/generation/anthropic", async () => {
  const { fakeGeneration } = await import("@/generation/fake");
  const fake = fakeGeneration();
  const runCoach = (input: CoachInput): Promise<CoachOutput> => {
    coach.inputs.push(input);
    return coach.answer ? coach.answer(input, coach.inputs.length) : fake.runCoach(input);
  };
  return { anthropicGeneration: () => fakeGeneration({ runCoach }) };
});

const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-r", scripted("ffhrfffhf"));
const input = coachInput(result, emptyNotes());

const post = (handler: (request: Request) => Promise<Response>, value: unknown) =>
  handler(new Request("http://localhost/api/coach", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) }));

/** The route with the Coach's own schema and a Coach that only remembers what it was given. */
function fakeCoachRoute() {
  const calls: unknown[] = [];
  process.env.ANTHROPIC_API_KEY = "test-key";
  return { calls, handler: modelRoute({ schema: CoachInputSchema, run: async (given) => { calls.push(given); return { ran: true }; } }) };
}

beforeEach(() => {
  coach.answer = null;
  coach.inputs.length = 0;
});

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

/** The fake's own valid answer. */
const valid = (given: CoachInput): Promise<CoachOutput> => fakeGeneration().runCoach(given);

/** A claim no valid output makes, so a response carrying it carries the invented output. */
const INVENTED = "Guesses whenever the numbers are big";

/** The fake's answer with one more Hypothesis, citing p99: a Problem the Coach was never shown. */
async function inventingP99(given: CoachInput): Promise<CoachOutput> {
  const output = await valid(given);
  const invented = { id: "h9", claim: INVENTED, status: "proposed" as const, confidence: 0.4, evidence: ["p99"], nextTest: "More big numbers" };
  return { ...output, notes: { ...output.notes, hypotheses: [...output.notes.hypotheses, invented] } };
}

/** The fake's answer with a Plan for Word Problems, whose Unit the Diagnostic Session has not unlocked. */
async function planningWordProblems(given: CoachInput): Promise<CoachOutput> {
  const output = await valid(given);
  return { ...output, plan: { ...output.plan, skills: [{ skill: "result-unknown", weight: 1 }] } };
}

describe("POST /api/coach runs the Coach step and answers only checked output", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("answers a Coach output the engine allows, and says it was the Coach's", async () => {
    const response = await post(POST, input);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...(await valid(input)), source: "coach", rejections: [] });
    expect(coach.inputs).toHaveLength(1);
  });

  it("never answers a Coach output citing a Problem it was not shown: the retry, when that is allowed", async () => {
    coach.answer = (given, call) => (call === 1 ? inventingP99(given) : valid(given));

    const body = await (await post(POST, input)).json();

    expect(body.source).toBe("retry");
    expect(body.notes).toEqual((await valid(input)).notes);
    // The rejection says why, and does not carry the rejected output back to the device.
    expect(body.rejections).toEqual([{ attempt: 1, reasons: ['h9 cites "p99", which is not a Problem the Coach was shown'] }]);
    expect(JSON.stringify(body)).not.toContain(INVENTED);
    // The retry was shown what was rejected and every reason, as the engine's rule says.
    expect(coach.inputs).toHaveLength(2);
    expect(coach.inputs[1].rejected?.reasons).toEqual(body.rejections[0].reasons);
    expect(coach.inputs[1].rejected?.output?.notes.hypotheses.at(-1)?.claim).toBe(INVENTED);
  });

  it("never answers a Coach output citing a Problem it was not shown: the Baseline Plan, when the retry cites one too", async () => {
    coach.answer = inventingP99;

    const body = await (await post(POST, input)).json();

    expect(body.source).toBe("baseline");
    expect(body.plan).toEqual(baselinePlan(result.profile));
    // The Notes as they stood before the Session.
    expect(body.notes).toEqual(input.notes);
    expect(body.rejections.map((rejection: { attempt: number }) => rejection.attempt)).toEqual([1, 2]);
    expect(JSON.stringify(body)).not.toContain(INVENTED);
    expect(coach.inputs).toHaveLength(2);
  });

  it("never answers a Plan outside the Plan Space", async () => {
    coach.answer = planningWordProblems;

    const body = await (await post(POST, input)).json();

    expect(body.source).toBe("baseline");
    expect(body.rejections[0].reasons).toEqual(["result-unknown is in Unit 3, which is not unlocked yet"]);
    expect(JSON.stringify(body.plan)).not.toContain("result-unknown");
  });

  it("rebuilds the Plan Space from the Knowledge Estimates, so a body claiming a wider one widens nothing", async () => {
    coach.answer = planningWordProblems;
    const everyUnit = planSpace(profileWithMastered("partners-to-10", "teen-numbers", "counting-on", "make-a-ten", "unknown-addend"));

    const body = await (await post(POST, { ...input, planSpace: everyUnit })).json();

    expect(body.source).toBe("baseline");
    expect(body.rejections[0].reasons).toEqual(["result-unknown is in Unit 3, which is not unlocked yet"]);
    // The Coach is shown the Plan Space the server rebuilt, not the one the body claimed.
    expect(coach.inputs[0].planSpace).toEqual(input.planSpace);
  });

  it("knows the Problems the Notes already cite, so a Hypothesis resting on an earlier Session is allowed", async () => {
    const earlier = { id: "h-earlier", claim: "Counts on from the larger number", status: "proposed" as const, confidence: 0.5, evidence: ["p0"], nextTest: "Watch counting on" };
    // The fake keeps every Hypothesis it was given, evidence and all.
    const body = await (await post(POST, { ...input, notes: { hypotheses: [earlier], strengths: [] } })).json();

    expect(body.source).toBe("coach");
    expect(body.notes.hypotheses[0]).toEqual(earlier);
  });
});

describe("POST /api/coach", () => {
  it("fails at once and says why when the server has no key, so the browser falls back to the Baseline Plan", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const response = await post(POST, input);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "ANTHROPIC_API_KEY is not set" });
  });

  it("hands the Coach exactly what the engine built, and nothing else", async () => {
    const { calls, handler } = fakeCoachRoute();

    const response = await post(handler, input);

    expect(response.status).toBe(200);
    expect(calls).toEqual([input]);
  });

  it("refuses a body carrying the Nickname, the Avatar colour, or the Theme, so nothing personal reaches the Coach", async () => {
    const { calls, handler } = fakeCoachRoute();

    const response = await post(handler, { ...input, nickname: "Mia", avatarColor: "sky", theme: "space" });

    expect(response.status).toBe(400);
    expect(calls).toEqual([]);
  });

  it("rejects a body that is not what the engine hands the Coach", async () => {
    const { calls, handler } = fakeCoachRoute();

    expect((await post(handler, { ...input, sessionNumber: 0 })).status).toBe(400);
    expect((await post(handler, { ...input, evidence: [{ id: "p1" }] })).status).toBe(400);
    expect((await post(handler, null)).status).toBe(400);
    expect((await handler(new Request("http://localhost/api/coach", { method: "POST", body: "nope" }))).status).toBe(400);
    expect(calls).toEqual([]);
  });

  it("answers 502 when the operation itself throws, and the browser uses its own Baseline Plan", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const handler = modelRoute({
      schema: CoachInputSchema,
      run: async () => {
        throw new Error("the model is busy");
      },
    });

    const response = await post(handler, input);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "the model is busy" });
  });
});
