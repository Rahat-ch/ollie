# 05: The model routes can't be used to run up the bill

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 1 › Abuse guard; `.scratch/harness/decisions.md` #4, 20, 29; §4.8; read the Next 16 docs on `proxy.ts` in `node_modules/next/dist/docs/` first; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** Four protections guard the model routes. The public app keeps working with no captcha.
- **Origin check:** a request from another origin gets 403.
- **Rate limit:** one address sending a burst gets 429.
- **Daily spend cap:** $5 a day, summed from the telemetry's per-call cost. Past it, the Coach and Summary routes answer as unreachable, so the device uses the Baseline Plan and the template Summary. The Story and speech routes fall back the same way. It resets at midnight UTC.
- **Cloudflare:** a rate-limiting rule is set up by hand at the edge and written down in the deploy guide, with the owner doing the dashboard step.

**Blocked by:** 04

**Status:** resolved

- [x] Route or proxy tests show 403 cross-origin, 429 on a burst, and the unavailable answer past the cap
- [x] A same-origin Session in the browser tests plays through untouched
- [x] The cap resets at midnight UTC (tested with an injected clock)
- [x] The deploy guide documents the Cloudflare rule and the cap; curl commands showing 403 and 429 against the live site are captured for ticket 10 (captured against the local production build; the live capture waits for the deploy, see Comments)

## Comments

**2026-09-28, implementation.** Test first through the proxy and route seams, with fakes: no model call, no key. `src/lib/abuse-guard.test.ts` covers the origin check, the client address, the token bucket on an injected millisecond clock, and the guard as a whole (403, 429 with `Retry-After`, health untouched, a refused cross-origin request spends no token); `src/proxy.test.ts` drives the exported `proxy` with a `NextRequest` (next, 403, 429 on request 61, health). `src/lib/spend-cap.test.ts` covers the daily allowance on an injected clock: closed at the limit, still closed at 23:59:59.999 UTC, open at 00:00:00 UTC, UTC days rather than local ones, and the telemetry adapter's pricing. `src/app/api/spend-cap.test.ts` posts to the four real `POST` handlers with the Anthropic adapter mocked as the Generation fake reporting $2 a call and ElevenLabs as a stubbed fetch, on a faked system date: three calls take the day to $6, then the Coach and the Summary answer 503 with the cap's reason and call nothing, the Story route answers the template, a line already on the volume is still voiced and a new one is 503, and moving the clock to midnight UTC opens the Coach again. The files were not committed red separately.

The proxy. `src/proxy.ts` (Next 16's renamed Middleware, Node.js runtime by default, `matcher: "/api/:path*"`) calls `serverApiGuard()` from `src/lib/abuse-guard.ts` and returns its refusal or `NextResponse.next()`. `/api/health` is skipped inside the guard, so Coolify and the Docker `HEALTHCHECK` work with no Origin. Same origin is judged by the `Origin` header's host and port against `X-Forwarded-Host`, else `Host`; the scheme is not compared, because TLS ends at Cloudflare and Traefik. A request with no Origin (or `null`) is refused: every current browser sends Origin on a POST, same-origin ones included, so the app's page always has one. That stops a bare script, not one that forges the header, which is what the bucket and the cap are for. The bucket is per address, 60 requests of burst and 1 a second after, keyed on `CF-Connecting-IP`, then the first `X-Forwarded-For`, then `X-Real-IP`, then one shared `unknown` key; full buckets are pruned past 10,000 addresses. The bucket and the spend counts live on `globalThis` under `Symbol.for` keys, so every route and the proxy share one count however the server's bundles load the modules (the Proxy docs warn against relying on module globals); the curl burst below confirms the bucket persists across requests in the standalone server.

The cap. `src/lib/spend-cap.ts`: `dailyAllowance({ limit, now })` resets when the UTC date of `now()` changes; `spendTelemetry(allowance)` is a `Telemetry` whose `record` adds `callDollars(call)`, or, for a model with no published rate, every token at the dearest rate in the table, so the cap errs high. `modelRoute` checks the shared `modelSpend()` after the key and answers 503 `CAP_REACHED` past $5, and hands the operation that telemetry (a fourth `run` argument), which the Coach and Summary routes pass to `anthropicGeneration`. The Story route's writer fails at once past the cap, so `fillStory` answers the Pool or the template, and its calls are priced the same way. The device already reads 503 as `ModelUnavailableError`, so no device change was needed: past the cap a Session gets the Baseline Plan and the template Summary.

Decided here, not in the spec: the speech route has its own allowance, 20,000 ElevenLabs characters a day (reset at midnight UTC on the same clock), counted before each render is sent, because the telemetry prices Anthropic tokens and has no price for a character (it depends on the plan). A render is also refused once the dollar cap is spent, so past $5 the app spends on no vendor until midnight UTC. A line already on the volume is always served. The refusal is inside the renderer, so the route answers its existing 503 "could not render" and the device falls through the Speech Chain as before. The caps are constants, not environment variables. The two `e2e/voice.spec.ts` tests that post straight to `/api/speech` now send the app's Origin, and `e2e/guard.spec.ts` checks the 403s and that the site's own Origin reaches the route; the 429 is left to unit tests because every browser spec shares one address. The comments in `telemetry.ts` and `anthropic.ts` that said the routes record nothing are updated.

Verified with `pnpm typecheck`, `pnpm lint`, `pnpm test` (711), `pnpm build` (lists `ƒ Proxy (Middleware)`), and `pnpm test:e2e --project=desktop-chrome` (31 of 31, including the same-origin Sessions in `session.spec.ts`, `coach.spec.ts` and `voice.spec.ts`).

**For ticket 10: curl against the local production build, not the live site.** This agent cannot deploy, so the capture below is from `pnpm build` and the standalone server (`node .next/standalone/server.js` on port 3210, the artefact the Dockerfile ships). The same commands against <https://ollie.rahatcodes.com> are in `docs/deploy.md` › Checking the guard from outside, and the live capture is taken after this is deployed.

```
$ curl -si -X POST http://localhost:3210/api/coach -H "Origin: https://evil.example" -H "Content-Type: application/json" -d "{}"
HTTP/1.1 403 Forbidden
content-type: application/json

{"error":"cross-origin requests are refused"}

$ for i in $(seq 1 62); do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3210/api/story -H "Origin: http://localhost:3210" -H "Content-Type: application/json" -d "{}"; done | sort | uniq -c
  60 400
   2 429

$ curl -si -X POST http://localhost:3210/api/story -H "Origin: http://localhost:3210" -H "Content-Type: application/json" -d "{}"
HTTP/1.1 429 Too Many Requests
content-type: application/json
retry-after: 1

{"error":"too many requests from this address; try again shortly"}

$ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3210/api/health
200
```

**For the owner, by hand.** The Cloudflare rate-limiting rule is not something the repo can set: follow `docs/deploy.md` › Cloudflare rate-limiting rule (Security › WAF › Rate limiting rules; `/api/*` except `/api/health` on `ollie.rahatcodes.com`, 50 requests per 10 seconds per IP, Block for 10 seconds). Also worth doing: a monthly spend limit in the Anthropic console as the hard stop behind the in-memory cap, and, optionally, a host firewall that only lets Cloudflare's ranges reach ports 80 and 443, since a request that bypasses Cloudflare can set `CF-Connecting-IP` itself.
