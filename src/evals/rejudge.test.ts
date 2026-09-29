import { describe, expect, it } from "vitest";
import { createRecorder } from "@/generation/telemetry";
import type { StoryInput } from "@/generation/types";
import { NICKNAME_PLACEHOLDER } from "@/story/nickname";
import { readReport } from "./files";
import { fakeJudge, recordedFakeJudge, type Judge, type Judgement, type StoryToJudge } from "./judge";
import { changedVerdicts, formatRejudge, formatRejudgeRun, mentionsPlaceholder, rejudgeRun, rejudgeStories } from "./rejudge";
import { finalRun, SEALED_SPLIT, storyCalibrationSet } from "./sealed";
import type { StoryReport, StoryTrace } from "./stories";

const OPEN_HALF = storyCalibrationSet("tuning");
/** Both halves, only to name what the re-judge must never read. */
const SEALED_HALF = storyCalibrationSet(finalRun("the re-judge's test that it reads the open half only")).filter((s) =>
  SEALED_SPLIT.sets.stories.sealed.includes(s.id),
);

const input = (theme: StoryInput["theme"]): StoryInput => ({
  skill: "result-unknown",
  structure: "add-to",
  equation: { left: 2, op: "+", right: 5, result: 7, unknown: "result" },
  answer: 7,
  theme,
  nickname: NICKNAME_PLACEHOLDER,
});

const story = (text: string, judged?: Judgement, source: StoryTrace["source"] = "story"): StoryTrace => ({
  input: input("puppies"),
  text,
  source,
  rejections: [],
  ...(judged ? { judged } : {}),
});

const PLACEHOLDER_FAIL = { pass: false, reason: `The literal ${NICKNAME_PLACEHOLDER} placeholder would confuse a child.` };

/**
 * Five stored Stories: four the stored Judge read and one template it did
 * not. Worked by hand: the new Judge passes two of the four, so readability
 * is 2 of 4 (Wilson 0.150 to 0.850); one of its two fails still cites the
 * placeholder, against both of the stored two; and two verdicts changed.
 */
const STORED: StoryReport = {
  // The first Sonnet 5.5 run's validity and gate, as it stored them, with five Stories of this test's own.
  ...readReport("docs/evals/2026-09-29T19-10-40Z.json").stories,
  stories: [
    story(`${NICKNAME_PLACEHOLDER} sees 2 puppies, then 5 more come. How many puppies now?`, { pass: true, reason: "fine" }),
    story(`${NICKNAME_PLACEHOLDER} has 2 bones and finds 5 more. How many bones now?`, PLACEHOLDER_FAIL),
    story(`${NICKNAME_PLACEHOLDER} counts 2 pups and 5 pups. How many?`, { pass: false, reason: "The nickname placeholder is odd." }),
    story("2 puppies and 5 puppies play. How many puppies play?", { pass: true, reason: "fine" }),
    story("There are 2 puppies. 5 more puppies come. How many puppies are there now?", undefined, "template"),
  ],
};

/** The new Judge, scripted: the owner's verdict on the Calibration Set, and these verdicts on the stored Stories. */
function scriptedJudge(seen: string[]): Judge {
  const verdicts: Readonly<Record<number, Judgement>> = {
    0: { pass: true, reason: "fine" },
    1: { pass: true, reason: "fine" },
    2: PLACEHOLDER_FAIL,
    3: { pass: false, reason: "It reads as a bare sum with puppies pasted on." },
  };
  return {
    ...fakeJudge,
    async judgeStory({ text }: StoryToJudge) {
      seen.push(text);
      const calibrated = [...OPEN_HALF, ...SEALED_HALF].find((s) => s.text === text);
      if (calibrated) return { pass: calibrated.pass, reason: "as the owner labelled it" };
      return verdicts[STORED.stories.findIndex((s) => s.text === text)];
    },
  };
}

describe("rejudgeStories", () => {
  it("scores the stored Stories again against a hand-worked case", async () => {
    const rejudge = await rejudgeStories("hand.json", STORED, scriptedJudge([]), "scripted");

    expect(rejudge.judge.calibration).toMatchObject({ size: 10, agreement: 1, passes: true });
    expect(rejudge.judge.readability).toMatchObject({ judged: 4, passed: 2, passRate: 0.5 });
    expect(rejudge.judge.readability?.passRateInterval?.lower).toBeCloseTo(0.15, 3);
    expect(rejudge.judge.readability?.passRateInterval?.upper).toBeCloseTo(0.85, 3);
    expect(rejudge.placeholder).toEqual({ stored: { fails: 2, mentioning: 2 }, rejudged: { fails: 2, mentioning: 1 } });
    expect(changedVerdicts(rejudge).map((s) => s.text)).toEqual([STORED.stories[1].text, STORED.stories[3].text]);
    expect(rejudge.stories).toHaveLength(4);
    expect(rejudge.stored).toEqual({ judge: "claude-sonnet-5-5", gateSize: 20, readability: STORED.judge.readability, withheld: null });
  });

  it("gates on the open half of the Story Calibration Set and never reads the sealed half", async () => {
    const seen: string[] = [];
    await rejudgeStories("hand.json", STORED, scriptedJudge(seen), "scripted");

    for (const item of OPEN_HALF) expect(seen).toContain(item.text);
    for (const item of SEALED_HALF) expect(seen).not.toContain(item.text);
    expect(OPEN_HALF).toHaveLength(10);
  });

  it("withholds readability when the gate fails, as the eval does, and still lists the verdicts", async () => {
    const rejudge = await rejudgeStories("fake.json", STORED, fakeJudge, "fake");

    expect(rejudge.judge.calibration.passes).toBe(false);
    expect(rejudge.judge.readability).toBeNull();
    expect(rejudge.stories).toHaveLength(4);
    expect(formatRejudge(rejudge)).toContain(`Readability: scores withheld — ${rejudge.judge.calibration.withheld}`);
  });
});

describe("mentionsPlaceholder", () => {
  it("counts the stored Sonnet 5.5 fails as Pre-registration 1 did: 11 of 16 in the first run", () => {
    const { stories } = readReport("docs/evals/2026-09-29T19-10-40Z.json").stories;
    const fails = stories.filter((s) => s.judged && !s.judged.pass);

    expect(fails).toHaveLength(16);
    expect(fails.filter((s) => mentionsPlaceholder(s.judged!.reason))).toHaveLength(11);
    expect(mentionsPlaceholder("It reads as a bare sum with 'rockets' pasted in.")).toBe(false);
  });
});

describe("rejudgeRun", () => {
  it("records every Judge call, the gate's and the Stories', per report", async () => {
    const recorder = createRecorder();
    const report = readReport("docs/evals/2026-09-29T19-10-40Z.json");
    const run = await rejudgeRun({
      reports: [
        { file: "a.json", storyReport: report.stories },
        { file: "b.json", storyReport: STORED },
      ],
      judge: recordedFakeJudge(recorder),
      judgeName: "fake",
      recorder,
      generatedAt: new Date("2026-09-29T20:00:00Z"),
    });

    expect(run.reports.map((r) => r.file)).toEqual(["a.json", "b.json"]);
    // The gate's 10 on each report, then its 30 and 4 Stories.
    expect(run.telemetry.byOperation.judge.calls).toBe(10 + 30 + 10 + 4);
    expect(run.telemetry.total.dollars).toBe(0);
    expect(run.reports[0].stored.readability).toMatchObject({ judged: 30, passed: 14 });
    // No Coach ran, so the Cost block has no Coach-per-Session line.
    expect(formatRejudgeRun(run)).toContain("Cost (estimated");
    expect(formatRejudgeRun(run)).not.toContain("per Coach call");
  });
});
