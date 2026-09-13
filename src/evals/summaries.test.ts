import { describe, expect, it } from "vitest";
import { fakeGeneration } from "@/generation/fake";
import { validateSummary } from "@/summary/validate";
import { SUMMARY_CALIBRATION_SET } from "./calibration";
import { fakeJudge, JUDGE_AGREEMENT_THRESHOLD, type Judge } from "./judge";
import { SIMULATED_LEARNERS } from "./learners";
import { coachPlanner, runLearner } from "./run";
import { runSummaryEvals, summarySample } from "./summaries";

/** A Judge that answers with the Calibration Set's own verdicts, and passes anything else. */
const agreeingJudge: Judge = {
  ...fakeJudge,
  async judgeSummary({ output }) {
    const calibrated = SUMMARY_CALIBRATION_SET.find((s) => s.output.practiced === output.practiced);
    return { pass: calibrated?.pass ?? true, reason: "as the Calibration Set says" };
  },
};

const sample = async () => {
  const runs = await Promise.all(SIMULATED_LEARNERS.map((learner) => runLearner(learner, coachPlanner(fakeGeneration()), 3)));
  return summarySample(runs);
};

describe("the Parent Summary Calibration Set", () => {
  it("has 10 Summaries the validator accepts, some faithful and some not", () => {
    expect(SUMMARY_CALIBRATION_SET).toHaveLength(10);
    expect(new Set(SUMMARY_CALIBRATION_SET.map((s) => s.id)).size).toBe(10);
    for (const summary of SUMMARY_CALIBRATION_SET) {
      expect(validateSummary(summary.output, summary.input), summary.id).toEqual({ ok: true });
    }
    expect(SUMMARY_CALIBRATION_SET.filter((s) => s.pass)).toHaveLength(6);
    expect(SUMMARY_CALIBRATION_SET.filter((s) => !s.pass)).toHaveLength(4);
  });
});

describe("summarySample", () => {
  it("is one Summary input per Simulated Learner, from the last Session of its Coach run", async () => {
    const inputs = await sample();

    expect(inputs).toHaveLength(SIMULATED_LEARNERS.length);
    for (const input of inputs) {
      expect(input.sessionNumber).toBe(3);
      expect(input.problems).toBeGreaterThan(0);
      expect(input.practice.length).toBeGreaterThan(0);
      expect(input.powers).toEqual([]);
      expect(JSON.stringify(input)).not.toContain("nickname");
    }
  });
});

describe("runSummaryEvals", () => {
  it("withholds faithfulness when the Judge does not clear the Calibration Set, and still reports validity", async () => {
    const report = await runSummaryEvals({
      generation: fakeGeneration(),
      name: "fake",
      judge: fakeJudge,
      judgeName: "fake",
      sample: await sample(),
    });

    expect(report.judge.calibration.agreement).toBeLessThan(JUDGE_AGREEMENT_THRESHOLD);
    expect(report.judge.calibration.passes).toBe(false);
    expect(report.judge.faithfulness).toBeNull();
    expect(report.summaries.every((trace) => trace.judged === undefined)).toBe(true);
    expect(report.validity.sample).toBe(SIMULATED_LEARNERS.length);
    expect(report.validity.validRate).toBe(1);
    expect(report.validity.templates).toBe(0);
  });

  it("reports faithfulness once the Judge agrees with the Calibration Set", async () => {
    const report = await runSummaryEvals({
      generation: fakeGeneration(),
      name: "fake",
      judge: agreeingJudge,
      judgeName: "agreeing",
      sample: await sample(),
    });

    expect(report.judge.calibration).toMatchObject({ agreement: 1, passes: true, disagreements: [] });
    expect(report.judge.faithfulness).toEqual({
      judged: SIMULATED_LEARNERS.length,
      passed: SIMULATED_LEARNERS.length,
      passRate: 1,
    });
  });

  it("counts the template fallbacks and their reasons when the writer cannot be reached", async () => {
    const report = await runSummaryEvals({
      generation: {
        writeSummary: async () => {
          throw new Error("ANTHROPIC_API_KEY is not set");
        },
      },
      name: "fake",
      judge: fakeJudge,
      judgeName: "fake",
      sample: await sample(),
    });

    expect(report.validity.validRate).toBe(0);
    expect(report.validity.templates).toBe(SIMULATED_LEARNERS.length);
    expect(report.validity.rejectionReasons).toEqual([
      { reason: "ANTHROPIC_API_KEY is not set", count: SIMULATED_LEARNERS.length * 2 },
    ]);
  });
});
