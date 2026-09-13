import { describe, expect, it } from "vitest";
import { DIAGNOSTIC_PLAN, emptyNotes, newProfile, runSession, scripted } from "@/loop";
import { summaryInput } from "@/summary/summary";
import { POST } from "./route";

const input = summaryInput(runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-r", scripted("ffhrfffhf")), emptyNotes(), []);

const post = (value: unknown) =>
  POST(new Request("http://localhost/api/summary", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) }));

describe("POST /api/summary", () => {
  it("fails at once and says why when the server has no key, so the Parent reads the template Summary", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const response = await post(input);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "ANTHROPIC_API_KEY is not set" });
  });

  it("rejects a body that is not the Session Log tallied and the Notes", async () => {
    expect((await post({ ...input, practice: [{ skill: "partners-to-10" }] })).status).toBe(400);
    expect((await post({ ...input, notes: { hypotheses: "none" } })).status).toBe(400);
    expect((await post(null)).status).toBe(400);
  });

  it("rejects a body carrying the Nickname, which the Summary writer is never given", async () => {
    const response = await post({ ...input, nickname: "Mia" });

    expect(response.status).toBe(400);
    expect(JSON.stringify(input)).not.toContain("nickname");
  });
});
