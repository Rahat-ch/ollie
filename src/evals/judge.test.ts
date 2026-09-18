/**
 * The Judge's gate, on hand-built Calibration Sets so the arithmetic is
 * checked against worked numbers rather than against a real set: the
 * confusion matrix, Cohen's kappa, the agreement an always-pass and an
 * always-fail Judge would score for free, and which of the gate's two
 * conditions a withheld verdict names.
 */
import { describe, expect, it } from "vitest";
import { calibrateJudge, JUDGE_AGREEMENT_THRESHOLD, JUDGE_KAPPA_FLOOR, type Calibrated } from "@/evals/judge";

/** A Calibration Set of `pass` items the human passed and `fail` items the human failed. */
const set = (pass: number, fail: number): Calibrated[] => [
  ...Array.from({ length: pass }, (_, i) => ({ id: `p${i + 1}`, pass: true, note: "the human passed it" })),
  ...Array.from({ length: fail }, (_, i) => ({ id: `f${i + 1}`, pass: false, note: "the human failed it" })),
];

/** A Judge that disagrees with the first `wrong` items of each label and agrees with the rest. */
const judgeMissing = (wrongPass: number, wrongFail: number) => {
  let seenPass = 0;
  let seenFail = 0;
  return async (item: Calibrated) => {
    const nth = item.pass ? ++seenPass : ++seenFail;
    const wrong = item.pass ? nth <= wrongPass : nth <= wrongFail;
    return { pass: wrong ? !item.pass : item.pass, reason: "as this Judge sees it" };
  };
};

describe("calibrateJudge", () => {
  it("scores the confusion matrix and kappa of a Judge that agrees on 16 of 20 with matching 60/40 marginals", async () => {
    const calibration = await calibrateJudge(set(12, 8), judgeMissing(2, 2));

    expect(calibration.confusion).toEqual({ humanPassJudgePass: 10, humanPassJudgeFail: 2, humanFailJudgePass: 2, humanFailJudgeFail: 6 });
    expect(calibration.agreement).toBe(0.8);
    // Observed 0.80 against an expected 0.52 by chance: (0.80 - 0.52) / 0.48.
    expect(calibration.kappa).toBeCloseTo(0.583, 3);
    expect(calibration.alwaysPassAgreement).toBe(0.6);
    expect(calibration.alwaysFailAgreement).toBe(0.4);
  });

  it("withholds a Judge that clears the agreement threshold but not the kappa floor, and says which", async () => {
    const calibration = await calibrateJudge(set(12, 8), judgeMissing(2, 2));

    expect(calibration.agreement).toBeGreaterThanOrEqual(JUDGE_AGREEMENT_THRESHOLD);
    expect(calibration.kappa).toBeLessThan(JUDGE_KAPPA_FLOOR);
    expect(calibration.passes).toBe(false);
    expect(calibration.withheld).toBe("kappa 0.58 is below the floor 0.60");
  });

  it("gives an always-pass Judge the set's pass share and a kappa of zero, and names both failures", async () => {
    const calibration = await calibrateJudge(set(12, 8), async () => ({ pass: true, reason: "everything passes" }));

    expect(calibration.agreement).toBe(0.6);
    expect(calibration.agreement).toBe(calibration.alwaysPassAgreement);
    expect(calibration.kappa).toBe(0);
    expect(calibration.confusion).toEqual({ humanPassJudgePass: 12, humanPassJudgeFail: 0, humanFailJudgePass: 8, humanFailJudgeFail: 0 });
    expect(calibration.passes).toBe(false);
    expect(calibration.withheld).toBe("agreement 0.60 is below the threshold 0.80, and kappa 0.00 is below the floor 0.60");
  });

  it("passes a Judge that agrees with every verdict, with kappa 1 and nothing withheld", async () => {
    const calibration = await calibrateJudge(set(12, 8), judgeMissing(0, 0));

    expect(calibration).toMatchObject({ agreement: 1, kappa: 1, passes: true, withheld: null, disagreements: [] });
    expect(calibration.kappaFloor).toBe(JUDGE_KAPPA_FLOOR);
  });

  it("says what 16 of 20 agreement is worth: an interval wider than the gate it clears", async () => {
    const { agreementInterval } = await calibrateJudge(set(12, 8), judgeMissing(2, 2));

    expect(agreementInterval?.lower).toBeCloseTo(0.58, 2);
    expect(agreementInterval?.upper).toBeCloseTo(0.92, 2);
  });
});
