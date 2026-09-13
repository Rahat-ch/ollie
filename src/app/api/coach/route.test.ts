import { describe, expect, it } from "vitest";
import { coachInput } from "@/coach";
import { DIAGNOSTIC_PLAN, emptyNotes, newProfile, runSession, scripted } from "@/loop";
import { POST } from "./route";

const input = coachInput(runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-r", scripted("ffhrfffhf")), emptyNotes());

const post = (value: unknown) =>
  POST(new Request("http://localhost/api/coach", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) }));

describe("POST /api/coach", () => {
  it("fails at once and says why when the server has no key, so the browser falls back to the Baseline Plan", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const response = await post(input);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "ANTHROPIC_API_KEY is not set" });
  });

  it("rejects a body that is not what the engine hands the Coach", async () => {
    expect((await post({ ...input, sessionNumber: 0 })).status).toBe(400);
    expect((await post({ ...input, evidence: [{ id: "p1" }] })).status).toBe(400);
    expect((await post(null)).status).toBe(400);
    expect((await POST(new Request("http://localhost/api/coach", { method: "POST", body: "nope" }))).status).toBe(400);
  });

  it("rejects a body carrying anything personal, so the Nickname, the Avatar, and the Theme cannot reach the model", async () => {
    const response = await post({ ...input, nickname: "Mia" });

    expect(response.status).toBe(400);
    expect(JSON.stringify(input)).not.toContain("nickname");
  });
});
