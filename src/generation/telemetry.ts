/**
 * What a run of the models cost. Every call behind the Generation seam and
 * every Judge call is reported to a recorder, which the caller passes to the
 * adapter: never a global, so the app's routes record nothing and only the
 * eval CLI installs one for its run. The fake reports the same call shape
 * with no tokens and no milliseconds, so a fake run exercises the path.
 * Each call is kept with its own wall time and tokens, not only summed, so
 * a report can say how slow the slow calls were (p50 and p95 per operation).
 *
 * The dollars are an estimate from the published first-party rates below,
 * as they stood on the day, and never the invoice. A model with no rate
 * here is reported as null, never guessed.
 *
 * A call can be served by a model other than the one it named: every call
 * sends the server-side refusal fallback, so when Sonnet 5.5 declines, the
 * API runs the same request on its fallback model inside the same call. The
 * response's `usage.iterations` then lists each attempt with its own model
 * and tokens, and the call is recorded as the model that served it, with the
 * attempts that declined kept beside it and priced at their own model's rate.
 */

/** The four things a run pays for: the three Generation operations and the Judge. */
export type TelemetryOperation = "coach" | "summary" | "story" | "judge";

export const TELEMETRY_OPERATIONS: readonly TelemetryOperation[] = ["coach", "summary", "story", "judge"];

/** What one model's attempt at a call used. */
export type ModelAttempt = {
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly cacheWriteTokens: number;
};

/** One model call, as the adapter that made it saw it. */
export type ModelCall = ModelAttempt & {
  readonly operation: TelemetryOperation;
  /**
   * The model id that served the call: the one it named, or the refusal
   * fallback's model when that one declined. `fake` for the Generation fake.
   * The tokens beside it are that model's attempt.
   */
  readonly model: string;
  /** Wall time of the call itself, every attempt included. */
  readonly ms: number;
  /** The attempts that declined before the serving model ran; absent when the named model served it. */
  readonly declined?: readonly ModelAttempt[];
};

/** What an adapter is given: somewhere to report a call. */
export type Telemetry = { readonly record: (call: ModelCall) => void };

/** The recorder the CLI installs: a Telemetry that keeps what it was told. */
export type Recorder = Telemetry & { readonly calls: () => readonly ModelCall[] };

export function createRecorder(): Recorder {
  const calls: ModelCall[] = [];
  return {
    record: (call) => {
      calls.push(call);
    },
    calls: () => calls,
  };
}

/** Dollars per million tokens. */
export type ModelPrice = { readonly input: number; readonly output: number };

/**
 * The first-party rates, per million tokens: Opus 5, Sonnet 5 and Haiku 4.5 as
 * they stood on 2026-09-18, Sonnet 5.5 on 2026-09-28. Opus 5 stays for the
 * stored reports it ran; Sonnet 5 is where Sonnet 5.5's refusal fallback
 * sends a declined call. Anything not here costs an unknown amount.
 */
export const MODEL_PRICES: Readonly<Record<string, ModelPrice>> = {
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

/** A cached token read costs a tenth of the input rate. */
export const CACHE_READ_SHARE = 0.1;
/** Writing a token to the cache costs 1.25 times the input rate. */
export const CACHE_WRITE_SHARE = 1.25;

/** The model name a call with no model behind it records. */
export const FAKE_MODEL = "fake";

/** To the micro-dollar, so summing a run's calls does not print float noise. */
const dollars = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);

const attemptTokens = (attempt: ModelAttempt): number =>
  attempt.inputTokens + attempt.outputTokens + attempt.cacheReadTokens + attempt.cacheWriteTokens;

/**
 * Every attempt a call made, as calls of their own: the serving one first,
 * with the call's wall time, then each declined one with none, so a model's
 * share of a run can be added up without counting a wall time twice.
 */
export const callAttempts = (call: ModelCall): readonly ModelCall[] => {
  const { declined = [], ...served } = call;
  return [served, ...declined.map((attempt) => ({ ...attempt, operation: call.operation, ms: 0 }))];
};

/** Every token the call moved, a declined attempt's included. */
export const callTokens = (call: ModelCall): number => sum(callAttempts(call).map(attemptTokens));

/** One attempt at its own model's rate, or null when that model has no published rate. */
function attemptDollars(attempt: ModelAttempt): number | null {
  if (attemptTokens(attempt) === 0) return 0;
  const price = MODEL_PRICES[attempt.model];
  if (!price) return null;
  const perMillion =
    attempt.inputTokens * price.input +
    attempt.outputTokens * price.output +
    attempt.cacheReadTokens * price.input * CACHE_READ_SHARE +
    attempt.cacheWriteTokens * price.input * CACHE_WRITE_SHARE;
  return perMillion / 1_000_000;
}

/**
 * What one call is estimated to have cost, or null when a model it ran on
 * has no published rate: a price is never guessed from a name. A call with
 * no tokens at all cost nothing whatever the model was, which is how the
 * fake reports zero rather than unknown. A call the refusal fallback served
 * is its serving attempt at the fallback model's rate plus each declined
 * attempt at its own model's rate, as the API reported them. Whether a
 * decline before any output is billed depends on its refusal category, so
 * a declined attempt is counted in full: the estimate errs high, never low.
 */
export function callDollars(call: ModelCall): number | null {
  const each = callAttempts(call).map(attemptDollars);
  return each.some((value) => value === null) ? null : dollars(sum(each as number[]));
}

/** One group of calls added up: an operation, a model, or the whole run. */
export type CostTotals = {
  readonly calls: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly cacheWriteTokens: number;
  /** Every token the group moved, cached ones included. */
  readonly tokens: number;
  readonly ms: number;
  /** The estimate; null when any call in the group has no published rate. */
  readonly dollars: number | null;
  /** Every model id the group named, so no report hides which model ran. */
  readonly models: readonly string[];
};

/** The group's estimate: null as soon as one call in it cannot be priced. */
function totalDollars(calls: readonly ModelCall[]): number | null {
  const each = calls.map(callDollars);
  return each.some((value) => value === null) ? null : dollars(sum(each as number[]));
}

/** The group's totals; a declined attempt's tokens and model count toward the call that made it. */
export function costTotals(calls: readonly ModelCall[]): CostTotals {
  const attempts = calls.flatMap(callAttempts);
  return {
    calls: calls.length,
    inputTokens: sum(attempts.map((c) => c.inputTokens)),
    outputTokens: sum(attempts.map((c) => c.outputTokens)),
    cacheReadTokens: sum(attempts.map((c) => c.cacheReadTokens)),
    cacheWriteTokens: sum(attempts.map((c) => c.cacheWriteTokens)),
    tokens: sum(attempts.map(attemptTokens)),
    ms: sum(calls.map((c) => c.ms)),
    dollars: totalDollars(calls),
    models: [...new Set(attempts.map((c) => c.model))],
  };
}

/** What the Coach cost, per call and per Session: the number a run is planned from. */
export type CoachPerSession = {
  /** The Sessions the Coach planned for in this run. */
  readonly sessions: number;
  /** Coach calls, which is more than the Sessions when a Session needed the retry. */
  readonly coachCalls: number;
  readonly dollarsPerCoachCall: number | null;
  readonly dollarsPerSession: number | null;
};

/**
 * How long one operation's calls took, call by call rather than in total:
 * the middle call and the slow tail. A mean of 71 s says nothing about how
 * many calls ran past a deadline; the 95th percentile does. Null when the
 * operation made no calls.
 */
export type Latency = {
  readonly calls: number;
  readonly p50Ms: number | null;
  readonly p95Ms: number | null;
};

/**
 * The value at or below which `share` of the values fall, by nearest rank:
 * always one of the values themselves, never an interpolation between two,
 * so a p95 is the wall time of a call that happened.
 */
export function percentile(values: readonly number[], share: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(share * sorted.length) - 1)];
}

export function latency(calls: readonly ModelCall[]): Latency {
  const ms = calls.map((c) => c.ms);
  return { calls: calls.length, p50Ms: percentile(ms, 0.5), p95Ms: percentile(ms, 0.95) };
}

/** The telemetry one run leaves in its report. */
export type TelemetrySection = {
  readonly byOperation: Readonly<Record<TelemetryOperation, CostTotals>>;
  readonly byModel: readonly ({ readonly model: string } & CostTotals)[];
  readonly total: CostTotals;
  readonly perSession: CoachPerSession;
  /** p50 and p95 wall time per operation. */
  readonly latency: Readonly<Record<TelemetryOperation, Latency>>;
  /** Every call as it was recorded, its wall time and tokens, so a later reader can ask what the totals cannot answer. */
  readonly calls: readonly ModelCall[];
};

const per = (total: number | null, count: number): number | null =>
  total === null ? null : count === 0 ? 0 : dollars(total / count);

/** Every call a run reported, added up per operation, per model, and in all, with each operation's latency and the calls themselves. */
export function telemetrySection(calls: readonly ModelCall[], sessions: number): TelemetrySection {
  const perOperation = <T>(summarise: (calls: readonly ModelCall[]) => T): Record<TelemetryOperation, T> =>
    Object.fromEntries(
      TELEMETRY_OPERATIONS.map((operation) => [operation, summarise(calls.filter((c) => c.operation === operation))]),
    ) as Record<TelemetryOperation, T>;
  const byOperation = perOperation(costTotals);
  // Per model, each attempt counts where it ran: a declined Sonnet 5.5 attempt is Sonnet 5.5's, the rescue its fallback's.
  const attempts = calls.flatMap(callAttempts);
  const models = [...new Set(attempts.map((c) => c.model))];
  const coach = byOperation.coach;
  return {
    byOperation,
    byModel: models.map((model) => ({ model, ...costTotals(attempts.filter((c) => c.model === model)) })),
    total: costTotals(calls),
    perSession: {
      sessions,
      coachCalls: coach.calls,
      dollarsPerCoachCall: per(coach.dollars, coach.calls),
      dollarsPerSession: per(coach.dollars, sessions),
    },
    latency: perOperation(latency),
    calls,
  };
}

/** The token counts a usage and each attempt in it carry; the cache fields are absent or null when nothing was cached. */
type ApiTokens = {
  readonly input_tokens: number | null;
  readonly output_tokens: number;
  readonly cache_read_input_tokens?: number | null;
  readonly cache_creation_input_tokens?: number | null;
};

/**
 * One attempt in `usage.iterations`. A `message` entry is an attempt by the
 * requested model (one that declined, when a fallback served the call); a
 * `fallback_message` entry is a fallback model's attempt.
 */
export type ApiIteration = ApiTokens & { readonly type: string; readonly model?: string };

/** The usage an Anthropic response carries. */
export type ApiUsage = ApiTokens & { readonly iterations?: readonly ApiIteration[] | null };

const attemptOf = (model: string, usage: ApiTokens): ModelAttempt => ({
  model,
  inputTokens: usage.input_tokens ?? 0,
  outputTokens: usage.output_tokens,
  cacheReadTokens: usage.cache_read_input_tokens ?? 0,
  cacheWriteTokens: usage.cache_creation_input_tokens ?? 0,
});

/**
 * Who served a call and what each attempt used. With no `fallback_message`
 * among the iterations, the model the call named served it and the
 * top-level usage is the whole call. With one, the iterations are the
 * per-attempt record (the top-level usage covers only the serving attempt):
 * the last `fallback_message` is the serving attempt, at its own model, and
 * every other `message` or `fallback_message` entry is an attempt that
 * declined, at its own model.
 */
export function usageAttempts(
  model: string,
  usage: ApiUsage,
): { readonly served: ModelAttempt; readonly declined: readonly ModelAttempt[] } {
  const iterations = usage.iterations ?? [];
  const rescue = iterations.findLast((entry) => entry.type === "fallback_message");
  if (!rescue) return { served: attemptOf(model, usage), declined: [] };
  const declined = iterations
    .filter((entry) => entry !== rescue && (entry.type === "message" || entry.type === "fallback_message"))
    .map((entry) => attemptOf(entry.model ?? model, entry));
  return { served: attemptOf(rescue.model ?? model, rescue), declined };
}

/**
 * Make one model call and report what it used and how long it took. A call
 * that throws is not reported: the run failed, and a failure has no usage to
 * read. With no recorder this is the call itself and nothing else. `model`
 * is the model the call named; the call is recorded as the model that
 * served it, which differs only when the refusal fallback ran.
 */
export async function recordApiCall<T extends { readonly usage: ApiUsage }>(
  recorder: Telemetry | undefined,
  operation: TelemetryOperation,
  model: string,
  call: () => Promise<T>,
): Promise<T> {
  const started = performance.now();
  const response = await call();
  const { served, declined } = usageAttempts(model, response.usage);
  recorder?.record({
    operation,
    ...served,
    ...(declined.length > 0 ? { declined } : {}),
    ms: Math.round(performance.now() - started),
  });
  return response;
}

/** What the fake reports: the operation happened, and it cost nothing. */
export const zeroCall = (operation: TelemetryOperation): ModelCall => ({
  operation,
  model: FAKE_MODEL,
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  ms: 0,
});
