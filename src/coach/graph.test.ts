import { readFileSync } from "node:fs";
import { APIConnectionError, APIConnectionTimeoutError, APIError, APIUserAbortError } from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { DIAGNOSTIC_PLAN, emptyNotes, newProfile, planSpace, runSession, scripted } from "@/loop";
import type { LearnerNotes, SessionResult } from "@/loop";
import { fakeGeneration } from "@/generation/fake";
import type { CallOptions, CoachInput, CoachOutput, Generation } from "@/generation/types";
import { ModelUnavailableError } from "@/lib/errors";
import { deadlineReason } from "@/lib/model-route";
import { boundsFromInput, coachInput, coachSession, coachStep } from "./coach";
import { serverBaseline } from "./deadline";
import { coachGraph, coachGraphMermaid, isTransportError, serverCoachStep } from "./graph";
import type { CoachStep } from "./types";

/** A Diagnostic Session with p3 Hint-assisted, p4 Revealed, and p8 Hint-assisted. */
const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-g", scripted("ffhrfffhf"));
const notes = emptyNotes();
const priorNotes: LearnerNotes = {
  hypotheses: [{ id: "h1", claim: "Counts on from one", status: "proposed", confidence: 0.4, evidence: [], nextTest: "Watch counting on" }],
  strengths: ["Partners to 10: quick"],
};

const valid = (input: CoachInput): Promise<CoachOutput> => fakeGeneration().runCoach(input);

async function citingP99(input: CoachInput): Promise<CoachOutput> {
  const output = await valid(input);
  const [first, ...rest] = output.notes.hypotheses;
  return { ...output, notes: { ...output.notes, hypotheses: [{ ...first, evidence: ["p99"] }, ...rest] } };
}

async function planningTwelve(input: CoachInput): Promise<CoachOutput> {
  const output = await valid(input);
  return { ...output, plan: { ...output.plan, length: 12 } };
}

async function testingH9(input: CoachInput): Promise<CoachOutput> {
  const output = await valid(input);
  return { ...output, plan: { ...output.plan, hypothesisUnderTest: "h9" } };
}

type Answer = (input: CoachInput, call: number, options?: CallOptions) => Promise<CoachOutput>;

/** A fake Coach answering each call by its number, and remembering every input it was given. */
function recordingCoach(answer: Answer): { generation: Pick<Generation, "runCoach">; inputs: CoachInput[] } {
  const inputs: CoachInput[] = [];
  return {
    inputs,
    generation: { runCoach: (input, options) => { inputs.push(input); return answer(input, inputs.length, options); } },
  };
}

/** The Coach step cases the old step is tested on, each a fresh Coach per run. */
const cases: { readonly name: string; readonly notes: LearnerNotes; readonly answer: Answer; readonly source: CoachStep["source"] }[] = [
  { name: "accepted", notes, answer: (input) => valid(input), source: "coach" },
  { name: "retried: a Hypothesis citing a Problem not in the Log", notes, answer: (input, call) => (call === 1 ? citingP99(input) : valid(input)), source: "retry" },
  { name: "retried: a Plan outside the Plan Space", notes, answer: (input, call) => (call === 1 ? planningTwelve(input) : valid(input)), source: "retry" },
  { name: "retried: a Plan testing a Hypothesis not in the Notes", notes, answer: (input, call) => (call === 1 ? testingH9(input) : valid(input)), source: "retry" },
  { name: "Baseline after two rejections, with the Notes from before", notes: priorNotes, answer: citingP99, source: "baseline" },
  { name: "Baseline after a throwing adapter twice", notes, answer: () => Promise.reject(new Error("network down")), source: "baseline" },
  { name: "Baseline after malformed output twice", notes, answer: async () => ({ notes: { hypotheses: [] } }) as unknown as CoachOutput, source: "baseline" },
  { name: "unreachable: Baseline at once, never retried", notes, answer: () => Promise.reject(new ModelUnavailableError("ANTHROPIC_API_KEY is not set")), source: "baseline" },
];

const invokeGraph = async (generation: Pick<Generation, "runCoach">, state: { session: { result: SessionResult; notes: LearnerNotes } } | { body: CoachInput }) =>
  (await coachGraph(generation).invoke(state)).step;

describe("the compiled Coach graph agrees with coachStep", () => {
  for (const testCase of cases) {
    it(`on a Session: ${testCase.name}`, async () => {
      const before = recordingCoach(testCase.answer);
      const after = recordingCoach(testCase.answer);

      const old = await coachSession(before.generation, result, testCase.notes);
      const graph = await invokeGraph(after.generation, { session: { result, notes: testCase.notes } });

      expect(old.source).toBe(testCase.source);
      expect(graph).toEqual(old);
      // The Coach was asked the same things: the retry with the rejected output and every reason.
      expect(after.inputs).toEqual(before.inputs);
    });

    it(`on a body, as the route runs it: ${testCase.name}`, async () => {
      const body = coachInput(result, testCase.notes);
      const bounds = boundsFromInput(body);
      const before = recordingCoach(testCase.answer);
      const after = recordingCoach(testCase.answer);

      const old = await coachStep(before.generation, { ...body, planSpace: planSpace(bounds.profile) }, bounds);
      const graph = await invokeGraph(after.generation, { body });

      expect(graph).toEqual(old);
      expect(after.inputs).toEqual(before.inputs);
    });
  }

  it("on a timeout: stops the call at the deadline and answers what the route answered at its deadline", async () => {
    const aborted: unknown[] = [];
    const { generation, inputs } = recordingCoach((_input, _call, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => { aborted.push(options.signal?.reason); reject(new APIUserAbortError()); });
    }));
    const body = coachInput(result, notes);

    const step = await serverCoachStep(generation, body, undefined, { deadlineMs: 50 });

    expect(step).toEqual(serverBaseline(body, deadlineReason(50)));
    expect(step.rejections).toEqual([{ attempt: 1, reasons: [expect.stringContaining("deadline")], unavailable: true }]);
    // One call, cancelled rather than left running, and never retried.
    expect(inputs).toHaveLength(1);
    expect(aborted).toHaveLength(1);
  });
});

/** A transport error of each kind the policy retries: rate limited, overloaded, and the network. */
const transportErrors = {
  "429": () => APIError.generate(429, { type: "error", error: { type: "rate_limit_error", message: "rate limited" } }, "rate limited", new Headers()),
  "529": () => APIError.generate(529, { type: "error", error: { type: "overloaded_error", message: "overloaded" } }, "overloaded", new Headers()),
  network: () => new APIConnectionError({ message: "Connection error." }),
};

describe("transport errors and rejections are retried differently", () => {
  for (const [kind, error] of Object.entries(transportErrors)) {
    it(`retries a ${kind} with the same input, by the policy, and then accepts the Coach's first output`, async () => {
      const { generation, inputs } = recordingCoach((input, call) => (call === 1 ? Promise.reject(error()) : valid(input)));

      const step = await coachGraph(generation, { backoffMs: 1 }).invoke({ body: coachInput(result, notes) });

      expect(inputs).toHaveLength(2);
      expect(inputs[1]).toEqual(inputs[0]);
      expect(inputs[1].rejected).toBeUndefined();
      // Still the Coach's first output: a transport retry is not the engine's retry.
      expect(step.step).toMatchObject({ source: "coach", rejections: [] });
    });
  }

  it("gives up after three attempts and treats the last transport error as a rejection, retried once with its reason", async () => {
    const { generation, inputs } = recordingCoach(() => Promise.reject(transportErrors["529"]()));

    const { step } = await coachGraph(generation, { backoffMs: 1 }).invoke({ body: coachInput(result, notes) });

    // Three attempts by the policy, then the engine's one retry with the reason, three attempts again.
    expect(inputs).toHaveLength(6);
    expect(inputs.slice(0, 3).every((input) => input.rejected === undefined)).toBe(true);
    const reason = transportErrors["529"]().message;
    expect(inputs.slice(3).every((input) => input.rejected?.reasons.join() === reason)).toBe(true);
    expect(step).toMatchObject({ source: "baseline", rejections: [{ attempt: 1, reasons: [reason] }, { attempt: 2, reasons: [reason] }] });
  });

  it("retries a validation rejection once with the rejected output and every reason, never by the policy", async () => {
    const { generation, inputs } = recordingCoach(citingP99);

    const { step } = await coachGraph(generation, { backoffMs: 1 }).invoke({ body: coachInput(result, notes) });

    expect(inputs).toHaveLength(2);
    expect(inputs[0].rejected).toBeUndefined();
    expect(inputs[1].rejected?.reasons).toEqual([expect.stringMatching(/p99/)]);
    expect(inputs[1].rejected?.output?.notes.hypotheses[0].evidence).toEqual(["p99"]);
    expect(step?.source).toBe("baseline");
  });

  it("knows a transport error from a timeout, an abort, and everything else", () => {
    expect(Object.values(transportErrors).map((error) => isTransportError(error()))).toEqual([true, true, true]);
    expect(isTransportError(new APIConnectionTimeoutError())).toBe(false);
    expect(isTransportError(new APIUserAbortError())).toBe(false);
    expect(isTransportError(APIError.generate(500, undefined, "server error", new Headers()))).toBe(false);
    expect(isTransportError(APIError.generate(400, undefined, "bad request", new Headers()))).toBe(false);
    expect(isTransportError(new Error("network down"))).toBe(false);
    expect(isTransportError(new ModelUnavailableError("no key"))).toBe(false);
  });
});

describe("the graph drawn in the README", () => {
  it("is the compiled graph's own drawing; `pnpm coach:graph` redraws it", async () => {
    const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf8");

    expect(readme).toContain(["```mermaid", await coachGraphMermaid(), "```"].join("\n"));
  });
});
