import { describe, expect, it } from "vitest";
import {
  callDollars,
  callTokens,
  costTotals,
  createRecorder,
  latency,
  percentile,
  telemetrySection,
  usageAttempts,
  zeroCall,
  type ModelCall,
} from "@/generation/telemetry";

const call = (over: Partial<ModelCall> = {}): ModelCall => ({
  operation: "coach",
  model: "claude-opus-5",
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  ms: 0,
  ...over,
});

describe("the price table", () => {
  it("charges input and output at the published rate per million tokens", () => {
    // 200,000 in at $5/M is $1.00; 40,000 out at $25/M is $1.00.
    expect(callDollars(call({ inputTokens: 200_000, outputTokens: 40_000 }))).toBe(2);
    // Sonnet 5.5, every call's model since 2026-09-28: 1,000,000 in at $2/M and 500,000 out at $10/M.
    expect(callDollars(call({ model: "claude-sonnet-5-5", inputTokens: 1_000_000, outputTokens: 500_000 }))).toBe(7);
    // Its cache: 1,000,000 read at $0.20/M, 1,000,000 written at $2.50/M.
    expect(callDollars(call({ model: "claude-sonnet-5-5", cacheReadTokens: 1_000_000 }))).toBe(0.2);
    expect(callDollars(call({ model: "claude-sonnet-5-5", cacheWriteTokens: 1_000_000 }))).toBe(2.5);
    // Sonnet 5: 1,000,000 in at $2/M and 500,000 out at $10/M.
    expect(callDollars(call({ model: "claude-sonnet-5", inputTokens: 1_000_000, outputTokens: 500_000 }))).toBe(7);
    // Haiku 4.5: 10,000 in at $1/M and 2,000 out at $5/M.
    expect(callDollars(call({ model: "claude-haiku-4-5", inputTokens: 10_000, outputTokens: 2_000 }))).toBe(0.02);
  });

  it("charges a cache read at a tenth of the input rate and a cache write at 1.25 times it", () => {
    // 100,000 read at $5/M × 0.1 is $0.05; 20,000 written at $5/M × 1.25 is $0.125.
    expect(callDollars(call({ cacheReadTokens: 100_000 }))).toBe(0.05);
    expect(callDollars(call({ cacheWriteTokens: 20_000 }))).toBe(0.125);
    expect(
      callDollars(call({ inputTokens: 200_000, outputTokens: 40_000, cacheReadTokens: 100_000, cacheWriteTokens: 20_000 })),
    ).toBe(2.175);
  });

  it("says a model it has no rate for costs an unknown amount rather than guessing one", () => {
    expect(callDollars(call({ model: "claude-unpublished-9", inputTokens: 1_000 }))).toBeNull();
    // Nothing was spent, whatever the model: that is how the fake reports zero and not unknown.
    expect(callDollars(zeroCall("story"))).toBe(0);
    expect(costTotals([call({ model: "claude-unpublished-9", inputTokens: 1_000 }), call({ inputTokens: 1_000 })]).dollars).toBeNull();
  });
});

describe("a call the refusal fallback served", () => {
  const declined = { model: "claude-sonnet-5-5", inputTokens: 100_000, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
  const rescued = call({ model: "claude-sonnet-5", inputTokens: 100_000, outputTokens: 20_000, ms: 30_000, declined: [declined] });

  it("reads who served it and each attempt from usage.iterations, not from the model the call named", () => {
    const usage = {
      input_tokens: 100_000,
      output_tokens: 20_000,
      iterations: [
        { type: "message", model: "claude-sonnet-5-5", input_tokens: 100_000, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
        { type: "fallback_message", model: "claude-sonnet-5", input_tokens: 100_000, output_tokens: 20_000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
      ],
    };
    expect(usageAttempts("claude-sonnet-5-5", usage)).toEqual({
      served: { model: "claude-sonnet-5", inputTokens: 100_000, outputTokens: 20_000, cacheReadTokens: 0, cacheWriteTokens: 0 },
      declined: [declined],
    });
    // No fallback ran: the named model served it, and the top-level usage is the whole call.
    expect(usageAttempts("claude-sonnet-5-5", { input_tokens: 10, output_tokens: 5, iterations: null })).toEqual({
      served: { model: "claude-sonnet-5-5", inputTokens: 10, outputTokens: 5, cacheReadTokens: 0, cacheWriteTokens: 0 },
      declined: [],
    });
  });

  it("prices each attempt at its own model and counts the declined one's tokens", () => {
    // Sonnet 5 served: $0.20 in + $0.20 out. Sonnet 5.5 declined before any output: $0.20 in.
    expect(callDollars(rescued)).toBe(0.6);
    expect(callTokens(rescued)).toBe(220_000);
    expect(callDollars({ ...rescued, declined: [{ ...declined, model: "claude-unpublished-9" }] })).toBeNull();
  });

  it("adds each attempt to the model it ran on, and the call's wall time once", () => {
    const telemetry = telemetrySection([rescued, call({ model: "claude-sonnet-5-5", inputTokens: 100_000, ms: 10_000 })], 2);
    expect(telemetry.byOperation.coach).toMatchObject({ calls: 2, inputTokens: 300_000, ms: 40_000, dollars: 0.8 });
    expect(telemetry.byOperation.coach.models).toEqual(["claude-sonnet-5", "claude-sonnet-5-5"]);
    expect(telemetry.byModel).toEqual([
      expect.objectContaining({ model: "claude-sonnet-5", calls: 1, ms: 30_000, dollars: 0.4 }),
      expect.objectContaining({ model: "claude-sonnet-5-5", calls: 2, ms: 10_000, dollars: 0.4 }),
    ]);
    expect(telemetry.latency.coach).toEqual({ calls: 2, p50Ms: 10_000, p95Ms: 30_000 });
    expect(telemetry.perSession.dollarsPerSession).toBe(0.4);
  });
});

describe("the recorder", () => {
  it("sums the three calls it was told about, per operation, per model, and in all", () => {
    const recorder = createRecorder();
    recorder.record(call({ operation: "coach", inputTokens: 200_000, outputTokens: 40_000, ms: 9_000 }));
    recorder.record(call({ operation: "coach", inputTokens: 200_000, cacheReadTokens: 100_000, ms: 5_000 }));
    recorder.record(call({ operation: "story", model: "claude-sonnet-5", inputTokens: 1_000_000, outputTokens: 500_000, ms: 2_000 }));

    const telemetry = telemetrySection(recorder.calls(), 2);
    expect(recorder.calls()).toHaveLength(3);
    expect(telemetry.byOperation.coach).toMatchObject({ calls: 2, inputTokens: 400_000, ms: 14_000, dollars: 3.05 });
    expect(telemetry.byOperation.coach.tokens).toBe(540_000);
    expect(telemetry.byOperation.story).toMatchObject({ calls: 1, dollars: 7, models: ["claude-sonnet-5"] });
    expect(telemetry.byOperation.summary).toMatchObject({ calls: 0, dollars: 0 });
    expect(telemetry.byModel).toEqual([
      expect.objectContaining({ model: "claude-opus-5", calls: 2, dollars: 3.05 }),
      expect.objectContaining({ model: "claude-sonnet-5", calls: 1, dollars: 7 }),
    ]);
    expect(telemetry.total).toMatchObject({ calls: 3, ms: 16_000, dollars: 10.05, models: ["claude-opus-5", "claude-sonnet-5"] });
    expect(telemetry.perSession).toEqual({ sessions: 2, coachCalls: 2, dollarsPerCoachCall: 1.525, dollarsPerSession: 1.525 });
  });

  it("names every operation even when one never ran, so a report never hides a missing arm", () => {
    const telemetry = telemetrySection([], 0);
    expect(Object.keys(telemetry.byOperation)).toEqual(["coach", "summary", "story", "judge"]);
    expect(telemetry.total).toMatchObject({ calls: 0, tokens: 0, ms: 0, dollars: 0, models: [] });
    expect(telemetry.perSession.dollarsPerSession).toBe(0);
  });
});

describe("per-call latency", () => {
  it("takes the percentile by nearest rank, so a p95 is the wall time of a call that happened", () => {
    const twenty = Array.from({ length: 20 }, (_, i) => (i + 1) * 1000);
    expect(percentile(twenty, 0.5)).toBe(10_000);
    expect(percentile(twenty, 0.95)).toBe(19_000);
    expect(percentile([71_000], 0.95)).toBe(71_000);
    expect(percentile([3, 1, 2], 0.5)).toBe(2);
    expect(percentile([], 0.5)).toBeNull();
  });

  it("shows the slow tail a mean hides: most Coach calls well inside the deadline, one far past it", () => {
    const calls = [60_000, 62_000, 64_000, 66_000, 68_000, 70_000, 72_000, 74_000, 76_000, 140_000].map((ms) => call({ ms }));
    // The mean is 73.2 s, which says nothing about the call that ran for 140.
    expect(latency(calls)).toEqual({ calls: 10, p50Ms: 68_000, p95Ms: 140_000 });
    expect(latency([])).toEqual({ calls: 0, p50Ms: null, p95Ms: null });
  });

  it("carries every call with its wall time and tokens, and p50 and p95 per operation, in the report's section", () => {
    const calls = [
      call({ operation: "coach", ms: 71_000, outputTokens: 9_000 }),
      call({ operation: "coach", ms: 80_000, outputTokens: 11_000 }),
      call({ operation: "summary", ms: 12_000 }),
    ];
    const telemetry = telemetrySection(calls, 2);

    expect(telemetry.calls).toEqual(calls);
    expect(telemetry.latency.coach).toEqual({ calls: 2, p50Ms: 71_000, p95Ms: 80_000 });
    expect(telemetry.latency.summary).toEqual({ calls: 1, p50Ms: 12_000, p95Ms: 12_000 });
    expect(telemetry.latency.story).toEqual({ calls: 0, p50Ms: null, p95Ms: null });
    expect(Object.keys(telemetry.latency)).toEqual(["coach", "summary", "story", "judge"]);
  });
});
