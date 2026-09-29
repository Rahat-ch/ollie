/**
 * The latency probe's record of one Coach call, from the moment the Coach
 * is asked to the moment it answers (`scripts/latency-probe-v2.ts`). The
 * first probe logged an HTTP attempt only once `fetch` had resolved, so an
 * attempt that threw, and the SDK's retry after it, left no trace; a call
 * then read as a long silence and one clean 200. Here every source writes
 * timestamped events to one Trace: each `fetch` attempt, thrown or not, with
 * its headers and the end of its body; the SDK's own log at debug level,
 * which names every retry; and the socket events Node's fetch publishes
 * (`./latency-wire.ts`). A call is then assembled from the events inside
 * its window, in milliseconds from its start.
 *
 * Everything here is pure but the fetch wrapper, which measures and passes
 * on: the SDK receives the Response the real `fetch` returned (its body read
 * again from a clone) and any error it threw, the same object.
 */

/** Milliseconds on one monotonic clock: `performance.now()` in the probe, a counter in tests. */
export type Clock = () => number;

/** What an error said, and what its cause said: undici puts the socket's own error in `cause`. */
export type ErrorInfo = {
  readonly name: string;
  readonly message: string;
  readonly causeName: string | null;
  readonly causeCode: string | null;
  readonly causeMessage: string | null;
};

export type SdkLevel = "error" | "warn" | "info" | "debug";

/** One socket as the wire saw it at the moment a request was sent on it. */
export type SocketUse = {
  readonly socket: number;
  /** A request had already been sent on this socket: a kept-alive connection. */
  readonly reused: boolean;
  /** Requests sent on the socket before this one. */
  readonly earlierRequests: number;
  /** Since the socket's last response ended; null on a new socket. */
  readonly idleMs: number | null;
  /** Since the socket was created; null when its creation was not seen. */
  readonly ageMs: number | null;
};

export type TraceEvent =
  | { readonly t: number; readonly source: "fetch"; readonly kind: "start"; readonly attempt: number; readonly url: string }
  | { readonly t: number; readonly source: "fetch"; readonly kind: "headers"; readonly attempt: number; readonly status: number; readonly requestId: string | null }
  | { readonly t: number; readonly source: "fetch"; readonly kind: "body"; readonly attempt: number; readonly bytes: number }
  | { readonly t: number; readonly source: "fetch"; readonly kind: "body-error"; readonly attempt: number; readonly error: ErrorInfo }
  | { readonly t: number; readonly source: "fetch"; readonly kind: "error"; readonly attempt: number; readonly error: ErrorInfo }
  | { readonly t: number; readonly source: "sdk"; readonly level: SdkLevel; readonly message: string; readonly details?: Readonly<Record<string, unknown>> }
  | { readonly t: number; readonly source: "wire"; readonly kind: "request"; readonly request: number; readonly method: string; readonly path: string }
  | ({ readonly t: number; readonly source: "wire"; readonly kind: "send"; readonly request: number } & SocketUse)
  | { readonly t: number; readonly source: "wire"; readonly kind: "body-sent"; readonly request: number }
  | { readonly t: number; readonly source: "wire"; readonly kind: "headers"; readonly request: number; readonly status: number }
  | { readonly t: number; readonly source: "wire"; readonly kind: "done"; readonly request: number }
  | { readonly t: number; readonly source: "wire"; readonly kind: "request-error"; readonly request: number; readonly error: ErrorInfo }
  | { readonly t: number; readonly source: "wire"; readonly kind: "connect-start"; readonly host: string }
  | { readonly t: number; readonly source: "wire"; readonly kind: "connected"; readonly socket: number; readonly host: string; readonly remote: string | null; readonly alpn: string | null; readonly tlsResumed: boolean | null }
  | { readonly t: number; readonly source: "wire"; readonly kind: "connect-error"; readonly host: string; readonly error: ErrorInfo }
  | { readonly t: number; readonly source: "socket"; readonly kind: "created" | "lookup" | "tcp" | "tls" | "end" | "close" | "error" | "timeout"; readonly socket: number; readonly detail?: string };

/** An event before it is stamped. */
export type UnstampedEvent = TraceEvent extends infer E ? (E extends TraceEvent ? Omit<E, "t"> : never) : never;

export type Trace = {
  readonly now: Clock;
  readonly events: readonly TraceEvent[];
  push(event: UnstampedEvent): void;
};

export function createTrace(now: Clock = () => performance.now()): Trace {
  const events: TraceEvent[] = [];
  return { now, events, push: (event) => void events.push({ ...event, t: now() } as TraceEvent) };
}

const text = (value: unknown): string | null => (typeof value === "string" || typeof value === "number" ? String(value) : null);

export function errorInfo(error: unknown): ErrorInfo {
  const own = error instanceof Error ? error : new Error(String(error));
  const cause = (own as { cause?: unknown }).cause;
  const causeRecord = typeof cause === "object" && cause !== null ? (cause as Record<string, unknown>) : null;
  return {
    name: own.name,
    message: own.message,
    causeName: causeRecord ? text(causeRecord.name) : null,
    causeCode: causeRecord ? text(causeRecord.code) : null,
    causeMessage: causeRecord ? text(causeRecord.message) : cause === undefined ? null : String(cause),
  };
}

/**
 * A `fetch` that records every attempt the SDK makes through it: its start,
 * its headers or the error it threw, and when its body finished. The body
 * is timed on a clone, read alongside the SDK's own read of the original.
 */
export function tracingFetch(trace: Trace, base: typeof fetch = fetch): typeof fetch {
  let attempts = 0;
  return async (input, init) => {
    const attempt = ++attempts;
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    trace.push({ source: "fetch", kind: "start", attempt, url });
    let response: Response;
    try {
      response = await base(input, init);
    } catch (error) {
      trace.push({ source: "fetch", kind: "error", attempt, error: errorInfo(error) });
      throw error;
    }
    trace.push({ source: "fetch", kind: "headers", attempt, status: response.status, requestId: response.headers.get("request-id") });
    if (response.body) void timeBody(trace, attempt, response.clone());
    return response;
  };
}

async function timeBody(trace: Trace, attempt: number, copy: Response): Promise<void> {
  let bytes = 0;
  try {
    const reader = (copy.body as ReadableStream<Uint8Array>).getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
    }
    trace.push({ source: "fetch", kind: "body", attempt, bytes });
  } catch (error) {
    trace.push({ source: "fetch", kind: "body-error", attempt, error: errorInfo(error) });
  }
}

/** The SDK's detail fields worth keeping: never the request body, which is the whole prompt. */
const SDK_DETAILS = ["url", "status", "durationMs", "retryOf", "message"] as const;

/** A logger for the SDK's `logger` option: each line stamped into the Trace, the request id picked out of the headers. */
export function sdkLogger(trace: Trace): Record<SdkLevel, (message: string, ...rest: unknown[]) => void> {
  const log = (level: SdkLevel) => (message: string, ...rest: unknown[]) => {
    const raw = rest[0];
    const details: Record<string, unknown> = {};
    if (typeof raw === "object" && raw !== null) {
      const record = raw as Record<string, unknown>;
      for (const key of SDK_DETAILS) if (record[key] !== undefined) details[key] = record[key];
      const headers = record.headers as Record<string, unknown> | undefined;
      if (headers && typeof headers === "object" && "request-id" in headers) details.requestId = headers["request-id"];
    }
    trace.push({ source: "sdk", level, message, ...(Object.keys(details).length > 0 ? { details } : {}) });
  };
  return { error: log("error"), warn: log("warn"), info: log("info"), debug: log("debug") };
}

/** One Coach call as the probe saw it from outside: when it was asked and when it answered. */
export type CallWindow = {
  readonly learner: string;
  /** 1-based, over the whole run. */
  readonly index: number;
  readonly startedAt: string;
  readonly start: number;
  readonly end: number;
  readonly outcome: "ok" | "error";
  readonly error?: string;
  readonly outputTokens: number | null;
};

export type AttemptTimeline = {
  /** 1-based within the call. */
  readonly attempt: number;
  readonly startMs: number;
  readonly endMs: number;
  readonly outcome: "response" | "threw";
  readonly status: number | null;
  readonly requestId: string | null;
  /** From the attempt's start to its headers; null when it threw first. */
  readonly headersMs: number | null;
  /** From the headers to the body's last byte. */
  readonly bodyMs: number | null;
  /** From the attempt's start to the error it threw. */
  readonly threwAfterMs: number | null;
  readonly error: ErrorInfo | null;
  /** The socket the request went out on; null when none carried it (it failed to connect). */
  readonly socket: SocketUse | null;
  /** For a new socket: DNS, TCP and TLS, each from the end of the one before. */
  readonly connect: { readonly dnsMs: number | null; readonly tcpMs: number | null; readonly tlsMs: number | null; readonly totalMs: number | null } | null;
  /** From the request going out on the socket to its response headers or its error. */
  readonly waitMs: number | null;
  /** From the end of the attempt before to this one's start: the SDK's backoff. Null for the first. */
  readonly afterPreviousMs: number | null;
};

export type CallTimeline = {
  readonly learner: string;
  readonly index: number;
  readonly startedAt: string;
  readonly totalMs: number;
  /** From the call's start to its first fetch; the whole call when it made none. */
  readonly prefetchGapMs: number;
  readonly outcome: "ok" | "error";
  readonly error: string | null;
  readonly outputTokens: number | null;
  readonly attempts: readonly AttemptTimeline[];
  /** The SDK's retry and timeout lines. */
  readonly retries: readonly { readonly ms: number; readonly message: string }[];
  /** Every event in the window, in milliseconds from the call's start. */
  readonly events: readonly (TraceEvent & { readonly ms: number })[];
};

type FetchEvent = Extract<TraceEvent, { source: "fetch" }>;
type FetchOf<K extends FetchEvent["kind"]> = Extract<FetchEvent, { kind: K }>;
type WireEvent = Extract<TraceEvent, { source: "wire" }>;
type WireOf<K extends WireEvent["kind"]> = Extract<WireEvent, { kind: K }>;

/** Everything after an attempt's start, found by its number wherever it fell: a body can end just after the window. */
const fetchEvents = (events: readonly TraceEvent[], attempt: number): FetchEvent[] =>
  events.filter((e): e is FetchEvent => e.source === "fetch" && e.kind !== "start" && e.attempt === attempt);

const round = (ms: number): number => Math.round(ms);
const within = (t: number, from: number, to: number): boolean => t >= from && t <= to;

/** Assemble one call from the Trace: attempts are the fetch starts inside its window, in order. */
export function assembleCall(window: CallWindow, events: readonly TraceEvent[]): CallTimeline {
  const inWindow = events.filter((e) => within(e.t, window.start, window.end));
  const starts = inWindow.filter((e): e is FetchOf<"start"> => e.source === "fetch" && e.kind === "start");
  const rel = (t: number): number => round(t - window.start);

  const attempts = starts.map((start, i): AttemptTimeline => {
    const until = starts[i + 1]?.t ?? window.end;
    const mine = fetchEvents(events, start.attempt);
    const headers = mine.find((e): e is FetchOf<"headers"> => e.kind === "headers");
    const thrown = mine.find((e): e is FetchOf<"error"> => e.kind === "error");
    const body = mine.find((e) => e.kind === "body" || e.kind === "body-error");
    const wire = inWindow.filter((e): e is WireEvent => e.source === "wire" && within(e.t, start.t, until));
    const request = wire.find((e) => e.kind === "request");
    const send = wire.find((e): e is WireOf<"send"> => e.kind === "send" && e.request === request?.request);
    const socket: SocketUse | null = send
      ? { socket: send.socket, reused: send.reused, earlierRequests: send.earlierRequests, idleMs: send.idleMs, ageMs: send.ageMs }
      : null;
    const answered = wire.find((e) => (e.kind === "headers" || e.kind === "request-error") && e.request === request?.request);
    const end = body?.t ?? thrown?.t ?? headers?.t ?? start.t;
    // The attempt before ended at its headers or its error; its body is not the SDK's wait.
    const previousEnd = i > 0 ? fetchEvents(events, starts[i - 1].attempt).find((e) => e.kind === "headers" || e.kind === "error")?.t : undefined;
    return {
      attempt: i + 1,
      startMs: rel(start.t),
      endMs: rel(end),
      outcome: headers ? "response" : "threw",
      status: headers?.status ?? null,
      requestId: headers?.requestId ?? null,
      headersMs: headers ? round(headers.t - start.t) : null,
      bodyMs: headers && body ? round(body.t - headers.t) : null,
      threwAfterMs: thrown ? round(thrown.t - start.t) : null,
      error: thrown?.error ?? null,
      socket,
      connect: socket && !socket.reused ? connectTimings(inWindow, socket.socket) : null,
      waitMs: send && answered ? round(answered.t - send.t) : null,
      afterPreviousMs: previousEnd === undefined ? null : round(start.t - previousEnd),
    };
  });

  const retries = inWindow
    .filter((e): e is Extract<TraceEvent, { source: "sdk" }> => e.source === "sdk" && e.level === "info" && /retrying|timed out|failed|no more retries/.test(e.message))
    .map((e) => ({ ms: rel(e.t), message: e.message }));

  return {
    learner: window.learner,
    index: window.index,
    startedAt: window.startedAt,
    totalMs: rel(window.end),
    prefetchGapMs: starts.length > 0 ? rel(starts[0].t) : rel(window.end),
    outcome: window.outcome,
    error: window.error ?? null,
    outputTokens: window.outputTokens,
    attempts,
    retries,
    events: inWindow.map((e) => ({ ...e, ms: rel(e.t) })),
  };
}

function connectTimings(events: readonly TraceEvent[], socket: number): AttemptTimeline["connect"] {
  const at = (kind: string): number | null => {
    const found = events.filter((e) => e.source === "socket" && e.socket === socket && e.kind === kind);
    return found.length > 0 ? found[found.length - 1].t : null;
  };
  const created = at("created");
  const lookup = at("lookup");
  const tcp = at("tcp");
  const tls = at("tls");
  const span = (from: number | null, to: number | null): number | null => (from !== null && to !== null ? round(to - from) : null);
  return {
    dnsMs: span(created, lookup),
    tcpMs: span(lookup ?? created, tcp),
    tlsMs: span(tcp, tls),
    totalMs: span(created, tls ?? tcp),
  };
}

const seconds = (ms: number | null): string => (ms === null ? "-" : `${(ms / 1000).toFixed(1)}s`);

function describeError(error: ErrorInfo | null): string {
  if (!error) return "no error";
  const cause = [error.causeCode, error.causeMessage].filter(Boolean).join(" ");
  return cause ? `${error.name}: ${error.message} (cause ${cause})` : `${error.name}: ${error.message}`;
}

function describeSocket(socket: SocketUse | null): string {
  if (!socket) return "no socket";
  return socket.reused ? `reused socket #${socket.socket} (idle ${socket.idleMs ?? "?"} ms, ${socket.earlierRequests} earlier)` : `new socket #${socket.socket}`;
}

/**
 * Where the call's time went, largest first: the gap before the first
 * fetch, then each attempt's connect, wait and body, the time until an
 * attempt threw, and the SDK's backoff before the next.
 */
export function explainCall(call: CallTimeline): string {
  const parts: { ms: number; says: string }[] = [];
  parts.push({
    ms: call.prefetchGapMs,
    says: call.attempts.length === 0 ? "no fetch at all" : "before the first fetch started (in-process: nothing on the wire)",
  });
  for (const a of call.attempts) {
    if (a.afterPreviousMs !== null) parts.push({ ms: a.afterPreviousMs, says: `SDK backoff before attempt ${a.attempt}` });
    if (a.connect?.totalMs) parts.push({ ms: a.connect.totalMs, says: `attempt ${a.attempt} connecting (DNS ${a.connect.dnsMs ?? "?"} ms, TCP ${a.connect.tcpMs ?? "?"} ms, TLS ${a.connect.tlsMs ?? "?"} ms)` });
    if (a.outcome === "threw") {
      parts.push({ ms: a.threwAfterMs ?? 0, says: `attempt ${a.attempt} until it threw on ${describeSocket(a.socket)}: ${describeError(a.error)}` });
    } else {
      parts.push({ ms: a.headersMs ?? 0, says: `attempt ${a.attempt} waiting for headers (status ${a.status}, ${describeSocket(a.socket)})` });
      if (a.bodyMs !== null) parts.push({ ms: a.bodyMs, says: `attempt ${a.attempt} reading the body` });
    }
  }
  const last = call.attempts[call.attempts.length - 1];
  if (last) parts.push({ ms: call.totalMs - last.endMs, says: "after the last attempt (parsing, checking)" });
  // Anything under 50 ms is noise beside a call worth explaining.
  return parts
    .filter((p) => p.ms >= 50)
    .sort((a, b) => b.ms - a.ms)
    .map((p) => `${seconds(p.ms)} ${p.says}`)
    .join("; ");
}

/** What each way an attempt can end means, by the cause undici gave. */
const CAUSES: readonly { readonly test: (a: AttemptTimeline) => boolean; readonly says: string }[] = [
  {
    test: (a) => a.error?.causeCode === "ETIMEDOUT" && (a.threwAfterMs ?? 0) >= 60_000,
    says: "the socket's TCP keep-alive gave up: nothing came back to 10 probes 1 s apart after 60 s of silence (undici's keepAliveInitialDelay 60 s, libuv's interval and count), so the connection had gone dead without a FIN or a RST",
  },
  { test: (a) => a.error?.causeCode === "ETIMEDOUT", says: "the kernel timed the connection out (ETIMEDOUT)" },
  { test: (a) => a.error?.causeCode === "ECONNRESET", says: "the far end, or something on the way, reset the connection (RST)" },
  { test: (a) => a.error?.causeCode === "UND_ERR_SOCKET", says: "the far end closed the connection (FIN) before answering" },
  { test: (a) => a.error?.causeCode === "UND_ERR_HEADERS_TIMEOUT", says: "undici's headersTimeout (300 s) passed with no answer" },
  { test: (a) => a.error?.causeCode === "UND_ERR_CONNECT_TIMEOUT", says: "undici's connect timeout (10 s) passed" },
  { test: (a) => a.error?.name === "AbortError" || a.error?.name === "TimeoutError", says: "the call was aborted: the SDK's own timeout (10 minutes) or the caller's signal" },
];

/** What the call's attempts and gap say about the cause, one line each. */
export function diagnoseCall(call: CallTimeline): string[] {
  const notes: string[] = [];
  if (call.prefetchGapMs >= 1_000) notes.push(`${seconds(call.prefetchGapMs)} passed before any fetch: in-process, not the network`);
  for (const a of call.attempts.filter((attempt) => attempt.outcome === "threw")) {
    const cause = CAUSES.find((c) => c.test(a));
    notes.push(`attempt ${a.attempt} threw after ${seconds(a.threwAfterMs)}: ${cause ? cause.says : describeError(a.error)}`);
  }
  for (const a of call.attempts.filter((attempt) => attempt.status !== null && attempt.status !== 200)) {
    notes.push(`attempt ${a.attempt} was answered ${a.status} after ${seconds(a.headersMs)}`);
  }
  return notes;
}

/**
 * What the first probe would have logged for this call: only the attempts
 * whose `fetch` resolved, each timed from its start. Its signature for the
 * unexplained calls was a gap of `gapMs` or more before the one logged
 * attempt, and that attempt a clean 200.
 */
export function firstProbeView(call: CallTimeline, gapMs = 60_000): { readonly loggedAttempts: number; readonly gapMs: number; readonly matchesSignature: boolean } {
  const logged = call.attempts.filter((a) => a.outcome === "response");
  const gap = logged.length > 0 ? logged[0].startMs : call.totalMs;
  return { loggedAttempts: logged.length, gapMs: gap, matchesSignature: logged.length === 1 && logged[0].status === 200 && gap >= gapMs };
}

function attemptCell(a: AttemptTimeline): string {
  if (a.outcome === "threw") return `threw@${seconds(a.threwAfterMs)} ${a.error?.causeCode ?? a.error?.name ?? "?"}`;
  return String(a.status);
}

/** The per-call table the probe prints. */
export function formatCallTable(calls: readonly CallTimeline[]): string {
  const header = ["call", "learner", "total", "gap", "attempts", "headers", "body", "socket", "out tok"];
  const rows = calls.map((c) => {
    const last = c.attempts[c.attempts.length - 1];
    const sockets = c.attempts.map((a) => (a.socket ? (a.socket.reused ? `reused(${a.socket.idleMs ?? "?"}ms)` : "new") : "none")).join(",");
    return [
      String(c.index),
      c.learner,
      seconds(c.totalMs),
      seconds(c.prefetchGapMs),
      c.attempts.length === 0 ? "none" : c.attempts.map(attemptCell).join(" > "),
      seconds(last?.headersMs ?? null),
      last?.bodyMs === null || last === undefined ? "-" : `${last.bodyMs}ms`,
      sockets || "-",
      c.outputTokens === null ? "-" : String(c.outputTokens),
    ];
  });
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const line = (cells: readonly string[]) => cells.map((cell, i) => cell.padEnd(widths[i])).join("  ").trimEnd();
  return [line(header), ...rows.map(line)].join("\n");
}
