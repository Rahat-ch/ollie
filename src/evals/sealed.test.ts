import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LABEL_SETS } from "./labels";
import {
  claimItems,
  finalRun,
  readable,
  SEALED_SPLIT,
  sealHalf,
  sealSplit,
  SPLIT_SEED,
  storyCalibrationSet,
  summaryCalibrationSet,
} from "./sealed";

const everything = finalRun("the tests of the seal itself");

describe("sealHalf", () => {
  it("seals half of the ids at random with the seed, the same half every time", () => {
    const ids = Array.from({ length: 20 }, (_, i) => `c${i + 1}`);
    const split = sealHalf(ids, "seed");
    expect(split.sealed).toHaveLength(10);
    expect(split.open).toHaveLength(10);
    expect([...split.open, ...split.sealed].sort()).toEqual([...ids].sort());
    expect(sealHalf(ids, "seed")).toEqual(split);
    expect(sealHalf(ids, "another seed")).not.toEqual(split);
  });

  it("keeps each half in the set's own order, and puts the odd one out in the open half", () => {
    const split = sealHalf(["a", "b", "c", "d", "e"], "seed");
    expect(split.sealed).toHaveLength(2);
    expect(split.open).toHaveLength(3);
    for (const half of [split.open, split.sealed]) expect(half).toEqual([...half].sort());
  });
});

describe("the committed split", () => {
  it("seals half of the 20 Stories, the 10 Summaries and the 100 claims", () => {
    expect(SEALED_SPLIT.seed).toBe(SPLIT_SEED);
    expect(SEALED_SPLIT.sets.stories.sealed).toHaveLength(10);
    expect(SEALED_SPLIT.sets.summaries.sealed).toHaveLength(5);
    expect(SEALED_SPLIT.sets.claims.sealed).toHaveLength(50);
  });

  it("is exactly the seeded split of the sets' ids, so nobody chose which items to seal", () => {
    const ids = {
      stories: storyCalibrationSet(everything).map((s) => s.id),
      summaries: summaryCalibrationSet(everything).map((s) => s.id),
      claims: claimItems(everything).map((c) => c.id),
    };
    expect(sealSplit(ids, SPLIT_SEED)).toEqual(SEALED_SPLIT);
  });
});

describe("reading a set", () => {
  it("gives tuning code the open half only, of every set", () => {
    for (const set of LABEL_SETS) {
      const items = { stories: storyCalibrationSet, summaries: summaryCalibrationSet, claims: claimItems }[set]("tuning");
      expect(items.map((item) => item.id), set).toEqual(SEALED_SPLIT.sets[set].open);
      for (const item of items) expect(SEALED_SPLIT.sets[set].sealed, set).not.toContain(item.id);
    }
  });

  it("gives a final run both halves, in the set's order", () => {
    expect(storyCalibrationSet(everything)).toHaveLength(20);
    expect(summaryCalibrationSet(everything)).toHaveLength(10);
    expect(claimItems(everything)).toHaveLength(100);
  });

  it("refuses an item the split does not know, so a new item cannot slip in unsealed", () => {
    expect(() => readable("stories", [{ id: "c99" }], "tuning")).toThrow(/split/);
    expect(() => readable("stories", [{ id: "c99" }], everything)).toThrow(/split/);
  });

  it("refuses a final run with no reason given", () => {
    expect(() => finalRun("  ")).toThrow(/reason/);
  });
});

/**
 * The seal holds only if nothing reaches around it, so the source is read
 * here: the sets and their labels are imported by the seal alone, and only
 * the named final runs may ask for the sealed half.
 */
describe("nothing reads the sealed half outside a final run", () => {
  const SRC = "src";
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return files(full);
      return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : [];
    });
  const source = files(SRC).map((file) => ({ file: file.split(path.sep).join("/"), text: readFileSync(file, "utf8") }));

  /** The Eval Run (whose Judge gate Pre-registration 1 fixes on the whole of both sets) and the labelling page (which labels every item). */
  const FINAL_RUNS = ["src/evals/evals.ts", "src/cli/label.ts"];

  it("calls finalRun only in the named final runs", () => {
    const callers = source.filter(({ file, text }) => file !== "src/evals/sealed.ts" && /\bfinalRun\s*\(/.test(text)).map(({ file }) => file);
    expect(callers.sort()).toEqual([...FINAL_RUNS].sort());
  });

  it("imports the Calibration Sets, the claim set and the label files in the seal and nowhere else", () => {
    const readers = source
      .filter(({ text }) => /from\s+["'](?:\.\/|@\/evals\/)calibration["']/.test(text) || /from\s+["'][^"']*docs\/evals\/labels\//.test(text))
      .map(({ file }) => file);
    expect(readers).toEqual(["src/evals/sealed.ts"]);
  });

  it("reads label files from disk only through the one reader, which filters by access", () => {
    const readers = source.filter(({ file, text }) => file !== "src/evals/labels.ts" && /\bLABELS_DIR\b/.test(text)).map(({ file }) => file);
    expect(readers).toEqual(["src/evals/label-files.ts"]);
  });
});
