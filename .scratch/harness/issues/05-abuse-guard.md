# 05: The model routes can't be used to run up the bill

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 1 › Abuse guard; `.scratch/harness/decisions.md` #4, 20, 29; §4.8; read the Next 16 docs on `proxy.ts` in `node_modules/next/dist/docs/` first; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** Four protections guard the model routes. The public app keeps working with no captcha.
- **Origin check:** a request from another origin gets 403.
- **Rate limit:** one address sending a burst gets 429.
- **Daily spend cap:** $5 a day, summed from the telemetry's per-call cost. Past it, the Coach and Summary routes answer as unreachable, so the device uses the Baseline Plan and the template Summary. The Story and speech routes fall back the same way. It resets at midnight UTC.
- **Cloudflare:** a rate-limiting rule is set up by hand at the edge and written down in the deploy guide, with the owner doing the dashboard step.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Route or proxy tests show 403 cross-origin, 429 on a burst, and the unavailable answer past the cap
- [ ] A same-origin Session in the browser tests plays through untouched
- [ ] The cap resets at midnight UTC (tested with an injected clock)
- [ ] The deploy guide documents the Cloudflare rule and the cap; curl commands showing 403 and 429 against the live site are captured for ticket 10
