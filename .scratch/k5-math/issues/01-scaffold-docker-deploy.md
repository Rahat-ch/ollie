# 01: Scaffold, Dockerfile, deploy to ollie.rahatcodes.com

**What to build:** A visitor opens ollie.rahatcodes.com and sees a placeholder Ollie page served from the user's Coolify host behind Cloudflare. The repo has a Next.js app with TypeScript, a unit test runner, a browser test runner, lint, a Dockerfile that Coolify builds, a persistent volume mounted for generated audio, and a THIRD_PARTY file started with the initial dependencies. Never Vercel.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human (deploy step only; everything else done 2026-09-10)

- [ ] `ollie.rahatcodes.com` serves the app over HTTPS via Coolify with Cloudflare DNS
- [x] A Dockerfile builds a production image; a named volume is mounted for audio and survives redeploys
- [x] Unit tests, browser tests, and lint each run with one command and pass on the empty app
- [x] THIRD_PARTY.md exists at the root listing every dependency and its licence; no copyleft licences present
- [x] Secrets are read from environment variables only; none are committed

## Comments

**2026-09-10, implementation.** Scaffold, Dockerfile, tests, lint, licence audit, and env seam are done and verified locally (`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm licenses:check` all pass). Docker is not installed on the build machine, so the image was verified by reading the standalone output layout, not by `docker build`; Coolify builds it.

The first criterion (ollie.rahatcodes.com over HTTPS) needs the Coolify and Cloudflare dashboards, which only the user can drive. Run `scripts/deploy-wizard.sh` or follow `docs/deploy.md`, then tick the box.

Licence decision: `sharp` (Next's optional image optimiser) pulls in an LGPL-3.0 libvips binary, which the contest terms prohibit. It is removed via a pnpm override and `images.unoptimized` is set; Ollie ships SVG. Three MPL-2.0 build/lint tools (lightningcss, axe-core) remain as reviewed exceptions in `scripts/third-party.mjs`; MPL is not on the contest's prohibited list.
