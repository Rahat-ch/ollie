/**
 * ADR 0002: no route sends anything to a tracing or evaluation service.
 * Walks every module the app can load at run time, from every file under
 * src/app and the proxy, following static imports, re-exports and dynamic
 * `import()` (the routes load their adapters lazily), and fails if any of
 * them imports `langsmith`, the eval's LangSmith modules, or wraps a client
 * for tracing. LangGraph's own dependency on `langsmith` (through
 * `@langchain/core`) is inert unless `LANGSMITH_TRACING` is set, which it
 * never is in production; what this test holds is that no code of ours
 * turns it on or calls it.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../../..");
const SRC = path.join(ROOT, "src");

/** Where the app starts: every page, layout and route under src/app, and the proxy on /api/*. */
function appEntries(): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) return walk(full);
      return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [full] : [];
    });
  return [...walk(path.join(SRC, "app")), path.join(SRC, "proxy.ts")];
}

const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)["']([^"']+)["']/g;

/** Every module specifier a source file names, type-only imports included (they are erased, but naming one is still a mistake here). */
function specifiers(source: string): string[] {
  return [...source.matchAll(SPECIFIER)].map((match) => match[1]);
}

/** A specifier resolved to one of our files, or null for a package. */
function resolve(from: string, specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? path.join(SRC, specifier.slice(2))
    : specifier.startsWith(".")
      ? path.resolve(path.dirname(from), specifier)
      : null;
  if (base === null) return null;
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
  return candidates.find((file) => existsSync(file) && statSync(file).isFile()) ?? null;
}

/** Every file of ours reachable from the entries, and every package any of them names. */
function reach(entries: readonly string[]): { readonly files: Set<string>; readonly packages: Map<string, string> } {
  const files = new Set<string>();
  const packages = new Map<string, string>();
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (files.has(file)) continue;
    files.add(file);
    if (!/\.(ts|tsx|js|mjs)$/.test(file)) continue;
    for (const specifier of specifiers(readFileSync(file, "utf8"))) {
      const target = resolve(file, specifier);
      if (target) queue.push(target);
      else if (!specifier.startsWith(".") && !specifier.startsWith("@/")) packages.set(specifier, path.relative(ROOT, file));
    }
  }
  return { files, packages };
}

const TRACING_WORDS = /\b(traceable|wrapAnthropic|wrapSDK|getCurrentRunTree|LANGSMITH_\w+|LANGCHAIN_TRACING\w*)\b/;

/** A file's code without its comments: the Coach graph's header may say tracing stays off, its code may not name it. */
const code = (file: string): string =>
  readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

describe("no route imports the tracing client", () => {
  const { files, packages } = reach(appEntries());
  const relative = [...files].map((file) => path.relative(ROOT, file));

  it("walks the whole app, the lazily loaded Coach graph and Anthropic adapter included, so it cannot pass by looking at nothing", () => {
    expect(relative).toContain("src/app/api/coach/route.ts");
    expect(relative).toContain("src/coach/graph.ts");
    expect(relative).toContain("src/generation/anthropic.ts");
    expect(relative).toContain("src/app/play/page.tsx");
    expect(packages.has("@langchain/langgraph")).toBe(true);
  });

  it("imports no langsmith module anywhere the app can reach", () => {
    const langsmith = [...packages].filter(([specifier]) => specifier === "langsmith" || specifier.startsWith("langsmith/"));
    expect(langsmith).toEqual([]);
  });

  it("reaches none of the eval's LangSmith modules, nor the eval itself", () => {
    expect(relative.filter((file) => file.startsWith("src/evals/langsmith/") || file.startsWith("src/cli/"))).toEqual([]);
  });

  it("wraps no client and sets no tracing variable in any file the app can reach", () => {
    const offending = [...files].filter((file) => TRACING_WORDS.test(code(file)));
    expect(offending.map((file) => path.relative(ROOT, file))).toEqual([]);
    // And the words are found where they are used, so the pattern is not looking for nothing.
    expect(TRACING_WORDS.test(code(path.join(SRC, "evals/langsmith/tracing.ts")))).toBe(true);
    expect(TRACING_WORDS.test(code(path.join(SRC, "evals/langsmith/tracing-config.ts")))).toBe(true);
  });

  it("would catch it: the same walk from the eval commands finds langsmith", () => {
    const evalSide = reach([path.join(SRC, "cli/eval.ts"), path.join(SRC, "cli/eval-langsmith.ts")]);
    expect([...evalSide.packages.keys()].some((specifier) => specifier.startsWith("langsmith"))).toBe(true);
    expect([...evalSide.files].some((file) => file.includes(`${path.sep}langsmith${path.sep}tracing.ts`))).toBe(true);
  });
});

describe("the eval command", () => {
  it("loads LangSmith only when tracing is on: nothing from it is imported at the top of the file", () => {
    const source = readFileSync(path.join(SRC, "cli/eval.ts"), "utf8");
    const topLevel = source.split("\n").filter((line) => /^import\s/.test(line));
    expect(topLevel.filter((line) => /langsmith/.test(line) && !/tracing-config/.test(line))).toEqual([]);
    expect(source).toMatch(/await import\("@\/evals\/langsmith\/tracing"\)/);
  });
});
