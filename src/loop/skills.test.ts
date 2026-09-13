import { describe, expect, it } from "vitest";
import { createRng } from "@/loop/random";
import { getSkill, hintFor, SKILLS, type GenerateOptions, type Skill } from "@/loop/skills";
import type { Equation, SkillId } from "@/loop/types";

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

/** The number a Skill's range describes, read off the Equation independently of the generator. */
const RANGED: Record<SkillId, (equation: Equation) => number> = {
  "partners-to-10": (e) => (e.op === "+" ? e.left : e.right),
  "teen-numbers": (e) => e.result,
  "counting-on": (e) => Math.max(e.left, e.right),
  "make-a-ten": (e) => Math.max(e.left, e.right),
  "unknown-addend": (e) => (e.op === "-" ? e.left : e.result),
  "result-unknown": (e) => (e.op === "-" ? e.left : e.result),
  "change-unknown": (e) => (e.op === "-" ? e.left : e.result),
};

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

  it("keeps the ranged number inside the range it was given", () => {
    for (const draft of all) {
      expect(RANGED[skill.id](draft.equation)).toBeGreaterThanOrEqual(skill.defaultRange.min);
      expect(RANGED[skill.id](draft.equation)).toBeLessThanOrEqual(skill.defaultRange.max);
    }
  });

  it("honours a narrowed range and a single allowed structure", () => {
    const { min } = skill.standardRange;
    const narrowed = drafts(skill, "narrow", { range: { min, max: min }, structures: [skill.structures[1]] }, 50);
    for (const draft of narrowed) {
      expect(draft.structure).toBe(skill.structures[1]);
      expect(RANGED[skill.id](draft.equation)).toBe(min);
    }
  });

  it("has a hand-written Hint per structure with no numbers in it, so each can be voiced once", () => {
    for (const structure of skill.structures) {
      const hint = skill.hints[structure];
      expect(hint).toMatch(/^[A-Z].*\.$/);
      expect(hint).not.toMatch(/\d/);
    }
    expect(Object.keys(skill.hints).sort()).toEqual([...skill.structures].sort());
  });

  it("has a default range inside its standard's range", () => {
    expect(skill.defaultRange.min).toBeGreaterThanOrEqual(skill.standardRange.min);
    expect(skill.defaultRange.max).toBeLessThanOrEqual(skill.standardRange.max);
  });
});

describe("hintFor", () => {
  it("gives the Hint for the Problem's own structure, so take-from-ten is not told to count empty spaces", () => {
    const [draft] = drafts(getSkill("partners-to-10"), "hint", { structures: ["take-from-ten"] }, 1);
    const problem = { id: "p1", skill: "partners-to-10" as const, review: false, ...draft };
    expect(hintFor(problem)).toBe(getSkill("partners-to-10").hints["take-from-ten"]);
    expect(hintFor(problem)).toMatch(/left/);
    expect(hintFor(problem)).not.toMatch(/empty/);
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

describe("counting-on", () => {
  const all = drafts(getSkill("counting-on"), "count", {}, 500);

  it("adds 1, 2, or 3 to a larger number, in either order, within 20", () => {
    for (const { equation } of all) {
      const small = Math.min(equation.left, equation.right);
      const larger = Math.max(equation.left, equation.right);
      expect(equation.op).toBe("+");
      expect(small).toBeGreaterThanOrEqual(1);
      expect(small).toBeLessThanOrEqual(3);
      expect(small).toBeLessThan(larger);
      expect(equation.result).toBeLessThanOrEqual(20);
    }
  });

  it("puts the larger number second in the smaller-first structure", () => {
    for (const { equation } of drafts(getSkill("counting-on"), "order", { structures: ["smaller-first"] }, 100)) {
      expect(equation.left).toBeLessThan(equation.right);
    }
  });

  it("shows a number line", () => {
    expect(getSkill("counting-on").visual).toBe("number-line");
  });
});

describe("make-a-ten", () => {
  it("always crosses ten with both addends under ten", () => {
    for (const { equation } of drafts(getSkill("make-a-ten"), "ten", {}, 500)) {
      expect(equation.op).toBe("+");
      expect(equation.left).toBeLessThan(10);
      expect(equation.right).toBeLessThan(10);
      expect(equation.result).toBeGreaterThanOrEqual(11);
      expect(equation.result).toBeLessThanOrEqual(18);
    }
  });

  it("shows a ten-frame", () => {
    expect(getSkill("make-a-ten").visual).toBe("ten-frame");
  });
});

describe("unknown-addend", () => {
  it("asks for a missing part of 1 to 5 whether phrased as subtraction or as a missing addend", () => {
    for (const draft of drafts(getSkill("unknown-addend"), "part", {}, 500)) {
      expect(draft.answer).toBeGreaterThanOrEqual(1);
      expect(draft.answer).toBeLessThanOrEqual(5);
      if (draft.structure === "subtract") {
        expect(draft.equation.op).toBe("-");
        expect(draft.equation.unknown).toBe("result");
      } else {
        expect(draft.structure).toBe("missing-addend");
        expect(draft.equation.op).toBe("+");
        expect(draft.equation.unknown).toBe("right");
      }
    }
  });

  it("shows a number line", () => {
    expect(getSkill("unknown-addend").visual).toBe("number-line");
  });
});

describe("result-unknown", () => {
  const all = drafts(getSkill("result-unknown"), "result", {}, 500);

  it("asks for the result of adding to, taking from, or putting together, with the whole at most 20 and every part at least 1", () => {
    for (const draft of all) {
      expect(draft.equation.unknown).toBe("result");
      const whole = draft.equation.op === "-" ? draft.equation.left : draft.equation.result;
      expect(whole).toBeLessThanOrEqual(20);
      expect(Math.min(draft.equation.left, draft.equation.right, draft.equation.result)).toBeGreaterThanOrEqual(1);
      if (draft.structure === "take-from") expect(draft.equation.op).toBe("-");
      else expect(draft.equation.op).toBe("+");
    }
  });

  it("is in Unit 3, mapped to 1.OA.1, and shows the Theme picture", () => {
    const skill = getSkill("result-unknown");
    expect(skill.unit).toBe(3);
    expect(skill.standard).toBe("1.OA.1");
    expect(skill.visual).toBe("theme-picture");
    expect(skill.structures).toEqual(["add-to", "take-from", "put-together"]);
  });
});

describe("change-unknown", () => {
  const all = drafts(getSkill("change-unknown"), "change", {}, 500);

  it("asks for the change: 7 + ? = 12 when things come, 12 - ? = 7 when they go, with the change 1 to 9", () => {
    for (const draft of all) {
      expect(draft.equation.unknown).toBe("right");
      expect(draft.answer).toBeGreaterThanOrEqual(1);
      expect(draft.answer).toBeLessThanOrEqual(9);
      if (draft.structure === "add-to-change") {
        expect(draft.equation.op).toBe("+");
        expect(draft.equation.result).toBeLessThanOrEqual(20);
      } else {
        expect(draft.structure).toBe("take-from-change");
        expect(draft.equation.op).toBe("-");
        expect(draft.equation.left).toBeLessThanOrEqual(20);
        expect(draft.equation.result).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("is in Unit 3 after result-unknown, and shows the Theme picture", () => {
    expect(SKILLS.map((s) => s.id).slice(-2)).toEqual(["result-unknown", "change-unknown"]);
    expect(getSkill("change-unknown").unit).toBe(3);
    expect(getSkill("change-unknown").visual).toBe("theme-picture");
  });
});
