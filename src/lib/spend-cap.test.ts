import { describe, expect, it } from "vitest";
import { zeroCall, type ModelCall } from "@/generation/telemetry";
import { dailyAllowance, spendTelemetry, cappedDollars } from "./spend-cap";

/** A clock the test moves by hand. */
function clock(iso: string) {
  let at = new Date(iso);
  return {
    now: () => at,
    set: (next: string) => {
      at = new Date(next);
    },
  };
}

/** A Sonnet 5.5 call that cost exactly `dollars`: output tokens at $10 per million. */
const sonnetCall = (dollars: number): ModelCall => ({
  ...zeroCall("coach"),
  model: "claude-sonnet-5-5",
  outputTokens: Math.round(dollars * 100_000),
});

describe("a daily allowance", () => {
  it("is open until what was spent reaches the limit, then closed", () => {
    const time = clock("2026-09-28T09:00:00Z");
    const allowance = dailyAllowance({ limit: 5, now: time.now });
    expect(allowance.exhausted()).toBe(false);
    allowance.spend(4.99);
    expect(allowance.exhausted()).toBe(false);
    allowance.spend(0.01);
    expect(allowance.spent()).toBeCloseTo(5);
    expect(allowance.exhausted()).toBe(true);
  });

  it("stays closed until midnight UTC and opens again at midnight UTC", () => {
    const time = clock("2026-09-28T09:00:00Z");
    const allowance = dailyAllowance({ limit: 5, now: time.now });
    allowance.spend(6);
    time.set("2026-09-28T23:59:59.999Z");
    expect(allowance.exhausted()).toBe(true);
    time.set("2026-09-29T00:00:00.000Z");
    expect(allowance.exhausted()).toBe(false);
    expect(allowance.spent()).toBe(0);
  });

  it("keeps UTC days, not the server's local ones", () => {
    // 23:30 in New York on the 28th is already the 29th in UTC.
    const time = clock("2026-09-28T23:30:00-04:00");
    const allowance = dailyAllowance({ limit: 5, now: time.now });
    allowance.spend(5);
    time.set("2026-09-29T19:59:00-04:00"); // 23:59 UTC on the 29th: the same UTC day.
    expect(allowance.exhausted()).toBe(true);
    time.set("2026-09-29T20:00:00-04:00"); // Midnight UTC on the 30th.
    expect(allowance.exhausted()).toBe(false);
  });

  it("counts a spend made on a new day toward that day only", () => {
    const time = clock("2026-09-28T23:00:00Z");
    const allowance = dailyAllowance({ limit: 5, now: time.now });
    allowance.spend(4);
    time.set("2026-09-29T01:00:00Z");
    allowance.spend(2);
    expect(allowance.spent()).toBe(2);
    expect(allowance.exhausted()).toBe(false);
  });
});

describe("the spend cap's telemetry", () => {
  it("adds each recorded call's dollars to the allowance", () => {
    const time = clock("2026-09-28T09:00:00Z");
    const allowance = dailyAllowance({ limit: 5, now: time.now });
    const telemetry = spendTelemetry(allowance);
    telemetry.record(sonnetCall(2.5));
    expect(allowance.exhausted()).toBe(false);
    telemetry.record(sonnetCall(2.5));
    expect(allowance.spent()).toBeCloseTo(5);
    expect(allowance.exhausted()).toBe(true);
  });

  it("prices a call the refusal fallback served with its declined attempt too", () => {
    const call: ModelCall = {
      ...sonnetCall(1),
      model: "claude-sonnet-5",
      declined: [{ model: "claude-sonnet-5-5", inputTokens: 0, outputTokens: 100_000, cacheReadTokens: 0, cacheWriteTokens: 0 }],
    };
    expect(cappedDollars(call)).toBeCloseTo(2);
  });

  it("prices a call on a model with no published rate at the dearest rate, never at nothing", () => {
    const unknown: ModelCall = { ...zeroCall("story"), model: "claude-unlisted", inputTokens: 100_000, outputTokens: 100_000 };
    // Every token at Opus 5's output rate, the dearest in the table: 200,000 tokens at $25 per million.
    expect(cappedDollars(unknown)).toBeCloseTo(5);
  });

  it("counts the fake as free", () => {
    expect(cappedDollars(zeroCall("coach"))).toBe(0);
  });
});
