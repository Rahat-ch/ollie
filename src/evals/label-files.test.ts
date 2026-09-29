import { mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readLabelFiles, readLabels, writeLabels } from "./label-files";
import { emptyLabelFile, withLabel, type LabelFile } from "./labels";
import { finalRun, SEALED_SPLIT } from "./sealed";

const everything = finalRun("the label files' own tests");
const scratch = () => mkdtempSync(path.join(tmpdir(), "labels-"));

const allStories = (labeller: string): LabelFile<"stories"> =>
  Array.from({ length: 20 }, (_, i) => `c${String(i + 1).padStart(2, "0")}`).reduce((file, id) => withLabel(file, { id, pass: true }), emptyLabelFile("stories", labeller));

describe("label files on disk", () => {
  it("write one file per set and labeller, and read it back whole in a final run", () => {
    const dir = scratch();
    expect(path.basename(writeLabels(allStories("second"), dir))).toBe("stories.second.json");
    expect(readLabels("stories", "second", everything, dir)).toEqual(allStories("second"));
  });

  it("drop every label on a sealed item when read for tuning", () => {
    const dir = scratch();
    writeLabels(allStories("second"), dir);
    const tuning = readLabels("stories", "second", "tuning", dir);
    expect(tuning.labels.map((l) => l.id)).toEqual(SEALED_SPLIT.sets.stories.open);
    const [file] = readLabelFiles("tuning", dir);
    expect(file.labels.map((l) => l.id)).toEqual(SEALED_SPLIT.sets.stories.open);
  });

  it("give an empty file to a labeller who has not started", () => {
    expect(readLabels("claims", "second", everything, scratch())).toEqual(emptyLabelFile("claims", "second"));
  });

  it("read every label file and nothing else in the directory, and refuse one whose contents contradict its name", () => {
    const dir = scratch();
    writeLabels(allStories("owner"), dir);
    writeLabels(emptyLabelFile("claims", "second"), dir);
    writeFileSync(path.join(dir, "claims.json"), "{}");
    writeFileSync(path.join(dir, "split.json"), "{}");
    expect(readLabelFiles(everything, dir).map((f) => `${f.set}.${f.labeller}`)).toEqual(["claims.second", "stories.owner"]);
    writeFileSync(path.join(dir, "summaries.third.json"), JSON.stringify(emptyLabelFile("summaries", "fourth")));
    expect(() => readLabelFiles(everything, dir)).toThrow(/fourth/);
    expect(readdirSync(dir)).toHaveLength(5);
  });

  it("the committed owner labels hold a verdict for every Story and Summary", () => {
    const files = readLabelFiles(everything);
    const owner = (set: string) => files.find((f) => f.set === set && f.labeller === "owner");
    expect(owner("stories")?.labels).toHaveLength(20);
    expect(owner("summaries")?.labels).toHaveLength(10);
  });
});
