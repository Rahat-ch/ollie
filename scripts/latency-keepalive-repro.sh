#!/usr/bin/env bash
# A connection that goes silent without a FIN or a RST, which localhost
# cannot produce: the kernel always answers there. This runs the Coach call
# of scripts/latency-repro.ts in Docker (Linux, node:24-alpine), on a network
# where the server can be unplugged. Server one takes the request and never
# answers; five seconds in it is disconnected from the network, so the
# client's packets to it go nowhere. Server two, answering at once, takes
# over the name `api`, so the SDK's retry, on a new socket, finds it. What
# ends the first attempt is then whatever the client's own socket settings
# say. Undici turns TCP keep-alive on for every socket (60 s idle), and
# libuv sets 1 s between probes and 10 probes; on macOS the same values
# were read off a live socket of Node 24.13.
#
#   bash scripts/latency-keepalive-repro.sh
#
# About 75 s. Needs Docker and the node:24-alpine image. No model is called.
# Writes docs/evals/latency-keepalive-repro-<time>.json.
set -euo pipefail
cd "$(dirname "$0")/.."

work=$(mktemp -d)
tag="ollie-lat-$$"
cleanup() {
  docker rm -f "$tag-client" "$tag-s1" "$tag-s2" >/dev/null 2>&1 || true
  docker network rm "$tag" "$tag-spare" >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT

esbuild=$(ls -d node_modules/.pnpm/esbuild@*/node_modules/esbuild | head -1)
node -e '
  const [esbuild, out] = process.argv.slice(1);
  require(require("path").resolve(esbuild)).buildSync({
    entryPoints: ["scripts/latency-repro.ts"], bundle: true, platform: "node", format: "cjs", target: "node24",
    alias: { "@": "./src" }, outfile: out, logLevel: "warning",
  });
' "$esbuild" "$work/repro.cjs"

# Fixed addresses, so server two never inherits server one's and answers its probes with a RST.
docker network create --subnet 172.31.207.0/24 "$tag" >/dev/null
docker network create --subnet 172.31.208.0/24 "$tag-spare" >/dev/null
docker run -d --name "$tag-s1" --network "$tag" --ip 172.31.207.10 --network-alias api -v "$work:/w:ro" node:24-alpine node /w/repro.cjs --serve hang >/dev/null
docker run -d --name "$tag-s2" --network "$tag-spare" -v "$work:/w:ro" node:24-alpine node /w/repro.cjs --serve answer >/dev/null
sleep 2
docker run -d --name "$tag-client" --network "$tag" --ip 172.31.207.30 -e ANTHROPIC_BASE_URL=http://api:8080 -v "$work:/w" \
  node:24-alpine node /w/repro.cjs --call keepalive-silent-drop --out /w/result.json >/dev/null

sleep 5
docker network disconnect "$tag" "$tag-s1"
docker network connect --ip 172.31.207.20 --alias api "$tag" "$tag-s2"
echo "$(date -u +%T) server one unplugged, server two answering as api; waiting for the client"

docker wait "$tag-client" >/dev/null
docker logs "$tag-client"
out="docs/evals/latency-keepalive-repro-$(date -u +%Y-%m-%dT%H-%M-%SZ).json"
cp "$work/result.json" "$out"
echo "Wrote $out"
