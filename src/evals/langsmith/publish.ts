/**
 * Send an Eval Run's report to LangSmith as an experiment, and compare two
 * Arms' experiments. Eval only (ADR 0002): the eval command loads this when
 * tracing is on, and `pnpm eval:langsmith` loads it to replay stored
 * reports; no route imports it (`no-route-tracing.test.ts`).
 *
 * The experiment's target reads the report and never calls a model, so a
 * replay costs nothing but traces: one per Simulated Learner. The
 * evaluators run untraced (`disableEvaluatorTracing`), so their feedback
 * costs no traces at all.
 */
import type { Client } from "langsmith";
import { evaluate } from "langsmith/evaluation";
import type { Example } from "langsmith/schemas";
import type { EvalReport } from "../report";
import {
  checkReportLearners,
  COMPARATIVE_EVALUATORS,
  DATASET_DESCRIPTION,
  DATASET_NAME,
  experimentMetadata,
  experimentPrefix,
  LEARNER_EVALUATORS,
  learnerExamples,
  learnerOutputs,
  runEvaluator,
  type LearnerExampleInputs,
  type RunSource,
} from "./experiment";

type ExperimentResults = Awaited<ReturnType<typeof evaluate>>;

const sameInputs = (a: Record<string, unknown>, b: LearnerExampleInputs): boolean =>
  JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

/**
 * The dataset of Simulated Learners, created on first use, one Example per
 * Learner in the Learners' order. An existing Example that no longer
 * matches its Learner is refused rather than overwritten: experiments
 * already on it were run on the Learner as it was.
 */
export async function learnerDataset(client: Client, name = DATASET_NAME): Promise<Example[]> {
  const dataset = (await client.hasDataset({ datasetName: name }))
    ? await client.readDataset({ datasetName: name })
    : await client.createDataset(name, { description: DATASET_DESCRIPTION });
  const existing: Example[] = [];
  for await (const example of client.listExamples({ datasetId: dataset.id })) existing.push(example);

  const wanted = learnerExamples();
  const missing = wanted.filter((w) => !existing.some((e) => e.inputs.learner === w.inputs.learner));
  const created = missing.length > 0 ? await client.createExamples(missing.map((w) => ({ ...w, dataset_id: dataset.id }))) : [];
  const all = [...existing, ...created];

  return wanted.map((w) => {
    const example = all.find((e) => e.inputs.learner === w.inputs.learner);
    if (!example) throw new Error(`The dataset ${name} has no Example for ${w.inputs.learner}`);
    if (!sameInputs(example.inputs, w.inputs)) {
      throw new Error(`The dataset ${name} has ${w.inputs.learner} as it was before the Learners changed; name a new dataset (DATASET_NAME)`);
    }
    return example;
  });
}

export type PublishOptions = {
  /** The report's file name, `2026-09-18T19-09-56Z.json`. */
  readonly file: string;
  /** Which Arm the run is; the model the Coach ran on unless given. */
  readonly arm?: string;
  readonly source: RunSource;
};

/**
 * One report as one experiment over the dataset: each Learner's run is
 * that Learner's lines of the report, and every evaluator returns a number
 * the report holds. Returns the experiment, whose name a comparison takes.
 */
export async function publishReport(client: Client, report: EvalReport, options: PublishOptions): Promise<ExperimentResults> {
  checkReportLearners(report, options.file);
  const run = { report: options.file, arm: options.arm ?? report.coach.generation, source: options.source };
  const data = await learnerDataset(client);
  const learnerRun = async (inputs: LearnerExampleInputs) => learnerOutputs(report, inputs.learner, run);
  return withoutUntracedEvaluatorWarning(() => evaluate(learnerRun, {
    data,
    client,
    experimentPrefix: experimentPrefix(run.arm, run.report),
    description: `${run.source === "live" ? "The Eval Run" : "A replay of the stored report"} docs/evals/${run.report}: the report is the record, this experiment the view of it.`,
    metadata: experimentMetadata(report, run),
    evaluators: [...LEARNER_EVALUATORS],
    summaryEvaluators: [runEvaluator(report)],
    disableEvaluatorTracing: true,
  }));
}

/**
 * langsmith 0.10.5 warns once per evaluator call that it "can not call
 * 'on_end'" when evaluator tracing is off, which is the setting that keeps
 * the evaluators from costing traces. That one line is dropped; every other
 * warning is printed as usual.
 */
async function withoutUntracedEvaluatorWarning<T>(run: () => Promise<T>): Promise<T> {
  const warn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (args.length === 1 && args[0] === "Can not call 'on_end' if currentRunTree is undefined") return;
    warn(...args);
  };
  try {
    return await run();
  } finally {
    console.warn = warn;
  }
}

/**
 * Two Arms side by side on the same Learners: each run scored per Learner
 * against every run of the other Arm (`superiority`). Takes the
 * experiments `publishReport` returned, and all of them must be over the
 * same dataset.
 */
export async function compareArms(
  client: Client,
  experiments: readonly ExperimentResults[],
  arms: { readonly a: string; readonly b: string },
): Promise<{ readonly experimentName: string; readonly url: string | null }> {
  // `evaluate` over experiments rather than models is the comparative form (evaluateComparative is deprecated in 0.10.5).
  const result = await evaluate([...experiments], {
    client,
    evaluators: [...COMPARATIVE_EVALUATORS],
    randomizeOrder: true,
    experimentPrefix: `${arms.a}-vs-${arms.b}`,
    description: `${arms.a} against ${arms.b} on the same Simulated Learners and seeds, from the stored reports: the Pre-registration reads pass or fail from the reports, this is the view.`,
    metadata: { a: arms.a, b: arms.b, experiments: experiments.map((e) => e.experimentName) },
  });
  return { experimentName: result.experimentName, url: result.url };
}
