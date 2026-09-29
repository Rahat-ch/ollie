/**
 * Latency probe for the Coach (Pre-registration 1, "findings outside the
 * pre-registered lines"). Runs ONE Simulated Learner for 20 Sessions on the
 * real Coach, one call at a time, and logs every HTTP attempt the Anthropic
 * SDK makes: status, request id, retry-after, rate-limit headers and time.
 * The eval runs six Learners at once; if the slow rounds seen there come
 * from SDK retries or from concurrency, this run (serial, instrumented)
 * says which. About $1 on Sonnet 5.5.
 *
 *   pnpm exec tsx scripts/latency-probe.ts [learner-id]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { anthropicGeneration } from "@/generation/anthropic";
import { createRecorder, callDollars } from "@/generation/telemetry";
import { coachPlanner, runLearner } from "@/evals/run";
import { SIMULATED_LEARNERS } from "@/evals/learners";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

type Attempt = { at: string; ms: number; status: number; requestId: string | null; retryAfter: string | null; limits: Record<string, string> };
const attempts: Attempt[] = [];

const loggingFetch: typeof fetch = async (input, init) => {
  const started = Date.now();
  const response = await fetch(input, init);
  const limits: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    if (key.startsWith("anthropic-ratelimit")) limits[key] = value;
  });
  attempts.push({
    at: new Date(started).toISOString(),
    ms: Date.now() - started, // time to headers; the body is streamed after
    status: response.status,
    requestId: response.headers.get("request-id"),
    retryAfter: response.headers.get("retry-after"),
    limits,
  });
  return response;
};

const id = process.argv[2] ?? "crossing-ten-weakness";
const learner = SIMULATED_LEARNERS.find((l) => l.id === id);
if (!learner) throw new Error(`no Learner ${id}`);

async function main(): Promise<void> {
  const telemetry = createRecorder();
  const generation = anthropicGeneration({ apiKey: apiKey as string, telemetry, fetch: loggingFetch });
  await runLearner(learner as NonNullable<typeof learner>, coachPlanner(generation), 20);

  const calls = telemetry.calls().filter((c) => c.operation === "coach");
  const ms = calls.map((c) => c.ms).sort((a, b) => a - b);
  const q = (p: number) => ms[Math.min(ms.length - 1, Math.ceil(p * ms.length) - 1)];
  const dollars = calls.reduce((sum, c) => sum + (callDollars(c) ?? 0), 0);
  const summary = {
    learner: id,
    coachCalls: calls.length,
    httpAttempts: attempts.length,
    nonOkAttempts: attempts.filter((a) => a.status !== 200),
    p50Seconds: q(0.5) / 1000,
    p95Seconds: q(0.95) / 1000,
    maxSeconds: ms[ms.length - 1] / 1000,
    over60s: ms.filter((m) => m > 60000).length,
    estimatedDollars: Number(dollars.toFixed(4)),
  };
  console.log(JSON.stringify(summary, null, 2));
  writeFileSync(
    `docs/evals/latency-probe-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    JSON.stringify({ summary, calls, attempts }, null, 2),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
