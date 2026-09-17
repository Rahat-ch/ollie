import { describe, expect, it } from "vitest";
import type { StoryInput } from "@/generation/types";
import { NICKNAME_PLACEHOLDER } from "@/story/nickname";
import { templateStory } from "@/story/template";
import { POST } from "./route";

const body: Omit<StoryInput, "nickname"> = {
  theme: "puppies",
  skill: "result-unknown",
  structure: "add-to",
  equation: { left: 7, op: "+", right: 5, result: 12, unknown: "result" },
  answer: 12,
};

const post = (value: unknown) =>
  POST(new Request("http://localhost/api/story", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) }));

describe("POST /api/story", () => {
  it("answers a Problem the engine could have set from the bundled Pool with no call at all", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const response = await post(body);
    expect(response.status).toBe(200);
    const answer = (await response.json()) as { text: string; source: string };
    expect(answer.source).toBe("pool");
    expect(answer.text).toContain(NICKNAME_PLACEHOLDER);
    expect(answer.text).toMatch(/\?$/);
  });

  it("answers a Problem outside the bundled Pool with the template when there is no key", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const outside = { ...body, equation: { left: 9, op: "+" as const, right: 11, result: 20, unknown: "result" as const }, answer: 20 };
    const response = await post(outside);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      text: templateStory({ ...outside, nickname: NICKNAME_PLACEHOLDER }),
      source: "template",
    });
  });

  it("answers the rich set apart from the plain one, so Story Solver hears its own Story", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const response = await post({ ...body, set: "rich" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      text: templateStory({ ...body, nickname: NICKNAME_PLACEHOLDER, set: "rich" as const }),
      source: "template",
    });
  });

  it("rejects a structure the Skill does not have", async () => {
    const response = await post({ ...body, structure: "compare" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: ['structure: result-unknown has no structure "compare"'] });
  });

  it("rejects numbers the engine would not set: a sum that does not hold, the wrong unknown, a part of 0, a wrong answer", async () => {
    for (const bad of [
      { ...body, equation: { ...body.equation, result: 13 }, answer: 13 },
      { ...body, equation: { ...body.equation, unknown: "right" }, answer: 5 },
      { ...body, equation: { left: 0, op: "+", right: 12, result: 12, unknown: "result" } },
      { ...body, answer: 11 },
    ]) {
      const response = await post(bad);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: ["equation: not a Problem the engine sets for this structure"] });
    }
  });

  it("rejects a body that is not JSON, or carries the Nickname", async () => {
    const notJson = await POST(new Request("http://localhost/api/story", { method: "POST", body: "nope" }));
    expect(notJson.status).toBe(400);
    const withNickname = await post({ ...body, nickname: "Mia" });
    expect(withNickname.status).toBe(400);
  });
});
