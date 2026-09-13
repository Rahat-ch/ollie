import { describe, expect, it } from "vitest";
import { createRng, getSkill } from "@/loop";
import type { StoryInput } from "@/generation/types";
import { THEMES } from "@/profile/identity";
import { NICKNAME_PLACEHOLDER } from "./nickname";
import { templateStory } from "./template";
import { validateStory } from "./validate";

const UNIT_3 = [getSkill("result-unknown"), getSkill("change-unknown")];

/** Every Theme, every Unit 3 structure, a handful of seeded number draws. */
function inputs(nickname: string): StoryInput[] {
  return THEMES.flatMap(({ id: theme }) =>
    UNIT_3.flatMap((skill) =>
      skill.structures.flatMap((structure) =>
        [0, 1, 2, 3].map((i): StoryInput => {
          const draft = skill.generate(createRng(`${theme}-${structure}-${i}`), { range: skill.standardRange, structures: [structure] });
          return { skill: skill.id, structure, equation: draft.equation, answer: draft.answer, theme, nickname };
        }),
      ),
    ),
  );
}

describe("templateStory", () => {
  it("is a valid Story for every Theme and structure, so the fallback never fails the validator", () => {
    for (const input of inputs("Mia")) {
      expect(validateStory(templateStory(input), input)).toEqual({ ok: true });
    }
  });

  it("writes the Pool's placeholder form as well", () => {
    for (const input of inputs(NICKNAME_PLACEHOLDER)) {
      expect(validateStory(templateStory(input), input)).toEqual({ ok: true });
    }
  });

  const addTo = (left: number, right: number): StoryInput => ({
    skill: "result-unknown",
    structure: "add-to",
    equation: { left, op: "+", right, result: left + right, unknown: "result" },
    answer: left + right,
    theme: "puppies",
    nickname: "Mia",
  });

  it("reads as a word problem in the Theme, with the Nickname, the numbers, and a question", () => {
    expect(templateStory(addTo(7, 5))).toBe("Mia has 7 puppies. 5 more puppies come, so how many puppies are there now?");
  });

  it("says one thing in the singular, so it never says 1 puppies", () => {
    expect(templateStory(addTo(1, 5))).toBe("Mia has 1 puppy. 5 more puppies come, so how many puppies are there now?");
    expect(templateStory(addTo(5, 1))).toBe("Mia has 5 puppies. 1 more puppy comes, so how many puppies are there now?");
    const change: StoryInput = {
      ...addTo(6, 5),
      skill: "change-unknown",
      structure: "take-from-change",
      equation: { left: 6, op: "-", right: 5, result: 1, unknown: "right" },
      answer: 5,
    };
    expect(templateStory(change)).toBe("Mia had 6 puppies. Now there is 1 puppy, so how many puppies went away?");
    expect(validateStory(templateStory(change), change)).toEqual({ ok: true });
  });

  it("counts the Theme's second thing on request, so a second valid Story is one call away", () => {
    const input = inputs("Mia").find((i) => i.theme === "space" && i.structure === "take-from-change")!;
    expect(templateStory(input)).toContain("rockets");
    expect(templateStory(input, 1)).toContain("stars");
    expect(validateStory(templateStory(input, 1), input)).toEqual({ ok: true });
  });
});
