import { describe, expect, it } from "vitest";
import { BUNDLED_POOL } from "./bundled";
import { NICKNAME_PLACEHOLDER } from "./nickname";
import { poolKey, type PoolInput } from "./pool";
import { storyShape } from "./shapes";
import { validateStory } from "./validate";

/** The input a key stands for, read back from the key itself. */
function inputOf(key: string): PoolInput {
  const match = key.match(/^([a-z]+)\/([a-z-]+)\/([a-z-]+)\/(\d+)([+-])(\d+)=(\d+)$/);
  if (!match) throw new Error(`not a Pool key: ${key}`);
  const [, theme, skill, structure, left, op, right, result] = match;
  const unknown = storyShape(structure).equation(1, 1).unknown;
  const equation = { left: Number(left), op: op as "+" | "-", right: Number(right), result: Number(result), unknown };
  return { theme: theme as PoolInput["theme"], skill: skill as PoolInput["skill"], structure, equation, answer: equation[unknown] };
}

describe("the bundled Content Pool", () => {
  it("holds only Stories the validator accepts, under keys that say what they are for, with the Nickname placeholder", () => {
    for (const [key, variants] of Object.entries(BUNDLED_POOL)) {
      const input = inputOf(key);
      expect(poolKey(input)).toBe(key);
      expect(variants.length).toBeGreaterThan(0);
      for (const text of variants) {
        expect(validateStory(text, { ...input, nickname: NICKNAME_PLACEHOLDER }), `${key}: ${text}`).toEqual({ ok: true });
      }
    }
  });
});
