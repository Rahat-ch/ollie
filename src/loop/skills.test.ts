import { describe, expect, it } from "vitest";
import { createRng } from "@/loop/random";
import { SKILLS } from "@/loop/skills";
import type { Equation } from "@/loop/types";

const SEEDS = 2000;

/** Independent arithmetic: does the filled-in Equation actually hold? */
function holds({ left, op, right, result }: Equation): boolean {
  return op === "+" ? left + right === result : left - right === result;
}

describe.each(SKILLS.map((s) => [s.id, s] as const))("Skill %s", (_, skill) => {
  const drafts = Array.from({ length: SEEDS }, (_, i) =>
    skill.generate(createRng(`property-${i}`), {
      range: skill.defaultRange,
      structures: skill.structures,
    }),
  );

  it("never emits a Problem whose answer differs from its own arithmetic", () => {
    for (const draft of drafts) {
      expect(holds(draft.equation)).toBe(true);
      expect(draft.answer).toBe(draft.equation[draft.equation.unknown]);
    }
  });

  it("keeps every answer on the 0 to 20 number pad", () => {
    for (const draft of drafts) {
      expect(draft.answer).toBeGreaterThanOrEqual(0);
      expect(draft.answer).toBeLessThanOrEqual(20);
    }
  });

  it("uses every one of its structures", () => {
    expect(new Set(drafts.map((d) => d.structure))).toEqual(new Set(skill.structures));
  });

  it("has a hand-written Hint with no numbers in it, so it can be voiced once", () => {
    expect(skill.hint.length).toBeGreaterThan(20);
    expect(skill.hint).not.toMatch(/\d/);
  });

  it("has a default range inside its standard's range", () => {
    expect(skill.defaultRange.min).toBeGreaterThanOrEqual(skill.standardRange.min);
    expect(skill.defaultRange.max).toBeLessThanOrEqual(skill.standardRange.max);
  });
});

describe("partners-to-10", () => {
  it("always makes ten", () => {
    const skill = SKILLS.find((s) => s.id === "partners-to-10")!;
    for (let i = 0; i < 200; i++) {
      const { equation } = skill.generate(createRng(`ten-${i}`), {
        range: skill.defaultRange,
        structures: skill.structures,
      });
      expect(equation.op === "+" ? equation.result : equation.left).toBe(10);
    }
  });
});

describe("teen-numbers", () => {
  it("always has ten as one part and a teen as the whole", () => {
    const skill = SKILLS.find((s) => s.id === "teen-numbers")!;
    for (let i = 0; i < 200; i++) {
      const { equation } = skill.generate(createRng(`teen-${i}`), {
        range: skill.defaultRange,
        structures: skill.structures,
      });
      expect(equation.left).toBe(10);
      expect(equation.result).toBeGreaterThanOrEqual(11);
      expect(equation.result).toBeLessThanOrEqual(19);
    }
  });
});
