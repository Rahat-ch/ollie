/**
 * The interval every rate in the report is printed with, checked against
 * published values rather than against its own arithmetic: the numbers here
 * are the ones `docs/research/evals-comparison.md` quotes (3 of 18 is
 * [0.06, 0.39], 30 of 30 is [0.89, 1.00], 16 of 20 is [0.58, 0.92], 8 of 10
 * is [0.49, 0.94]).
 */
import { describe, expect, it } from "vitest";
import { wilsonInterval, writtenValidity } from "@/evals/stats";

const width = (hits: number, total: number): number => {
  const interval = wilsonInterval(hits, total);
  if (!interval) throw new Error("no interval");
  return interval.upper - interval.lower;
};

describe("wilsonInterval", () => {
  it("is the published 95 percent interval for a rate in the middle of its range", () => {
    expect(wilsonInterval(3, 18)?.lower).toBeCloseTo(0.06, 2);
    expect(wilsonInterval(3, 18)?.upper).toBeCloseTo(0.39, 2);
    expect(wilsonInterval(16, 20)?.lower).toBeCloseTo(0.58, 2);
    expect(wilsonInterval(16, 20)?.upper).toBeCloseTo(0.92, 2);
    expect(wilsonInterval(8, 10)?.lower).toBeCloseTo(0.49, 2);
    expect(wilsonInterval(8, 10)?.upper).toBeCloseTo(0.94, 2);
  });

  it("stays non-degenerate at 0 and at 1, where a Wald interval would claim a width of zero", () => {
    expect(wilsonInterval(0, 10)).toEqual({ lower: 0, upper: expect.closeTo(0.28, 2) });
    expect(wilsonInterval(10, 10)).toEqual({ lower: expect.closeTo(0.72, 2), upper: 1 });
    expect(wilsonInterval(30, 30)?.lower).toBeCloseTo(0.89, 2);
    expect(wilsonInterval(30, 30)?.upper).toBe(1);
  });

  it("narrows as the sample grows, so 1,502 of 1,502 says more than 30 of 30", () => {
    expect(width(1502, 1502)).toBeLessThan(width(30, 30));
    expect(wilsonInterval(1502, 1502)?.lower).toBeGreaterThan(0.997);
    expect(width(300, 600)).toBeLessThan(width(30, 60));
  });

  it("is undefined when nothing was counted, rather than a false precision", () => {
    expect(wilsonInterval(0, 0)).toBeNull();
  });
});

describe("writtenValidity", () => {
  it("carries an interval beside the first-attempt and valid rates", () => {
    const traces = [
      { source: "story", rejections: [] },
      { source: "story", rejections: [{ reasons: ["too many words"] }] },
      { source: "template", rejections: [{ reasons: ["too many words"] }, { reasons: ["too many words"] }] },
    ];
    const validity = writtenValidity(traces, (reason) => reason);

    expect(validity.firstAttemptRate).toBeCloseTo(1 / 3, 6);
    expect(validity.firstAttemptRateInterval?.lower).toBeCloseTo(0.06, 2);
    expect(validity.firstAttemptRateInterval?.upper).toBeCloseTo(0.79, 2);
    expect(validity.validRateInterval?.lower).toBeCloseTo(0.21, 2);
    expect(validity.validRateInterval?.upper).toBeCloseTo(0.94, 2);
  });
});
