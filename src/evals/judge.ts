/**
 * The Judge: a rubric grader used only where a deterministic check cannot
 * apply. For Stories it reads what the validator cannot: whether a Grade 1
 * child hearing the Story once could follow it, whether what happens in it
 * matches the arithmetic, and whether it fits the Theme. Its scores count
 * only once it agrees with the hand-labelled Calibration Set above the
 * threshold. The fake here is the validator's opinion, which by design
 * fails calibration, so a fake Eval Run shows the gate and withholds.
 */
import type { StoryInput } from "@/generation/types";
import { describeProblem } from "@/story/prompt";
import { validateStory } from "@/story/validate";

export type StoryToJudge = { readonly input: StoryInput; readonly text: string };

export type StoryJudgement = {
  readonly pass: boolean;
  /** One sentence on what failed, or what was checked. */
  readonly reason: string;
};

export type Judge = {
  judgeStory(story: StoryToJudge): Promise<StoryJudgement>;
};

/** A labelled Story the Judge must agree with; the label is a human's. */
export type CalibrationStory = StoryToJudge & {
  readonly id: string;
  readonly pass: boolean;
  /** Why the label is what it is, for the reader. */
  readonly note: string;
};

/** The Judge's scores are reported only when it agrees with this share of the Calibration Set or more. */
export const JUDGE_AGREEMENT_THRESHOLD = 0.8;

export const STORY_JUDGE_SYSTEM_PROMPT = `You judge one word problem written for a Grade 1 child, age 6 or 7, who hears it read aloud once and then answers by tapping a number.

The numbers, sentence count, word count, and vocabulary have already been checked by a program. You judge what a program cannot. The Story passes only if all three hold:
1. Readability: a 6-year-old could follow it after hearing it once. Simple, natural sentences; nothing confusing, garbled, or odd.
2. Fit to the arithmetic: what happens in the Story matches the problem you are given. Things that arrive or join mean adding; things that leave mean taking away; two groups named together mean a total; a change-unknown Story gives the start and the end and asks how many came or went, and never states that number. A Story that narrates the wrong action, or asks a different question, fails.
3. Fit to the Theme: it reads as a scene in the Theme, not as a bare sum with a Theme word pasted on.

Answer with pass true or false and one sentence of reason.`;

export function storyJudgeUserMessage({ input, text }: StoryToJudge): string {
  return [
    `Theme: ${input.theme}`,
    `The problem the Story must tell: ${describeProblem(input)}`,
    "",
    "The Story:",
    text,
  ].join("\n");
}

/** The validator's opinion, offered as a Judge: deterministic, no I/O, and blind to everything the rubric is for. */
export const fakeJudge: Judge = {
  async judgeStory({ input, text }) {
    const verdict = validateStory(text, input);
    return verdict.ok
      ? { pass: true, reason: "The validator's checks pass; the fake Judge reads nothing else." }
      : { pass: false, reason: verdict.reasons.join("; ") };
  },
};

export type Calibration = {
  readonly size: number;
  readonly agreements: number;
  readonly agreement: number;
  readonly threshold: number;
  /** Whether the Judge's scores may be reported. */
  readonly passes: boolean;
  readonly disagreements: readonly { readonly id: string; readonly label: boolean; readonly judged: boolean; readonly reason: string }[];
};

/** Run the Judge over the Calibration Set and score its agreement with the human labels. */
export async function calibrateJudge(judge: Judge, set: readonly CalibrationStory[]): Promise<Calibration> {
  const judged = await Promise.all(set.map((story) => judge.judgeStory(story)));
  const disagreements = set.flatMap((story, i) =>
    judged[i].pass === story.pass ? [] : [{ id: story.id, label: story.pass, judged: judged[i].pass, reason: judged[i].reason }],
  );
  const agreements = set.length - disagreements.length;
  const agreement = set.length === 0 ? 0 : agreements / set.length;
  return { size: set.length, agreements, agreement, threshold: JUDGE_AGREEMENT_THRESHOLD, passes: agreement >= JUDGE_AGREEMENT_THRESHOLD, disagreements };
}
