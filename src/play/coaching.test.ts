import { describe, expect, it } from "vitest";
import { emptyRecord } from "@/coach";
import { baselinePlan, DIAGNOSTIC_PLAN, newProfile, runSession, scripted, validatePlan } from "@/loop";
import { fakeGeneration } from "@/generation/fake";
import { runCoaching, type Coaching } from "./coaching";

const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-c", scripted("ffhrfffhf"));
const at = new Date("2026-09-13T20:00:00.000Z");

/** Neither operation can be reached: what a browser sees with no key on the server. */
const unreachable: Coaching = {
  runCoach: async () => {
    throw new Error("/api/coach answered 503: ANTHROPIC_API_KEY is not set");
  },
  writeSummary: async () => {
    throw new Error("/api/summary answered 503: ANTHROPIC_API_KEY is not set");
  },
};

describe("runCoaching", () => {
  it("writes the Learner Notes, the next Session Plan, and the Parent Summary onto the record", async () => {
    const record = await runCoaching(fakeGeneration(), emptyRecord(), result, [], at);

    expect(record.source).toBe("coach");
    expect(record.reasons).toEqual([]);
    expect(record.lastSessionCoached).toBe(1);
    expect(record.notes.hypotheses.length).toBeGreaterThan(0);
    expect(validatePlan(record.plan!, result.profile)).toEqual({ ok: true });
    expect(record.changed.every((change) => change.startsWith("New:") || change.startsWith("Strength:"))).toBe(true);
    expect(record.summaries).toHaveLength(1);
    expect(record.summaries[0]).toMatchObject({ sessionNumber: 1, source: "summary", at: at.toISOString(), problems: 9 });
  });

  it("keeps the evidence of every Hypothesis, so the Notebook can show the Problems it rests on", async () => {
    const record = await runCoaching(fakeGeneration(), emptyRecord(), result, [], at);
    const cited = new Set(record.cited.map((problem) => problem.id));

    for (const hypothesis of record.notes.hypotheses) {
      expect(hypothesis.evidence.length).toBeGreaterThan(0);
      for (const id of hypothesis.evidence) expect(cited.has(id)).toBe(true);
    }
  });

  it("falls back to the Baseline Plan with its reasons, and still gives the Parent a Summary, when neither can be reached", async () => {
    const record = await runCoaching(unreachable, emptyRecord(), result, [], at);

    expect(record.source).toBe("baseline");
    expect(record.plan).toEqual(baselinePlan(result.profile));
    expect(record.reasons).toEqual([
      "/api/coach answered 503: ANTHROPIC_API_KEY is not set",
      "/api/coach answered 503: ANTHROPIC_API_KEY is not set",
    ]);
    expect(record.notes).toEqual(emptyRecord().notes);
    expect(record.lastSessionCoached).toBe(1);
    expect(record.summaries[0].source).toBe("template");
    expect(record.summaries[0].practiced).toContain("9 Problems");
  });

  it("passes the Powers the Session earned to the Summary, so they are named in it", async () => {
    const record = await runCoaching(fakeGeneration(), emptyRecord(), result, ["Count-On Flight"], at);

    expect(record.summaries[0].powers).toEqual(["Count-On Flight"]);
    expect(record.summaries[0].practiced).toContain("Count-On Flight");
  });
});
