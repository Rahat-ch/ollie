import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Every relative link in the README and the docs it sends a reader to
 * resolves: the file or folder exists, and a `#fragment` into a Markdown
 * file names one of its headings (GitHub's anchor rules).
 */
const root = fileURLToPath(new URL("..", import.meta.url));

const DOCS = [
  "README.md",
  "docs/develop.md",
  "docs/voice.md",
  "docs/powers.md",
  "docs/deploy.md",
  "docs/evals/README.md",
  "docs/evals/evidence.md",
  "docs/evals/preregistration-1.md",
];

/** The Markdown with fenced code blocks and inline code spans taken out. */
function prose(markdown: string): string {
  return markdown.replace(/^```[\s\S]*?^```/gm, "").replace(/`[^`\n]*`/g, "");
}

function links(markdown: string): string[] {
  const text = prose(markdown);
  const inline = [...text.matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1]);
  const references = [...text.matchAll(/^\[[^\]]+\]:\s*(\S+)/gm)].map((m) => m[1]);
  return [...inline, ...references].filter((target) => !/^[a-z]+:/i.test(target));
}

/** GitHub's heading anchors, with -1, -2 for repeats. */
function anchors(markdown: string): Set<string> {
  const seen = new Map<string, number>();
  const result = new Set<string>();
  for (const m of markdown.replace(/^```[\s\S]*?^```/gm, "").matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const slug = m[1]
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/\s/g, "-");
    const count = seen.get(slug) ?? 0;
    seen.set(slug, count + 1);
    result.add(count === 0 ? slug : `${slug}-${count}`);
  }
  return result;
}

describe("documentation links", () => {
  for (const doc of DOCS) {
    it(`every relative link in ${doc} resolves`, () => {
      const source = resolve(root, doc);
      const markdown = readFileSync(source, "utf8");
      const broken: string[] = [];
      for (const target of links(markdown)) {
        const [path, fragment] = target.split("#");
        const file = path ? resolve(dirname(source), decodeURI(path)) : source;
        if (!existsSync(file)) {
          broken.push(`${target}: no such file`);
          continue;
        }
        if (fragment && file.endsWith(".md") && !anchors(readFileSync(file, "utf8")).has(fragment)) {
          broken.push(`${target}: no such heading`);
        }
      }
      expect(broken).toEqual([]);
    });
  }
});
