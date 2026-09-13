import { describe, expect, it } from "vitest";
import { createRng, getSkill, SKILLS } from "@/loop";
import { everyDraft } from "./drafts";

const optionsFor = (skill: (typeof SKILLS)[number], which: "defaultRange" | "standardRange") => ({
  range: skill[which],
  structures: skill.structures,
});

describe("everyDraft", () => {
  it("enumerates every Problem the engine can draw: two thousand draws turn up nothing it missed", () => {
    for (const skill of SKILLS) {
      for (const which of ["defaultRange", "standardRange"] as const) {
        const options = optionsFor(skill, which);
        const spoken = new Set(everyDraft(skill, options).map((draft) => draft.spoken));
        for (let seed = 0; seed < 2000; seed++) {
          expect(spoken).toContain(skill.generate(createRng(`${skill.id}:${which}:${seed}`), options).spoken);
        }
      }
    }
  });

  it("draws each Problem once and only within the range it is given", () => {
    const teen = getSkill("teen-numbers");
    const drafts = everyDraft(teen, optionsFor(teen, "defaultRange"));
    // The teen numbers 11 to 19, composed and decomposed: nine of each.
    expect(drafts).toHaveLength(18);
    expect(new Set(drafts.map((d) => d.spoken)).size).toBe(18);
    expect(drafts.every((d) => d.equation.result >= 11 && d.equation.result <= 19)).toBe(true);
  });

  it("keeps a narrowed range and a single structure, as a Session Plan may ask", () => {
    const skill = getSkill("counting-on");
    const drafts = everyDraft(skill, { range: { min: 5, max: 6 }, structures: ["larger-first"] });
    expect(drafts.map((d) => d.spoken).sort()).toEqual([
      "What is 5 and 1 more?",
      "What is 5 and 2 more?",
      "What is 5 and 3 more?",
      "What is 6 and 1 more?",
      "What is 6 and 2 more?",
      "What is 6 and 3 more?",
    ]);
  });

  it("answers every Problem it enumerates with the engine's own arithmetic", () => {
    for (const skill of SKILLS) {
      for (const draft of everyDraft(skill, optionsFor(skill, "standardRange"))) {
        const { left, op, right, result, unknown } = draft.equation;
        expect(op === "+" ? left + right : left - right).toBe(result);
        expect(draft.answer).toBe(draft.equation[unknown]);
      }
    }
  });
});
