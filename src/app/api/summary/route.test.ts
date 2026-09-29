import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DIAGNOSTIC_PLAN, emptyNotes, newProfile, runSession, scripted } from "@/loop";
import { SummaryInputSchema } from "@/generation/summary-schema";
import { fakeGeneration } from "@/generation/fake";
import type { SummaryInput, SummaryOutput } from "@/generation/types";
import { modelRoute } from "@/lib/model-route";
import { summaryInput } from "@/summary/summary";
import { templateSummary } from "@/summary/template";
import { POST } from "./route";

/**
 * The Summary writer behind the Anthropic adapter's name: the Generation
 * fake, whose answer a test may replace. Every call is counted.
 */
const writer = vi.hoisted(() => ({
  answer: null as ((input: SummaryInput, call: number) => Promise<SummaryOutput>) | null,
  calls: 0,
}));

vi.mock("@/generation/anthropic", async () => {
  const { fakeGeneration } = await import("@/generation/fake");
  const fake = fakeGeneration();
  const writeSummary = (input: SummaryInput): Promise<SummaryOutput> => {
    writer.calls += 1;
    return writer.answer ? writer.answer(input, writer.calls) : fake.writeSummary(input);
  };
  return { anthropicGeneration: () => fakeGeneration({ writeSummary }) };
});

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

beforeEach(() => {
  writer.answer = null;
  writer.calls = 0;
});

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

describe("POST /api/summary runs the Summary validator and answers only a checked Summary", () => {
  /** A Summary counting 12 Problems in a Session of 9: a number the engine did not give. */
  const INVENTED = "Your child answered 12 Problems today, with 1 Revealed and 1 correct after a Hint.";
  const inventing = async (given: SummaryInput): Promise<SummaryOutput> => ({ ...(await fakeGeneration().writeSummary(given)), practiced: INVENTED });

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("answers a Summary the validator allows, and says it was the writer's", async () => {
    const response = await post(POST, input);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...(await fakeGeneration().writeSummary(input)), source: "summary", rejections: [] });
    expect(writer.calls).toBe(1);
  });

  it("never answers a Summary with a number the engine did not give: the second attempt, when that is allowed", async () => {
    writer.answer = (given, call) => (call === 1 ? inventing(given) : fakeGeneration().writeSummary(given));

    const body = await (await post(POST, input)).json();

    expect(body.source).toBe("summary");
    expect(body.practiced).toBe((await fakeGeneration().writeSummary(input)).practiced);
    expect(body.rejections).toHaveLength(1);
    expect(body.rejections[0].attempt).toBe(1);
    expect(body.rejections[0].reasons.join("; ")).toContain("12");
    // The rejection says why, and does not carry the rejected Summary back to the device.
    expect(JSON.stringify(body)).not.toContain(INVENTED);
    expect(writer.calls).toBe(2);
  });

  it("never answers a Summary with a number the engine did not give: the template, when every attempt has one", async () => {
    writer.answer = inventing;

    const body = await (await post(POST, input)).json();

    expect(body).toMatchObject({ ...templateSummary(input), source: "template" });
    expect(body.rejections.map((rejection: { attempt: number }) => rejection.attempt)).toEqual([1, 2]);
    expect(JSON.stringify(body)).not.toContain(INVENTED);
  });
});
