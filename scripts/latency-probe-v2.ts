/**
 * Latency probe, second version. The first (`scripts/latency-probe.ts`,
 * kept as the record of its run) logged an HTTP attempt only once `fetch`
 * resolved, so in its call 14 the 70.5 s before the one logged attempt were
 * blank. This one runs the same Simulated Learners through the same real
 * Coach, one call at a time, and records each call's whole timeline
 * (`src/evals/latency-trace.ts`): every fetch attempt, a thrown one
 * included, with its error and cause; its headers and the end of its body;
 * the SDK's own log at debug level, which names every retry and timeout;
 * and the socket events Node's fetch publishes (`src/evals/latency-wire.ts`):
 * whether each request went out on a new or a kept-alive socket, how long
 * that socket had been idle, and DNS, TCP and TLS times for a new one. A
 * call over the flag line (60 s) is printed with where its time went.
 *
 *   pnpm exec tsx scripts/latency-probe-v2.ts [--learners a,b] [--sessions 20] [--flag-ms 60000]
 *   pnpm exec tsx scripts/latency-probe-v2.ts --dry-run [--fault reset:2000 --fault-call 3]
 *
 * About $0.93 per Learner for 20 Sessions on Sonnet 5.5 (the first probe's
 * cost). `--dry-run` calls no model: it points the real SDK at a local
 * server answering like the Messages API with the Generation fake's output
 * (`src/evals/messages-server.ts`), and `--fault` makes one call's first
 * request misbehave there (`hang`, `reset:<ms>`, `close:<ms>`, `slow:<ms>`,
 * `status:<code>:<ms>`). A live run writes
 * `docs/evals/latency-probe-v2-<time>.json`; a dry run writes to the
 * system's temporary directory.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { VERSION as SDK_VERSION } from "@anthropic-ai/sdk/version";
import { anthropicGeneration } from "@/generation/anthropic";
import { fakeGeneration } from "@/generation/fake";
import { callDollars, createRecorder } from "@/generation/telemetry";
import type { CoachInput, Generation } from "@/generation/types";
import { coachPlanner, runLearner } from "@/evals/run";
import { SIMULATED_LEARNERS } from "@/evals/learners";
import {
  assembleCall,
  createTrace,
  diagnoseCall,
  explainCall,
  firstProbeView,
  formatCallTable,
  sdkLogger,
  tracingFetch,
  type CallTimeline,
  type CallWindow,
} from "@/evals/latency-trace";
import { recordWire } from "@/evals/latency-wire";
import { parseBehaviour, startMessagesServer, type Behaviour, type MessagesServer } from "@/evals/messages-server";

const { values } = parseArgs({
  options: {
    learners: { type: "string", default: "crossing-ten-weakness" },
    sessions: { type: "string", default: "20" },
    "flag-ms": { type: "string", default: "60000" },
    "dry-run": { type: "boolean", default: false },
    fault: { type: "string" },
    "fault-call": { type: "string", default: "1" },
  },
});
const dryRun = values["dry-run"] ?? false;
const sessions = Number(values.sessions);
const flagMs = Number(values["flag-ms"]);
const faultCall = Number(values["fault-call"]);
const fault: Behaviour | null = values.fault ? parseBehaviour(values.fault) : null;
if (fault && !dryRun) throw new Error("--fault is for --dry-run only");
if (!Number.isInteger(sessions) || sessions < 1) throw new Error("--sessions must be a whole number");
const learners = (values.learners ?? "").split(",").map((id) => {
  const learner = SIMULATED_LEARNERS.find((l) => l.id === id.trim());
  if (!learner) throw new Error(`no Learner ${id}; one of ${SIMULATED_LEARNERS.map((l) => l.id).join(", ")}`);
  return learner;
});

if (!dryRun && existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const seconds = (ms: number): string => `${(ms / 1000).toFixed(1)}s`;
const nearestRank = (sorted: readonly number[], p: number): number => sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];

async function main(): Promise<void> {
  const trace = createTrace();
  const stopWire = recordWire(trace);
  const telemetry = createRecorder();
  const windows: CallWindow[] = [];
  let learnerId = "";
  let currentInput: CoachInput | null = null;
  let requestsThisCall = 0;

  let server: MessagesServer | null = null;
  let apiKey = process.env.ANTHROPIC_API_KEY;
  if (dryRun) {
    const fake = fakeGeneration();
    server = await startMessagesServer({
      answer: () => (currentInput ? fake.runCoach(currentInput) : null),
      behaviour: () => {
        requestsThisCall += 1;
        return fault && windows.length + 1 === faultCall && requestsThisCall === 1 ? fault : { kind: "answer" };
      },
    });
    process.env.ANTHROPIC_BASE_URL = server.url;
    apiKey = "dry-run";
  }
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set (in the environment or .env.local)");
  const baseURL = process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com";

  const generation = anthropicGeneration({ apiKey, telemetry, fetch: tracingFetch(trace), logger: sdkLogger(trace), logLevel: "debug" });
  const calls: CallTimeline[] = [];
  const timed: Generation = {
    ...generation,
    runCoach: async (input, options) => {
      currentInput = input;
      requestsThisCall = 0;
      const before = telemetry.calls().length;
      const startedAt = new Date().toISOString();
      const start = trace.now();
      const finish = (outcome: CallWindow["outcome"], error?: unknown) => {
        const recorded = telemetry.calls().slice(before).find((c) => c.operation === "coach");
        const window: CallWindow = {
          learner: learnerId,
          index: windows.length + 1,
          startedAt,
          start,
          end: trace.now(),
          outcome,
          ...(error === undefined ? {} : { error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) }),
          outputTokens: recorded?.outputTokens ?? null,
        };
        windows.push(window);
        const call = assembleCall(window, trace.events);
        calls.push(call);
        const attempts = call.attempts.map((a) => (a.outcome === "threw" ? `threw ${a.error?.causeCode ?? a.error?.name}` : String(a.status))).join(" > ");
        console.log(`call ${call.index} (${learnerId}): ${seconds(call.totalMs)}, gap ${seconds(call.prefetchGapMs)}, ${attempts || "no fetch"}${call.totalMs > flagMs ? "  << over the flag line" : ""}`);
      };
      try {
        const output = await generation.runCoach(input, options);
        finish("ok");
        return output;
      } catch (error) {
        finish("error", error);
        throw error;
      }
    },
  };

  const file = dryRun
    ? join(tmpdir(), `latency-probe-v2-dry-run-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
    : `docs/evals/latency-probe-v2-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  console.log(`${dryRun ? "Dry run against a local server" : "Live run"}: ${learners.map((l) => l.id).join(", ")}, ${sessions} Sessions each, serial, to ${baseURL}`);

  let failure: unknown = null;
  try {
    for (const learner of learners) {
      learnerId = learner.id;
      await runLearner(learner, coachPlanner(timed), sessions);
    }
  } catch (error) {
    failure = error;
  } finally {
    stopWire();
    await server?.close();
  }

  const ms = calls.map((c) => c.totalMs).sort((a, b) => a - b);
  const coachCalls = telemetry.calls().filter((c) => c.operation === "coach");
  const flagged = calls.filter((c) => c.totalMs > flagMs);
  const summary = {
    dryRun,
    fault: values.fault ?? null,
    learners: learners.map((l) => l.id),
    sessions,
    coachCalls: calls.length,
    fetchAttempts: calls.reduce((n, c) => n + c.attempts.length, 0),
    thrownAttempts: calls.reduce((n, c) => n + c.attempts.filter((a) => a.outcome === "threw").length, 0),
    nonOkResponses: calls.reduce((n, c) => n + c.attempts.filter((a) => a.status !== null && a.status !== 200).length, 0),
    sdkRetries: calls.reduce((n, c) => n + c.retries.filter((r) => /retrying/.test(r.message)).length, 0),
    requestsOnReusedSockets: calls.reduce((n, c) => n + c.attempts.filter((a) => a.socket?.reused).length, 0),
    newSockets: calls.reduce((n, c) => n + c.attempts.filter((a) => a.socket && !a.socket.reused).length, 0),
    maxPrefetchGapMs: Math.max(0, ...calls.map((c) => c.prefetchGapMs)),
    p50Seconds: ms.length ? nearestRank(ms, 0.5) / 1000 : null,
    p95Seconds: ms.length ? nearestRank(ms, 0.95) / 1000 : null,
    maxSeconds: ms.length ? ms[ms.length - 1] / 1000 : null,
    flagMs,
    overFlag: flagged.length,
    estimatedDollars: dryRun ? 0 : Number(coachCalls.reduce((sum, c) => sum + (callDollars(c) ?? 0), 0).toFixed(4)),
    failure: failure === null ? null : String(failure),
  };
  const environment = {
    node: process.versions.node,
    undici: process.versions.undici,
    sdk: SDK_VERSION,
    platform: `${process.platform} ${process.arch}`,
    baseURL,
    sdkDefaults: { maxRetries: 2, timeoutMs: 600_000, backoff: "0.5 s doubling to 8 s, less up to 25% jitter" },
    undiciDefaults: { connectTimeoutMs: 10_000, headersTimeoutMs: 300_000, bodyTimeoutMs: 300_000, keepAliveTimeoutMs: 4_000 },
    // Read off a live fetch socket on macOS with Node 24.13: undici's setKeepAlive(true, 60 s), libuv's interval and count.
    tcpKeepAlive: { idleMs: 60_000, probeIntervalMs: 1_000, probes: 10 },
  };

  console.log(`\n${formatCallTable(calls)}\n`);
  for (const call of flagged) {
    const v1 = firstProbeView(call, flagMs);
    console.log(`Call ${call.index} (${call.learner}) took ${seconds(call.totalMs)}: ${explainCall(call)}`);
    console.log(`  The first probe would have logged ${v1.loggedAttempts} attempt(s), the first ${seconds(v1.gapMs)} after the start${v1.matchesSignature ? ": its signature (a long gap, then one clean 200)" : ""}.`);
    for (const line of call.retries) console.log(`  SDK at ${seconds(line.ms)}: ${line.message}`);
    for (const note of diagnoseCall(call)) console.log(`  ${note}`);
  }
  console.log(JSON.stringify(summary, null, 2));

  const runStart = trace.events[0]?.t ?? 0;
  writeFileSync(
    file,
    JSON.stringify(
      {
        summary,
        environment,
        calls: calls.map((call) => ({ ...call, explanation: explainCall(call), diagnosis: diagnoseCall(call), firstProbe: firstProbeView(call, flagMs) })),
        telemetry: coachCalls,
        events: trace.events.map((e) => ({ ...e, ms: Math.round(e.t - runStart) })),
        ...(server ? { serverEvents: server.events } : {}),
      },
      null,
      2,
    ),
  );
  console.log(`Wrote ${file}`);
  if (failure !== null) throw failure;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
