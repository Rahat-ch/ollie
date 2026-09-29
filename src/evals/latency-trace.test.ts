/**
 * The latency probe's Trace: every fetch attempt kept, a thrown one
 * included, and a Coach call assembled from the events in its window. The
 * last two tests run the real SDK, once on a stubbed fetch and once on
 * Node's fetch against the local Messages server, so the retry the first
 * probe could not see is seen here. No model is called.
 */
import { afterEach, describe, expect, it } from "vitest";
import { DIAGNOSTIC_PLAN, newProfile, runSession, scripted } from "@/loop";
import { coachInput } from "@/coach";
import { anthropicGeneration } from "@/generation/anthropic";
import { fakeGeneration } from "@/generation/fake";
import {
  assembleCall,
  createTrace,
  diagnoseCall,
  errorInfo,
  explainCall,
  firstProbeView,
  formatCallTable,
  sdkLogger,
  tracingFetch,
  type CallWindow,
  type TraceEvent,
  type UnstampedEvent,
} from "./latency-trace";
import { recordWire } from "./latency-wire";
import { parseBehaviour, startMessagesServer, type MessagesServer } from "./messages-server";

const coach = coachInput(runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-f", scripted("ffhrfffhf")), { hypotheses: [], strengths: [] });

/** A clock the test moves by hand. */
function manualClock() {
  let t = 0;
  return { now: () => t, set: (ms: number) => void (t = ms) };
}

const socketClosed = (): TypeError =>
  new TypeError("fetch failed", { cause: Object.assign(new Error("other side closed"), { name: "SocketError", code: "UND_ERR_SOCKET" }) });

describe("the attempt log", () => {
  it("keeps an attempt whose fetch threw, with its cause, and hands the SDK the same error", async () => {
    const clock = manualClock();
    const trace = createTrace(clock.now);
    const thrown = socketClosed();
    const fetch = tracingFetch(trace, async () => {
      clock.set(69_500);
      throw thrown;
    });

    await expect(fetch("https://api.example/v1/messages")).rejects.toBe(thrown);
    expect(trace.events).toEqual([
      { t: 0, source: "fetch", kind: "start", attempt: 1, url: "https://api.example/v1/messages" },
      {
        t: 69_500,
        source: "fetch",
        kind: "error",
        attempt: 1,
        error: { name: "TypeError", message: "fetch failed", causeName: "SocketError", causeCode: "UND_ERR_SOCKET", causeMessage: "other side closed" },
      },
    ]);
  });

  it("passes the response through untouched and times its body on a copy", async () => {
    const trace = createTrace();
    const fetch = tracingFetch(trace, async () => new Response("hello", { status: 200, headers: { "request-id": "req_1" } }));

    const response = await fetch("https://api.example/v1/messages");
    expect(await response.text()).toBe("hello");
    await new Promise((resolve) => setTimeout(resolve, 0));
    const kinds = trace.events.map((e) => (e.source === "fetch" ? e.kind : e.source));
    expect(kinds).toEqual(["start", "headers", "body"]);
    expect(trace.events[1]).toMatchObject({ status: 200, requestId: "req_1" });
    expect(trace.events[2]).toMatchObject({ bytes: 5 });
  });

  it("numbers attempts across calls, so each keeps its own events", async () => {
    const trace = createTrace();
    let calls = 0;
    const fetch = tracingFetch(trace, async () => {
      calls += 1;
      if (calls === 1) throw socketClosed();
      return new Response("{}");
    });
    await fetch("u").catch(() => {});
    await fetch("u");
    const attempts = trace.events.filter((e) => e.source === "fetch" && e.kind !== "body").map((e) => (e.source === "fetch" ? `${e.attempt}:${e.kind}` : ""));
    expect(attempts).toEqual(["1:start", "1:error", "2:start", "2:headers"]);
  });

  it("reads an error with no cause, and a cause that is not an Error", () => {
    expect(errorInfo(new Error("boom"))).toEqual({ name: "Error", message: "boom", causeName: null, causeCode: null, causeMessage: null });
    expect(errorInfo("plain")).toMatchObject({ name: "Error", message: "plain" });
    expect(errorInfo(new Error("x", { cause: "why" }))).toMatchObject({ causeMessage: "why" });
  });

  it("keeps the SDK's log lines with the fields that time them, never the request body", () => {
    const trace = createTrace(() => 5);
    sdkLogger(trace).info("[log_1] connection failed - retrying, 2 attempts remaining");
    sdkLogger(trace).debug("[log_1] response start", { url: "u", status: 200, durationMs: 12, headers: { "request-id": "req_9" }, options: { body: "the prompt" } });
    expect(trace.events).toEqual([
      { t: 5, source: "sdk", level: "info", message: "[log_1] connection failed - retrying, 2 attempts remaining" },
      { t: 5, source: "sdk", level: "debug", message: "[log_1] response start", details: { url: "u", status: 200, durationMs: 12, requestId: "req_9" } },
    ]);
  });
});

/** Call 14 of the first probe, as it would read if the SDK had retried a thrown attempt. */
function retriedCall(): { window: CallWindow; events: TraceEvent[] } {
  const at = (t: number, e: UnstampedEvent): TraceEvent => ({ ...e, t }) as TraceEvent;
  const events: TraceEvent[] = [
    at(10_000, { source: "wire", kind: "done", request: 13 }),
    at(10_003, { source: "fetch", kind: "start", attempt: 14, url: "u" }),
    at(10_004, { source: "wire", kind: "request", request: 14, method: "POST", path: "/v1/messages" }),
    at(10_005, { source: "wire", kind: "send", request: 14, socket: 1, reused: true, earlierRequests: 13, idleMs: 5, ageMs: 290_000 }),
    at(79_500, { source: "wire", kind: "request-error", request: 14, error: errorInfo(socketClosed().cause) }),
    at(79_500, { source: "socket", kind: "close", socket: 1, detail: "with an error" }),
    at(79_501, { source: "fetch", kind: "error", attempt: 14, error: errorInfo(socketClosed()) }),
    at(79_502, { source: "sdk", level: "info", message: "[log_a] connection failed - retrying, 2 attempts remaining" }),
    at(80_100, { source: "fetch", kind: "start", attempt: 15, url: "u" }),
    at(80_101, { source: "wire", kind: "request", request: 15, method: "POST", path: "/v1/messages" }),
    at(80_101, { source: "wire", kind: "connect-start", host: "api.anthropic.com" }),
    at(80_102, { source: "socket", kind: "created", socket: 2 }),
    at(80_110, { source: "socket", kind: "lookup", socket: 2 }),
    at(80_130, { source: "socket", kind: "tcp", socket: 2 }),
    at(80_160, { source: "socket", kind: "tls", socket: 2 }),
    at(80_161, { source: "wire", kind: "send", request: 15, socket: 2, reused: false, earlierRequests: 0, idleMs: null, ageMs: 59 }),
    at(115_900, { source: "wire", kind: "headers", request: 15, status: 200 }),
    at(115_900, { source: "fetch", kind: "headers", attempt: 15, status: 200, requestId: "req_2" }),
    at(115_903, { source: "fetch", kind: "body", attempt: 15, bytes: 20_000 }),
    at(115_910, { source: "sdk", level: "info", message: "[log_b, retryOf: log_a] post succeeded with status 200 in 35800ms" }),
  ];
  const window: CallWindow = { learner: "crossing-ten-weakness", index: 14, startedAt: "2026-09-29T19:45:23.720Z", start: 10_001, end: 116_309, outcome: "ok", outputTokens: 4947 };
  return { window, events };
}

describe("a call assembled from the Trace", () => {
  it("shows a thrown attempt on a reused socket, the SDK's backoff, and the retry on a new socket", () => {
    const { window, events } = retriedCall();
    const call = assembleCall(window, events);

    expect(call.totalMs).toBe(106_308);
    expect(call.prefetchGapMs).toBe(2);
    expect(call.attempts).toHaveLength(2);
    expect(call.attempts[0]).toMatchObject({
      attempt: 1,
      outcome: "threw",
      threwAfterMs: 69_498,
      status: null,
      socket: { socket: 1, reused: true, idleMs: 5 },
      error: { causeCode: "UND_ERR_SOCKET", causeMessage: "other side closed" },
      waitMs: 69_495,
      afterPreviousMs: null,
      connect: null,
    });
    expect(call.attempts[1]).toMatchObject({
      attempt: 2,
      outcome: "response",
      status: 200,
      requestId: "req_2",
      headersMs: 35_800,
      bodyMs: 3,
      afterPreviousMs: 599,
      socket: { socket: 2, reused: false },
      connect: { dnsMs: 8, tcpMs: 20, tlsMs: 30, totalMs: 58 },
    });
    expect(call.retries).toEqual([{ ms: 69_501, message: "[log_a] connection failed - retrying, 2 attempts remaining" }]);
    // The event before the window (the last call's response) is not this call's.
    expect(call.events.some((e) => e.source === "wire" && e.kind === "done" && e.request === 13)).toBe(false);
  });

  it("says where the time went, largest first", () => {
    const { window, events } = retriedCall();
    const explanation = explainCall(assembleCall(window, events));
    expect(explanation.split("; ")[0]).toBe(
      "69.5s attempt 1 until it threw on reused socket #1 (idle 5 ms, 13 earlier): TypeError: fetch failed (cause UND_ERR_SOCKET other side closed)",
    );
    expect(explanation).toContain("35.8s attempt 2 waiting for headers (status 200, new socket #2)");
    expect(explanation).toContain("0.6s SDK backoff before attempt 2");
  });

  it("reads as the first probe's signature: a long gap, then one clean 200", () => {
    const { window, events } = retriedCall();
    expect(firstProbeView(assembleCall(window, events))).toEqual({ loggedAttempts: 1, gapMs: 70_099, matchesSignature: true });
  });

  it("names what the thrown attempt's cause means", () => {
    const { window, events } = retriedCall();
    expect(diagnoseCall(assembleCall(window, events))).toEqual(["attempt 1 threw after 69.5s: the far end closed the connection (FIN) before answering"]);

    const timedOut = events.map((e) =>
      e.source === "fetch" && e.kind === "error" ? { ...e, error: { ...e.error, causeCode: "ETIMEDOUT", causeMessage: "read ETIMEDOUT" } } : e,
    );
    expect(diagnoseCall(assembleCall(window, timedOut))[0]).toMatch(/^attempt 1 threw after 69\.5s: the socket's TCP keep-alive gave up/);
  });

  it("puts a gap with nothing on the wire before the first fetch", () => {
    const events: TraceEvent[] = [
      { t: 70_500, source: "fetch", kind: "start", attempt: 1, url: "u" },
      { t: 106_000, source: "fetch", kind: "headers", attempt: 1, status: 200, requestId: "req_1" },
    ];
    const call = assembleCall({ learner: "l", index: 1, startedAt: "", start: 0, end: 106_010, outcome: "ok", outputTokens: 10 }, events);
    expect(call.prefetchGapMs).toBe(70_500);
    expect(diagnoseCall(call)).toEqual(["70.5s passed before any fetch: in-process, not the network"]);
    expect(explainCall(call).split("; ")[0]).toBe("70.5s before the first fetch started (in-process: nothing on the wire)");
    expect(firstProbeView(call).matchesSignature).toBe(true);
  });

  it("does not match the signature when the one attempt simply took long", () => {
    const events: TraceEvent[] = [
      { t: 3, source: "fetch", kind: "start", attempt: 1, url: "u" },
      { t: 106_000, source: "fetch", kind: "headers", attempt: 1, status: 200, requestId: "req_1" },
    ];
    const call = assembleCall({ learner: "l", index: 1, startedAt: "", start: 0, end: 106_010, outcome: "ok", outputTokens: 10 }, events);
    expect(firstProbeView(call)).toEqual({ loggedAttempts: 1, gapMs: 3, matchesSignature: false });
  });

  it("prints one row per call with attempts, socket and tokens", () => {
    const { window, events } = retriedCall();
    const table = formatCallTable([assembleCall(window, events)]).split("\n");
    expect(table[0]).toMatch(/^call\s+learner\s+total\s+gap\s+attempts\s+headers\s+body\s+socket\s+out tok$/);
    expect(table[1]).toContain("106.3s");
    expect(table[1]).toContain("threw@69.5s UND_ERR_SOCKET > 200");
    expect(table[1]).toContain("reused(5ms),new");
    expect(table[1]).toContain("4947");
  });
});

describe("the local Messages server's behaviours", () => {
  it("reads each from the command line", () => {
    expect(parseBehaviour("hang")).toEqual({ kind: "hang" });
    expect(parseBehaviour("slow:70000")).toEqual({ kind: "answer", delayMs: 70_000 });
    expect(parseBehaviour("reset:250")).toEqual({ kind: "reset", afterMs: 250 });
    expect(parseBehaviour("status:529:10")).toEqual({ kind: "status", status: 529, afterMs: 10 });
    expect(() => parseBehaviour("reset:soon")).toThrow(/milliseconds/);
    expect(() => parseBehaviour("drop")).toThrow(/unknown behaviour/);
  });
});

describe("the real SDK, traced", () => {
  let server: MessagesServer | null = null;
  let stopWire: (() => void) | null = null;
  const baseURL = process.env.ANTHROPIC_BASE_URL;
  afterEach(async () => {
    stopWire?.();
    await server?.close();
    if (baseURL === undefined) delete process.env.ANTHROPIC_BASE_URL;
    else process.env.ANTHROPIC_BASE_URL = baseURL;
  });

  it("logs the thrown attempt and the SDK's retry line that the first probe could not see", async () => {
    const trace = createTrace();
    const answer = await fakeGeneration().runCoach(coach);
    let calls = 0;
    const base: typeof fetch = async () => {
      calls += 1;
      if (calls === 1) throw socketClosed();
      return new Response(
        JSON.stringify({
          id: "m",
          type: "message",
          role: "assistant",
          model: "claude-sonnet-5-5",
          content: [{ type: "text", text: JSON.stringify(answer) }],
          stop_reason: "end_turn",
          stop_sequence: null,
          stop_details: null,
          usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, iterations: null },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    const generation = anthropicGeneration({ apiKey: "test", fetch: tracingFetch(trace, base), logger: sdkLogger(trace), logLevel: "debug" });
    const start = trace.now();
    await expect(generation.runCoach(coach)).resolves.toEqual(answer);
    const call = assembleCall({ learner: "l", index: 1, startedAt: "", start, end: trace.now(), outcome: "ok", outputTokens: 1 }, trace.events);

    expect(call.attempts.map((a) => a.outcome)).toEqual(["threw", "response"]);
    expect(call.attempts[0].error?.causeCode).toBe("UND_ERR_SOCKET");
    expect(call.retries[0].message).toMatch(/connection failed - retrying, 2 attempts remaining$/);
    // The SDK's first backoff is 0.5 s less up to a quarter of jitter.
    expect(call.attempts[1].afterPreviousMs).toBeGreaterThanOrEqual(370);
  });

  it("sees a connection reset mid-request on the wire, and the retry go out on a new socket", async () => {
    const answer = await fakeGeneration().runCoach(coach);
    server = await startMessagesServer({ answer: () => answer, behaviour: ({ request }) => (request === 1 ? parseBehaviour("reset:50") : { kind: "answer" }) });
    process.env.ANTHROPIC_BASE_URL = server.url;
    const trace = createTrace();
    stopWire = recordWire(trace);
    const generation = anthropicGeneration({ apiKey: "test", fetch: tracingFetch(trace), logger: sdkLogger(trace), logLevel: "debug" });
    const start = trace.now();
    await expect(generation.runCoach(coach)).resolves.toEqual(answer);
    const call = assembleCall({ learner: "l", index: 1, startedAt: "", start, end: trace.now(), outcome: "ok", outputTokens: 1 }, trace.events);

    expect(call.attempts).toHaveLength(2);
    expect(call.attempts[0]).toMatchObject({ outcome: "threw", socket: { reused: false }, error: { name: "TypeError", message: "fetch failed", causeCode: "ECONNRESET" } });
    expect(call.attempts[0].threwAfterMs).toBeGreaterThanOrEqual(45);
    expect(call.attempts[1]).toMatchObject({ outcome: "response", status: 200, requestId: "req_local_2", socket: { reused: false } });
    expect(call.attempts[1].socket?.socket).not.toBe(call.attempts[0].socket?.socket);
    expect(call.attempts[1].connect?.tcpMs).not.toBeNull();
  });
});
