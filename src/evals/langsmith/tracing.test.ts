import { describe, expect, it } from "vitest";
import { fakeGeneration } from "@/generation";
import { createRecorder } from "@/generation/telemetry";
import { runEvals, type EvalOptions } from "../evals";
import { recordedFakeJudge } from "../judge";
import { storySample } from "../stories";
import { FakeLangSmith } from "./fake-client";
import { evalTracer } from "./tracing";
import { tracingDecision, DEFAULT_PROJECT } from "./tracing-config";

describe("whether pnpm eval traces", () => {
  it("does not, and says nothing, when LANGSMITH_TRACING is not set: the run is exactly as before", () => {
    expect(tracingDecision({})).toEqual({ on: false, reason: null });
    expect(tracingDecision({ LANGSMITH_API_KEY: "key" })).toEqual({ on: false, reason: null });
    expect(tracingDecision({ LANGSMITH_TRACING: "false", LANGSMITH_API_KEY: "key" })).toEqual({ on: false, reason: null });
  });

  it("does not, and says why, when tracing is asked for without a key", () => {
    const decision = tracingDecision({ LANGSMITH_TRACING: "true" });
    expect(decision.on).toBe(false);
    expect(decision).toMatchObject({ reason: expect.stringMatching(/LANGSMITH_API_KEY/) });
  });

  it("does when both are set, into the project named, or its own", () => {
    expect(tracingDecision({ LANGSMITH_TRACING: "true", LANGSMITH_API_KEY: "key" })).toEqual({ on: true, project: DEFAULT_PROJECT });
    expect(tracingDecision({ LANGSMITH_TRACING: "true", LANGSMITH_API_KEY: "key", LANGSMITH_PROJECT: "mine" })).toEqual({ on: true, project: "mine" });
  });
});

/** A fake Eval Run of a few Sessions, traced into `client` when a tracer is given. */
async function fakeRun(client?: FakeLangSmith) {
  const tracer = client ? evalTracer(client, "ollie-eval-test") : undefined;
  const recorder = createRecorder();
  const telemetry = tracer ? tracer.telemetry(recorder) : recorder;
  const generation = fakeGeneration({}, telemetry);
  const judge = recordedFakeJudge(telemetry);
  const coach = { generation: tracer ? tracer.generation(generation) : generation, name: "fake" };
  const tracedJudge = tracer ? tracer.judge(judge) : judge;
  const options: EvalOptions = {
    sessions: 3,
    coach,
    recorder,
    stories: { generation: coach.generation, name: "fake", judge: tracedJudge, judgeName: "fake" },
    summaries: { generation: coach.generation, name: "fake", judge: tracedJudge, judgeName: "fake" },
    span: tracer?.span,
  };
  const results = await runEvals(options);
  await tracer?.flush();
  return { results, recorder };
}

describe("a traced Eval Run", () => {
  it("scores exactly what an untraced one scores", async () => {
    const plain = await fakeRun();
    const traced = await fakeRun(new FakeLangSmith());
    expect(JSON.stringify(traced.results)).toBe(JSON.stringify(plain.results));
  });

  it("is eight traces: one per Simulated Learner's Coach run, one for the Stories, one for the Summaries", async () => {
    const client = new FakeLangSmith();
    await fakeRun(client);
    expect(client.storedRequests).toEqual([]);
    expect(client.rootRuns().map((run) => run.name).sort()).toEqual(
      [
        "coach: average",
        "coach: change-unknown-weakness",
        "coach: crossing-ten-weakness",
        "coach: fast-fatigue",
        "coach: strong",
        "coach: weak",
        "stories",
        "summaries",
      ].sort(),
    );
    expect(client.rootRuns().every((run) => run.session_name === "ollie-eval-test")).toBe(true);
  });

  it("nests every model call under its trace, with the model and tokens the recorder was given", async () => {
    const client = new FakeLangSmith();
    const { recorder } = await fakeRun(client);
    const calls = client.storedRuns.filter((run) => run.parent_run_id);
    expect(calls).toHaveLength(recorder.calls().length);
    expect(new Set(calls.map((run) => run.name))).toEqual(new Set(["runCoach", "writeStory", "writeSummary", "judgeStory", "judgeSummary"]));
    for (const call of calls) {
      expect(call.run_type).toBe("llm");
      const metadata = (call.extra as { metadata: Record<string, unknown> }).metadata;
      expect(metadata).toMatchObject({ ls_model_name: "fake", usage_metadata: { input_tokens: 0, output_tokens: 0, total_tokens: 0 } });
    }
    const coach = client.rootRuns().find((run) => run.name === "coach: strong")!;
    expect(calls.filter((run) => run.parent_run_id === coach.id && run.name === "runCoach")).toHaveLength(3);
  });

  it("traces no call made outside a trace, so a stray call cannot open a trace of its own", async () => {
    const client = new FakeLangSmith();
    const tracer = evalTracer(client, "ollie-eval-test");
    const generation = tracer.generation(fakeGeneration());
    await generation.writeStory(storySample()[0]);
    await tracer.flush();
    expect(client.storedRuns).toEqual([]);
  });
});
