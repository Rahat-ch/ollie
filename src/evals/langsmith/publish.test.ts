import path from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { readReport } from "../files";
import { EVALS_DIR, type EvalReport } from "../report";
import { SIMULATED_LEARNERS } from "../learners";
import { CLAIM_SET_REPORTS } from "../claim-set";
import { DATASET_NAME, experimentPrefix } from "./experiment";
import { FakeLangSmith, type FakeFeedback, type FakeRun } from "./fake-client";
import { compareArms, learnerDataset, publishReport } from "./publish";

/** The three live Opus 5 reports of 2026-09-18. */
const OPUS = CLAIM_SET_REPORTS.map((file) => ({ file, report: readReport(path.join(EVALS_DIR, file)) }));
/** A fake report whose Judge fails calibration by design, so its scores are withheld. */
const FAKE = { file: "2026-09-18T17-41-33Z.json", report: readReport(path.join(EVALS_DIR, "2026-09-18T17-41-33Z.json")) };

// LangSmith prints where to view each experiment; the tests read the fake instead.
beforeAll(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

const feedbackOn = (client: FakeLangSmith, run: FakeRun): Map<string, FakeFeedback> =>
  new Map(client.storedFeedback.filter((f) => f.runId === run.id && !f.comparativeExperimentId).map((f) => [f.key, f]));

const summaryFeedback = (client: FakeLangSmith, experiment: string): Map<string, FakeFeedback> => {
  const project = client.projectNamed(experiment)!;
  return new Map(client.storedFeedback.filter((f) => f.runId === null && f.projectId === project.id).map((f) => [f.key, f]));
};

describe("replaying the three live Opus reports", () => {
  let client: FakeLangSmith;
  let experiments: Awaited<ReturnType<typeof publishReport>>[];

  beforeAll(async () => {
    client = new FakeLangSmith();
    experiments = [];
    for (const { file, report } of OPUS) experiments.push(await publishReport(client, report, { file, source: "replay" }));
  });

  it("sends nothing anywhere: the fake answered every call", () => {
    expect(client.storedRequests).toEqual([]);
  });

  it("builds one dataset of the six Simulated Learners, once, however many reports replay into it", () => {
    expect(client.storedDatasets.map((d) => d.name)).toEqual([DATASET_NAME]);
    expect(client.storedExamples.map((e) => e.inputs.learner)).toEqual(SIMULATED_LEARNERS.map((l) => l.id));
    expect(client.storedExamples.map((e) => e.outputs?.planted)).toEqual(SIMULATED_LEARNERS.map((l) => l.weaknesses));
    expect(client.storedExamples.map((e) => e.metadata?.dataset_split)).toEqual(
      SIMULATED_LEARNERS.map((l) => [l.heldOut ? "held-out" : "tuning"]),
    );
  });

  it("makes one experiment per report, named by the Arm and the report, with one trace per Learner and none for the evaluators", () => {
    expect(experiments.map((e) => e.experimentName.replace(/-[0-9a-f]{8}$/, ""))).toEqual(
      OPUS.map(({ file }) => experimentPrefix("claude-opus-5", file)),
    );
    expect(client.rootRuns()).toHaveLength(3 * 6);
    expect(client.storedRuns).toHaveLength(3 * 6);
    for (const experiment of experiments) {
      const runs = client.runsOf(experiment.experimentName);
      expect(runs.map((r) => r.reference_example_id)).toEqual(client.storedExamples.map((e) => e.id));
      expect(runs.map((r) => r.outputs?.learner)).toEqual(SIMULATED_LEARNERS.map((l) => l.id));
    }
  });

  it("records the report the experiment is the view of", () => {
    for (const [i, { file, report }] of OPUS.entries()) {
      const project = client.projectNamed(experiments[i].experimentName)!;
      expect(project.metadata).toMatchObject({
        report: file,
        arm: "claude-opus-5",
        source: "replay",
        generatedAt: report.generatedAt,
        coach: "claude-opus-5",
        dollars: report.telemetry.total.dollars,
      });
    }
  });

  it("gives every Learner the report's own numbers: Evidence Integrity, claim agreement, plan sources, detection, false positives, convergence", () => {
    for (const [i, { report }] of OPUS.entries()) {
      const runs = client.runsOf(experiments[i].experimentName);
      for (const [j, learner] of report.hypotheses.learners.entries()) {
        const feedback = feedbackOn(client, runs[j]);
        const coach = report.convergence.coach.learners[j];
        const baseline = report.convergence.baseline.learners[j];
        expect(feedback.get("evidence_integrity")?.score).toBe(learner.evidence.integrity);
        expect(feedback.get("claim_agreement")?.score).toBe(learner.evidence.claimAgreement);
        expect(feedback.get("plans_from_coach")?.score).toBe(learner.sources.coach);
        expect(feedback.get("plans_after_retry")?.score).toBe(learner.sources.retry);
        expect(feedback.get("plans_from_baseline")?.score).toBe(learner.sources.baseline);
        expect(feedback.get("weaknesses_detected")?.score).toBe(learner.detected);
        expect(feedback.get("false_positives")?.score).toBe(learner.falsePositives);
        expect(feedback.get("false_positive_rate")?.score).toBe(learner.falsePositiveRate);
        expect(feedback.get("skills_mastered")?.score).toBe(coach.perSession.at(-1)!.mastered);
        expect(feedback.get("skills_mastered_baseline")?.score).toBe(baseline.perSession.at(-1)!.mastered);
        expect(feedback.get("first_try_rate")?.score).toBe(coach.firstTryRate);
        expect(feedback.get("in_band_share")?.score).toBe(coach.inBandShare);
        for (const tag of learner.planted) {
          const stored = learner.sessionsToDetection[tag] ?? null;
          const detection = feedback.get(`sessions_to_detection_${tag.replace(/-/g, "_")}`);
          if (stored === null) expect(detection).toMatchObject({ value: "never", score: undefined });
          else expect(detection?.score).toBe(stored);
        }
        const summary = report.summaries.summaries[j];
        expect(feedback.get("summary_valid_first_attempt")?.score).toBe(summary.source === "summary" && summary.rejections.length === 0);
      }
    }
  });

  it("names crossing ten after Session 6 in two of the three runs and never in the third, as the evals README says", () => {
    const detections = experiments.map((experiment) => {
      const run = client.runsOf(experiment.experimentName).find((r) => r.outputs?.learner === "crossing-ten-weakness")!;
      const feedback = feedbackOn(client, run).get("sessions_to_detection_crossing_ten")!;
      return feedback.score ?? feedback.value;
    });
    expect(detections.filter((d) => d === 6)).toHaveLength(2);
    expect(detections.filter((d) => d === "never")).toHaveLength(1);
  });

  it("gives the run the report's own split, Story, Summary, Judge and cost numbers", () => {
    for (const [i, { report }] of OPUS.entries()) {
      const feedback = summaryFeedback(client, experiments[i].experimentName);
      const { tuning, heldOut } = report.hypotheses.splits;
      expect(feedback.get("evidence_integrity_tuning")?.score).toBe(tuning.evidenceIntegrity);
      expect(feedback.get("evidence_integrity_held_out")?.score).toBe(heldOut.evidenceIntegrity);
      expect(feedback.get("claim_agreement_tuning")?.score).toBe(tuning.claimAgreement);
      expect(feedback.get("false_positive_rate_tuning")?.score).toBe(tuning.falsePositiveRate);
      expect(feedback.get("false_positive_rate_held_out")?.score).toBe(heldOut.falsePositiveRate);
      expect(feedback.get("detection_rate_held_out")?.score).toBe(heldOut.detectionRate);
      expect(feedback.get("story_valid_first_attempt_rate")?.score).toBe(report.stories.validity.firstAttemptRate);
      expect(feedback.get("story_valid_rate")?.score).toBe(report.stories.validity.validRate);
      expect(feedback.get("story_templates")?.score).toBe(report.stories.validity.templates);
      expect(feedback.get("story_judge_agreement")?.score).toBe(report.stories.judge.calibration.agreement);
      expect(feedback.get("story_judge_kappa")?.score).toBe(report.stories.judge.calibration.kappa);
      expect(feedback.get("story_judge_gate")).toMatchObject({ score: true, value: "open" });
      expect(feedback.get("story_readability")?.score).toBe(report.stories.judge.readability!.passRate);
      expect(feedback.get("summary_valid_first_attempt_rate")?.score).toBe(report.summaries.validity.firstAttemptRate);
      expect(feedback.get("summary_faithfulness")?.score).toBe(report.summaries.judge.faithfulness!.passRate);
      expect(feedback.get("cost_dollars")?.score).toBe(report.telemetry.total.dollars);
      expect(feedback.get("coach_dollars_per_session")?.score).toBe(report.telemetry.perSession.dollarsPerSession);
      // These reports predate per-call latency.
      expect(feedback.has("coach_p95_ms")).toBe(false);
    }
  });
});

describe("a report whose Judge failed calibration", () => {
  it("reports the gate as withheld and gives the guarded score no number", async () => {
    const client = new FakeLangSmith();
    const experiment = await publishReport(client, FAKE.report, { file: FAKE.file, source: "replay" });
    const feedback = summaryFeedback(client, experiment.experimentName);
    expect(FAKE.report.stories.judge.readability).toBeNull();
    expect(feedback.get("story_judge_gate")).toMatchObject({ score: false, value: "withheld" });
    expect(feedback.get("story_readability")).toMatchObject({ score: undefined, value: "withheld" });
    expect(feedback.get("story_readability")?.comment).toBe(FAKE.report.stories.judge.calibration.withheld);
    expect(feedback.get("summary_faithfulness")).toMatchObject({ score: undefined, value: "withheld" });
    expect(client.storedRequests).toEqual([]);
  });
});

describe("the dataset", () => {
  it("refuses a report run on other Learners", async () => {
    const client = new FakeLangSmith();
    const [{ report }] = OPUS;
    const other: EvalReport = {
      ...report,
      hypotheses: { ...report.hypotheses, learners: report.hypotheses.learners.slice(1) },
    };
    await expect(publishReport(client, other, { file: "other.json", source: "replay" })).rejects.toThrow(/not the dataset's/);
  });

  it("refuses to reuse an Example whose Learner has changed since", async () => {
    const client = new FakeLangSmith();
    await learnerDataset(client);
    client.storedExamples[0] = { ...client.storedExamples[0], inputs: { ...client.storedExamples[0].inputs, seed: "an old seed" } };
    await expect(learnerDataset(client)).rejects.toThrow(/name a new dataset/);
  });
});

/**
 * A second Arm built from the Opus reports, for the comparison's tests
 * until ticket 07's Sonnet reports exist: the same runs with the Coach
 * renamed and, for the Strong Learner, fewer false positives and one Skill
 * more Mastered.
 */
function secondArm(report: EvalReport): EvalReport {
  const learners = report.hypotheses.learners.map((l) =>
    l.id === "strong" ? { ...l, falsePositives: 0, falsePositiveRate: 0 } : l,
  );
  const coach = report.convergence.coach.learners.map((l) =>
    l.id === "strong"
      ? { ...l, perSession: [...l.perSession.slice(0, -1), { ...l.perSession.at(-1)!, mastered: l.perSession.at(-1)!.mastered + 1 }] }
      : l,
  );
  return {
    ...report,
    coach: { generation: "claude-sonnet-5-5" },
    hypotheses: { ...report.hypotheses, learners },
    convergence: { ...report.convergence, coach: { ...report.convergence.coach, learners: coach } },
  };
}

describe("comparing two Arms", () => {
  it("scores every run per Learner against every run of the other Arm, with no model call", async () => {
    const client = new FakeLangSmith();
    const opus = [];
    const sonnet = [];
    for (const { file, report } of OPUS) {
      opus.push(await publishReport(client, report, { file, source: "replay" }));
      sonnet.push(await publishReport(client, secondArm(report), { file: `second-arm-${file}`, source: "replay" }));
    }
    const comparison = await compareArms(client, [...opus, ...sonnet], { a: "claude-opus-5", b: "claude-sonnet-5-5" });

    expect(client.storedRequests).toEqual([]);
    expect(client.storedComparisons).toHaveLength(1);
    expect(comparison.experimentName).toMatch(/^claude-opus-5-vs-claude-sonnet-5-5-/);

    const comparative = client.storedFeedback.filter((f) => f.comparativeExperimentId === client.storedComparisons[0].id);
    const armOf = (runId: string | null) => client.storedRuns.find((r) => r.id === runId)!.outputs as { arm: string; learner: string };
    const scores = (key: string, learner: string, arm: string) =>
      comparative.filter((f) => f.key === key && armOf(f.runId).learner === learner && armOf(f.runId).arm === arm).map((f) => f.score);

    // Strong: the second Arm has no false positives in any run, and every Opus run had some.
    expect(scores("fewer_false_positives", "strong", "claude-sonnet-5-5")).toEqual([1, 1, 1]);
    expect(scores("fewer_false_positives", "strong", "claude-opus-5")).toEqual([0, 0, 0]);
    // Every Sonnet run Masters one more Skill than its own Opus run: it beats that one and whatever else it beats.
    for (const score of scores("more_skills_mastered", "strong", "claude-sonnet-5-5")) expect(score).toBeGreaterThan(1 / 3);
    // The other Learners are the same runs in both Arms, so the two Arms' scores mirror each other about a half.
    const a = scores("higher_claim_agreement", "average", "claude-opus-5") as number[];
    const b = scores("higher_claim_agreement", "average", "claude-sonnet-5-5") as number[];
    expect(a.reduce((x, y) => x + y, 0) + b.reduce((x, y) => x + y, 0)).toBeCloseTo(3);
    // A Learner with nothing planted has no detection to compare.
    expect(scores("earlier_detection", "strong", "claude-opus-5")).toEqual([]);
    expect(scores("earlier_detection", "crossing-ten-weakness", "claude-opus-5")).toHaveLength(3);
  });
});
