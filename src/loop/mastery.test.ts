import { describe, expect, it } from "vitest";
import { meetsMastery } from "@/loop/mastery";

const state = (estimate: number, attempts: string) => ({
  estimate,
  recentFirstAttempts: [...attempts].map((c) => c === "1"),
  mastered: false,
});

describe("meetsMastery", () => {
  it("needs both an Estimate of at least 0.95 and 8 of the last 10 first attempts correct", () => {
    expect(meetsMastery(state(0.95, "1111111100"))).toBe(true);
  });

  it("fails on 7 of 10 even with a high Estimate", () => {
    expect(meetsMastery(state(0.99, "1111111000"))).toBe(false);
  });

  it("fails on a low Estimate even with 10 of 10", () => {
    expect(meetsMastery(state(0.9, "1111111111"))).toBe(false);
  });

  it("counts only the last ten first attempts", () => {
    expect(meetsMastery(state(0.99, "11111111110000000000"))).toBe(false);
  });

  it("is satisfied by 8 correct out of fewer than 10 attempts", () => {
    expect(meetsMastery(state(0.99, "11111111"))).toBe(true);
  });
});
