import { afterEach, describe, expect, it } from "vitest";
import { coachInput } from "@/coach";
import { DIAGNOSTIC_PLAN, emptyNotes, newProfile, runSession, scripted } from "@/loop";
import { CoachInputSchema } from "@/generation/coach-schema";
import { modelRoute } from "@/lib/model-route";
import { POST } from "./route";

const input = coachInput(runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-r", scripted("ffhrfffhf")), emptyNotes());

const post = (handler: (request: Request) => Promise<Response>, value: unknown) =>
  handler(new Request("http://localhost/api/coach", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) }));

/** The route with the Coach's own schema and a Coach that only remembers what it was given. */
function fakeCoachRoute() {
  const calls: unknown[] = [];
  process.env.ANTHROPIC_API_KEY = "test-key";
  return { calls, handler: modelRoute({ schema: CoachInputSchema, run: async (given) => { calls.push(given); return { ran: true }; } }) };
}

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
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

  it("answers 502 when the Coach itself fails, which the browser may try once more", async () => {
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
