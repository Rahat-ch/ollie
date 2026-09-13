# Deploying Ollie

Ollie runs as a Docker container built by Coolify on the Hetzner host, behind Cloudflare DNS, at <https://ollie.rahatcodes.com>. Never Vercel.

For a guided first-time setup, run `scripts/deploy-wizard.sh`; this page is the reference behind it.

## How Coolify builds it

- **Source:** the GitHub repo `Rahat-ch/ollie`, branch `main`. Every push triggers a redeploy once the GitHub App webhook is connected.
- **Build Pack:** `Dockerfile` (the one at the repo root). Coolify runs `docker build` with the repo as context; `.dockerignore` keeps `node_modules`, `.next`, `.env*`, `data/`, tests, and docs out of the context.
- **Port:** `3000`. The image sets `HOSTNAME=0.0.0.0 PORT=3000` and `EXPOSE 3000`; tell Coolify to expose port 3000 so Traefik routes to it.
- **Domain:** `https://ollie.rahatcodes.com`. Coolify's Traefik obtains a Let's Encrypt certificate for it and redirects HTTP to HTTPS.
- **Health check:** path `/api/health` on port 3000. It returns `{ ok, audioDir, audioDirWritable }`. The image also declares a Docker `HEALTHCHECK` on the same path, so `docker ps` shows `healthy` / `unhealthy` without any Coolify configuration. If Coolify's own health check settings are enabled for the resource, point them at the same path; a failing Coolify health check keeps the new container from being marked live.

The build is multi-stage: `deps` installs from the frozen lockfile with the pnpm version pinned in `package.json`'s `packageManager` field, `builder` runs `pnpm build` to produce Next's standalone output, and `runner` copies only `.next/standalone`, `.next/static`, and `public/` into a `node:24-alpine` image that runs as the non-root `nextjs` user (uid 1001).

## Persistent volume for audio

Generated speech is written under `AUDIO_DIR`, which the image sets to `/data/audio`. That directory must be a volume, otherwise every redeploy starts with an empty store and every Nickname line is re-rendered through ElevenLabs. Only the lines with the Nickname in them live there, one file per line named after a non-cryptographic hash of what the line says. That hash is an address, not a hiding place: the line has the Nickname in it and the audio says it aloud, so treat the volume as holding what a Learner is called. Nothing on it ties a line to a Profile. The fixed lines are rendered at build time into `public/voice/` and ship inside the image.

| Setting | Value |
| --- | --- |
| Volume name | `ollie-audio` |
| Mount path in the container | `/data/audio` |

In Coolify, open the resource and find the persistent storage tab (Coolify calls these "Storages" or "Persistent Storage"). Add a **volume mount** with name `ollie-audio` and destination `/data/audio`. Do not use a bind mount to a host path unless you also manage its ownership; the volume mount is what survives.

Why it survives redeploys: a Coolify redeploy builds a new image and replaces the container, but named Docker volumes live outside any container. Coolify re-attaches the same named volume (`ollie-audio`) to the new container on every deploy, so files written before the redeploy are still at `/data/audio` afterwards. Only deleting the resource, or removing the volume by hand, loses the data. The image pre-creates `/data/audio` owned by `nextjs`, so an empty volume is writable on first boot.

## Environment variables (Coolify only)

Set these in the resource's environment variables tab. Secrets live only here: they are never committed, never in `.dockerignore`d `.env*` files that reach the image, and never passed as build args.

| Variable | Required | Value |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | for Stories, Coach, Summary (optional at boot) | from <https://console.anthropic.com/settings/keys> |
| `ELEVENLABS_API_KEY` | for Ollie's voice (optional at boot) | from the ElevenLabs dashboard, profile / API keys |
| `ELEVENLABS_VOICE_ID` | for Ollie's voice (optional at boot) | the voice ID `pnpm voice:design --save <preview id>` prints; the voice is never named in the code |
| `ELEVENLABS_MODEL_ID` | no | defaults to `eleven_v3`; set it to `eleven_flash_v2_5` for a cheaper render with no audio tags |
| `AUDIO_DIR` | no | defaults to `/data/audio` inside the image; set it only if you change the volume mount path |

Without `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` the speech route answers 503 and the browser falls through the chain (bundled fixed line, platform speech synthesis, the line on screen), so the app runs, speaks the bundled lines, and never blocks; only the lines with the Nickname in them go quiet. Mark the two API keys as runtime (not build-time) variables if Coolify asks; the build does not need them. Locally the app defaults `AUDIO_DIR` to `./data/audio` (git-ignored).

## Cloudflare DNS and TLS

1. **DNS record.** In the `rahatcodes.com` zone, add an `A` record with name `ollie` pointing at the Hetzner host's public IPv4. Proxy status: **DNS only** (grey cloud) for the first deploy, so Traefik's HTTP-01 challenge on port 80 reaches the origin unmodified and Let's Encrypt issues the certificate.
2. **Proxy and SSL/TLS mode, after the first successful deploy.** Once <https://ollie.rahatcodes.com> serves a valid Let's Encrypt certificate, switch the record to **Proxied** (orange cloud) and set the zone's SSL/TLS mode to **Full (strict)**. Strict verification works because the origin certificate is valid, and it avoids the redirect loop that **Flexible** causes when Traefik redirects HTTP to HTTPS.
3. **Certificate issuance gotcha.** If the proxy was turned on before the certificate existed, the challenge can fail when the zone forces HTTPS at the edge ("Always Use HTTPS", or an HTTPS redirect rule). If Coolify reports a certificate error or the site serves Traefik's self-signed default cert:
   - switch the `ollie` record back to **DNS only**, redeploy or wait for Traefik to retry, confirm the Let's Encrypt cert, then switch back to **Proxied**; or
   - keep the proxy on and use SSL/TLS mode **Full** (not strict) until the origin certificate is in place, then move to **Full (strict)**.

## Running the image locally

Docker is required (it is not installed on the Mac Mini used for development, so this is for another machine or CI).

```sh
docker build -t ollie .
docker run --rm -p 3000:3000 -v ollie-audio:/data/audio \
  -e ANTHROPIC_API_KEY=... -e ELEVENLABS_API_KEY=... -e ELEVENLABS_VOICE_ID=... ollie
```

Then open <http://localhost:3000> and <http://localhost:3000/api/health>; the health payload should show `"audioDir": "/data/audio"` and `"audioDirWritable": true`. The keys are only needed once routes that call the vendors exist; the placeholder page runs without them.

## Verifying the volume survives a redeploy

Either of these proves the volume is real and re-attached:

**By file.** On the Hetzner host (or through Coolify's terminal for the container):

```sh
docker exec <container> sh -c 'echo probe > /data/audio/.redeploy-probe && ls -la /data/audio'
```

Trigger a redeploy in Coolify, wait for it to finish, then:

```sh
docker exec <new-container> ls -la /data/audio   # .redeploy-probe is still there
```

Remove the probe file afterwards. If it is missing, the mount was not a named volume, or the destination path is not exactly `/data/audio`.

**What the health check does and does not prove.** <https://ollie.rahatcodes.com/api/health> returns 503 with `"audioDirWritable": false` when the mount is not writable by uid 1001, which happens when a host-path bind mount was used instead of the named volume. A `true` only proves the directory is writable: an anonymous volume, or no volume at all, is writable too. Only the probe file above proves the data survives a redeploy.
