# syntax=docker/dockerfile:1
#
# Production image for Ollie (Next.js 16, output: "standalone").
# Built by Coolify with the "Dockerfile" build pack; see docs/deploy.md.
#
# No secrets are baked in. ANTHROPIC_API_KEY and ELEVENLABS_API_KEY are
# runtime environment variables set in Coolify. There are deliberately no
# build args for secrets: anything passed at build time ends up in image
# layers, and the app only needs the keys at request time.
#
# node:24-alpine keeps the image small; nothing native compiles at install
# time (`sharp` is removed via the pnpm override in pnpm-workspace.yaml, and
# lightningcss ships musl binaries). Switch to node:24-bookworm-slim only if a
# future native dependency lacks a musl build.

ARG NODE_IMAGE=node:24-alpine

# ── deps: install the full dependency tree from the frozen lockfile ────────
FROM ${NODE_IMAGE} AS deps
WORKDIR /app

# libc6-compat is the standard Alpine shim for the few Node native modules
# that link against glibc symbols (documented in the Next.js Docker example).
RUN apk add --no-cache libc6-compat

# pnpm comes from Corepack, which reads the exact version pinned in the
# `packageManager` field of package.json (pnpm@10.28.2 at time of writing),
# so this stage never drifts from what the lockfile was written with.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable pnpm

# pnpm-workspace.yaml carries `ignoredBuiltDependencies`, which pnpm needs at
# install time to know not to run sharp/unrs-resolver postinstall scripts.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── builder: produce .next/standalone ──────────────────────────────────────
FROM ${NODE_IMAGE} AS builder
WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during the build (and keep it off in the runner).
ENV NEXT_TELEMETRY_DISABLED=1

# The repo has no public/ directory yet. `mkdir -p` guarantees the path
# exists so the runner's COPY below never fails; once real static assets are
# added under public/ they are picked up automatically by the same COPY.
RUN mkdir -p public && pnpm build

# ── runner: minimal runtime image ──────────────────────────────────────────
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    AUDIO_DIR=/data/audio

# Non-root runtime user. uid/gid 1001 match the Next.js reference image, and
# are what the Coolify volume's files end up owned by.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs nextjs

# Standalone output layout (verified against `pnpm build` on Next 16.3.4):
#   .next/standalone/server.js        minimal production server
#   .next/standalone/package.json
#   .next/standalone/node_modules/    only the traced runtime dependencies
#   .next/standalone/.next/           server bundles + manifests
#   .next/static/                     client assets, NOT included in
#                                     standalone; copied in explicitly below
#   public/                           created empty in the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/public        ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static  ./.next/static

# Persistent audio store. Coolify mounts the `ollie-audio` volume here; the
# directory is pre-created and owned by the runtime user so the first write
# succeeds even on a fresh, empty volume.
RUN mkdir -p /data/audio && chown -R nextjs:nodejs /data
VOLUME ["/data/audio"]

USER nextjs

EXPOSE 3000

# Alpine's busybox wget is enough for a local liveness probe. /api/health
# returns { ok, audioDir, audioDirWritable }; a non-2xx status fails the check.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
