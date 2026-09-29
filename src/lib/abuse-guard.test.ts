import { describe, expect, it } from "vitest";
import { apiGuard, clientAddress, sameOrigin, tokenBucket } from "./abuse-guard";

const SITE = "https://ollie.rahatcodes.com";

/** A request as the proxy sees it behind Cloudflare: the Host header is the site's own. */
function request(path: string, headers: Record<string, string> = {}, method = "POST"): Request {
  return new Request(`http://0.0.0.0:3000${path}`, {
    method,
    headers: { host: "ollie.rahatcodes.com", "cf-connecting-ip": "203.0.113.7", ...headers },
  });
}

/** A clock the test moves by hand, in milliseconds. */
function clock(start = 0) {
  let ms = start;
  return { now: () => ms, advance: (by: number) => void (ms += by) };
}

describe("the origin check", () => {
  it("lets the site's own page through: its Origin names the Host it was sent to", () => {
    expect(sameOrigin(request("/api/coach", { origin: SITE }))).toBe(true);
  });

  it("matches on the host and port, not the scheme, since TLS ends before the container", () => {
    expect(sameOrigin(request("/api/coach", { origin: "http://ollie.rahatcodes.com" }))).toBe(true);
    expect(sameOrigin(new Request("http://localhost:3100/api/coach", { method: "POST", headers: { host: "localhost:3100", origin: "http://localhost:3100" } }))).toBe(true);
    expect(sameOrigin(new Request("http://localhost:3100/api/coach", { method: "POST", headers: { host: "localhost:3100", origin: "http://localhost:3000" } }))).toBe(false);
  });

  it("refuses a page on another site", () => {
    expect(sameOrigin(request("/api/coach", { origin: "https://evil.example" }))).toBe(false);
    expect(sameOrigin(request("/api/coach", { origin: "https://ollie.rahatcodes.com.evil.example" }))).toBe(false);
  });

  it("refuses a request with no Origin at all, since every browser sends one on a POST", () => {
    expect(sameOrigin(request("/api/coach"))).toBe(false);
    expect(sameOrigin(request("/api/coach", { origin: "null" }))).toBe(false);
  });

  it("accepts the host a proxy in front forwarded, when it rewrote Host", () => {
    const forwarded = request("/api/coach", { host: "ollie:3000", "x-forwarded-host": "ollie.rahatcodes.com", origin: SITE });
    expect(sameOrigin(forwarded)).toBe(true);
  });
});

describe("the client's address", () => {
  it("is Cloudflare's CF-Connecting-IP first", () => {
    expect(clientAddress(request("/api/coach", { "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("falls back to the first X-Forwarded-For entry, then X-Real-IP, then one shared key", () => {
    const bare = (headers: Record<string, string>) => new Request("http://localhost/api/coach", { headers });
    expect(clientAddress(bare({ "x-forwarded-for": " 198.51.100.1 , 10.0.0.1" }))).toBe("198.51.100.1");
    expect(clientAddress(bare({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientAddress(bare({}))).toBe("unknown");
  });
});

describe("the token bucket", () => {
  it("lets a burst up to its capacity through, then refuses until tokens refill", () => {
    const time = clock();
    const bucket = tokenBucket({ capacity: 3, refillPerSecond: 1, now: time.now });
    expect([bucket.take("a"), bucket.take("a"), bucket.take("a")]).toEqual([true, true, true]);
    expect(bucket.take("a")).toBe(false);
    time.advance(999);
    expect(bucket.take("a")).toBe(false);
    time.advance(1);
    expect(bucket.take("a")).toBe(true);
    expect(bucket.take("a")).toBe(false);
  });

  it("keeps one bucket per address", () => {
    const bucket = tokenBucket({ capacity: 1, refillPerSecond: 1, now: clock().now });
    expect(bucket.take("a")).toBe(true);
    expect(bucket.take("a")).toBe(false);
    expect(bucket.take("b")).toBe(true);
  });

  it("never fills past its capacity however long an address was away", () => {
    const time = clock();
    const bucket = tokenBucket({ capacity: 2, refillPerSecond: 1, now: time.now });
    bucket.take("a");
    time.advance(60_000);
    expect([bucket.take("a"), bucket.take("a"), bucket.take("a")]).toEqual([true, true, false]);
  });

  it("says how long until the next token", () => {
    const time = clock();
    const bucket = tokenBucket({ capacity: 1, refillPerSecond: 0.5, now: time.now });
    bucket.take("a");
    expect(bucket.retryAfterSeconds("a")).toBe(2);
  });

  it("forgets addresses whose buckets are full again, so memory stays bounded", () => {
    const time = clock();
    const bucket = tokenBucket({ capacity: 1, refillPerSecond: 1, now: time.now, maxAddresses: 2 });
    bucket.take("a");
    bucket.take("b");
    time.advance(5_000);
    bucket.take("c");
    expect(bucket.size()).toBeLessThanOrEqual(2);
  });
});

describe("the API guard", () => {
  const guard = (capacity = 2) => {
    const time = clock();
    return { time, check: apiGuard({ bucket: tokenBucket({ capacity, refillPerSecond: 1, now: time.now }) }) };
  };

  it("lets a same-origin request through", () => {
    expect(guard().check(request("/api/coach", { origin: SITE }))).toBeUndefined();
  });

  it("answers 403 to a cross-origin request", async () => {
    const answer = guard().check(request("/api/coach", { origin: "https://evil.example" }));
    expect(answer?.status).toBe(403);
    expect(await answer?.json()).toEqual({ error: "cross-origin requests are refused" });
  });

  it("answers 429 with Retry-After once one address sends a burst", async () => {
    const { check } = guard(2);
    const same = () => check(request("/api/story", { origin: SITE }));
    expect(same()).toBeUndefined();
    expect(same()).toBeUndefined();
    const answer = same();
    expect(answer?.status).toBe(429);
    expect(answer?.headers.get("retry-after")).toBe("1");
    expect(await answer?.json()).toEqual({ error: "too many requests from this address; try again shortly" });
    // Another address is not held up by the first one's burst.
    expect(check(request("/api/story", { origin: SITE, "cf-connecting-ip": "198.51.100.9" }))).toBeUndefined();
  });

  it("leaves the health check alone, for Coolify and Docker, whoever asks and however often", () => {
    const { check } = guard(1);
    for (let i = 0; i < 5; i++) expect(check(request("/api/health", {}, "GET"))).toBeUndefined();
  });

  it("does not spend a token on a request it refuses as cross-origin", () => {
    const { check } = guard(1);
    expect(check(request("/api/coach", { origin: "https://evil.example" }))?.status).toBe(403);
    expect(check(request("/api/coach", { origin: SITE }))).toBeUndefined();
  });
});
