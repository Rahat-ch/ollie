import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fakeGeneration } from "@/generation/fake";
import { NICKNAME_PLACEHOLDER } from "@/story/nickname";
import { addToPool, poolKey, type PoolInput } from "@/story/pool";
import { templateStory } from "@/story/template";
import { storyFor } from "./story-service";

const addTo = (left: number, right: number): PoolInput => ({
  skill: "result-unknown",
  structure: "add-to",
  equation: { left, op: "+", right, result: left + right, unknown: "result" },
  answer: left + right,
  theme: "puppies",
});

const pooled = `${NICKNAME_PLACEHOLDER} has 7 puppies in the yard. 5 more puppies run in, so how many puppies are there now?`;

/** A writer that counts its calls and answers with a valid Story that names its numbers. */
function countingWriter() {
  let calls = 0;
  return {
    calls: () => calls,
    writeStory: async (input: { equation: { left: number; right: number } }) => {
      calls += 1;
      return { text: `${NICKNAME_PLACEHOLDER} has ${input.equation.left} puppies. ${input.equation.right} more puppies come, so how many puppies are there now?` };
    },
  };
}

const neverCalled = fakeGeneration({
  writeStory: async () => {
    throw new Error("writeStory was called on a Pool hit");
  },
});

describe("the story service", () => {
  let dir: string;
  let poolFile: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "ollie-pool-"));
    poolFile = path.join(dir, "stories.json");
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it("answers from the bundled Pool with no call and no file", async () => {
    const bundled = addToPool({}, addTo(7, 5), pooled);
    expect(await storyFor({ poolFile, writer: neverCalled, bundled }, addTo(7, 5))).toEqual({ text: pooled, source: "pool" });
    await expect(readFile(poolFile, "utf8")).rejects.toThrow();
  });

  it("writes a missing variant live, adds it to the file, and answers from the file next time", async () => {
    const writer = countingWriter();
    const first = await storyFor({ poolFile, writer, bundled: {} }, addTo(7, 5));
    expect(first.source).toBe("generated");
    expect(JSON.parse(await readFile(poolFile, "utf8"))).toEqual({ [poolKey(addTo(7, 5))]: [first.text] });

    const again = await storyFor({ poolFile, writer: neverCalled, bundled: {} }, addTo(7, 5));
    expect(again).toEqual({ text: first.text, source: "pool" });
    expect(writer.calls()).toBe(1);
  });

  it("keeps every Story when a Session's misses are written at once", async () => {
    const writer = countingWriter();
    const inputs = [addTo(7, 5), addTo(8, 4), addTo(9, 3), addTo(6, 6), addTo(5, 7), addTo(4, 8)];
    const answers = await Promise.all(inputs.map((input) => storyFor({ poolFile, writer, bundled: {} }, input)));
    expect(answers.every((a) => a.source === "generated")).toBe(true);
    const file = JSON.parse(await readFile(poolFile, "utf8"));
    expect(Object.keys(file).sort()).toEqual(inputs.map(poolKey).sort());
  });

  it("answers with the template and leaves no file when the writer fails", async () => {
    const failing = fakeGeneration({
      writeStory: async () => {
        throw new Error("ANTHROPIC_API_KEY is not set");
      },
    });
    const answer = await storyFor({ poolFile, writer: failing, bundled: {} }, addTo(7, 5));
    expect(answer).toEqual({ text: templateStory({ ...addTo(7, 5), nickname: NICKNAME_PLACEHOLDER }), source: "template" });
    await expect(readFile(poolFile, "utf8")).rejects.toThrow();
  });
});
