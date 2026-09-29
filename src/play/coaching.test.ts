import { afterEach, describe, expect, it, vi } from "vitest";
import { applyCoachRun, awaitCoach, coachInput, emptyRecord } from "@/coach";
import { alwaysFirstTry, baselinePlan, DIAGNOSTIC_PLAN, newProfile, runSession, scripted, validatePlan } from "@/loop";
import { profileWithMastered } from "@/loop/testing";
import { fakeGeneration } from "@/generation/fake";
import { ModelUnavailableError } from "@/lib/errors";
import { describePlan, notebook } from "@/parent/notebook";
import { summaryInput } from "@/summary/summary";
import { templateSummary } from "@/summary/template";
import { generationCoaching, powersEarnedIn, routeCoaching, runCoaching, type Coaching } from "./coaching";

const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-c", scripted("ffhrfffhf"));
const at = new Date("2026-09-13T20:00:00.000Z");

/** Neither operation can be reached: what a browser sees with no key on the server. */
const unreachable: Coaching = generationCoaching({
  runCoach: async () => {
    throw new ModelUnavailableError("/api/coach answered 503: ANTHROPIC_API_KEY is not set");
  },
  writeSummary: async () => {
    throw new ModelUnavailableError("/api/summary answered 503: ANTHROPIC_API_KEY is not set");
  },
});

/** The run written onto the record that was waiting for it, which is what the screens do. */
const written = async (coaching: Coaching, record = awaitCoach(emptyRecord(), result)) =>
  applyCoachRun(record, await runCoaching(coaching, record, result, [], at));

describe("runCoaching", () => {
  it("writes the Learner Notes, the next Session Plan, and the Parent Summary onto the record", async () => {
    const record = await written(generationCoaching(fakeGeneration()));

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

    expect((await written(generationCoaching(fakeGeneration()), waiting)).awaiting).toBeNull();
    expect((await written(unreachable, waiting)).awaiting).toBeNull();
  });

  it("keeps the evidence of every Hypothesis, so the Notebook can show the Problems it rests on", async () => {
    const record = await written(generationCoaching(fakeGeneration()));
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
    const run = await runCoaching(generationCoaching(fakeGeneration()), waiting, result, [], at);
    // While the run was away, a later Session's Summary was written.
    const meanwhile = { ...waiting, summaries: [{ ...(await written(generationCoaching(fakeGeneration()))).summaries[0], sessionNumber: 2 }] };

    const record = applyCoachRun(meanwhile, run);

    expect(record.summaries.map((summary) => summary.sessionNumber)).toEqual([2, 1]);
  });

  it("passes the Powers the Session earned to the Summary, so they are named in it", async () => {
    const record = applyCoachRun(emptyRecord(), await runCoaching(generationCoaching(fakeGeneration()), emptyRecord(), result, ["Count-On Flight"], at));

    expect(record.summaries[0].powers).toEqual(["Count-On Flight"]);
    expect(record.summaries[0].practiced).toContain("Count-On Flight");
  });

  it("names the Power a Session taught Ollie, read from the Session itself and not from a screen", async () => {
    // A Session that Masters counting on: the Loop returns Count-On Flight with it.
    const flight = runSession(
      { length: 10, skills: [{ skill: "counting-on", weight: 1 }], reviewShare: 0, hypothesisUnderTest: null },
      profileWithMastered("partners-to-10", "teen-numbers"),
      "seed-flight",
      alwaysFirstTry,
    );
    expect(flight.powersEarned).toEqual(["count-on-flight"]);
    expect(powersEarnedIn(flight)).toEqual(["Count-On Flight"]);

    const waiting = awaitCoach(emptyRecord(), flight);
    const run = await runCoaching(generationCoaching(fakeGeneration()), waiting, waiting.awaiting!, powersEarnedIn(waiting.awaiting!), at);
    const summary = applyCoachRun(waiting, run).summaries[0];

    expect(summary.powers).toEqual(["Count-On Flight"]);
    expect(summary.practiced).toContain("Count-On Flight");
    // And with no model to write it, the hand-written Summary names it too.
    const template = (await runCoaching(unreachable, waiting, waiting.awaiting!, powersEarnedIn(waiting.awaiting!), at)).summary;
    expect(template.source).toBe("template");
    expect(template.practiced).toContain("Ollie learned Count-On Flight.");
  });
});

describe("routeCoaching", () => {
  /** The routes as `fetch` reaches them, each answering what the test gives, and every path asked kept. */
  function routesAnswering(answers: Record<string, unknown>): string[] {
    const asked: string[] = [];
    vi.stubGlobal("fetch", async (path: string) => {
      asked.push(path);
      return Response.json(answers[path]);
    });
    return asked;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const input = coachInput(result, emptyRecord().notes);
  const reasons = ['h9 cites "p99", which is not a Problem the Coach was shown'];

  it("keeps the route's retried output with where it came from and why, and asks the route once", async () => {
    const output = await fakeGeneration().runCoach(input);
    const asked = routesAnswering({
      "/api/coach": { ...output, source: "retry", rejections: [{ attempt: 1, reasons }] },
      "/api/summary": { ...(await fakeGeneration().writeSummary(summaryInput(result, output.notes, []))), source: "summary", rejections: [] },
    });

    const record = await written(routeCoaching());

    expect(record.source).toBe("retry");
    expect(record.notes).toEqual(output.notes);
    expect(record.reasons).toEqual(reasons);
    expect(record.summaries[0].source).toBe("summary");
    expect(asked).toEqual(["/api/coach", "/api/summary"]);
  });

  it("uses its own Baseline Plan when the route rejected the Coach twice, and does not ask again: the Notebook says the plan could not be used", async () => {
    const asked = routesAnswering({
      "/api/coach": { notes: input.notes, plan: baselinePlan(result.profile), source: "baseline", rejections: [{ attempt: 1, reasons }, { attempt: 2, reasons }] },
      "/api/summary": { ...templateSummary(summaryInput(result, input.notes, [])), source: "template", rejections: [{ attempt: 1, reasons: ["12 is not a number the engine gave"] }] },
    });

    const record = await written(routeCoaching());

    expect(record.source).toBe("baseline");
    expect(record.unavailable).toBe(false);
    expect(record.plan).toEqual(baselinePlan(result.profile));
    expect(record.reasons).toEqual([...reasons, ...reasons]);
    expect(notebook(record).baseline).toEqual({ unavailable: false, plan: describePlan(baselinePlan(result.profile)) });
    expect(record.summaries[0].source).toBe("template");
    expect(asked).toEqual(["/api/coach", "/api/summary"]);
  });

  it("checks what the route answered again: an output citing a Problem the Session never had is rejected on the device too", async () => {
    const output = await fakeGeneration().runCoach(input);
    const invented = { ...output, notes: { ...output.notes, hypotheses: output.notes.hypotheses.map((h) => ({ ...h, evidence: ["p99"] })) } };
    routesAnswering({ "/api/coach": { ...invented, source: "coach", rejections: [] }, "/api/summary": null });

    const record = await written(routeCoaching());

    expect(record.source).toBe("baseline");
    expect(record.notes).toEqual(input.notes);
    expect(record.reasons.every((reason) => reason.includes('"p99"'))).toBe(true);
    // A Summary route answering nothing usable still leaves the Parent a note.
    expect(record.summaries[0].source).toBe("template");
  });
});
