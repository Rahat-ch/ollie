/**
 * Reproduction harness for the slow Coach calls: which failure at the far
 * end, met by the SDK's default settings (2 retries, a 10-minute timeout)
 * and Node's fetch defaults, reads in the first probe as its call 14 did:
 * a long silence and then one clean 200. Each scenario runs one real Coach
 * call (`anthropicGeneration`, the same request as the probe) against the
 * local Messages server (`src/evals/messages-server.ts`), traced exactly as
 * the second probe traces a live call, and prints what that probe records
 * and what the first probe would have logged. No model is called.
 *
 *   pnpm exec tsx scripts/latency-repro.ts [scenario ...]
 *
 * With no scenario named, all run in turn; `b-hang` and `c3-blackhole-reused`
 * each wait out undici's 300 s headers timeout, so the whole set takes about
 * 13 minutes. Results go to `docs/evals/latency-repro-<time>.json`.
 */
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { setTimeout as sleep } from "node:timers/promises";
import { DIAGNOSTIC_PLAN, newProfile, runSession, scripted } from "@/loop";
import { coachInput } from "@/coach";
import { anthropicGeneration } from "@/generation/anthropic";
import { fakeGeneration } from "@/generation/fake";
import { assembleCall, createTrace, diagnoseCall, explainCall, firstProbeView, formatCallTable, sdkLogger, tracingFetch, type CallTimeline } from "@/evals/latency-trace";
import { recordWire } from "@/evals/latency-wire";
import { parseBehaviour, startMessagesServer, type Behaviour, type RequestContext, type ServerEvent } from "@/evals/messages-server";

type Scenario = {
  readonly name: string;
  readonly says: string;
  /** One ordinary call first, so the measured call can find a kept-alive socket. */
  readonly warmUp?: { readonly pauseMs: number };
  readonly closeAfterAnswerMs?: number;
  /** What the server does with each request; `measured` is false during the warm-up. */
  readonly behaviour: (context: RequestContext, measured: { readonly first: boolean }) => Behaviour;
};

const answer: Behaviour = { kind: "answer" };
const firstOnly = (behaviour: Behaviour) => (_: RequestContext, measured: { readonly first: boolean }) => (measured.first ? behaviour : answer);

const SCENARIOS: readonly Scenario[] = [
  { name: "a-answer", says: "a normal answer", behaviour: () => answer },
  { name: "b-hang", says: "the server accepts the request and never answers", behaviour: firstOnly(parseBehaviour("hang")) },
  {
    name: "c1-close-idle",
    says: "the server closes a kept-alive socket (FIN) 500 ms after answering; the next call comes 2 s later",
    warmUp: { pauseMs: 2_000 },
    closeAfterAnswerMs: 500,
    behaviour: () => answer,
  },
  {
    name: "c2-reset-reused",
    says: "the next request on a kept-alive socket is reset at once (RST): the client reused a socket the server had dropped",
    warmUp: { pauseMs: 500 },
    behaviour: ({ onSocket }) => (onSocket >= 2 ? parseBehaviour("reset:0") : answer),
  },
  {
    name: "c3-blackhole-reused",
    says: "the next request on a kept-alive socket is swallowed: the socket stays open and nothing ever comes back (a silently dropped connection, as near as localhost gets)",
    warmUp: { pauseMs: 500 },
    behaviour: ({ onSocket }) => (onSocket >= 2 ? parseBehaviour("hang") : answer),
  },
  { name: "d-reset-mid", says: "the connection is reset (RST) 1 s into the request", behaviour: firstOnly(parseBehaviour("reset:1000")) },
  { name: "d70-reset", says: "the connection is reset (RST) 70 s into the request", behaviour: firstOnly(parseBehaviour("reset:70000")) },
  { name: "d70-close", says: "the connection is closed (FIN) 70 s into the request", behaviour: firstOnly(parseBehaviour("close:70000")) },
  { name: "e-slow-70s", says: "the first byte comes 70 s after the request", behaviour: firstOnly(parseBehaviour("slow:70000")) },
];

const coach = coachInput(runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-f", scripted("ffhrfffhf")), { hypotheses: [], strengths: [] });
const seconds = (ms: number): string => `${(ms / 1000).toFixed(1)}s`;

type Result = {
  readonly scenario: string;
  readonly says: string;
  readonly outcome: string;
  readonly call: CallTimeline;
  readonly explanation: string;
  readonly firstProbe: ReturnType<typeof firstProbeView>;
  readonly serverEvents: readonly ServerEvent[];
};

/** One traced Coach call against wherever `ANTHROPIC_BASE_URL` points, after an optional warm-up call. */
async function tracedCall(name: string, warmUp?: Scenario["warmUp"], onMeasuring?: () => void): Promise<{ readonly outcome: string; readonly call: CallTimeline; readonly start: number }> {
  const trace = createTrace();
  const stopWire = recordWire(trace);
  const generation = anthropicGeneration({ apiKey: "local", fetch: tracingFetch(trace), logger: sdkLogger(trace), logLevel: "debug" });
  try {
    if (warmUp) {
      await generation.runCoach(coach);
      await sleep(warmUp.pauseMs);
    }
    onMeasuring?.();
    const startedAt = new Date().toISOString();
    const start = trace.now();
    let outcome = "ok";
    try {
      await generation.runCoach(coach, { signal: AbortSignal.timeout(20 * 60_000) });
    } catch (error) {
      outcome = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    }
    const window = { learner: name, index: 1, startedAt, start, end: trace.now(), outcome: outcome === "ok" ? ("ok" as const) : ("error" as const), outputTokens: null };
    return { outcome, call: assembleCall(outcome === "ok" ? window : { ...window, error: outcome }, trace.events), start };
  } finally {
    stopWire();
  }
}

async function run(scenario: Scenario): Promise<Result> {
  const output = await fakeGeneration().runCoach(coach);
  let measuring = false;
  let measuredRequests = 0;
  const server = await startMessagesServer({
    answer: () => output,
    closeAfterAnswerMs: scenario.closeAfterAnswerMs,
    behaviour: (context) => {
      if (!measuring) return answer;
      measuredRequests += 1;
      return scenario.behaviour(context, { first: measuredRequests === 1 });
    },
  });
  process.env.ANTHROPIC_BASE_URL = server.url;
  try {
    const { outcome, call, start } = await tracedCall(scenario.name, scenario.warmUp, () => void (measuring = true));
    return { scenario: scenario.name, says: scenario.says, outcome, call, explanation: explainCall(call), firstProbe: firstProbeView(call), serverEvents: server.events.map((e) => ({ ...e, t: Math.round(e.t - start) })) };
  } finally {
    await server.close();
  }
}

function print(result: Omit<Result, "serverEvents">): void {
  console.log(formatCallTable([result.call]));
  console.log(`outcome: ${result.outcome}`);
  console.log(`where the time went: ${result.explanation || "nowhere worth naming"}`);
  for (const line of result.call.retries) console.log(`SDK at ${seconds(line.ms)}: ${line.message}`);
  for (const note of diagnoseCall(result.call)) console.log(note);
  const v1 = result.firstProbe;
  console.log(`the first probe would have logged ${v1.loggedAttempts} attempt(s), the first ${seconds(v1.gapMs)} after the start: ${v1.matchesSignature ? "MATCHES" : "does not match"} its call-14 signature`);
}

const environment = () => ({ node: process.versions.node, undici: process.versions.undici, platform: `${process.platform} ${process.arch}` });

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { serve: { type: "string" }, port: { type: "string", default: "8080" }, call: { type: "string" }, out: { type: "string" } },
  });

  // The container run (scripts/latency-keepalive-repro.sh): a server that behaves one way for every request...
  if (values.serve) {
    const behaviour = parseBehaviour(values.serve);
    const output = await fakeGeneration().runCoach(coach);
    const server = await startMessagesServer({ answer: () => output, behaviour: () => behaviour, host: "0.0.0.0", port: Number(values.port) });
    console.log(`serving "${values.serve}" at ${server.url}`);
    return;
  }
  // ...and one traced call against it, its result written where the host can read it.
  if (values.call) {
    const { outcome, call } = await tracedCall(values.call);
    const result = { scenario: values.call, says: "one call against ANTHROPIC_BASE_URL", outcome, call, explanation: explainCall(call), firstProbe: firstProbeView(call) };
    print(result);
    if (values.out) writeFileSync(values.out, JSON.stringify({ environment: environment(), results: [result] }, null, 2));
    return;
  }

  const unknown = positionals.filter((n) => !SCENARIOS.some((s) => s.name === n));
  if (unknown.length > 0) throw new Error(`unknown scenario ${unknown.join(", ")}; one of ${SCENARIOS.map((s) => s.name).join(", ")}`);
  const chosen = positionals.length > 0 ? SCENARIOS.filter((s) => positionals.includes(s.name)) : SCENARIOS;

  const results: Result[] = [];
  for (const scenario of chosen) {
    console.log(`\n== ${scenario.name}: ${scenario.says}`);
    const result = await run(scenario);
    results.push(result);
    print(result);
  }

  const file = `docs/evals/latency-repro-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify({ environment: environment(), results }, null, 2));
  console.log(`\nWrote ${file}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
