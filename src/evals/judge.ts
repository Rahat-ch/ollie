/**
 * The Judge: a rubric grader used only where a deterministic check cannot
 * apply. For Stories it reads what the validator cannot: whether a Grade 1
 * child hearing the Story once could follow it, whether what happens in it
 * matches the arithmetic, and whether it fits the Theme. For Parent
 * Summaries it checks every claim against the Session Log it was written
 * from and fails an unsupported claim or a claim about the Learner's
 * thinking. Its scores count only once it agrees with the hand-labelled
 * Calibration Set above the threshold. The fakes here are the validators'
 * opinions, which by design fail calibration, so a fake Eval Run shows the
 * gate and withholds.
 */
import { zeroCall, type Telemetry } from "@/generation/telemetry";
import type { StoryInput, SummaryInput, SummaryOutput } from "@/generation/types";
import { describeProblem } from "@/story/prompt";
import { validateStory } from "@/story/validate";
import { evidenceParts } from "@/summary/assistance";
import { validateSummary } from "@/summary/validate";
import { share, wilsonInterval, type Interval } from "./stats";

export type StoryToJudge = { readonly input: StoryInput; readonly text: string };

/** One Parent Summary with the evidence it was written from, so every claim can be checked against it. */
export type SummaryToJudge = { readonly input: SummaryInput; readonly output: SummaryOutput };

export type Judgement = {
  readonly pass: boolean;
  /** One sentence on what failed, or what was checked. */
  readonly reason: string;
};

export type Judge = {
  judgeStory(story: StoryToJudge): Promise<Judgement>;
  judgeSummary(summary: SummaryToJudge): Promise<Judgement>;
};

/** A hand-labelled item the Judge must agree with; `pass` is the human's verdict. */
export type Calibrated = {
  readonly id: string;
  readonly pass: boolean;
  /** Why the verdict is what it is, for the reader. */
  readonly note: string;
};

export type CalibrationStory = StoryToJudge & Calibrated;

export type CalibrationSummary = SummaryToJudge & Calibrated;

/** The Judge's scores are reported only when it agrees with this share of the Calibration Set or more. */
export const JUDGE_AGREEMENT_THRESHOLD = 0.8;

/**
 * And only when its agreement beyond chance is this high. Raw agreement
 * flatters a lopsided set: the Story set is 12 pass and 8 fail, so a Judge
 * that says pass to everything scores 0.60 on no skill at all. Cohen's kappa
 * takes that floor out, and 0.60 is the line below which agreement is
 * usually called inadequate.
 */
export const JUDGE_KAPPA_FLOOR = 0.6;

export const STORY_JUDGE_SYSTEM_PROMPT = `You judge one word problem written for a Grade 1 child, age 6 or 7, who hears it read aloud once and then answers by tapping a number.

The numbers, sentence count, word count, and vocabulary have already been checked by a program. You judge what a program cannot. The Story passes only if all three hold:
1. Readability: a 6-year-old could follow it after hearing it once. Simple, natural sentences; nothing confusing, garbled, or odd.
2. Fit to the arithmetic: what happens in the Story matches the problem you are given. Things that arrive or join mean adding; things that leave mean taking away; two groups named together mean a total; a change-unknown Story gives the start and the end and asks how many came or went, and never states that number. A Story that narrates the wrong action, or asks a different question, fails.
3. Fit to the Theme: it reads as a scene in the Theme, not as a bare sum with a Theme word pasted on.

Answer with pass true or false and one sentence of reason.`;

export const SUMMARY_JUDGE_SYSTEM_PROMPT = `You judge one Parent Summary: a short note written to the parent of a six-year-old after one Session of a Grade 1 math game.

You are given the evidence the note was written from — a deterministic engine's tally of the Session, one line per Skill practiced, with how many Problems were first-try correct, correct after a Hint, Revealed (the answer shown after a second miss), or left unanswered, plus what was Mastered and any Power earned — and then the note itself.

You judge faithfulness. The note passes only if all three hold:
1. Every claim it makes is supported by the evidence. A number, a strategy, a Mastery, a Power, or a characterisation of how the Session went that the evidence does not support is a failure, and so is praise the evidence does not support. The Learner Notes are given to you as well: the note may mention a Hypothesis from them as something Ollie is watching or will try next, which is supported, but never as something true about the child.
2. It never claims to know how the child was thinking, what she understands, knows, remembers, or is confused by, or what she did in her head. Saying what she did — first try, after a Hint, Revealed — is right; saying why is not.
3. It distinguishes the kinds of evidence it cites: a Problem answered on the first try, one answered after a Hint, and one Revealed are three different things and must not be run together as "got right" or "knew".

The activity at the end is a suggestion for the parent, not a claim about the Session; judge it only for whether it fits the weakest Skill named in the evidence.

Answer with pass true or false and one sentence of reason.`;

export function summaryJudgeUserMessage({ input, output }: SummaryToJudge): string {
  const practice = input.practice.map((row) => `- ${row.name}: ${evidenceParts(row, true).join(", ")}`);
  return [
    `Session ${input.sessionNumber}, ${input.problems} Problems.`,
    "The evidence the note was written from:",
    ...practice,
    `Mastered this Session: ${input.mastered.length === 0 ? "nothing new" : input.mastered.join(", ")}`,
    `Powers earned this Session: ${input.powers.length === 0 ? "none" : input.powers.join(", ")}`,
    `Weakest Skill practiced: ${input.weakest?.name ?? "none"}`,
    "",
    "The Learner Notes the writer was also given (Hypotheses under test, not facts):",
    JSON.stringify(input.notes, null, 2),
    "",
    "The note:",
    output.practiced,
    "",
    "The activity:",
    output.activity,
  ].join("\n");
}

export function storyJudgeUserMessage({ input, text }: StoryToJudge): string {
  return [
    `Theme: ${input.theme}`,
    `The problem the Story must tell: ${describeProblem(input)}`,
    "",
    "The Story:",
    text,
  ].join("\n");
}

/** The validators' opinions, offered as a Judge: deterministic, no I/O, and blind to everything the rubrics are for. */
export const fakeJudge: Judge = {
  async judgeStory({ input, text }) {
    const verdict = validateStory(text, input);
    return verdict.ok
      ? { pass: true, reason: "The validator's checks pass; the fake Judge reads nothing else." }
      : { pass: false, reason: verdict.reasons.join("; ") };
  },
  async judgeSummary({ input, output }) {
    const verdict = validateSummary(output, input);
    return verdict.ok
      ? { pass: true, reason: "The validator's checks pass; the fake Judge reads nothing else." }
      : { pass: false, reason: verdict.reasons.join("; ") };
  },
};

/**
 * The fake Judge reporting every verdict through the recorder as a call of
 * no tokens and no milliseconds, so a fake run's telemetry names the Judge
 * alongside the three Generation operations.
 */
export const recordedFakeJudge = (telemetry: Telemetry): Judge => ({
  judgeStory: async (story) => {
    const verdict = await fakeJudge.judgeStory(story);
    telemetry.record(zeroCall("judge"));
    return verdict;
  },
  judgeSummary: async (summary) => {
    const verdict = await fakeJudge.judgeSummary(summary);
    telemetry.record(zeroCall("judge"));
    return verdict;
  },
});

/** The Judge's verdicts against the human's, item by item: the human's label first. */
export type Confusion = {
  readonly humanPassJudgePass: number;
  readonly humanPassJudgeFail: number;
  readonly humanFailJudgePass: number;
  readonly humanFailJudgeFail: number;
};

export type Calibration = {
  readonly size: number;
  readonly agreements: number;
  readonly agreement: number;
  /** What the Calibration Set supports for the agreement; null on an empty set. */
  readonly agreementInterval: Interval | null;
  readonly threshold: number;
  /** Cohen's kappa against the human verdicts: agreement beyond what the marginals give for free. */
  readonly kappa: number;
  readonly kappaFloor: number;
  readonly confusion: Confusion;
  /** What a Judge that passed everything would agree on: the set's pass share. */
  readonly alwaysPassAgreement: number;
  /** And one that failed everything: the set's fail share. */
  readonly alwaysFailAgreement: number;
  /** Whether the Judge's scores may be reported: the threshold and the floor, both. */
  readonly passes: boolean;
  /** Which condition failed, in one phrase, or null when the Judge cleared the gate. */
  readonly withheld: string | null;
  readonly disagreements: readonly { readonly id: string; readonly expected: boolean; readonly judged: boolean; readonly reason: string }[];
};

/**
 * Cohen's kappa from the confusion matrix: the agreement observed, less the
 * agreement the two raters' own habits would produce by chance, over the room
 * that leaves. Zero when chance already explains everything, which is what an
 * always-pass Judge scores.
 */
function cohensKappa(confusion: Confusion, size: number): number {
  if (size === 0) return 0;
  const { humanPassJudgePass, humanPassJudgeFail, humanFailJudgePass, humanFailJudgeFail } = confusion;
  const observed = (humanPassJudgePass + humanFailJudgeFail) / size;
  const humanPass = (humanPassJudgePass + humanPassJudgeFail) / size;
  const judgePass = (humanPassJudgePass + humanFailJudgePass) / size;
  const chance = humanPass * judgePass + (1 - humanPass) * (1 - judgePass);
  return chance >= 1 ? 0 : (observed - chance) / (1 - chance);
}

/** Run the Judge over a Calibration Set and score its agreement with the human verdicts. */
export async function calibrateJudge<T extends Calibrated>(
  set: readonly T[],
  judgeOne: (item: T) => Promise<Judgement>,
): Promise<Calibration> {
  const judged = await Promise.all(set.map(judgeOne));
  const disagreements = set.flatMap((item, i) =>
    judged[i].pass === item.pass ? [] : [{ id: item.id, expected: item.pass, judged: judged[i].pass, reason: judged[i].reason }],
  );
  const count = (human: boolean, verdict: boolean) => set.filter((item, i) => item.pass === human && judged[i].pass === verdict).length;
  const confusion: Confusion = {
    humanPassJudgePass: count(true, true),
    humanPassJudgeFail: count(true, false),
    humanFailJudgePass: count(false, true),
    humanFailJudgeFail: count(false, false),
  };
  const agreements = set.length - disagreements.length;
  const agreement = share(agreements, set.length);
  const kappa = cohensKappa(confusion, set.length);
  const failures = [
    agreement >= JUDGE_AGREEMENT_THRESHOLD ? null : `agreement ${agreement.toFixed(2)} is below the threshold ${JUDGE_AGREEMENT_THRESHOLD.toFixed(2)}`,
    kappa >= JUDGE_KAPPA_FLOOR ? null : `kappa ${kappa.toFixed(2)} is below the floor ${JUDGE_KAPPA_FLOOR.toFixed(2)}`,
  ].filter((failure): failure is string => failure !== null);
  return {
    size: set.length,
    agreements,
    agreement,
    agreementInterval: wilsonInterval(agreements, set.length),
    threshold: JUDGE_AGREEMENT_THRESHOLD,
    kappa,
    kappaFloor: JUDGE_KAPPA_FLOOR,
    confusion,
    alwaysPassAgreement: share(set.filter((item) => item.pass).length, set.length),
    alwaysFailAgreement: share(set.filter((item) => !item.pass).length, set.length),
    passes: failures.length === 0,
    withheld: failures.length === 0 ? null : failures.join(", and "),
    disagreements,
  };
}
