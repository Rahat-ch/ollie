/**
 * An in-memory LangSmith, for tests and dry runs: a real `Client` whose
 * every call that `evaluate` (an experiment or a comparison) and the dataset code
 * make is answered here, and whose HTTP client throws, so anything this
 * fake does not answer fails loudly instead of reaching the network. It
 * keeps what a real LangSmith would show: datasets and their examples,
 * experiments (projects), every run (a trace is a run with no parent), and
 * every piece of feedback.
 */
import { randomUUID } from "node:crypto";
import { Client } from "langsmith";
import type {
  ComparativeExperiment,
  Dataset,
  Example,
  ExampleCreate,
  Feedback,
  Run,
  TracerSession,
  TracerSessionResult,
} from "langsmith/schemas";

type Stored<T> = T & { readonly id: string };

/** One piece of feedback as the fake kept it. */
export type FakeFeedback = {
  readonly runId: string | null;
  readonly key: string;
  readonly score?: number | boolean | null;
  readonly value?: unknown;
  readonly comment?: string;
  /** The experiment the feedback is on, for a summary evaluator's result. */
  readonly projectId?: string;
  readonly comparativeExperimentId?: string;
};

/** A run as the fake kept it: what the tracer sent on creation, patched by its updates. */
export type FakeRun = Record<string, unknown> & {
  readonly id: string;
  readonly name: string;
  readonly session_name?: string;
  readonly session_id?: string;
  readonly parent_run_id?: string;
  readonly reference_example_id?: string;
  readonly outputs?: Record<string, unknown>;
};

const TENANT = "00000000-0000-4000-8000-000000000000";

export class FakeLangSmith extends Client {
  readonly storedDatasets: Stored<Dataset>[] = [];
  readonly storedExamples: Example[] = [];
  readonly storedProjects: Stored<TracerSession & { metadata?: Record<string, unknown> }>[] = [];
  readonly storedRuns: FakeRun[] = [];
  readonly storedFeedback: FakeFeedback[] = [];
  readonly storedComparisons: ComparativeExperiment[] = [];
  /** Every request that reached the HTTP client: none, if the fake answered everything. */
  readonly storedRequests: string[] = [];

  constructor() {
    const requests: string[] = [];
    super({
      apiUrl: "http://langsmith.fake.invalid",
      webUrl: "http://langsmith.fake.invalid",
      apiKey: "fake",
      autoBatchTracing: false,
      fetchImplementation: (async (input: RequestInfo | URL) => {
        requests.push(String(input));
        throw new Error(`The fake LangSmith does not answer ${String(input)}`);
      }) as typeof fetch,
    });
    this.storedRequests = requests;
  }

  /** The runs with no parent: what LangSmith bills as traces. */
  rootRuns(): FakeRun[] {
    return this.storedRuns.filter((run) => !run.parent_run_id);
  }

  projectNamed(name: string): (typeof this.storedProjects)[number] | undefined {
    return this.storedProjects.find((p) => p.name === name);
  }

  /** The runs of one experiment, by its name. */
  runsOf(experiment: string): FakeRun[] {
    const project = this.projectNamed(experiment);
    return this.storedRuns.filter((run) => run.session_name === experiment || (project && run.session_id === project.id));
  }

  // Runs: what traceable and the experiment's target send.

  override async createRun(run: Parameters<Client["createRun"]>[0]): Promise<void> {
    const id = run.id ?? randomUUID();
    const session_name = (run as { session_name?: string }).session_name;
    const project = session_name ? this.projectNamed(session_name) : undefined;
    this.storedRuns.push({ ...(run as unknown as Record<string, unknown>), id, name: run.name, session_id: project?.id } as FakeRun);
  }

  override async updateRun(runId: string, update: Parameters<Client["updateRun"]>[1]): Promise<void> {
    const index = this.storedRuns.findIndex((run) => run.id === runId);
    if (index === -1) throw new Error(`The fake LangSmith has no run ${runId}`);
    this.storedRuns[index] = { ...this.storedRuns[index], ...(update as Record<string, unknown>) } as FakeRun;
  }

  override async awaitPendingTraceBatches(): Promise<void> {}

  // Datasets and examples.

  override async hasDataset({ datasetName, datasetId }: { datasetName?: string; datasetId?: string }): Promise<boolean> {
    return this.storedDatasets.some((d) => d.name === datasetName || d.id === datasetId);
  }

  override async readDataset({ datasetName, datasetId }: { datasetName?: string; datasetId?: string }): Promise<Dataset> {
    const dataset = this.storedDatasets.find((d) => d.name === datasetName || d.id === datasetId);
    if (!dataset) throw new Error(`The fake LangSmith has no dataset ${datasetName ?? datasetId}`);
    return { ...dataset, example_count: this.storedExamples.filter((e) => e.dataset_id === dataset.id).length };
  }

  override async createDataset(name: string, options: { description?: string } = {}): Promise<Dataset> {
    const now = new Date().toISOString();
    const dataset = { id: randomUUID(), name, description: options.description ?? "", tenant_id: TENANT, created_at: now, modified_at: now };
    this.storedDatasets.push(dataset);
    return dataset;
  }

  // Only the uploads overload is used here.
  override async createExamples(uploads: ExampleCreate[]): Promise<Example[]>;
  override async createExamples(uploads: unknown): Promise<never>;
  override async createExamples(uploads: ExampleCreate[] | unknown): Promise<Example[]> {
    if (!Array.isArray(uploads)) throw new Error("The fake LangSmith takes the uploads overload of createExamples only");
    const created = (uploads as ExampleCreate[]).map((upload): Example => {
      const dataset = this.storedDatasets.find((d) => d.id === upload.dataset_id || d.name === upload.dataset_name);
      if (!dataset) throw new Error(`The fake LangSmith has no dataset ${upload.dataset_id ?? upload.dataset_name}`);
      const now = new Date().toISOString();
      return {
        id: upload.id ?? randomUUID(),
        dataset_id: dataset.id,
        inputs: upload.inputs,
        outputs: upload.outputs,
        metadata: { ...upload.metadata, ...(upload.split ? { dataset_split: [upload.split].flat() } : {}) },
        created_at: now,
        modified_at: now,
        runs: [],
      };
    });
    this.storedExamples.push(...created);
    return created;
  }

  override async *listExamples(
    options: { datasetId?: string; datasetName?: string; exampleIds?: string[] } = {},
  ): AsyncIterable<Example> {
    const dataset = this.storedDatasets.find((d) => d.id === options.datasetId || d.name === options.datasetName);
    for (const example of this.storedExamples) {
      if (dataset && example.dataset_id !== dataset.id) continue;
      if (options.exampleIds && !options.exampleIds.includes(example.id)) continue;
      yield example;
    }
  }

  override async getDatasetUrl({ datasetId }: { datasetId?: string }): Promise<string> {
    return `http://langsmith.fake.invalid/datasets/${datasetId}`;
  }

  // Experiments.

  override async createProject(params: Parameters<Client["createProject"]>[0]): Promise<TracerSession> {
    if (this.projectNamed(params.projectName)) {
      const error = new Error(`Project ${params.projectName} exists`);
      error.name = "LangSmithConflictError";
      throw error;
    }
    const project = {
      id: randomUUID(),
      tenant_id: TENANT,
      name: params.projectName,
      start_time: Date.now(),
      description: params.description ?? undefined,
      reference_dataset_id: params.referenceDatasetId ?? undefined,
      metadata: params.metadata ?? undefined,
      extra: { metadata: params.metadata ?? {} },
    };
    this.storedProjects.push(project);
    // Runs sent before the project existed are named by it; give them its id.
    for (const [i, run] of this.storedRuns.entries()) {
      if (run.session_name === project.name) this.storedRuns[i] = { ...run, session_id: project.id };
    }
    return project;
  }

  override async updateProject(
    projectId: string,
    update: { metadata?: Record<string, unknown> | null; description?: string | null },
  ): Promise<TracerSession> {
    const index = this.storedProjects.findIndex((p) => p.id === projectId);
    if (index === -1) throw new Error(`The fake LangSmith has no project ${projectId}`);
    const metadata = { ...this.storedProjects[index].metadata, ...update.metadata };
    this.storedProjects[index] = { ...this.storedProjects[index], metadata, extra: { metadata } };
    return this.storedProjects[index];
  }

  override async readProject({ projectId, projectName }: { projectId?: string; projectName?: string }): Promise<TracerSessionResult> {
    const project = this.storedProjects.find((p) => p.id === projectId || p.name === projectName);
    if (!project) throw new Error(`The fake LangSmith has no project ${projectName ?? projectId}`);
    const runCount = this.storedRuns.filter((run) => run.session_id === project.id && !run.parent_run_id).length;
    return { ...project, run_count: runCount };
  }

  override async getProjectUrl({ projectId }: { projectId?: string }): Promise<string> {
    return `http://langsmith.fake.invalid/projects/p/${projectId}`;
  }

  override async _supportsSDBQuery(): Promise<boolean> {
    return false;
  }

  async *_listRuns(options: { projectId?: string | string[]; executionOrder?: number }): AsyncIterable<Run> {
    const ids = [options.projectId ?? []].flat();
    for (const run of this.storedRuns) {
      if (run.session_id === undefined || !ids.includes(run.session_id)) continue;
      if (options.executionOrder === 1 && run.parent_run_id) continue;
      yield run as unknown as Run;
    }
  }

  override async createComparativeExperiment(params: Parameters<Client["createComparativeExperiment"]>[0]): Promise<ComparativeExperiment> {
    const now = new Date().toISOString();
    const comparison: ComparativeExperiment = {
      id: params.id ?? randomUUID(),
      name: params.name,
      description: params.description ?? "",
      tenant_id: TENANT,
      created_at: now,
      modified_at: now,
      reference_dataset_id: params.referenceDatasetId ?? "",
      extra: { metadata: params.metadata ?? {}, experimentIds: params.experimentIds },
    };
    this.storedComparisons.push(comparison);
    return comparison;
  }

  // Feedback: every evaluator's result, per run or per experiment.

  override async createFeedback(...args: unknown[]): Promise<Feedback> {
    let entry: FakeFeedback;
    if (typeof args[0] === "object" && args[0] !== null) {
      const params = args[0] as { runId?: string | null; key: string; score?: number | boolean | null; value?: unknown; comment?: string; projectId?: string; comparativeExperimentId?: string };
      entry = { runId: params.runId ?? null, key: params.key, score: params.score, value: params.value, comment: params.comment, projectId: params.projectId, comparativeExperimentId: params.comparativeExperimentId };
    } else {
      const [runId, key, options = {}] = args as [string | null, string, { score?: number | boolean | null; value?: unknown; comment?: string; projectId?: string; comparativeExperimentId?: string }];
      entry = { runId, key, score: options.score, value: options.value, comment: options.comment, projectId: options.projectId, comparativeExperimentId: options.comparativeExperimentId };
    }
    this.storedFeedback.push(entry);
    return { id: randomUUID(), run_id: entry.runId, key: entry.key } as unknown as Feedback;
  }
}
