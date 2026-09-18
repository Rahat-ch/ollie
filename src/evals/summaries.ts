/**
 * The Parent Summary evals: validity (deterministic — the Summary
 * validator's verdict on what the model wrote, with the retries and
 * template fallbacks counted) and faithfulness (the Judge's rubric over
 * every Summary kept, checking each claim against the evidence it was
 * written from, reported only when the Judge clears calibration against the
 * hand-labelled set of 10, and only over the Summaries the model itself
 * wrote). The sample is the Summary the app would have written after a real
 * Session of a Simulated Learner.
 */
import type { Generation, SummaryInput, SummaryOutput } from "@/generation/types";
import { mapLimit } from "@/lib/map-limit";
import { summaryInput } from "@/summary/summary";
import { writeValidSummary, type SummaryRejection } from "@/summary/write";
import { SUMMARY_CALIBRATION_SET } from "./calibration";
import { calibrateJudge, type Calibration, type Judge, type Judgement } from "./judge";
import type { LearnerRun } from "./run";
import { share, wilsonInterval, writtenValidity, type Interval, type Validity } from "./stats";

/**
 * One Summary per Learner, from the last Session of its Coach run: the
 * Session Log tallied and the Notes as the Coach left them, which is
 * exactly what the app sends. No Powers, which do not exist yet.
 */
export function summarySample(runs: readonly LearnerRun[]): SummaryInput[] {
  return runs.flatMap((run) => {
    const trace = run.sessions[run.sessions.length - 1];
    return trace ? [summaryInput(trace.result, trace.step.notes, [])] : [];
  });
}

export type SummaryTrace = {
  readonly input: SummaryInput;
  readonly output: SummaryOutput;
  readonly source: "summary" | "template";
  readonly rejections: readonly SummaryRejection[];
  /** The Judge's verdict; absent when the Judge did not clear calibration. */
  readonly judged?: Judgement;
};

export type SummaryFaithfulness = {
  readonly judged: number;
  readonly passed: number;
  readonly passRate: number;
  readonly passRateInterval: Interval | null;
};

export type SummaryReport = {
  readonly generation: string;
  readonly validity: Validity;
  readonly judge: {
    readonly name: string;
    readonly calibration: Calibration;
    /** Present only when the Judge cleared calibration. */
    readonly faithfulness: SummaryFaithfulness | null;
  };
  readonly summaries: readonly SummaryTrace[];
};

export type SummaryEvalOptions = {
  readonly generation: Pick<Generation, "writeSummary">;
  /** `fake`, or the model id. */
  readonly name: string;
  readonly judge: Judge;
  readonly judgeName: string;
  readonly sample: readonly SummaryInput[];
  /** How many model calls run at once. */
  readonly concurrency?: number;
};

/** A rejection reason without its particulars, so the same kind of failure counts together. */
const reasonKind = (reason: string): string => reason.replace(/\d+(, \d+)*/g, "n");

export async function runSummaryEvals(options: SummaryEvalOptions): Promise<SummaryReport> {
  const { generation, judge, sample } = options;
  const concurrency = options.concurrency ?? 6;
  const written = await mapLimit(sample, concurrency, async (input): Promise<SummaryTrace> => {
    const { practiced, activity, source, rejections } = await writeValidSummary(generation, input);
    return { input, output: { practiced, activity }, source, rejections };
  });
  const calibration = await calibrateJudge(SUMMARY_CALIBRATION_SET, (item) => judge.judgeSummary(item));
  let summaries = written;
  let faithfulness: SummaryFaithfulness | null = null;
  if (calibration.passes) {
    // The template Summary is the developer's own words; the Judge grades the model's.
    summaries = await mapLimit(written, concurrency, async (trace): Promise<SummaryTrace> =>
      trace.source === "summary" ? { ...trace, judged: await judge.judgeSummary(trace) } : trace,
    );
    const judged = summaries.filter((trace) => trace.judged !== undefined);
    const passed = judged.filter((trace) => trace.judged?.pass).length;
    faithfulness = { judged: judged.length, passed, passRate: share(passed, judged.length), passRateInterval: wilsonInterval(passed, judged.length) };
  }
  return {
    generation: options.name,
    validity: writtenValidity(summaries, reasonKind),
    judge: { name: options.judgeName, calibration, faithfulness },
    summaries,
  };
}
