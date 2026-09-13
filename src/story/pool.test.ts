import { describe, expect, it } from "vitest";
import { fakeGeneration } from "@/generation/fake";
import type { StoryInput } from "@/generation/types";
import { NICKNAME_PLACEHOLDER, withNickname } from "./nickname";
import { addToPool, fillStory, poolKey, poolVariants, type ContentPool, type PoolInput } from "./pool";
import { templateStory } from "./template";
import { validateStory } from "./validate";

const input: PoolInput = {
  skill: "result-unknown",
  structure: "add-to",
  equation: { left: 7, op: "+", right: 5, result: 12, unknown: "result" },
  answer: 12,
  theme: "puppies",
};
const placeholder: StoryInput = { ...input, nickname: NICKNAME_PLACEHOLDER };

const pooled = `${NICKNAME_PLACEHOLDER} has 7 puppies in the yard. 5 more puppies run in, so how many puppies are there now?`;
const second = `${NICKNAME_PLACEHOLDER} sees 7 puppies. 5 more puppies come to play, so how many puppies are there now?`;

/** A writer that must not be called: the Pool had what was needed. */
const neverCalled = fakeGeneration({
  writeStory: async () => {
    throw new Error("writeStory was called on a Pool hit");
  },
});

describe("the Content Pool", () => {
  it("is keyed by Theme, Skill, structure, and the engine's numbers, never by Nickname", () => {
    expect(poolKey(input)).toBe("puppies/result-unknown/add-to/7+5=12");
    expect(poolKey({ ...input, theme: "space" })).not.toBe(poolKey(input));
  });

  it("grows by one variant at a time without repeating a Story", () => {
    let pool: ContentPool = {};
    pool = addToPool(pool, input, pooled);
    pool = addToPool(pool, input, second);
    pool = addToPool(pool, input, pooled);
    expect(poolVariants(pool, input)).toEqual([pooled, second]);
    expect(poolVariants(pool, { ...input, theme: "space" })).toEqual([]);
  });

  it("fills a Story from the Pool with no live call when a variant exists, by variant number", async () => {
    const pool = addToPool(addToPool({}, input, pooled), input, second);
    const first = await fillStory(pool, neverCalled, input, 0);
    expect(first).toEqual({ text: pooled, source: "pool", pool });
    expect((await fillStory(pool, neverCalled, input, 1)).text).toBe(second);
    expect((await fillStory(pool, neverCalled, input, 2)).text).toBe(pooled);
  });

  it("generates a missing variant live with the placeholder as the Nickname and adds it to the Pool", async () => {
    let calls = 0;
    const generation = fakeGeneration({
      writeStory: async (story) => {
        calls += 1;
        expect(story.nickname).toBe(NICKNAME_PLACEHOLDER);
        return { text: pooled };
      },
    });
    const filled = await fillStory({}, generation, input);
    expect(filled.text).toBe(pooled);
    expect(filled.source).toBe("generated");
    expect(poolVariants(filled.pool, input)).toEqual([pooled]);
    expect(calls).toBe(1);

    const again = await fillStory(filled.pool, neverCalled, input);
    expect(again.source).toBe("pool");
  });

  it("falls back to the template sentence when generation fails, and leaves the Pool as it was", async () => {
    const failing = fakeGeneration({
      writeStory: async () => {
        throw new Error("no key");
      },
    });
    const filled = await fillStory({}, failing, input);
    expect(filled).toEqual({ text: templateStory(placeholder), source: "template", pool: {} });
    expect(withNickname(filled.text, "Mia")).toBe(templateStory({ ...input, nickname: "Mia" }));
  });

  it("fills a valid, distinct Story on the Generation fake, so play on the fake reads as a Story and not the template", async () => {
    const filled = await fillStory({}, fakeGeneration(), input);
    expect(filled.source).toBe("generated");
    expect(validateStory(filled.text, placeholder)).toEqual({ ok: true });
    expect(filled.text).not.toBe(templateStory(placeholder));
  });
});
