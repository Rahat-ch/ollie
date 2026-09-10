#!/usr/bin/env node
// Licence audit for the dependency tree. Zero dependencies; Node ESM.
//
//   node scripts/third-party.mjs            print the dependency table (Markdown) to stdout
//   node scripts/third-party.mjs --check    exit 1 on any copyleft, weak-copyleft, or unrecognised licence
//   node scripts/third-party.mjs --write    regenerate the table in THIRD_PARTY.md between the markers
//   ... --strict                            ignore REVIEWED_EXCEPTIONS (show what would fail without them)
//
// Data comes from `pnpm licenses list --json --long`, which covers dependencies,
// devDependencies, and optionalDependencies of the installed tree.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const THIRD_PARTY_FILE = path.join(ROOT, "THIRD_PARTY.md");
const BEGIN_MARKER = "<!-- BEGIN:deps -->";
const END_MARKER = "<!-- END:deps -->";

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

// Exact SPDX identifiers (case-sensitive; "UNLICENSED" is deliberately not "Unlicense").
const PERMISSIVE = new Set([
  "MIT",
  "MIT-0",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "Apache-2.0",
  "0BSD",
  "CC0-1.0",
  "Unlicense",
  "BlueOak-1.0.0",
  "Python-2.0",
  "PSF-2.0",
  "CC-BY-4.0",
  "CC-BY-3.0",
  "Zlib",
  "WTFPL",
]);

// File-level ("weak") copyleft. Permits use from proprietary code, but modified
// files of the library itself must be released. Fails --check by default; a
// package can be allowed only through REVIEWED_EXCEPTIONS below.
const WEAK_COPYLEFT_PREFIXES = ["MPL-", "EPL-", "CDDL-", "CPL-"];

// Strong copyleft. Always fails --check unless explicitly excepted.
const COPYLEFT_PREFIXES = ["GPL-", "LGPL-", "AGPL-", "SSPL-", "EUPL-", "CC-BY-SA-", "OSL-"];

// Ranked by restrictiveness so that AND takes the max and OR takes the min.
const RANK = { permissive: 0, unknown: 1, "weak-copyleft": 2, copyleft: 3 };
const LABEL = {
  permissive: "permissive",
  unknown: "needs review (unrecognised licence)",
  "weak-copyleft": "weak copyleft (file-level)",
  copyleft: "copyleft",
};

// Per-package exceptions that --check accepts even though the classifier fails
// them. Each entry applies only while the package still reports exactly the
// listed licence, so a licence change re-fails the check. `match` is an exact
// name or a prefix ending in `*`. Every exception is printed on every run and
// listed in THIRD_PARTY.md; delete an entry to make the check fail again.
const REVIEWED_EXCEPTIONS = [
  {
    match: "lightningcss",
    licence: "MPL-2.0",
    reason:
      "CSS transformer required by Tailwind CSS v4 (`@tailwindcss/node`) and Vite (via `vitest`). Build-time tool, unmodified; MPL-2.0 copyleft covers only modified MPL files, none of which exist here. Not shipped to the browser.",
  },
  {
    match: "lightningcss-*",
    licence: "MPL-2.0",
    reason: "Platform binary for `lightningcss` (see above). Build-time only, unmodified.",
  },
  {
    match: "axe-core",
    licence: "MPL-2.0",
    reason:
      "Accessibility rule engine used only by `eslint-plugin-jsx-a11y` (a devDependency via `eslint-config-next`) at lint time. Unmodified; never part of the built app.",
  },
];

function classifyIdentifier(rawId) {
  let id = rawId.trim();
  if (id.endsWith("+")) id = id.slice(0, -1);
  if (PERMISSIVE.has(id)) return "permissive";
  if (COPYLEFT_PREFIXES.some((p) => id.startsWith(p))) return "copyleft";
  if (WEAK_COPYLEFT_PREFIXES.some((p) => id.startsWith(p))) return "weak-copyleft";
  return "unknown";
}

// Minimal SPDX expression evaluator: OR (lowest precedence), AND, parentheses,
// and `WITH <exception>` (the exception is ignored for classification).
function classifyExpression(expression) {
  if (typeof expression !== "string" || expression.trim() === "") return "unknown";
  const tokens = expression.match(/\(|\)|[^\s()]+/g) ?? [];
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const isOp = (t, op) => typeof t === "string" && t.toUpperCase() === op;

  function parsePrimary() {
    const t = next();
    if (t === undefined) throw new Error("unexpected end");
    if (t === "(") {
      const inner = parseOr();
      if (next() !== ")") throw new Error("missing )");
      return inner;
    }
    if (t === ")" || isOp(t, "AND") || isOp(t, "OR") || isOp(t, "WITH")) {
      throw new Error(`unexpected token ${t}`);
    }
    const category = classifyIdentifier(t);
    if (isOp(peek(), "WITH")) {
      next();
      if (next() === undefined) throw new Error("missing exception after WITH");
    }
    return category;
  }
  function parseAnd() {
    let result = parsePrimary();
    while (isOp(peek(), "AND")) {
      next();
      const rhs = parsePrimary();
      if (RANK[rhs] > RANK[result]) result = rhs;
    }
    return result;
  }
  function parseOr() {
    let result = parseAnd();
    while (isOp(peek(), "OR")) {
      next();
      const rhs = parseAnd();
      if (RANK[rhs] < RANK[result]) result = rhs;
    }
    return result;
  }

  try {
    const result = parseOr();
    if (pos !== tokens.length) return "unknown";
    return result;
  } catch {
    return "unknown";
  }
}

function findException(name, licence) {
  return REVIEWED_EXCEPTIONS.find(
    (e) =>
      e.licence === licence &&
      (e.match.endsWith("*") ? name.startsWith(e.match.slice(0, -1)) : name === e.match),
  );
}

// ---------------------------------------------------------------------------
// Data collection
// ---------------------------------------------------------------------------

function runPnpmLicenses() {
  let stdout;
  try {
    stdout = execFileSync("pnpm", ["licenses", "list", "--json", "--long"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    const detail = [error.stderr, error.stdout].filter(Boolean).join("\n").trim();
    throw new Error(`\`pnpm licenses list --json --long\` failed:\n${detail || error.message}`);
  }
  let data;
  try {
    data = JSON.parse(stdout);
  } catch {
    throw new Error(`could not parse pnpm licenses output as JSON:\n${stdout.slice(0, 500)}`);
  }
  // Shape: { "<licence>": [{ name, versions, paths, license, homepage, ... }, ...], ... }
  return Object.values(data).flat();
}

function normaliseRepositoryUrl(repository) {
  const raw = typeof repository === "string" ? repository : repository?.url;
  if (typeof raw !== "string" || raw === "") return undefined;
  let url = raw.trim();
  const shorthand = url.match(/^(?:github:)?([\w.-]+\/[\w.-]+)$/);
  if (shorthand) return `https://github.com/${shorthand[1]}`;
  url = url.replace(/^git\+/, "").replace(/\.git$/, "");
  url = url.replace(/^git:\/\//, "https://").replace(/^ssh:\/\/git@/, "https://");
  url = url.replace(/^git@([^:]+):/, "https://$1/");
  return /^https?:\/\//.test(url) ? url : undefined;
}

function sourceUrl(pkg) {
  const manifestPath = pkg.paths?.[0] && path.join(pkg.paths[0], "package.json");
  if (manifestPath && existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      const repo = normaliseRepositoryUrl(manifest.repository);
      if (repo) return repo;
    } catch {
      // fall through to homepage
    }
  }
  return typeof pkg.homepage === "string" && pkg.homepage !== "" ? pkg.homepage : "";
}

function collect(options) {
  const packages = runPnpmLicenses()
    .map((pkg) => {
      const licence = typeof pkg.license === "string" ? pkg.license : String(pkg.license ?? "");
      const category = classifyExpression(licence);
      const exception = category === "permissive" ? undefined : findException(pkg.name, licence);
      return {
        name: pkg.name,
        versions: [...(pkg.versions ?? [])].sort(compareVersions),
        licence,
        category,
        exception: options.strict ? undefined : exception,
        url: sourceUrl(pkg),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name) || a.licence.localeCompare(b.licence));
  return packages;
}

function compareVersions(a, b) {
  const pa = a.split(/[.-]/);
  const pb = b.split(/[.-]/);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const na = Number(pa[i]);
    const nb = Number(pb[i]);
    if (Number.isNaN(na) || Number.isNaN(nb)) {
      const cmp = String(pa[i] ?? "").localeCompare(String(pb[i] ?? ""));
      if (cmp !== 0) return cmp;
    } else if (na !== nb) {
      return na - nb;
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const escapeCell = (text) => String(text).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

function renderTable(packages) {
  const lines = ["| Package | Version(s) | Licence | Source |", "| --- | --- | --- | --- |"];
  for (const pkg of packages) {
    lines.push(
      `| \`${escapeCell(pkg.name)}\` | ${escapeCell(pkg.versions.join(", "))} | ${escapeCell(pkg.licence)} | ${escapeCell(pkg.url)} |`,
    );
  }
  return lines.join("\n");
}

function licenceCounts(packages) {
  const counts = new Map();
  for (const pkg of packages) counts.set(pkg.licence, (counts.get(pkg.licence) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function renderGeneratedSection(packages) {
  const exceptions = packages.filter((p) => p.exception);
  const lines = [
    `Generated by \`node scripts/third-party.mjs --write\` from \`pnpm licenses list --json --long\`: ${packages.length} packages (dependencies, devDependencies, and optionalDependencies). Do not edit by hand.`,
    "",
    `Licence counts: ${licenceCounts(packages)
      .map(([licence, count]) => `${licence} ${count}`)
      .join(", ")}.`,
    "",
  ];
  if (exceptions.length > 0) {
    lines.push(
      "**Reviewed exceptions.** The following transitive packages are under MPL-2.0, a file-level weak copyleft licence that the hackathon terms do not prohibit (they name GPL, LGPL, AGPL, and SSPL). Each is an unmodified build-time or lint-time tool; none is bundled into shipped code. They are recorded in `REVIEWED_EXCEPTIONS` in `scripts/third-party.mjs`; removing an entry makes `pnpm licenses:check` fail.",
      "",
    );
    for (const pkg of exceptions) {
      lines.push(`- \`${pkg.name}\` ${pkg.versions.join(", ")} (${pkg.licence}): ${pkg.exception.reason}`);
    }
    lines.push("");
  }
  lines.push(renderTable(packages));
  return lines.join("\n");
}

function writeThirdPartyFile(packages) {
  if (!existsSync(THIRD_PARTY_FILE)) throw new Error(`${THIRD_PARTY_FILE} does not exist`);
  const original = readFileSync(THIRD_PARTY_FILE, "utf8");
  const begin = original.indexOf(BEGIN_MARKER);
  const end = original.indexOf(END_MARKER);
  if (begin === -1 || end === -1 || end < begin) {
    throw new Error(`THIRD_PARTY.md must contain ${BEGIN_MARKER} followed by ${END_MARKER}`);
  }
  const updated =
    original.slice(0, begin + BEGIN_MARKER.length) +
    "\n" +
    renderGeneratedSection(packages) +
    "\n" +
    original.slice(end);
  writeFileSync(THIRD_PARTY_FILE, updated);
  return updated !== original;
}

function printSummary(packages, log) {
  const counts = licenceCounts(packages);
  log(`Licence audit: ${packages.length} packages (dependencies, devDependencies, optionalDependencies)`);
  log(`  ${counts.map(([licence, count]) => `${licence} ${count}`).join(", ")}`);

  const permissive = packages.filter((p) => p.category === "permissive");
  const excepted = packages.filter((p) => p.category !== "permissive" && p.exception);
  const failing = packages.filter((p) => p.category !== "permissive" && !p.exception);

  log(`  permissive: ${permissive.length}`);
  if (excepted.length > 0) {
    log(`  reviewed exceptions (allowed via REVIEWED_EXCEPTIONS in scripts/third-party.mjs): ${excepted.length}`);
    for (const pkg of excepted) {
      log(`    ! ${pkg.name}@${pkg.versions.join(",")}  ${pkg.licence}  [${LABEL[pkg.category]}]`);
    }
  }
  if (failing.length > 0) {
    log(`  FAILING: ${failing.length}`);
    for (const pkg of failing) {
      log(`    x ${pkg.name}@${pkg.versions.join(",")}  ${pkg.licence || "(no licence field)"}  [${LABEL[pkg.category]}]`);
    }
    log("");
    log("  Only permissive licences are allowed. MPL-2.0 is file-level (weak) copyleft and is");
    log("  rejected by default; GPL/LGPL/AGPL/SSPL/EUPL/CC-BY-SA/OSL are copyleft; anything");
    log("  unrecognised needs a human to read the licence. To accept a reviewed package, add it");
    log("  to REVIEWED_EXCEPTIONS in scripts/third-party.mjs with a written justification.");
  }
  return failing;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(argv) {
  const flags = new Set(argv);
  const known = new Set(["--check", "--write", "--strict"]);
  const unknownFlags = [...flags].filter((f) => !known.has(f));
  if (unknownFlags.length > 0) {
    console.error(`unknown option(s): ${unknownFlags.join(" ")}`);
    console.error("usage: node scripts/third-party.mjs [--check | --write] [--strict]");
    return 2;
  }
  const mode = flags.has("--check") ? "check" : flags.has("--write") ? "write" : "table";
  const log = mode === "table" ? console.error : console.log;

  let packages;
  try {
    packages = collect({ strict: flags.has("--strict") });
  } catch (error) {
    console.error(`third-party: ${error.message}`);
    return 2;
  }

  if (mode === "table") {
    console.log(renderTable(packages));
    printSummary(packages, log);
    return 0;
  }

  if (mode === "write") {
    let changed;
    try {
      changed = writeThirdPartyFile(packages);
    } catch (error) {
      console.error(`third-party: ${error.message}`);
      return 2;
    }
    printSummary(packages, log);
    log(changed ? `Updated ${path.relative(ROOT, THIRD_PARTY_FILE)}` : `${path.relative(ROOT, THIRD_PARTY_FILE)} already up to date`);
    return 0;
  }

  const failing = printSummary(packages, log);
  if (failing.length > 0) {
    log("");
    log(`Licence check FAILED: ${failing.length} package(s) are not permissively licensed.`);
    return 1;
  }
  log("Licence check passed: every package is permissively licensed or a reviewed exception.");
  return 0;
}

process.exitCode = main(process.argv.slice(2));
