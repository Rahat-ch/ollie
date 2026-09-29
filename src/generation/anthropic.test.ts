/**
 * The request the Anthropic adapter and the Judge build, read off the wire
 * from a stubbed `fetch`: no model is called. Every call names Sonnet 5.5,
 * sends the server-side refusal fallback on the beta endpoint, and keeps its
 * structured output; the Coach runs at effort high. The answers are the
 * fake's own outputs, so the round trip through the SDK's parser is real.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { DIAGNOSTIC_PLAN, newProfile, runSession, scripted, type LearnerNotes } from "@/loop";
import { coachInput } from "@/coach";
import { anthropicGeneration, COACH_MODEL, STORY_MODEL, SUMMARY_MODEL } from "@/generation/anthropic";
import { CLAUDE_MODEL, REFUSAL_FALLBACK_BETA } from "@/generation/claude";
import { fakeGeneration } from "@/generation/fake";
import { callDollars, createRecorder, MODEL_PRICES, type ApiUsage } from "@/generation/telemetry";
import type { StoryInput } from "@/generation/types";
import { anthropicJudge, JUDGE_MODEL } from "@/evals/judge-anthropic";
import { summaryInput } from "@/summary/summary";

const emptyNotes: LearnerNotes = { hypotheses: [], strengths: [] };
const diagnostic = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-f", scripted("ffhrfffhf"));
const coach = coachInput(diagnostic, emptyNotes);
const summary = summaryInput(diagnostic, emptyNotes, []);
const story: StoryInput = {
  skill: "result-unknown",
  structure: "add-to",
  equation: { left: 8, op: "+", right: 5, result: 13, unknown: "result" },
  answer: 13,
  theme: "puppies",
  nickname: "Sam",
};

type Sent = { readonly url: string; readonly headers: Headers; readonly body: Record<string, unknown> };

const usage = (over: Partial<ApiUsage> = {}): ApiUsage => ({
  input_tokens: 1_000,
  output_tokens: 500,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
  iterations: null,
  ...over,
});

/** A `fetch` that keeps every request and answers each with `answer` as the model's text. */
function stubFetch(answer: unknown, over: { readonly model?: string; readonly usage?: ApiUsage } = {}) {
  const sent: Sent[] = [];
  const fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    sent.push({
      url: String(input),
      headers: new Headers(init?.headers),
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    });
    const message = {
      id: "msg_test",
      type: "message",
      role: "assistant",
      model: over.model ?? CLAUDE_MODEL,
      content: [{ type: "text", text: JSON.stringify(answer) }],
      stop_reason: "end_turn",
      stop_sequence: null,
      stop_details: null,
      usage: over.usage ?? usage(),
    };
    return new Response(JSON.stringify(message), { status: 200, headers: { "content-type": "application/json" } });
  };
  return { fetch: fetch as typeof globalThis.fetch, sent };
}

/** What every call must carry, whichever operation made it. */
function expectSonnetWithFallback(request: Sent): void {
  expect(request.url).toContain("/v1/messages?beta=true");
  expect(request.body.model).toBe("claude-sonnet-5-5");
  expect(request.body.fallbacks).toBe("default");
  expect(request.headers.get("anthropic-beta")?.split(",")).toContain("server-side-fallback-2026-07-01");
  // The array form's header would reject `fallbacks: "default"`.
  expect(request.headers.get("anthropic-beta")).not.toContain("server-side-fallback-2026-06-01");
  // Sonnet 5.5 rejects a disabled `thinking` and a forced tool choice with a 400; the adapter sends neither.
  expect(request.body).not.toHaveProperty("thinking");
  expect(request.body).not.toHaveProperty("tool_choice");
  expect(request.body).not.toHaveProperty("betas");
  const outputConfig = request.body.output_config as { format?: { type?: string } };
  expect(outputConfig.format?.type).toBe("json_schema");
}

describe("the model every call names", () => {
  it("is Sonnet 5.5 for the Coach, the Parent Summary, the Story writer and the Judge; no Opus model is called", () => {
    expect(CLAUDE_MODEL).toBe("claude-sonnet-5-5");
    expect([COACH_MODEL, SUMMARY_MODEL, STORY_MODEL, JUDGE_MODEL]).toEqual(Array(4).fill("claude-sonnet-5-5"));
    expect(REFUSAL_FALLBACK_BETA).toBe("server-side-fallback-2026-07-01");
  });
});

describe("the request the adapter builds", () => {
  it("runs the Coach on Sonnet 5.5 at effort high with the refusal fallback, and parses its structured output", async () => {
    const answer = await fakeGeneration().runCoach(coach);
    const { fetch, sent } = stubFetch(answer);
    const output = await anthropicGeneration({ apiKey: "test", fetch }).runCoach(coach);

    expect(sent).toHaveLength(1);
    expectSonnetWithFallback(sent[0]);
    expect((sent[0].body.output_config as { effort: string }).effort).toBe("high");
    expect(output).toEqual(answer);
  });

  it("writes the Parent Summary on Sonnet 5.5 with the refusal fallback, and parses its structured output", async () => {
    const answer = await fakeGeneration().writeSummary(summary);
    const { fetch, sent } = stubFetch(answer);
    const output = await anthropicGeneration({ apiKey: "test", fetch }).writeSummary(summary);

    expect(sent).toHaveLength(1);
    expectSonnetWithFallback(sent[0]);
    expect(output).toEqual(answer);
  });

  it("writes a Story on Sonnet 5.5 with the refusal fallback", async () => {
    const { fetch, sent } = stubFetch({ text: "Sam has 8 puppies. 5 more come to play." });
    const output = await anthropicGeneration({ apiKey: "test", fetch }).writeStory(story);

    expect(sent).toHaveLength(1);
    expectSonnetWithFallback(sent[0]);
    expect(output.text).toBe("Sam has 8 puppies. 5 more come to play.");
  });

  it("judges on Sonnet 5.5 with the refusal fallback", async () => {
    const { fetch, sent } = stubFetch({ pass: true, reason: "Reads well." });
    const judgement = await anthropicJudge({ apiKey: "test", fetch }).judgeStory({ input: story, text: "Sam has 8 puppies. 5 more come to play." });

    expect(sent).toHaveLength(1);
    expectSonnetWithFallback(sent[0]);
    expect(judgement).toEqual({ pass: true, reason: "Reads well." });
  });

  it("still rejects an output the whole fallback chain refused", async () => {
    const { fetch: answering } = stubFetch({});
    const refused: typeof globalThis.fetch = async (input, init) => {
      const response = (await (await answering(input, init)).json()) as Record<string, unknown>;
      return new Response(JSON.stringify({ ...response, content: [], stop_reason: "refusal" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    await expect(anthropicGeneration({ apiKey: "test", fetch: refused }).runCoach(coach)).rejects.toThrow(/refusal/);
  });
});

describe("what the telemetry records for a call", () => {
  it("records a call Sonnet 5.5 served at Sonnet 5.5's rate", async () => {
    const recorder = createRecorder();
    const { fetch } = stubFetch({ text: "Sam has 8 puppies. 5 more come to play." }, { usage: usage({ input_tokens: 100_000, output_tokens: 20_000 }) });
    await anthropicGeneration({ apiKey: "test", fetch, telemetry: recorder }).writeStory(story);

    const [call] = recorder.calls();
    expect(call).toMatchObject({ operation: "story", model: "claude-sonnet-5-5", inputTokens: 100_000, outputTokens: 20_000 });
    expect(call.declined).toBeUndefined();
    // 100,000 in at $2/M is $0.20; 20,000 out at $10/M is $0.20.
    expect(callDollars(call)).toBe(0.4);
  });

  it("records a call the refusal fallback served as the fallback model, with the declined attempt priced at Sonnet 5.5", async () => {
    expect(MODEL_PRICES["claude-sonnet-5"]).toBeDefined();
    const recorder = createRecorder();
    const rescued = usage({
      input_tokens: 100_000,
      output_tokens: 30_000,
      iterations: [
        { type: "message", model: "claude-sonnet-5-5", input_tokens: 100_000, output_tokens: 1_000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
        { type: "fallback_message", model: "claude-sonnet-5", input_tokens: 100_000, output_tokens: 30_000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
      ],
    });
    const answer = await fakeGeneration().runCoach(coach);
    const { fetch } = stubFetch(answer, { model: "claude-sonnet-5", usage: rescued });
    await anthropicGeneration({ apiKey: "test", fetch, telemetry: recorder }).runCoach(coach);

    const [call] = recorder.calls();
    expect(call).toMatchObject({ operation: "coach", model: "claude-sonnet-5", inputTokens: 100_000, outputTokens: 30_000 });
    expect(call.declined).toEqual([
      { model: "claude-sonnet-5-5", inputTokens: 100_000, outputTokens: 1_000, cacheReadTokens: 0, cacheWriteTokens: 0 },
    ]);
    // Sonnet 5 serving: $0.20 in + $0.30 out. Sonnet 5.5 declining: $0.20 in + $0.01 out.
    expect(callDollars(call)).toBe(0.71);
  });
});

describe("the SDK log the latency probe reads", () => {
  afterEach(() => vi.restoreAllMocks());

  it("is left as it was when no logger is passed: nothing logged, and the same request sent", async () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const answer = await fakeGeneration().runCoach(coach);
    const plain = stubFetch(answer);
    const logged = stubFetch(answer);
    await anthropicGeneration({ apiKey: "test", fetch: plain.fetch }).runCoach(coach);
    expect(debug).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();

    const lines: string[] = [];
    const logger = { error: () => {}, warn: () => {}, info: () => {}, debug: (message: string) => void lines.push(message) };
    await anthropicGeneration({ apiKey: "test", fetch: logged.fetch, logger, logLevel: "debug" }).runCoach(coach);
    expect(lines.some((line) => line.endsWith("sending request"))).toBe(true);
    expect(lines.some((line) => line.endsWith("response start"))).toBe(true);
    expect(logged.sent[0].url).toBe(plain.sent[0].url);
    expect(logged.sent[0].body).toEqual(plain.sent[0].body);
  });
});
