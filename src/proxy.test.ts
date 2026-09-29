import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { BURST_REQUESTS } from "@/lib/abuse-guard";
import { config, proxy } from "./proxy";

const SITE = "https://ollie.rahatcodes.com";

const request = (path: string, headers: Record<string, string>, method = "POST") =>
  new NextRequest(`http://0.0.0.0:3000${path}`, { method, headers: { host: "ollie.rahatcodes.com", ...headers } });

describe("the proxy", () => {
  it("runs on the API routes only", () => {
    expect(config.matcher).toBe("/api/:path*");
  });

  it("passes a same-origin request on to its route", () => {
    const answer = proxy(request("/api/coach", { origin: SITE, "cf-connecting-ip": "198.51.100.1" }));
    expect(answer.headers.get("x-middleware-next")).toBe("1");
  });

  it("answers 403 to another site's page", () => {
    expect(proxy(request("/api/coach", { origin: "https://evil.example", "cf-connecting-ip": "198.51.100.2" })).status).toBe(403);
  });

  it(`answers 429 once one address has sent a burst of more than ${BURST_REQUESTS}`, () => {
    const burst = Array.from({ length: BURST_REQUESTS + 1 }, () =>
      proxy(request("/api/story", { origin: SITE, "cf-connecting-ip": "198.51.100.3" })).status,
    );
    expect(burst.slice(0, BURST_REQUESTS).every((status) => status === 200)).toBe(true);
    expect(burst.at(-1)).toBe(429);
  });

  it("lets the health check through with no Origin", () => {
    expect(proxy(request("/api/health", {}, "GET")).headers.get("x-middleware-next")).toBe("1");
  });
});
