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
 */

/** The four things a run pays for: the three Generation operations and the Judge. */
export type TelemetryOperation = "coach" | "summary" | "story" | "judge";

export const TELEMETRY_OPERATIONS: readonly TelemetryOperation[] = ["coach", "summary", "story", "judge"];

/** One model call, as the adapter that made it saw it. */
export type ModelCall = {
  readonly operation: TelemetryOperation;
  /** The model id the call named; `fake` for the Generation fake. */
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly cacheWriteTokens: number;
  /** Wall time of the call itself. */
  readonly ms: number;
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

/** The first-party rates, per million tokens, on 2026-09-18. Anything not here costs an unknown amount. */
export const MODEL_PRICES: Readonly<Record<string, ModelPrice>> = {
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

export const callTokens = (call: ModelCall): number =>
  call.inputTokens + call.outputTokens + call.cacheReadTokens + call.cacheWriteTokens;

/**
 * What one call is estimated to have cost, or null when its model has no
 * published rate: a price is never guessed from a name. A call with no
 * tokens at all cost nothing whatever the model was, which is how the fake
 * reports zero rather than unknown.
 */
export function callDollars(call: ModelCall): number | null {
  if (callTokens(call) === 0) return 0;
  const price = MODEL_PRICES[call.model];
  if (!price) return null;
  const perMillion =
    call.inputTokens * price.input +
    call.outputTokens * price.output +
    call.cacheReadTokens * price.input * CACHE_READ_SHARE +
    call.cacheWriteTokens * price.input * CACHE_WRITE_SHARE;
  return dollars(perMillion / 1_000_000);
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

const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);

/** The group's estimate: null as soon as one call in it cannot be priced. */
function totalDollars(calls: readonly ModelCall[]): number | null {
  const each = calls.map(callDollars);
  return each.some((value) => value === null) ? null : dollars(sum(each as number[]));
}

export function costTotals(calls: readonly ModelCall[]): CostTotals {
  return {
    calls: calls.length,
    inputTokens: sum(calls.map((c) => c.inputTokens)),
    outputTokens: sum(calls.map((c) => c.outputTokens)),
    cacheReadTokens: sum(calls.map((c) => c.cacheReadTokens)),
    cacheWriteTokens: sum(calls.map((c) => c.cacheWriteTokens)),
    tokens: sum(calls.map(callTokens)),
    ms: sum(calls.map((c) => c.ms)),
    dollars: totalDollars(calls),
    models: [...new Set(calls.map((c) => c.model))],
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
  const models = [...new Set(calls.map((c) => c.model))];
  const coach = byOperation.coach;
  return {
    byOperation,
    byModel: models.map((model) => ({ model, ...costTotals(calls.filter((c) => c.model === model)) })),
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

/** The usage an Anthropic response carries; the cache fields are absent or null when nothing was cached. */
export type ApiUsage = {
  readonly input_tokens: number;
  readonly output_tokens: number;
  readonly cache_read_input_tokens?: number | null;
  readonly cache_creation_input_tokens?: number | null;
};

/**
 * Make one model call and report what it used and how long it took. A call
 * that throws is not reported: the run failed, and a failure has no usage to
 * read. With no recorder this is the call itself and nothing else.
 */
export async function recordApiCall<T extends { readonly usage: ApiUsage }>(
  recorder: Telemetry | undefined,
  operation: TelemetryOperation,
  model: string,
  call: () => Promise<T>,
): Promise<T> {
  const started = performance.now();
  const response = await call();
  recorder?.record({
    operation,
    model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
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
