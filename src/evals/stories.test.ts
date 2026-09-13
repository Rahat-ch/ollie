import { describe, expect, it } from "vitest";
import { fakeGeneration } from "@/generation/fake";
import { validateStory } from "@/story/validate";
import { STORY_CALIBRATION_SET } from "./calibration";
import { calibrateJudge, fakeJudge, JUDGE_AGREEMENT_THRESHOLD, type Judge } from "./judge";
import { runStoryEvals, storySample } from "./stories";

/** A Judge that answers with the human labels, and passes anything else. */
const labelJudge: Judge = {
  async judgeStory({ text }) {
    const labelled = STORY_CALIBRATION_SET.find((s) => s.text === text);
    return { pass: labelled?.pass ?? true, reason: "as labelled" };
  },
};

describe("the Story Calibration Set", () => {
  it("has 20 Stories, all valid to the validator, with both labels present", () => {
    expect(STORY_CALIBRATION_SET).toHaveLength(20);
    expect(new Set(STORY_CALIBRATION_SET.map((s) => s.id)).size).toBe(20);
    for (const story of STORY_CALIBRATION_SET) {
      expect(validateStory(story.text, story.input), story.id).toEqual({ ok: true });
    }
    expect(STORY_CALIBRATION_SET.filter((s) => s.pass)).toHaveLength(12);
    expect(STORY_CALIBRATION_SET.filter((s) => !s.pass)).toHaveLength(8);
  });
});

describe("calibrateJudge", () => {
  it("fails the fake Judge, which passes every valid Story and so misses every failing label", async () => {
    const calibration = await calibrateJudge(fakeJudge, STORY_CALIBRATION_SET);
    expect(calibration).toMatchObject({ size: 20, agreements: 12, agreement: 0.6, threshold: JUDGE_AGREEMENT_THRESHOLD, passes: false });
    expect(calibration.disagreements.map((d) => d.id)).toEqual(["c13", "c14", "c15", "c16", "c17", "c18", "c19", "c20"]);
  });

  it("passes a Judge that agrees with the labels", async () => {
    expect(await calibrateJudge(labelJudge, STORY_CALIBRATION_SET)).toMatchObject({ agreement: 1, passes: true, disagreements: [] });
  });
});

describe("runStoryEvals on the fake", () => {
  const options = { generation: fakeGeneration(), name: "fake", judge: fakeJudge, judgeName: "fake" };

  it("writes one Story per Theme and Unit 3 structure and finds every one valid on the first attempt", async () => {
    const report = await runStoryEvals(options);
    expect(storySample()).toHaveLength(30);
    expect(report.validity).toEqual({
      sample: 30,
      attempts: 30,
      firstAttemptRate: 1,
      validRate: 1,
      templates: 0,
      rejectionReasons: [],
    });
    expect(report.stories.every((s) => s.source === "story")).toBe(true);
  });

  it("withholds the Judge's readability score when calibration fails, and says so", async () => {
    const report = await runStoryEvals(options);
    expect(report.judge.name).toBe("fake");
    expect(report.judge.calibration.passes).toBe(false);
    expect(report.judge.readability).toBeNull();
    expect(report.stories.every((s) => s.judged === undefined)).toBe(true);
  });

  it("reports readability over the valid Stories once the Judge clears calibration", async () => {
    const report = await runStoryEvals({ ...options, judge: labelJudge, judgeName: "labels" });
    expect(report.judge.calibration.passes).toBe(true);
    expect(report.judge.readability).toEqual({ judged: 30, passed: 30, passRate: 1 });
  });

  it("counts retries and template fallbacks when the writer misbehaves", async () => {
    const altered = fakeGeneration({
      writeStory: async (input) => ({ text: `${input.nickname} has 99 kittens. 1 more kitten comes, so how many kittens now?` }),
    });
    const report = await runStoryEvals({ ...options, generation: altered, sample: storySample().slice(0, 4) });
    expect(report.validity).toMatchObject({ sample: 4, attempts: 12, firstAttemptRate: 0, validRate: 0, templates: 4 });
    expect(report.validity.rejectionReasons.map((r) => r.reason)).toEqual([
      "not in the puppies vocabulary",
      "the numbers are n instead of n",
    ]);
  });
});
