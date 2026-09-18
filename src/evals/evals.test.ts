import { describe, expect, it } from "vitest";
import { fakeGeneration } from "@/generation";
import { fakeJudge } from "@/evals/judge";
import { runEvals } from "@/evals/evals";
import { formatEvalResults } from "@/evals/format";
import type { SimulatedLearnerId } from "@/evals/learners";

const STORIES = { generation: fakeGeneration(), name: "fake", judge: fakeJudge, judgeName: "fake" };
const SUMMARIES = STORIES;

describe("runEvals", () => {
  const options = { sessions: 20, coach: { generation: fakeGeneration(), name: "fake" }, stories: STORIES, summaries: SUMMARIES };
  const promise = runEvals(options);
  const baseline = async (id: SimulatedLearnerId) => (await promise).convergence.baseline.learners.find((l) => l.id === id)!;
  const coach = async (id: SimulatedLearnerId) => (await promise).convergence.coach.learners.find((l) => l.id === id)!;

  it("runs every Simulated Learner for 20 Sessions under both planners in well under a second on the fake", async () => {
    const started = performance.now();
    const results = await runEvals(options);
    expect(performance.now() - started).toBeLessThan(1000);
    const ids = ["strong", "average", "weak", "crossing-ten-weakness", "change-unknown-weakness", "fast-fatigue"];
    expect(results.convergence.baseline.learners.map((l) => l.id)).toEqual(ids);
    expect(results.convergence.coach.learners.map((l) => l.id)).toEqual(ids);
    expect(results.hypotheses.learners.map((l) => l.id)).toEqual(ids);
    expect(results.convergence.baseline.learners.every((l) => l.perSession.length === 20)).toBe(true);
    expect(results.convergence.coach.learners.every((l) => l.perSession.length === 20)).toBe(true);
    expect(results.coach.generation).toBe("fake");
  });

  it("reports the Baseline as before: Sessions to Mastery per Skill in progression order for a strong Learner", async () => {
    expect((await baseline("strong")).sessionsToMastery).toEqual({
      "partners-to-10": 2,
      "teen-numbers": 3,
      "counting-on": 4,
      "make-a-ten": 6,
      "unknown-addend": 8,
      "result-unknown": 10,
      "change-unknown": 12,
    });
    expect((await baseline("weak")).sessionsToMastery["unknown-addend"]).toBeNull();
    expect((await baseline("average")).inBandShare).toBe(1);
  });

  it("runs the Coach on the same seeds, so its first Session is the Baseline's Diagnostic Session", async () => {
    const results = await promise;
    for (const learner of results.convergence.baseline.learners) {
      const other = results.convergence.coach.learners.find((l) => l.id === learner.id)!;
      expect(other.perSession[0]).toEqual(learner.perSession[0]);
    }
    expect((await coach("strong")).problems).not.toBe((await baseline("strong")).problems);
  });

  it("scores the tuning and held-out splits separately for both planners and for the Hypotheses", async () => {
    const { convergence, hypotheses } = await promise;
    for (const report of [convergence.baseline, convergence.coach]) {
      expect(report.splits.tuning.learners).toEqual(["strong", "average", "weak", "crossing-ten-weakness"]);
      expect(report.splits.heldOut.learners).toEqual(["change-unknown-weakness", "fast-fatigue"]);
    }
    expect(hypotheses.splits.tuning).toMatchObject({ learners: ["strong", "average", "weak", "crossing-ten-weakness"], planted: 1 });
    expect(hypotheses.splits.heldOut).toMatchObject({ learners: ["change-unknown-weakness", "fast-fatigue"], planted: 1 });
    expect(hypotheses.splits.tuning.evidenceIntegrity).toBe(1);
    expect(hypotheses.splits.tuning.claimAgreement).toBe(1);
    expect(hypotheses.splits.tuning.existingCitations).toBe(hypotheses.splits.tuning.citations);
    expect(hypotheses.splits.heldOut.sources).toEqual({ coach: 40, retry: 0, baseline: 0 });
  });

  it("is reproducible byte for byte on the fake", async () => {
    expect(JSON.stringify(await runEvals(options))).toBe(JSON.stringify(await promise));
  });
});

/** Every rate the Hypothesis, Story, and Summary sections carry, as `path`, the rate, and the interval beside it. */
function ratesWithIntervals(section: unknown, path = ""): { path: string; rate: number; interval: unknown }[] {
  if (Array.isArray(section)) return section.flatMap((item, i) => ratesWithIntervals(item, `${path}[${i}]`));
  if (section === null || typeof section !== "object") return [];
  const entries = Object.entries(section as Record<string, unknown>);
  return entries.flatMap(([key, value]) => {
    const here = path === "" ? key : `${path}.${key}`;
    if (typeof value === "number" && /(Rate|Integrity|integrity|claimAgreement|^agreement)$/.test(key)) {
      return [{ path: here, rate: value, interval: (section as Record<string, unknown>)[`${key}Interval`] }];
    }
    return ratesWithIntervals(value, here);
  });
}

describe("the intervals in an Eval Run's report", () => {
  const options = { sessions: 20, coach: { generation: fakeGeneration(), name: "fake" }, stories: STORIES, summaries: SUMMARIES };
  const promise = runEvals(options);

  it("puts a 95 percent interval beside every rate, containing the rate", async () => {
    const { hypotheses, stories, summaries } = await promise;
    const rates = ratesWithIntervals({ hypotheses, stories, summaries });

    expect(rates.length).toBeGreaterThan(20);
    for (const { path, rate, interval } of rates) {
      expect(interval, `${path} has no interval`).toBeDefined();
      if (interval === null) continue;
      const { lower, upper } = interval as { lower: number; upper: number };
      expect(lower, path).toBeLessThanOrEqual(rate);
      expect(upper, path).toBeGreaterThanOrEqual(rate);
    }
  });

  it("says how wide the small samples really are: 3 of 18 false positives, 0 of 1 detections, 30 of 30 Stories", async () => {
    const { hypotheses, stories, summaries } = await promise;
    const { tuning } = hypotheses.splits;

    expect(tuning.falsePositives).toBe(3);
    expect(tuning.supportedHypotheses).toBe(18);
    expect(tuning.falsePositiveRateInterval?.lower).toBeCloseTo(0.06, 2);
    expect(tuning.falsePositiveRateInterval?.upper).toBeCloseTo(0.39, 2);
    expect(tuning.detectionRateInterval).toEqual({ lower: 0, upper: expect.closeTo(0.79, 2) });
    expect(tuning.evidenceIntegrityInterval?.lower).toBeGreaterThan(0.997);
    expect(stories.validity.firstAttemptRateInterval?.lower).toBeCloseTo(0.89, 2);
    expect(summaries.validity.validRateInterval?.lower).toBeCloseTo(0.61, 2);
  });

  it("gives the fake Judge a kappa of 0, names both failed conditions, and still withholds", async () => {
    const { stories, summaries } = await promise;

    for (const calibration of [stories.judge.calibration, summaries.judge.calibration]) {
      expect(calibration.kappa).toBe(0);
      expect(calibration.alwaysPassAgreement).toBe(calibration.agreement);
      expect(calibration.passes).toBe(false);
      expect(calibration.withheld).toContain("kappa 0.00 is below the floor 0.60");
    }
    expect(stories.judge.calibration.confusion).toEqual({ humanPassJudgePass: 12, humanPassJudgeFail: 0, humanFailJudgePass: 8, humanFailJudgeFail: 0 });
    expect(stories.judge.calibration.agreementInterval?.lower).toBeCloseTo(0.39, 2);
    expect(stories.judge.calibration.agreementInterval?.upper).toBeCloseTo(0.78, 2);
  });
});

describe("the text report", () => {
  const promise = runEvals({ sessions: 20, coach: { generation: fakeGeneration(), name: "fake" }, stories: STORIES, summaries: SUMMARIES });
  const report = async () => formatEvalResults(await promise);

  it("prints the interval on the same line as the rate it qualifies", async () => {
    const text = await report();

    expect(text).toContain("False positives: 3 of 18 supported Hypotheses (17%, 95% CI 0.058 to 0.392)");
    expect(text).toContain("Evidence Integrity: 100% of 1502 citations name a Problem in the Log (95% CI 0.997 to 1.000)");
    expect(text).toContain("Claim agreement: 100% of the 1502 citations that exist agree with their claim (95% CI 0.997 to 1.000)");
    expect(text).toContain("Valid on the first attempt: 100% (95% CI 0.886 to 1.000)");
  });

  it("prints the Judge's kappa, the trivial baselines, and which condition withheld its scores", async () => {
    const text = await report();

    expect(text).toContain("12 of 20 Stories (60%, 95% CI 0.387 to 0.781)");
    expect(text).toContain("kappa 0.00, floor 0.60 (an always-pass Judge would score 60%, an always-fail Judge 40%)");
    expect(text).toContain("Readability: scores withheld — agreement 0.60 is below the threshold 0.80, and kappa 0.00 is below the floor 0.60");
    expect(text).toContain("Faithfulness: scores withheld —");
  });
});
