/**
 * Stored Eval Run reports as LangSmith experiments, at no model cost: each
 * report is replayed, its numbers become feedback on one run per Simulated
 * Learner, and nothing calls a model. The reports under docs/evals are the
 * record; LangSmith is the view (decision 21).
 *
 *   pnpm eval:langsmith replay                        # the three live Opus 5 reports of 2026-09-18
 *   pnpm eval:langsmith replay --report docs/evals/<date>.json [--report ...] [--arm <name>]
 *   pnpm eval:langsmith compare --a <report> [--a ...] --b <report> [--b ...] [--a-arm <name>] [--b-arm <name>]
 *   pnpm eval:langsmith compare --b <report> ...       # --a defaults to the three Opus 5 reports
 *   add --dry-run to any of them to replay into an in-memory LangSmith and print what would be sent
 *
 * Sending needs LANGSMITH_API_KEY, in the shell or .env.local (LANGSMITH_ENDPOINT
 * for a non-default region); --dry-run needs nothing. Each replayed report is
 * six traces, one per Simulated Learner; the evaluators are untraced, and a
 * comparison adds one trace per Learner and comparative key only when
 * LANGSMITH_TRACING is also set.
 */
import path from "node:path";
import { parseArgs } from "node:util";
import type { Client } from "langsmith";
import { CLAIM_SET_REPORTS } from "@/evals/claim-set";
import { readReport } from "@/evals/files";
import { EVALS_DIR } from "@/evals/report";
import { cliEnv } from "./generation";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    report: { type: "string", multiple: true },
    arm: { type: "string" },
    a: { type: "string", multiple: true },
    b: { type: "string", multiple: true },
    "a-arm": { type: "string" },
    "b-arm": { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
});

/** The three live Opus 5 reports, the Opus Arm of Pre-registration 1. */
const OPUS_REPORTS = CLAIM_SET_REPORTS.map((file) => path.join(EVALS_DIR, file));

async function client(dryRun: boolean): Promise<Client> {
  if (dryRun) {
    const { FakeLangSmith } = await import("@/evals/langsmith/fake-client");
    return new FakeLangSmith();
  }
  if (!cliEnv().LANGSMITH_API_KEY?.trim()) {
    throw new Error("Sending to LangSmith needs LANGSMITH_API_KEY in the shell or .env.local; add --dry-run to see what would be sent without one.");
  }
  const { Client } = await import("langsmith");
  return new Client();
}

/** What the in-memory LangSmith received, so a dry run shows what a real one would. */
async function describeDryRun(sent: Client): Promise<void> {
  const { FakeLangSmith } = await import("@/evals/langsmith/fake-client");
  if (!(sent instanceof FakeLangSmith)) return;
  console.log("");
  console.log(`Dry run: nothing was sent. A real LangSmith would have received:`);
  console.log(`  dataset ${sent.storedDatasets.map((d) => d.name).join(", ")}: ${sent.storedExamples.length} Examples`);
  for (const project of sent.storedProjects) {
    const runs = sent.runsOf(project.name ?? "");
    const feedback = sent.storedFeedback.filter((f) => !f.comparativeExperimentId).filter((f) => runs.some((r) => r.id === f.runId) || f.projectId === project.id);
    console.log(`  experiment ${project.name}: ${runs.length} runs, ${feedback.length} pieces of feedback`);
  }
  for (const comparison of sent.storedComparisons) {
    const feedback = sent.storedFeedback.filter((f) => f.comparativeExperimentId === comparison.id);
    console.log(`  comparative experiment ${comparison.name}: ${feedback.length} pieces of feedback`);
  }
  console.log(`  ${sent.rootRuns().length} traces in all, and ${sent.storedRequests.length} network requests`);
}

async function replay(files: readonly string[], arm: string | undefined, sent: Client) {
  const { publishReport } = await import("@/evals/langsmith/publish");
  const experiments = [];
  for (const file of files) {
    const experiment = await publishReport(sent, readReport(file), { file: path.basename(file), arm, source: "replay" });
    console.log(`${file} -> experiment ${experiment.experimentName}`);
    experiments.push(experiment);
  }
  return experiments;
}

async function main(): Promise<void> {
  const [command] = positionals;
  const dryRun = values["dry-run"];
  if (command === "replay") {
    const sent = await client(dryRun);
    await replay(values.report ?? OPUS_REPORTS, values.arm, sent);
    await sent.awaitPendingTraceBatches();
    await describeDryRun(sent);
    return;
  }
  if (command === "compare") {
    if (!values.b || values.b.length === 0) {
      throw new Error("compare needs the second Arm's reports (--b). The Sonnet 5.5 Arm is ticket 07's three live runs, which do not exist yet.");
    }
    const aFiles = values.a ?? OPUS_REPORTS;
    const aArm = values["a-arm"] ?? readReport(aFiles[0]).coach.generation;
    const bArm = values["b-arm"] ?? readReport(values.b[0]).coach.generation;
    if (aArm === bArm) throw new Error(`Both Arms are named ${aArm}; name them with --a-arm and --b-arm`);
    const sent = await client(dryRun);
    const a = await replay(aFiles, aArm, sent);
    const b = await replay(values.b, bArm, sent);
    const { compareArms } = await import("@/evals/langsmith/publish");
    const comparison = await compareArms(sent, [...a, ...b], { a: aArm, b: bArm });
    console.log(`comparative experiment ${comparison.experimentName}${comparison.url ? `: ${comparison.url}` : ""}`);
    await sent.awaitPendingTraceBatches();
    await describeDryRun(sent);
    return;
  }
  throw new Error(`Say replay or compare, as in: pnpm eval:langsmith replay --dry-run`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
