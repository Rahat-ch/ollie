/**
 * The socket side of the latency probe: what Node's own `fetch` (undici,
 * 7.18 in Node 24.13) publishes on `diagnostics_channel`, written into the
 * probe's Trace (`./latency-trace.ts`). Subscribing changes nothing about
 * the requests; it is how undici is meant to be watched.
 *
 * The channels, each checked to fire in Node 24.13: `undici:request:create`,
 * `undici:client:sendHeaders` (which socket the request went out on),
 * `undici:request:bodySent`, `undici:request:headers`,
 * `undici:request:trailers` (the response is complete),
 * `undici:request:error`, `undici:client:beforeConnect`,
 * `undici:client:connected` and `undici:client:connectError`; and Node's
 * `net.client.socket`, which hands over each new socket (a TLSSocket for
 * https) before it connects, so its `lookup`, `connect` and `secureConnect`
 * give the DNS, TCP and TLS times, and its `end` and `close` say when the
 * server hung up on a kept-alive connection.
 */
import diagnostics from "node:diagnostics_channel";
import type { Socket } from "node:net";
import { errorInfo, type Trace } from "./latency-trace";

type UndiciRequest = { readonly method?: string; readonly path?: string; readonly origin?: string };
type SocketState = { readonly id: number; readonly created: number | null; requests: number; lastDone: number | null };

/** Start writing the wire into the Trace; the returned function stops it. */
export function recordWire(trace: Trace): () => void {
  const requests = new WeakMap<object, number>();
  const sockets = new WeakMap<object, SocketState>();
  const requestSocket = new WeakMap<object, SocketState>();
  let nextRequest = 0;
  let nextSocket = 0;

  const socketState = (socket: object, created: number | null): SocketState => {
    let state = sockets.get(socket);
    if (!state) {
      state = { id: ++nextSocket, created, requests: 0, lastDone: null };
      sockets.set(socket, state);
    }
    return state;
  };
  const requestId = (request: object): number => {
    let id = requests.get(request);
    if (id === undefined) {
      id = ++nextRequest;
      requests.set(request, id);
    }
    return id;
  };

  const handlers: Record<string, (message: unknown) => void> = {
    "net.client.socket": (message) => {
      const socket = (message as { socket: Socket }).socket;
      const state = socketState(socket, trace.now());
      const id = state.id;
      trace.push({ source: "socket", kind: "created", socket: id });
      socket.on("lookup", (error: Error | null, address: string, family: string | number) =>
        trace.push({ source: "socket", kind: "lookup", socket: id, detail: error ? `error ${error.message}` : `${address} (IPv${family})` }),
      );
      socket.on("connect", () => trace.push({ source: "socket", kind: "tcp", socket: id, detail: `${socket.remoteAddress}:${socket.remotePort} from :${socket.localPort}` }));
      socket.on("secureConnect", () => trace.push({ source: "socket", kind: "tls", socket: id }));
      socket.on("end", () => trace.push({ source: "socket", kind: "end", socket: id, detail: "the server closed its side (FIN)" }));
      socket.on("timeout", () => trace.push({ source: "socket", kind: "timeout", socket: id }));
      socket.on("error", (error: Error) => trace.push({ source: "socket", kind: "error", socket: id, detail: `${(error as { code?: string }).code ?? error.name}: ${error.message}` }));
      socket.on("close", (hadError: boolean) => trace.push({ source: "socket", kind: "close", socket: id, detail: hadError ? "with an error" : "cleanly" }));
    },
    "undici:request:create": (message) => {
      const request = (message as { request: UndiciRequest }).request;
      trace.push({ source: "wire", kind: "request", request: requestId(request), method: request.method ?? "?", path: `${request.origin ?? ""}${request.path ?? ""}` });
    },
    "undici:client:sendHeaders": (message) => {
      const { request, socket } = message as { request: object; socket: object };
      const state = socketState(socket, null);
      const now = trace.now();
      trace.push({
        source: "wire",
        kind: "send",
        request: requestId(request),
        socket: state.id,
        reused: state.requests > 0,
        earlierRequests: state.requests,
        idleMs: state.lastDone === null ? null : Math.round(now - state.lastDone),
        ageMs: state.created === null ? null : Math.round(now - state.created),
      });
      state.requests += 1;
      requestSocket.set(request, state);
    },
    "undici:request:bodySent": (message) => {
      trace.push({ source: "wire", kind: "body-sent", request: requestId((message as { request: object }).request) });
    },
    "undici:request:headers": (message) => {
      const { request, response } = message as { request: object; response: { statusCode: number } };
      trace.push({ source: "wire", kind: "headers", request: requestId(request), status: response.statusCode });
    },
    "undici:request:trailers": (message) => {
      const request = (message as { request: object }).request;
      const state = requestSocket.get(request);
      if (state) state.lastDone = trace.now();
      trace.push({ source: "wire", kind: "done", request: requestId(request) });
    },
    "undici:request:error": (message) => {
      const { request, error } = message as { request: object; error: unknown };
      trace.push({ source: "wire", kind: "request-error", request: requestId(request), error: errorInfo(error) });
    },
    "undici:client:beforeConnect": (message) => {
      const { connectParams } = message as { connectParams: { host?: string } };
      trace.push({ source: "wire", kind: "connect-start", host: connectParams.host ?? "?" });
    },
    "undici:client:connected": (message) => {
      const { connectParams, socket } = message as { connectParams: { host?: string }; socket: Socket & { alpnProtocol?: string | false; isSessionReused?: () => boolean } };
      trace.push({
        source: "wire",
        kind: "connected",
        socket: socketState(socket, null).id,
        host: connectParams.host ?? "?",
        remote: socket.remoteAddress ? `${socket.remoteAddress}:${socket.remotePort}` : null,
        alpn: typeof socket.alpnProtocol === "string" ? socket.alpnProtocol : null,
        tlsResumed: typeof socket.isSessionReused === "function" ? socket.isSessionReused() : null,
      });
    },
    "undici:client:connectError": (message) => {
      const { connectParams, error } = message as { connectParams: { host?: string }; error: unknown };
      trace.push({ source: "wire", kind: "connect-error", host: connectParams.host ?? "?", error: errorInfo(error) });
    },
  };

  for (const [name, handler] of Object.entries(handlers)) diagnostics.subscribe(name, handler);
  return () => {
    for (const [name, handler] of Object.entries(handlers)) diagnostics.unsubscribe(name, handler);
  };
}
