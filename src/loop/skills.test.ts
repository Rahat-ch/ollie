import { describe, expect, it } from "vitest";
import { createRng } from "@/loop/random";
import { getSkill, SKILLS, type GenerateOptions, type Skill } from "@/loop/skills";
import type { Equation } from "@/loop/types";

const SEEDS = 2000;

/** Independent arithmetic: does the filled-in Equation actually hold? */
function holds({ left, op, right, result }: Equation): boolean {
  return op === "+" ? left + right === result : left - right === result;
}

/** The values the Learner is told, as opposed to the one asked for. */
function knownValues(equation: Equation): Set<number> {
  const slots = ["left", "right", "result"] as const;
  return new Set(slots.filter((s) => s !== equation.unknown).map((s) => equation[s]));
}

const numbersIn = (text: string): Set<number> =>
  new Set((text.match(/\d+/g) ?? []).map(Number));

function drafts(skill: Skill, label: string, options: Partial<GenerateOptions> = {}, count = SEEDS) {
  return Array.from({ length: count }, (_, i) =>
    skill.generate(createRng(`${label}-${i}`), {
      range: options.range ?? skill.defaultRange,
      structures: options.structures ?? skill.structures,
    }),
  );
}

describe.each(SKILLS.map((s) => [s.id, s] as const))("Skill %s", (_, skill) => {
  const all = drafts(skill, "property");

  it("never emits a Problem whose answer differs from its own arithmetic", () => {
    for (const draft of all) {
      expect(holds(draft.equation)).toBe(true);
      expect(draft.answer).toBe(draft.equation[draft.equation.unknown]);
    }
  });

  it("speaks exactly the numbers the Learner is given, never the answer slot", () => {
    for (const draft of all) {
      expect(numbersIn(draft.spoken)).toEqual(knownValues(draft.equation));
    }
  });

  it("keeps every answer on the 0 to 20 number pad", () => {
    for (const draft of all) {
      expect(draft.answer).toBeGreaterThanOrEqual(0);
      expect(draft.answer).toBeLessThanOrEqual(20);
    }
  });

  it("uses every one of its structures", () => {
    expect(new Set(all.map((d) => d.structure))).toEqual(new Set(skill.structures));
  });

  it("honours a narrowed range and a single allowed structure", () => {
    const { min } = skill.defaultRange;
    const narrowed = drafts(skill, "narrow", { range: { min, max: min }, structures: [skill.structures[1]] }, 50);
    for (const draft of narrowed) {
      expect(draft.structure).toBe(skill.structures[1]);
    }
    expect(new Set(narrowed.map((d) => d.answer)).size).toBe(1);
  });

  it("has a hand-written Hint with no numbers in it, so it can be voiced once", () => {
    expect(skill.hint).toMatch(/^[A-Z].*\.$/);
    expect(skill.hint).not.toMatch(/\d/);
  });

  it("has a default range inside its standard's range", () => {
    expect(skill.defaultRange.min).toBeGreaterThanOrEqual(skill.standardRange.min);
    expect(skill.defaultRange.max).toBeLessThanOrEqual(skill.standardRange.max);
  });
});

describe("partners-to-10", () => {
  it("always makes ten", () => {
    for (const { equation } of drafts(getSkill("partners-to-10"), "ten", {}, 200)) {
      expect(equation.op === "+" ? equation.result : equation.left).toBe(10);
    }
  });
});

describe("teen-numbers", () => {
  it("always has ten as one part and a teen as the whole", () => {
    for (const { equation } of drafts(getSkill("teen-numbers"), "teen", {}, 200)) {
      expect(equation.left).toBe(10);
      expect(equation.result).toBeGreaterThanOrEqual(11);
      expect(equation.result).toBeLessThanOrEqual(19);
    }
  });
});
