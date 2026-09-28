/**
 * The Coach's timeout, from the device through the route to the model call
 * and back. The live Coach averages about 71 s a call; what happens when it
 * takes that long, or longer, is decided by three clocks at once — the
 * device's, the route's, and the model's — so it is tested with all three
 * running: `routeCoaching` on the device, the real `/api/coach` and
 * `/api/summary` handlers behind `fetch`, and a slow fake Coach behind the
 * Anthropic adapter's name, on fake timers. Nothing reaches a model.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyCoachRun, awaitCoach, coachInput, emptyRecord } from "@/coach";
import { baselinePlan, DIAGNOSTIC_PLAN, newProfile, runSession, scripted } from "@/loop";
import type { CoachInput, CoachOutput } from "@/generation/types";
import { POST as coachRoute } from "@/app/api/coach/route";
import { POST as summaryRoute } from "@/app/api/summary/route";
import { routeCoaching, runCoaching } from "./coaching";

/** The slow Coach: how long each call takes, and every call it was asked for, with what it was told to listen to. */
const slow = vi.hoisted(() => ({
  ms: 0,
  calls: [] as { signal?: AbortSignal; settled: "answered" | "aborted" | null }[],
}));

/**
 * The Anthropic adapter's name, with the Generation fake behind it and a
 * Coach that takes `slow.ms` to give the fake's own valid answer. It hears
 * an abort only if the caller passes one, as the real SDK call does.
 */
vi.mock("@/generation/anthropic", async () => {
  const { fakeGeneration } = await import("@/generation/fake");
  const fake = fakeGeneration();
  const runCoach = (input: CoachInput, options?: { signal?: AbortSignal }): Promise<CoachOutput> => {
    const call: (typeof slow.calls)[number] = { signal: options?.signal, settled: null };
    slow.calls.push(call);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        call.settled = "answered";
        resolve(fake.runCoach(input));
      }, slow.ms);
      options?.signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        call.settled = "aborted";
        reject(options.signal!.reason);
      });
    });
  };
  return { anthropicGeneration: () => fakeGeneration({ runCoach }) };
});

const routes: Record<string, (request: Request) => Promise<Response>> = {
  "/api/coach": coachRoute,
  "/api/summary": summaryRoute,
};

/**
 * `fetch` as the browser has it, reaching the route handlers in process:
 * the request carries the device's signal, so the route sees the device
 * give up, and the device stops waiting the moment it does.
 */
function fetchTheRoutes(path: string, init: RequestInit): Promise<Response> {
  return new Promise((resolve, reject) => {
    init.signal?.addEventListener("abort", () => reject(init.signal!.reason));
    routes[path](new Request(`http://localhost${path}`, init)).then(resolve, reject);
  });
}

/**
 * Let time pass a second at a time, with a real turn of the event loop in
 * each, so a request body read or a response written between two timers is
 * not skipped over.
 */
async function elapse(seconds: number): Promise<void> {
  for (let second = 0; second < seconds; second++) {
    await vi.advanceTimersByTimeAsync(1000);
    await new Promise((settle) => setImmediate(settle));
  }
}

const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-t", scripted("ffhrfffhf"));
const at = new Date("2026-09-28T20:00:00.000Z");

/** One Coach run after a Session, as the device makes it, with time let run out. */
async function coachRunTaking(ms: number) {
  slow.ms = ms;
  const record = awaitCoach(emptyRecord(), result);
  const run = runCoaching(routeCoaching(), record, result, [], at);
  await elapse(400);
  return applyCoachRun(record, await run);
}

beforeEach(() => {
  slow.calls.length = 0;
  process.env.ANTHROPIC_API_KEY = "test-key";
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  // AbortSignal.timeout keeps Node's own clock; this one keeps the fake one, and times out the same way.
  vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(new DOMException("The operation was aborted due to timeout", "TimeoutError")), ms);
    return controller.signal;
  });
  vi.stubGlobal("fetch", fetchTheRoutes);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete process.env.ANTHROPIC_API_KEY;
});

describe("a slow Coach", () => {
  it("that takes the live average of 71 s reaches the Learner: the device waits for it, and it is called once", async () => {
    const record = await coachRunTaking(71_000);

    expect(slow.calls).toHaveLength(1);
    expect(record.source).toBe("coach");
    expect(record.unavailable).toBe(false);
  });

  it("that takes two minutes is paid for once, cancelled at the server's deadline, and the Baseline Plan is used without a retry", async () => {
    const record = await coachRunTaking(120_000);

    // One call paid for, not the call and its retry.
    expect(slow.calls).toHaveLength(1);
    // The route stopped it rather than letting it run on for nobody.
    expect(slow.calls[0].settled).toBe("aborted");
    // The Baseline Plan, used at once, as for a Coach that could not be reached.
    expect(record.source).toBe("baseline");
    expect(record.unavailable).toBe(true);
    expect(record.plan).toEqual(baselinePlan(result.profile));
    expect(record.reasons).toHaveLength(1);
    expect(record.reasons[0]).toContain("75 s");
    // And the Parent still gets a Summary.
    expect(record.summaries).toHaveLength(1);
  });
});

describe("POST /api/coach with a slow Coach", () => {
  const input = JSON.stringify(coachInput(result, emptyRecord().notes));
  const post = (signal?: AbortSignal) =>
    coachRoute(new Request("http://localhost/api/coach", { method: "POST", headers: { "content-type": "application/json" }, body: input, signal }));

  it("aborts the model call when the device abandons the request", async () => {
    slow.ms = 71_000;
    const device = new AbortController();
    const answered = post(device.signal).catch(() => null);
    await elapse(10);

    device.abort();
    await elapse(80);
    await answered;

    expect(slow.calls).toHaveLength(1);
    expect(slow.calls[0].signal?.aborted).toBe(true);
    expect(slow.calls[0].settled).toBe("aborted");
  });

  it("answers with the Baseline Plan itself, and says why, once the Coach passes the server's deadline", async () => {
    slow.ms = 120_000;
    const answered = post();
    await elapse(130);
    const response = await answered;

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ source: "baseline", plan: baselinePlan(result.profile), notes: emptyRecord().notes });
    expect(body.reason).toContain("75 s");
    expect(slow.calls[0].settled).toBe("aborted");
  });
});
