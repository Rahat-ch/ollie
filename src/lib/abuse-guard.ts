/**
 * What `proxy.ts` does to every `/api/*` request before a route sees it
 * (decisions.md #20): refuse another site's page (403), then refuse one
 * address sending a burst (429). The health check is left alone, so Coolify
 * and Docker can ask it as often as they like with no Origin at all.
 *
 * Same origin is judged by the Origin header against the host the request
 * was sent to. Every browser sends Origin on a POST, same-origin ones
 * included, so the site's own page always has one and a page on another
 * site can only send its own. A request with no Origin did not come from a
 * browser page and is refused too: that stops a bare script, though not
 * one that forges the header, which is what the rate limit and the daily
 * spend cap are for. Only the host and port are compared, not the scheme,
 * because TLS ends at Cloudflare and Traefik and the container sees HTTP.
 *
 * The rate limit is a token bucket per client address, in memory, since one
 * container serves the app. Behind Cloudflare the client's address is
 * `CF-Connecting-IP`; without it, the first `X-Forwarded-For` entry, then
 * `X-Real-IP`, then one key shared by every request that carries none.
 * Those headers are only as honest as whatever sits in front: they are
 * trusted because Cloudflare sets the first and overwrites any the client
 * sent (docs/deploy.md).
 */

/** A burst of this many requests from one address is let through… */
export const BURST_REQUESTS = 60;
/** …and then one more a second. A Session makes about 25 requests over several minutes. */
export const REFILL_PER_SECOND = 1;
/** Buckets kept before full ones are forgotten. */
const MAX_ADDRESSES = 10_000;

/** Paths the guard never touches. */
const UNGUARDED = new Set(["/api/health"]);

export type TokenBucket = {
  /** Take one token for the address: true when there was one to take. */
  readonly take: (key: string) => boolean;
  /** Whole seconds until the address has a token again. */
  readonly retryAfterSeconds: (key: string) => number;
  /** How many addresses have a bucket. */
  readonly size: () => number;
};

export type TokenBucketOptions = {
  readonly capacity: number;
  readonly refillPerSecond: number;
  /** Milliseconds; tests pass their own clock. */
  readonly now?: () => number;
  readonly maxAddresses?: number;
};

type Bucket = { tokens: number; at: number };

export function tokenBucket({ capacity, refillPerSecond, now = Date.now, maxAddresses = MAX_ADDRESSES }: TokenBucketOptions): TokenBucket {
  const buckets = new Map<string, Bucket>();

  /** The address's bucket, refilled for the time since it was last touched. */
  const current = (key: string): Bucket => {
    const at = now();
    const bucket = buckets.get(key);
    if (!bucket) return { tokens: capacity, at };
    return { tokens: Math.min(capacity, bucket.tokens + ((at - bucket.at) / 1000) * refillPerSecond), at };
  };

  /** Forget the buckets that have refilled; they would start full anyway. If that is not enough, the oldest go. */
  const prune = (): void => {
    for (const key of buckets.keys()) if (current(key).tokens >= capacity) buckets.delete(key);
    for (const key of buckets.keys()) {
      if (buckets.size <= maxAddresses) break;
      buckets.delete(key);
    }
  };

  return {
    take: (key) => {
      const bucket = current(key);
      const allowed = bucket.tokens >= 1;
      if (allowed) bucket.tokens -= 1;
      buckets.delete(key);
      buckets.set(key, bucket);
      if (buckets.size > maxAddresses) prune();
      return allowed;
    },
    retryAfterSeconds: (key) => Math.max(1, Math.ceil((1 - current(key).tokens) / refillPerSecond)),
    size: () => buckets.size,
  };
}

/** The host a request was sent to: the one a proxy in front forwarded, else Host. */
function requestHost(request: Request): string | null {
  return request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.headers.get("host");
}

/** True when the request's Origin names the host it was sent to. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = requestHost(request);
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host.toLowerCase();
  } catch {
    // "null" (a sandboxed frame, a file) or anything else that is not a URL.
    return false;
  }
}

/** The client's address, as Cloudflare or the proxy in front reported it. */
export function clientAddress(request: Request): string {
  const { headers } = request;
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export type ApiGuardOptions = { readonly bucket: TokenBucket };

/** The guard: a refusal to send back, or undefined to let the request through to its route. */
export function apiGuard({ bucket }: ApiGuardOptions): (request: Request) => Response | undefined {
  return (request) => {
    if (UNGUARDED.has(new URL(request.url).pathname)) return undefined;
    if (!sameOrigin(request)) return Response.json({ error: "cross-origin requests are refused" }, { status: 403 });
    const address = clientAddress(request);
    if (!bucket.take(address)) {
      return Response.json(
        { error: "too many requests from this address; try again shortly" },
        { status: 429, headers: { "retry-after": String(bucket.retryAfterSeconds(address)) } },
      );
    }
    return undefined;
  };
}

// Kept on globalThis, not in module scope, so the one bucket outlives however the proxy's bundle is loaded.
const SHARED = Symbol.for("ollie.api-guard");

/** The server's guard, with the production burst and refill. */
export function serverApiGuard(): (request: Request) => Response | undefined {
  const store = globalThis as typeof globalThis & { [SHARED]?: (request: Request) => Response | undefined };
  store[SHARED] ??= apiGuard({ bucket: tokenBucket({ capacity: BURST_REQUESTS, refillPerSecond: REFILL_PER_SECOND }) });
  return store[SHARED];
}
