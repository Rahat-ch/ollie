/**
 * A local server that answers like the Messages API, for the latency probe's
 * dry run and the reproduction harness (`scripts/latency-repro.ts`). The
 * real SDK client is pointed at it with `ANTHROPIC_BASE_URL`, so everything
 * from the SDK down (its retries, Node's fetch, the socket pool) is the real
 * thing and only the far end is local. A 200 carries the answer the caller
 * supplies (the Generation fake's own output, so the SDK's `parse` and the
 * Coach's schema both pass) as the model's text.
 *
 * Each request can be told to misbehave, by the request's number overall
 * and on its socket: answer late, never answer, reset the connection (RST)
 * or close it (FIN) part way through. On localhost a close is never silent:
 * the client's kernel always hears it, so a socket that vanished without a
 * word can only be approximated by one that stays open and never answers.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { Socket } from "node:net";
import { CLAUDE_MODEL } from "@/generation/claude";

export type Behaviour =
  /** A 200 with the answer, after `delayMs` (0 by default). */
  | { readonly kind: "answer"; readonly delayMs?: number }
  /** Read the request and never answer; the socket stays open. */
  | { readonly kind: "hang" }
  /** Reset the connection (RST) `afterMs` after the request arrived, without answering. */
  | { readonly kind: "reset"; readonly afterMs: number }
  /** Close the connection (FIN) `afterMs` after the request arrived, without answering. */
  | { readonly kind: "close"; readonly afterMs: number }
  /** Answer with this status and an API error body after `afterMs`. */
  | { readonly kind: "status"; readonly status: number; readonly afterMs: number };

export type RequestContext = {
  /** 1-based over the server's life. */
  readonly request: number;
  /** 1-based on the request's socket: 2 or more is a kept-alive connection. */
  readonly onSocket: number;
  readonly socket: number;
};

export type ServerEvent = { readonly t: number; readonly kind: string; readonly socket: number; readonly request?: number; readonly detail?: string };

export type MessagesServerOptions = {
  /** The model's output for a request body, sent as JSON text. */
  readonly answer: (body: unknown) => unknown;
  readonly behaviour?: (context: RequestContext) => Behaviour;
  /** After a 200 has been sent on a socket: close it this long after (FIN), or leave it to keep-alive. */
  readonly closeAfterAnswerMs?: number;
  readonly now?: () => number;
  /** 127.0.0.1 and a free port unless given: the harness's container run listens on 0.0.0.0. */
  readonly host?: string;
  readonly port?: number;
};

export type MessagesServer = {
  readonly url: string;
  readonly events: readonly ServerEvent[];
  close(): Promise<void>;
};

/**
 * `answer`, `hang`, `reset:<ms>`, `close:<ms>`, `slow:<ms>` (an answer after
 * that long) or `status:<code>:<ms>`, as the probe and the harness take it
 * on the command line.
 */
export function parseBehaviour(spec: string): Behaviour {
  const [kind, a, b] = spec.split(":");
  const ms = (value: string | undefined): number => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) throw new Error(`"${spec}": expected milliseconds, got "${value}"`);
    return n;
  };
  if (kind === "answer") return { kind: "answer" };
  if (kind === "hang") return { kind: "hang" };
  if (kind === "slow") return { kind: "answer", delayMs: ms(a) };
  if (kind === "reset") return { kind: "reset", afterMs: ms(a) };
  if (kind === "close") return { kind: "close", afterMs: ms(a) };
  if (kind === "status") return { kind: "status", status: ms(a), afterMs: ms(b ?? "0") };
  throw new Error(`unknown behaviour "${spec}": answer, hang, slow:<ms>, reset:<ms>, close:<ms>, status:<code>:<ms>`);
}

/** The Messages API's answer around the model's text: enough for the SDK's `parse` and the telemetry. */
function message(request: number, output: unknown, inputChars: number) {
  const text = JSON.stringify(output);
  return {
    id: `msg_local_${request}`,
    type: "message",
    role: "assistant",
    model: CLAUDE_MODEL,
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    stop_sequence: null,
    stop_details: null,
    usage: {
      input_tokens: Math.ceil(inputChars / 4),
      output_tokens: Math.ceil(text.length / 4),
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
      iterations: null,
    },
  };
}

export async function startMessagesServer(options: MessagesServerOptions): Promise<MessagesServer> {
  const now = options.now ?? (() => performance.now());
  const events: ServerEvent[] = [];
  const socketIds = new WeakMap<Socket, { id: number; requests: number }>();
  const open = new Set<Socket>();
  let sockets = 0;
  let requests = 0;
  const log = (kind: string, socket: number, request?: number, detail?: string) =>
    void events.push({ t: now(), kind, socket, ...(request === undefined ? {} : { request }), ...(detail ? { detail } : {}) });

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const socket = req.socket;
    const state = socketIds.get(socket) ?? { id: 0, requests: 0 };
    state.requests += 1;
    const context: RequestContext = { request: ++requests, onSocket: state.requests, socket: state.id };
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      const behaviour = options.behaviour?.(context) ?? { kind: "answer" };
      log("request", context.socket, context.request, `${req.method} ${req.url}, request ${context.onSocket} on the socket: ${behaviour.kind}`);
      const later = (ms: number, act: () => void) => {
        const timer = setTimeout(act, ms);
        socket.once("close", () => clearTimeout(timer));
      };
      if (behaviour.kind === "hang") return;
      if (behaviour.kind === "reset") {
        return later(behaviour.afterMs, () => {
          log("reset", context.socket, context.request);
          socket.resetAndDestroy();
        });
      }
      if (behaviour.kind === "close") {
        return later(behaviour.afterMs, () => {
          log("close", context.socket, context.request);
          socket.destroy();
        });
      }
      if (behaviour.kind === "status") {
        return later(behaviour.afterMs, () => {
          log("status", context.socket, context.request, String(behaviour.status));
          res.writeHead(behaviour.status, { "content-type": "application/json", "request-id": `req_local_${context.request}` });
          res.end(JSON.stringify({ type: "error", error: { type: "api_error", message: "local error" } }));
        });
      }
      later(behaviour.delayMs ?? 0, () => {
        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          body = null;
        }
        Promise.resolve(options.answer(body)).then((output) => {
          log("answer", context.socket, context.request);
          res.writeHead(200, { "content-type": "application/json", "request-id": `req_local_${context.request}` });
          res.end(JSON.stringify(message(context.request, output, raw.length)));
          if (options.closeAfterAnswerMs !== undefined) {
            later(options.closeAfterAnswerMs, () => {
              log("close-idle", context.socket, context.request);
              socket.end();
            });
          }
        });
      });
    });
  });
  server.on("connection", (socket: Socket) => {
    const id = ++sockets;
    socketIds.set(socket, { id, requests: 0 });
    open.add(socket);
    log("connection", id, undefined, `from :${socket.remotePort}`);
    socket.on("close", () => {
      open.delete(socket);
      log("socket-closed", id);
    });
  });

  const host = options.host ?? "127.0.0.1";
  await new Promise<void>((resolve) => server.listen(options.port ?? 0, host, resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("the local Messages server has no port");
  return {
    url: `http://${host}:${address.port}`,
    events,
    close: () =>
      new Promise<void>((resolve) => {
        for (const socket of open) socket.destroy();
        server.close(() => resolve());
      }),
  };
}
