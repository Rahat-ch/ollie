#!/usr/bin/env node
// After `pnpm build`: fail if LangGraph code is in the browser's bundle, or
// the eval's LangSmith code is in either bundle. The Coach graph
// (src/coach/graph.ts, ADR 0004) is server only; nothing a page loads may
// import it. LangSmith experiments and tracing are `pnpm eval` only (ADR
// 0002); nothing the app loads may import them. Zero dependencies; Node ESM.
//
//   node scripts/bundle-check.mjs
//
// The markers are string literals LangGraph's own code carries, which
// survive minification. The check first finds them in the server's bundle,
// so a LangGraph upgrade that drops them fails here instead of passing
// with nothing to find.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLIENT = path.join(ROOT, ".next", "static");
const SERVER = path.join(ROOT, ".next", "server");
const MARKERS = ["__pregel_", "__error_handler__", "NodeTimeoutError"];

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? files(full) : /\.m?js$/.test(name) ? [full] : [];
  });
}

/** Every marker each file under `dir` carries. */
function findings(dir) {
  return files(dir).flatMap((file) => {
    const text = readFileSync(file, "utf8");
    return MARKERS.filter((marker) => text.includes(marker)).map((marker) => ({ file: path.relative(ROOT, file), marker }));
  });
}

if (!existsSync(CLIENT) || !existsSync(SERVER)) {
  console.error("No .next build found; run pnpm build first.");
  process.exit(1);
}

const server = new Set(findings(SERVER).map(({ marker }) => marker));
const missing = MARKERS.filter((marker) => !server.has(marker));
if (missing.length > 0) {
  console.error(`The server bundle does not carry ${missing.join(", ")}: update the markers in scripts/bundle-check.mjs.`);
  process.exit(1);
}

const client = findings(CLIENT);
if (client.length > 0) {
  console.error("LangGraph code is in the browser's bundle:");
  for (const { file, marker } of client) console.error(`  ${file}: ${marker}`);
  process.exit(1);
}
console.log(`Client bundle check passed: ${files(CLIENT).length} browser files, no LangGraph code (it is in the server's bundle only).`);

// The eval's LangSmith code (experiments, the Anthropic wrapper, our own
// src/evals/langsmith) is eval only (ADR 0002): it must be in neither
// bundle, server or browser. LangGraph's own tracer, which `@langchain/core`
// brings in and which is off unless LANGSMITH_TRACING is set, is not what
// this looks for. Each marker is first found in its source, so the check
// cannot pass by looking for a string that no longer exists.
const EVAL_ONLY = [
  { marker: "Starting evaluation of experiment", source: "node_modules/langsmith/dist/evaluation/_runner.js" },
  { marker: "This instance of Anthropic client has been already wrapped once.", source: "node_modules/langsmith/dist/wrappers/anthropic.js" },
  { marker: "ollie-simulated-learners-v", source: "src/evals/langsmith/experiment.ts" },
];
for (const { marker, source } of EVAL_ONLY) {
  const full = path.join(ROOT, source);
  if (!existsSync(full) || !readFileSync(full, "utf8").includes(marker)) {
    console.error(`${source} no longer carries "${marker}": update EVAL_ONLY in scripts/bundle-check.mjs.`);
    process.exit(1);
  }
}
const evalOnly = [...files(SERVER), ...files(CLIENT)].flatMap((file) => {
  const text = readFileSync(file, "utf8");
  return EVAL_ONLY.filter(({ marker }) => text.includes(marker)).map(({ marker }) => ({ file: path.relative(ROOT, file), marker }));
});
if (evalOnly.length > 0) {
  console.error("The eval's LangSmith code is in the app's bundle:");
  for (const { file, marker } of evalOnly) console.error(`  ${file}: ${marker}`);
  process.exit(1);
}
console.log("Eval-only check passed: no LangSmith experiment, wrapper or eval tracing code in the server or browser bundle.");
