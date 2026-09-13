import { describe, expect, it } from "vitest";
import { applyCoachRun, awaitCoach, emptyRecord } from "@/coach";
import { baselinePlan, DIAGNOSTIC_PLAN, newProfile, runSession, scripted, validatePlan } from "@/loop";
import { fakeGeneration } from "@/generation/fake";
import { ModelUnavailableError } from "@/lib/errors";
import { runCoaching, type Coaching } from "./coaching";

const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-c", scripted("ffhrfffhf"));
const at = new Date("2026-09-13T20:00:00.000Z");

/** Neither operation can be reached: what a browser sees with no key on the server. */
const unreachable: Coaching = {
  runCoach: async () => {
    throw new ModelUnavailableError("/api/coach answered 503: ANTHROPIC_API_KEY is not set");
  },
  writeSummary: async () => {
    throw new ModelUnavailableError("/api/summary answered 503: ANTHROPIC_API_KEY is not set");
  },
};

/** The run written onto the record that was waiting for it, which is what the screens do. */
const written = async (coaching: Coaching, record = awaitCoach(emptyRecord(), result)) =>
  applyCoachRun(record, await runCoaching(coaching, record, result, [], at));

describe("runCoaching", () => {
  it("writes the Learner Notes, the next Session Plan, and the Parent Summary onto the record", async () => {
    const record = await written(fakeGeneration());

    expect(record.source).toBe("coach");
    expect(record.reasons).toEqual([]);
    expect(record.unavailable).toBe(false);
    expect(record.lastSessionCoached).toBe(1);
    expect(record.notes.hypotheses.length).toBeGreaterThan(0);
    expect(validatePlan(record.plan!, result.profile)).toEqual({ ok: true });
    expect(record.changed.every((change) => change.startsWith("New:") || change.startsWith("Strength:"))).toBe(true);
    expect(record.summaries).toHaveLength(1);
    expect(record.summaries[0]).toMatchObject({ sessionNumber: 1, source: "summary", at: at.toISOString(), problems: 9 });
  });

  it("stops the Session waiting for a Coach run once the record is written, however the run went", async () => {
    const waiting = awaitCoach(emptyRecord(), result);
    expect(waiting.awaiting).toBe(result);

    expect((await written(fakeGeneration(), waiting)).awaiting).toBeNull();
    expect((await written(unreachable, waiting)).awaiting).toBeNull();
  });

  it("keeps the evidence of every Hypothesis, so the Notebook can show the Problems it rests on", async () => {
    const record = await written(fakeGeneration());
    const cited = new Set(record.cited.map((problem) => problem.id));

    for (const hypothesis of record.notes.hypotheses) {
      expect(hypothesis.evidence.length).toBeGreaterThan(0);
      for (const id of hypothesis.evidence) expect(cited.has(id)).toBe(true);
    }
  });

  it("falls back to the Baseline Plan at once, and still gives the Parent a Summary, when neither can be reached", async () => {
    const record = await written(unreachable);

    expect(record.source).toBe("baseline");
    expect(record.unavailable).toBe(true);
    expect(record.plan).toEqual(baselinePlan(result.profile));
    // A Coach that is not there is not asked twice: one reason, not two.
    expect(record.reasons).toEqual(["/api/coach answered 503: ANTHROPIC_API_KEY is not set"]);
    expect(record.notes).toEqual(emptyRecord().notes);
    expect(record.lastSessionCoached).toBe(1);
    expect(record.summaries[0].source).toBe("template");
    expect(record.summaries[0].practiced).toContain("9 Problems");
  });

  it("writes onto the record as it stands, so a run that took a while cannot drop what landed meanwhile", async () => {
    const waiting = awaitCoach(emptyRecord(), result);
    const run = await runCoaching(fakeGeneration(), waiting, result, [], at);
    // While the run was away, a later Session's Summary was written.
    const meanwhile = { ...waiting, summaries: [{ ...(await written(fakeGeneration())).summaries[0], sessionNumber: 2 }] };

    const record = applyCoachRun(meanwhile, run);

    expect(record.summaries.map((summary) => summary.sessionNumber)).toEqual([2, 1]);
  });

  it("passes the Powers the Session earned to the Summary, so they are named in it", async () => {
    const record = applyCoachRun(emptyRecord(), await runCoaching(fakeGeneration(), emptyRecord(), result, ["Count-On Flight"], at));

    expect(record.summaries[0].powers).toEqual(["Count-On Flight"]);
    expect(record.summaries[0].practiced).toContain("Count-On Flight");
  });
});
