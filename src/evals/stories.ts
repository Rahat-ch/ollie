/**
 * The Story evals: validity (deterministic, every Story written for a fixed
 * sample of Problems is checked by the validator, with the retries and
 * template fallbacks counted) and readability (the Judge's rubric on the
 * valid Stories, reported only when the Judge clears calibration against
 * the hand-labelled set).
 */
import type { Generation, StoryInput } from "@/generation/types";
import { createRng, getSkill, type SkillId } from "@/loop";
import { mapLimit } from "@/lib/map-limit";
import { THEMES } from "@/profile/identity";
import { NICKNAME_PLACEHOLDER } from "@/story/nickname";
import { STORY_ATTEMPTS, writeValidStory, type StoryRejection } from "@/story/write";
import { STORY_CALIBRATION_SET } from "./calibration";
import { calibrateJudge, type Calibration, type Judge, type StoryJudgement } from "./judge";
import { share } from "./stats";

const UNIT_3: readonly SkillId[] = ["result-unknown", "change-unknown"];

/** One Problem per Theme and Unit 3 structure, seeded, in placeholder form: 30 Stories. */
export function storySample(seed = "story-eval"): StoryInput[] {
  return THEMES.flatMap(({ id: theme }) =>
    UNIT_3.flatMap((id) => {
      const skill = getSkill(id);
      return skill.structures.map((structure): StoryInput => {
        const draft = skill.generate(createRng(`${seed}:${theme}:${structure}`), { range: skill.defaultRange, structures: [structure] });
        return { skill: id, structure, equation: draft.equation, answer: draft.answer, theme, nickname: NICKNAME_PLACEHOLDER };
      });
    }),
  );
}

export type StoryTrace = {
  readonly input: StoryInput;
  readonly text: string;
  readonly source: "story" | "template";
  readonly rejections: readonly StoryRejection[];
  /** The Judge's verdict on a valid Story; absent for a template. */
  readonly judged?: StoryJudgement;
};

export type StoryValidity = {
  readonly sample: number;
  readonly attempts: number;
  /** Stories valid on the model's first attempt, over the sample. */
  readonly firstAttemptRate: number;
  /** Stories that ended as a model Story (within the bounded attempts), over the sample. */
  readonly validRate: number;
  readonly templates: number;
  /** Every rejection reason seen, most frequent first. */
  readonly rejectionReasons: readonly { readonly reason: string; readonly count: number }[];
};

export type StoryReadability = {
  readonly judged: number;
  readonly passed: number;
  readonly passRate: number;
};

export type StoryReport = {
  readonly generation: string;
  readonly validity: StoryValidity;
  readonly judge: {
    readonly name: string;
    readonly calibration: Calibration;
    /** Present only when the Judge cleared calibration. */
    readonly readability: StoryReadability | null;
  };
  readonly stories: readonly StoryTrace[];
};

export type StoryEvalOptions = {
  readonly generation: Generation;
  /** `fake`, or the model id. */
  readonly name: string;
  readonly judge: Judge;
  readonly judgeName: string;
  readonly sample?: readonly StoryInput[];
  /** How many model calls run at once. */
  readonly concurrency?: number;
};

/** A rejection reason without its particulars, so the same kind of failure counts together. */
const kindOf = (reason: string): string => reason.replace(/\d+(, \d+)*/g, "n").replace(/vocabulary: .*$/, "vocabulary").replace(/the Nickname .* is missing/, "the Nickname is missing");

function validity(traces: readonly StoryTrace[]): StoryValidity {
  const counts = new Map<string, number>();
  let attempts = 0;
  for (const trace of traces) {
    attempts += trace.rejections.length + (trace.source === "story" ? 1 : 0);
    for (const rejection of trace.rejections) {
      for (const reason of rejection.reasons) {
        const kind = kindOf(reason);
        counts.set(kind, (counts.get(kind) ?? 0) + 1);
      }
    }
  }
  return {
    sample: traces.length,
    attempts,
    firstAttemptRate: share(traces.filter((t) => t.source === "story" && t.rejections.length === 0).length, traces.length),
    validRate: share(traces.filter((t) => t.source === "story").length, traces.length),
    templates: traces.filter((t) => t.source === "template").length,
    rejectionReasons: [...counts].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason)),
  };
}

export async function runStoryEvals(options: StoryEvalOptions): Promise<StoryReport> {
  const { generation, judge } = options;
  const sample = options.sample ?? storySample();
  const concurrency = options.concurrency ?? 6;
  const written = await mapLimit(sample, concurrency, async (input): Promise<StoryTrace> => {
    const story = await writeValidStory(generation, input, STORY_ATTEMPTS);
    return { input, ...story };
  });
  const calibration = await calibrateJudge(judge, STORY_CALIBRATION_SET);
  let stories = written;
  let readability: StoryReadability | null = null;
  if (calibration.passes) {
    stories = await mapLimit(written, concurrency, async (trace): Promise<StoryTrace> =>
      trace.source === "story" ? { ...trace, judged: await judge.judgeStory(trace) } : trace,
    );
    const judged = stories.filter((t) => t.judged !== undefined);
    const passed = judged.filter((t) => t.judged?.pass).length;
    readability = { judged: judged.length, passed, passRate: share(passed, judged.length) };
  }
  return {
    generation: options.name,
    validity: validity(stories),
    judge: { name: options.judgeName, calibration, readability },
    stories,
  };
}
