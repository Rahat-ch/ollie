import { describe, expect, it } from "vitest";
import { createRng, getSkill, newProfile, startSession } from "@/loop";
import type { Problem } from "@/loop";
import { profileWithMastered } from "@/loop/testing";
import { addToPool, poolKey } from "@/story/pool";
import { pooledStory, poolInputs, storyInputFor, variantFor } from "./stories";

const problem = (skill: Problem["skill"], structure: string, equation: Problem["equation"], id = "p7"): Problem => ({
  id,
  skill,
  structure,
  equation,
  answer: equation[equation.unknown],
  spoken: "",
  review: false,
});

describe("storyInputFor", () => {
  it("keys a Unit 3 Problem by the Profile's Theme and the engine's numbers, and nothing for Units 1 and 2", () => {
    const p = problem("result-unknown", "add-to", { left: 7, op: "+", right: 5, result: 12, unknown: "result" });
    expect(storyInputFor(p, "space")).toEqual({ skill: "result-unknown", structure: "add-to", equation: p.equation, answer: 12, theme: "space", set: "plain" });
    expect(storyInputFor(problem("make-a-ten", "larger-first", { left: 8, op: "+", right: 5, result: 13, unknown: "result" }), "space")).toBeNull();
  });
});

describe("variantFor", () => {
  it("picks a variant from the Problem's number, so a reload shows the same Story", () => {
    const p = problem("result-unknown", "add-to", { left: 7, op: "+", right: 5, result: 12, unknown: "result" });
    expect(variantFor({ ...p, id: "p7" })).toBe(7);
    expect(variantFor({ ...p, id: "p120" })).toBe(120);
  });
});

describe("pooledStory", () => {
  const p = problem("result-unknown", "add-to", { left: 7, op: "+", right: 5, result: 12, unknown: "result" }, "p3");
  const input = storyInputFor(p, "puppies")!;
  const pool = addToPool(addToPool({}, input, "first {{nickname}}"), input, "second {{nickname}}");

  it("picks the Problem's variant from the Pool, wrapping, and nothing on a miss", () => {
    expect(pooledStory(pool, p, "puppies")).toBe("second {{nickname}}");
    expect(pooledStory(pool, { ...p, id: "p4" }, "puppies")).toBe("first {{nickname}}");
    expect(pooledStory(pool, p, "space")).toBeUndefined();
    expect(pooledStory(pool, problem("counting-on", "larger-first", p.equation), "puppies")).toBeUndefined();
  });

  it("follows the Profile's Theme, so changing it in the Shop changes the Stories the next Session is asked with", () => {
    const both = addToPool(pool, storyInputFor(p, "dinosaurs")!, "a dinosaur Story for {{nickname}}");
    expect(pooledStory(both, p, "puppies")).toBe("second {{nickname}}");
    expect(pooledStory(both, p, "dinosaurs")).toBe("a dinosaur Story for {{nickname}}");
  });
});

describe("poolInputs", () => {
  it("enumerates every equation the engine can draw in a Skill's default range, per Theme and structure", () => {
    const inputs = poolInputs(["puppies"]);
    expect(inputs).toHaveLength(297 + 168);
    expect(new Set(inputs.map(poolKey)).size).toBe(inputs.length);
    expect(inputs.filter((i) => i.skill === "result-unknown" && i.structure === "take-from")).toHaveLength(99);
    expect(inputs.filter((i) => i.skill === "change-unknown" && i.structure === "add-to-change")).toHaveLength(84);
  });

  it.each(["default", "standard"] as const)("covers every Problem the engine draws in the %s range, so a full Pool never misses", (range) => {
    const keys = new Set(poolInputs(["ocean"], range).map(poolKey));
    for (const skill of [getSkill("result-unknown"), getSkill("change-unknown")]) {
      const bounds = range === "default" ? skill.defaultRange : skill.standardRange;
      for (let i = 0; i < 300; i++) {
        const draft = skill.generate(createRng(`cover-${i}`), { range: bounds, structures: skill.structures });
        expect(keys.has(poolKey({ skill: skill.id, structure: draft.structure, equation: draft.equation, answer: draft.answer, theme: "ocean" }))).toBe(true);
      }
    }
  });

  it("enumerates the standard range on request: 840 keys per Theme", () => {
    expect(poolInputs(["puppies"], "standard")).toHaveLength(840);
  });

  it("covers a Baseline Session in Unit 3 for a Profile with Units 1 and 2 Mastered", () => {
    const profile = profileWithMastered("partners-to-10", "teen-numbers", "counting-on", "make-a-ten", "unknown-addend");
    const session = startSession(
      { length: 8, skills: [{ skill: "result-unknown", weight: 1 }], reviewShare: 0.25, hypothesisUnderTest: null },
      { ...profile, sessionsCompleted: 1 },
      "seed-u3",
    );
    const keys = new Set(poolInputs(["trucks"]).map(poolKey));
    const unit3 = session.problems.map((p) => storyInputFor(p, "trucks")).filter((i) => i !== null);
    expect(unit3).toHaveLength(6);
    expect(unit3.every((i) => keys.has(poolKey(i)))).toBe(true);
    expect(newProfile().sessionsCompleted).toBe(0);
  });
});

describe("the rich Story set once Story Solver is learned", () => {
  const p = problem("result-unknown", "add-to", { left: 7, op: "+", right: 5, result: 12, unknown: "result" }, "p3");

  it("keys the Problem into the rich set, so the Learner hears a Story written as a scene", () => {
    expect(storyInputFor(p, "space", "rich")).toMatchObject({ theme: "space", set: "rich" });
    expect(storyInputFor(p, "space")).toMatchObject({ set: "plain" });
  });

  it("reads the rich set from the Pool and never the plain one", () => {
    const plain = addToPool({}, storyInputFor(p, "puppies")!, "plain {{nickname}}");
    expect(pooledStory(plain, p, "puppies", "rich")).toBeUndefined();
    const rich = addToPool(plain, storyInputFor(p, "puppies", "rich")!, "rich {{nickname}}");
    expect(pooledStory(rich, p, "puppies", "rich")).toBe("rich {{nickname}}");
    expect(pooledStory(rich, p, "puppies")).toBe("plain {{nickname}}");
  });

  it("is the same keys again for the fill script, one set for each", () => {
    const plain = poolInputs(["puppies"]);
    const rich = poolInputs(["puppies"], "default", "rich");
    expect(rich).toHaveLength(plain.length);
    expect(new Set([...plain, ...rich].map(poolKey)).size).toBe(plain.length * 2);
  });
});
