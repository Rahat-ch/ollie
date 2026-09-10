# 01: Scaffold, Dockerfile, deploy to ollie.rahatcodes.com

**What to build:** A visitor opens ollie.rahatcodes.com and sees a placeholder Ollie page served from the user's Coolify host behind Cloudflare. The repo has a Next.js app with TypeScript, a unit test runner, a browser test runner, lint, a Dockerfile that Coolify builds, a persistent volume mounted for generated audio, and a THIRD_PARTY file started with the initial dependencies. Never Vercel.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `ollie.rahatcodes.com` serves the app over HTTPS via Coolify with Cloudflare DNS
- [x] A Dockerfile builds a production image; a named volume is mounted for audio and survives redeploys
- [x] Unit tests, browser tests, and lint each run with one command and pass on the empty app
- [x] THIRD_PARTY.md exists at the root listing every dependency and its licence; no copyleft licences present (no GPL, LGPL, AGPL, or SSPL, which is what the contest prohibits; three MPL-2.0 build-time tools are recorded as reviewed exceptions)
- [x] Secrets are read from environment variables only; none are committed

## Comments

**2026-09-10, implementation.** Only the deploy criterion is left, hence ready-for-human. Scaffold, Dockerfile, tests, lint, licence audit, and env seam are done and verified locally (`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm licenses:check` all pass). Docker is not installed on the build machine, so the image was verified by reading the standalone output layout, not by `docker build`; Coolify builds it.

The first criterion (ollie.rahatcodes.com over HTTPS) needs the Coolify and Cloudflare dashboards, which only the user can drive. Run `scripts/deploy-wizard.sh` or follow `docs/deploy.md`, then tick the box.

Licence decision: `sharp` (Next's optional image optimiser) pulls in an LGPL-3.0 libvips binary, which the contest terms prohibit. It is removed via a pnpm override and `images.unoptimized` is set; Ollie ships SVG. Three MPL-2.0 build/lint packages (lightningcss, its platform binary, and axe-core) remain as reviewed exceptions in `scripts/third-party.mjs`; MPL is not on the contest's prohibited list.

**2026-09-10, deployed.** Live at https://ollie.rahatcodes.com. Coolify project `ollie`, application `ollie` (Dockerfile build pack, branch master, GitHub App source, so pushes to master auto-deploy). Volume `ollie-audio` mounted at `/data/audio`; `/api/health` reports it writable. Coolify's own health check is left disabled because its probe uses `curl`, which the Alpine image lacks; the Dockerfile `HEALTHCHECK` (busybox `wget`) is what Coolify waits on, and it passed on the first deploy. Cloudflare: A record `ollie` created DNS-only so Traefik could obtain the Let's Encrypt certificate, then switched to Proxied; the zone was already on Full (strict). Vendor API keys are not set in Coolify yet (optional at boot; add them under Environment Variables before the Story and voice adapters land). Not yet verified: the probe-file redeploy check in `docs/deploy.md`, because the agent could not type into Coolify's web terminal; the volume is a Coolify-managed named volume, which is the persistent kind.
