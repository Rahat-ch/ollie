/**
 * Tracing an Eval Run into LangSmith, eval only (ADR 0002). The eval
 * command loads this module only when `tracingDecision` says so; no route
 * imports it (`no-route-tracing.test.ts`).
 *
 * The seam stays at `Generation`: its methods and the Judge's are wrapped
 * with `traceable`, not the Anthropic client, so the fake and the real
 * adapter trace the same way and the adapter the routes use is untouched.
 * The tokens and the model come from the run's own recorder, the same
 * numbers the report's telemetry adds up.
 *
 * A run is eight traces: each Simulated Learner's Coach run, the Stories,
 * and the Summaries, with every model call a child of one of them. A call
 * made outside those spans is not traced rather than opening a trace of its
 * own, so the count cannot creep up.
 */
import { Client } from "langsmith";
import { getCurrentRunTree, traceable } from "langsmith/traceable";
import type { Generation } from "@/generation";
import type { ModelCall, Telemetry } from "@/generation/telemetry";
import type { EvalSpan } from "../evals";
import type { Judge } from "../judge";

export type EvalTracer = {
  /** The LangSmith client the traces and the run's experiment go through. */
  readonly client: Client;
  readonly project: string;
  /** Runs `run` as a trace of its own, a root run in the project. */
  readonly span: EvalSpan;
  readonly generation: (generation: Generation) => Generation;
  readonly judge: (judge: Judge) => Judge;
  /** The recorder, also writing each call's model and tokens onto the traced call it happened in. */
  readonly telemetry: <T extends Telemetry>(telemetry: T) => T;
  /** Waits until every trace has been sent. */
  readonly flush: () => Promise<void>;
};

/** What LangSmith reads a model run's cost from: the model, and the tokens with the cached ones inside the input. */
function callMetadata(call: ModelCall): Record<string, unknown> {
  const input = call.inputTokens + call.cacheReadTokens + call.cacheWriteTokens;
  return {
    ls_provider: "anthropic",
    ls_model_name: call.model,
    operation: call.operation,
    ms: call.ms,
    usage_metadata: {
      input_tokens: input,
      output_tokens: call.outputTokens,
      total_tokens: input + call.outputTokens,
      input_token_details: { cache_read: call.cacheReadTokens, cache_creation: call.cacheWriteTokens },
    },
  };
}

export function evalTracer(client: Client, project: string): EvalTracer {
  /** A model call traced as a child of the span it runs in, and not traced at all outside one. */
  function call<I, R>(name: string, fn: (input: I, ...rest: never[]) => Promise<R>): (input: I, ...rest: never[]) => Promise<R> {
    return (input, ...rest) => {
      if (!getCurrentRunTree(true)) return fn(input, ...rest);
      const traced = traceable((i: I) => fn(i, ...rest), { name, run_type: "llm", client, tracingEnabled: true });
      return (traced as unknown as (i: I) => Promise<R>)(input);
    };
  }

  return {
    client,
    project,
    span: (name, run) => traceable(run, { name, run_type: "chain", project_name: project, client, tracingEnabled: true })(),
    generation: (generation) => ({
      ...generation,
      runCoach: call("runCoach", generation.runCoach),
      writeStory: call("writeStory", generation.writeStory),
      writeSummary: call("writeSummary", generation.writeSummary),
    }),
    judge: (judge) => ({
      judgeStory: call("judgeStory", judge.judgeStory),
      judgeSummary: call("judgeSummary", judge.judgeSummary),
    }),
    telemetry: (telemetry) => ({
      ...telemetry,
      record: (modelCall: ModelCall) => {
        telemetry.record(modelCall);
        const run = getCurrentRunTree(true);
        if (run && run.run_type === "llm") run.extra = { ...run.extra, metadata: { ...run.extra?.metadata, ...callMetadata(modelCall) } };
      },
    }),
    flush: () => client.awaitPendingTraceBatches(),
  };
}

/** The tracer `pnpm eval` uses: LangSmith's own client, which reads LANGSMITH_API_KEY (and LANGSMITH_ENDPOINT) from the environment. */
export const langsmithTracer = (project: string): EvalTracer => evalTracer(new Client(), project);
