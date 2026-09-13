import { afterEach, describe, expect, it } from "vitest";
import { DIAGNOSTIC_PLAN, emptyNotes, newProfile, runSession, scripted } from "@/loop";
import { SummaryInputSchema } from "@/generation/summary-schema";
import { modelRoute } from "@/lib/model-route";
import { summaryInput } from "@/summary/summary";
import { POST } from "./route";

const input = summaryInput(runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-r", scripted("ffhrfffhf")), emptyNotes(), []);

const post = (handler: (request: Request) => Promise<Response>, value: unknown) =>
  handler(new Request("http://localhost/api/summary", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) }));

/** The route with the Summary's own schema and a writer that only remembers what it was given. */
function fakeSummaryRoute() {
  const calls: unknown[] = [];
  process.env.ANTHROPIC_API_KEY = "test-key";
  return {
    calls,
    handler: modelRoute({ schema: SummaryInputSchema, run: async (given) => { calls.push(given); return { practiced: "p", activity: "a" }; } }),
  };
}

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

describe("POST /api/summary", () => {
  it("fails at once and says why when the server has no key, so the Parent reads the template Summary", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const response = await post(POST, input);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "ANTHROPIC_API_KEY is not set" });
  });

  it("hands the writer the Session Log tallied and the Notes, and nothing else", async () => {
    const { calls, handler } = fakeSummaryRoute();

    const response = await post(handler, input);

    expect(response.status).toBe(200);
    expect(calls).toEqual([input]);
  });

  it("refuses a body carrying the Nickname, the Avatar colour, or the Theme, so the Summary can only say \"your child\"", async () => {
    const { calls, handler } = fakeSummaryRoute();

    const response = await post(handler, { ...input, nickname: "Mia", avatarColor: "sky", theme: "space" });

    expect(response.status).toBe(400);
    expect(calls).toEqual([]);
  });

  it("rejects a body that is not the Session Log tallied and the Notes", async () => {
    const { calls, handler } = fakeSummaryRoute();

    expect((await post(handler, { ...input, practice: [{ skill: "partners-to-10" }] })).status).toBe(400);
    expect((await post(handler, { ...input, notes: { hypotheses: "none" } })).status).toBe(400);
    expect((await post(handler, null)).status).toBe(400);
    expect(calls).toEqual([]);
  });
});
