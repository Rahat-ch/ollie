/**
 * Judge a stored report's Stories again with the Story Judge as it stands
 * now, and hold the new verdicts against the stored ones. Only the Judge's
 * prompt has changed since those runs (decision 40), so the Stories are not
 * written again: the same text meets the new Judge.
 *
 * The gate runs once per report, as the eval runs it once per run, but on
 * the open half of the Story Calibration Set only (`"tuning"` access): the
 * sealed half stays for Pre-registration 2. Readability is withheld when
 * the gate fails, as in the eval. The verdicts themselves are still kept,
 * so a reader can see what the new Judge said about the placeholder either
 * way. What comes out is exploratory, after the fact, and changes no
 * pre-registered result.
 */
import { mapLimit } from "@/lib/map-limit";
import type { StoryInput } from "@/generation/types";
import { telemetrySection, type Recorder, type TelemetrySection } from "@/generation/telemetry";
import { formatTelemetry, judgeLines, scoreLine } from "./format";
import { calibrateJudge, STORY_JUDGE_SYSTEM_PROMPT, type Calibration, type Judge, type Judgement } from "./judge";
import { describeGeneration, describeJudge } from "./report";
import { storyCalibrationSet } from "./sealed";
import { storyReadability, type StoryReadability, type StoryReport } from "./stories";

/** One Story the stored run's Judge read, with the new Judge's verdict beside the stored one. */
export type RejudgedStory = {
  readonly input: StoryInput;
  readonly text: string;
  /** Absent when the stored run's gate withheld readability and its Judge read no Story. */
  readonly stored?: Judgement;
  readonly rejudged: Judgement;
};

/** Of a Judge's fails, how many name the placeholder. */
export type PlaceholderCount = { readonly fails: number; readonly mentioning: number };

export type StoryRejudge = {
  /** The stored report's file. */
  readonly file: string;
  /** Who wrote the Stories. */
  readonly writer: string;
  readonly stored: {
    readonly judge: string;
    /** How many Stories the stored gate read: the whole Calibration Set in every run so far. */
    readonly gateSize: number;
    readonly readability: StoryReadability | null;
    readonly withheld: string | null;
  };
  readonly judge: {
    readonly name: string;
    /** The gate on the open half only. */
    readonly calibration: Calibration;
    /** Present only when the Judge cleared the gate. */
    readonly readability: StoryReadability | null;
  };
  readonly placeholder: { readonly stored: PlaceholderCount; readonly rejudged: PlaceholderCount };
  readonly stories: readonly RejudgedStory[];
};

/**
 * Whether a verdict's reason names the Nickname placeholder, by the literal
 * or by the word: "the {{nickname}} token", "the template placeholder". This
 * is how Pre-registration 1 counted 11, 12 and 10 such fails.
 */
export const mentionsPlaceholder = (reason: string): boolean => /nickname|placeholder/i.test(reason);

function placeholderCount(verdicts: readonly (Judgement | undefined)[]): PlaceholderCount {
  const fails = verdicts.filter((v): v is Judgement => v !== undefined && !v.pass);
  return { fails: fails.length, mentioning: fails.filter((v) => mentionsPlaceholder(v.reason)).length };
}

/** The Stories whose verdict the new Judge turned over, in the report's order. */
export const changedVerdicts = (rejudge: StoryRejudge): RejudgedStory[] =>
  rejudge.stories.filter((s) => s.stored !== undefined && s.stored.pass !== s.rejudged.pass);

/** One report's Stories judged again, the gate first on the open half. A template was never judged and is not now. */
export async function rejudgeStories(file: string, storyReport: StoryReport, judge: Judge, judgeName: string): Promise<StoryRejudge> {
  const calibration = await calibrateJudge(storyCalibrationSet("tuning"), (story) => judge.judgeStory(story));
  const written = storyReport.stories.filter((trace) => trace.source === "story");
  const rejudged = await mapLimit(written, 6, async (trace): Promise<RejudgedStory> => ({
    input: trace.input,
    text: trace.text,
    ...(trace.judged ? { stored: trace.judged } : {}),
    rejudged: await judge.judgeStory(trace),
  }));
  const passed = rejudged.filter((s) => s.rejudged.pass).length;
  return {
    file,
    writer: storyReport.generation,
    stored: {
      judge: storyReport.judge.name,
      gateSize: storyReport.judge.calibration.size,
      readability: storyReport.judge.readability,
      withheld: storyReport.judge.calibration.withheld,
    },
    judge: {
      name: judgeName,
      calibration,
      readability: calibration.passes ? storyReadability(passed, rejudged.length) : null,
    },
    placeholder: {
      stored: placeholderCount(rejudged.map((s) => s.stored)),
      rejudged: placeholderCount(rejudged.map((s) => s.rejudged)),
    },
    stories: rejudged,
  };
}

/** What one `pnpm eval:rejudge` leaves: every report judged again, the prompt that judged them, and what it cost. */
export type RejudgeRun = {
  readonly generatedAt: string;
  readonly judge: string;
  readonly prompt: string;
  readonly reports: readonly StoryRejudge[];
  readonly telemetry: TelemetrySection;
};

export type RejudgeOptions = {
  readonly reports: readonly { readonly file: string; readonly storyReport: StoryReport }[];
  readonly judge: Judge;
  readonly judgeName: string;
  /** The recorder the Judge reports to, read at the end for the Cost block. */
  readonly recorder: Recorder;
  readonly generatedAt: Date;
};

/** Every report in turn, each with its own gate. */
export async function rejudgeRun(options: RejudgeOptions): Promise<RejudgeRun> {
  const reports: StoryRejudge[] = [];
  for (const { file, storyReport } of options.reports) {
    reports.push(await rejudgeStories(file, storyReport, options.judge, options.judgeName));
  }
  return {
    generatedAt: options.generatedAt.toISOString(),
    judge: options.judgeName,
    prompt: STORY_JUDGE_SYSTEM_PROMPT,
    reports,
    telemetry: telemetrySection(options.recorder.calls(), 0),
  };
}

const verdict = (judgement: Judgement): string => (judgement.pass ? "pass" : "fail");

const placeholderLine = ({ stored, rejudged }: StoryRejudge["placeholder"]): string =>
  `Fails that mention the placeholder: ${rejudged.mentioning} of ${rejudged.fails} (stored: ${stored.mentioning} of ${stored.fails})`;

/** One report: the stored readability, the gate and readability of the new Judge, the placeholder count, and every Story that changed. */
export function formatRejudge(rejudge: StoryRejudge): string {
  const { stored, judge } = rejudge;
  const changed = changedVerdicts(rejudge);
  const withStored = rejudge.stories.filter((s) => s.stored !== undefined).length;
  return [
    `${rejudge.file}: ${rejudge.stories.length} Stories by ${describeGeneration(rejudge.writer)}`,
    `Stored (Judge: ${describeJudge(stored.judge)}, gate on ${stored.gateSize} Stories): ${scoreLine("Readability", "Stories", stored.readability, stored.withheld)}`,
    "Re-judged, gate on the open half of the Story Calibration Set:",
    ...judgeLines(judge, "Stories", "Readability", judge.readability).map((line) => `  ${line}`),
    ...(judge.readability ? [] : ["  The verdicts below are kept for reading, not as a score."]),
    placeholderLine(rejudge.placeholder),
    `Verdicts changed: ${changed.length} of ${withStored} Stories with a stored verdict`,
    ...changed.map(
      (s) => `  ${verdict(s.stored!)} -> ${verdict(s.rejudged)}  ${s.input.theme}, ${s.input.structure}: "${s.text}"\n    ${s.rejudged.reason}`,
    ),
  ].join("\n");
}

/** The whole run as text: each report, then the Cost block. */
export function formatRejudgeRun(run: RejudgeRun): string {
  return [
    `Stories judged again by ${describeJudge(run.judge)}, exploratory and after the fact`,
    "",
    ...run.reports.flatMap((rejudge) => [formatRejudge(rejudge), ""]),
    formatTelemetry(run.telemetry),
  ].join("\n");
}
