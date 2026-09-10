# 01: Scaffold, Dockerfile, deploy to ollie.rahatcodes.com

**What to build:** A visitor opens ollie.rahatcodes.com and sees a placeholder Ollie page served from the user's Coolify host behind Cloudflare. The repo has a Next.js app with TypeScript, a unit test runner, a browser test runner, lint, a Dockerfile that Coolify builds, a persistent volume mounted for generated audio, and a THIRD_PARTY file started with the initial dependencies. Never Vercel.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `ollie.rahatcodes.com` serves the app over HTTPS via Coolify with Cloudflare DNS
- [ ] A Dockerfile builds a production image; a named volume is mounted for audio and survives redeploys
- [ ] Unit tests, browser tests, and lint each run with one command and pass on the empty app
- [ ] THIRD_PARTY.md exists at the root listing every dependency and its licence; no copyleft licences present
- [ ] Secrets are read from environment variables only; none are committed
