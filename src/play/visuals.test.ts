import { describe, expect, it } from "vitest";
import type { Problem } from "@/loop";
import { visualFor, type Cell, type NumberLineModel, type TenFrameModel } from "./visuals";

const problem = (
  skill: Problem["skill"],
  structure: string,
  equation: Problem["equation"],
  answer: number,
): Problem => ({ id: "p1", skill, structure, equation, answer, spoken: "", review: false });

const tally = (cells: readonly Cell[], where: (cell: Cell) => boolean): number => cells.filter(where).length;
const red = (c: Cell) => c.counter === "red";
const yellow = (c: Cell) => c.counter === "yellow";
const empty = (c: Cell) => c.counter === null;

function tenFrame(p: Problem, stage: "asking" | "hint" | "reveal"): TenFrameModel {
  const model = visualFor(p, stage);
  if (model.kind !== "ten-frame") throw new Error(`expected a ten-frame, got ${model.kind}`);
  return model;
}
function numberLine(p: Problem, stage: "asking" | "hint" | "reveal"): NumberLineModel {
  const model = visualFor(p, stage);
  if (model.kind !== "number-line") throw new Error(`expected a number line, got ${model.kind}`);
  return model;
}

describe("ten-frame for partners to 10", () => {
  const missingPartner = problem("partners-to-10", "missing-partner", { left: 3, op: "+", right: 7, result: 10, unknown: "right" }, 7);
  const takeFromTen = problem("partners-to-10", "take-from-ten", { left: 10, op: "-", right: 3, result: 7, unknown: "result" }, 7);

  it("3 + ? = 10 shows 3 counters in one frame; the Hint counts the 7 empty spaces; the Reveal fills them", () => {
    const asking = tenFrame(missingPartner, "asking");
    expect(asking.frames).toHaveLength(1);
    expect(tally(asking.frames[0], red)).toBe(3);
    expect(tally(asking.frames[0], empty)).toBe(7);
    expect(asking.frames[0].every((c) => c.mark === null)).toBe(true);
    const hint = tenFrame(missingPartner, "hint");
    expect(tally(hint.frames[0], (c) => empty(c) && c.mark === "count")).toBe(7);
    const reveal = tenFrame(missingPartner, "reveal");
    expect(tally(reveal.frames[0], red)).toBe(3);
    expect(tally(reveal.frames[0], (c) => yellow(c) && c.mark === "arrive")).toBe(7);
  });

  it("10 - 3 = ? shows a full frame; the Hint takes 3 away and counts the 7 left", () => {
    const asking = tenFrame(takeFromTen, "asking");
    expect(tally(asking.frames[0], red)).toBe(10);
    const hint = tenFrame(takeFromTen, "hint");
    expect(tally(hint.frames[0], (c) => empty(c) && c.mark === "gone")).toBe(3);
    expect(tally(hint.frames[0], (c) => red(c) && c.mark === "count")).toBe(7);
    const reveal = tenFrame(takeFromTen, "reveal");
    expect(tally(reveal.frames[0], red)).toBe(7);
    expect(tally(reveal.frames[0], empty)).toBe(3);
  });
});

describe("ten-frame for teen numbers", () => {
  const compose = problem("teen-numbers", "compose", { left: 10, op: "+", right: 4, result: 14, unknown: "result" }, 14);
  const decompose = problem("teen-numbers", "decompose", { left: 10, op: "+", right: 4, result: 14, unknown: "right" }, 4);

  it.each([compose, decompose])("$structure shows a full frame and 4 extra in a second frame; the Hint counts the extras", (p) => {
    const asking = tenFrame(p, "asking");
    expect(asking.frames).toHaveLength(2);
    expect(tally(asking.frames[0], red)).toBe(10);
    expect(tally(asking.frames[1], yellow)).toBe(4);
    const hint = tenFrame(p, "hint");
    expect(tally(hint.frames[1], (c) => yellow(c) && c.mark === "count")).toBe(4);
    expect(hint.frames[0].every((c) => c.mark === null)).toBe(true);
  });
});

describe("ten-frame for make-a-ten", () => {
  const largerFirst = problem("make-a-ten", "larger-first", { left: 8, op: "+", right: 5, result: 13, unknown: "result" }, 13);
  const smallerFirst = problem("make-a-ten", "smaller-first", { left: 5, op: "+", right: 8, result: 13, unknown: "result" }, 13);

  it.each([largerFirst, smallerFirst])("$structure puts the larger addend in the frame with the other waiting beside it", (p) => {
    const asking = tenFrame(p, "asking");
    expect(asking.frames).toHaveLength(1);
    expect(tally(asking.frames[0], red)).toBe(8);
    expect(asking.loose).toHaveLength(5);
  });

  it("the Hint moves 2 in to make ten and counts the 3 left over", () => {
    const hint = tenFrame(largerFirst, "hint");
    expect(tally(hint.frames[0], red)).toBe(8);
    expect(tally(hint.frames[0], (c) => yellow(c) && c.mark === "arrive")).toBe(2);
    expect(hint.loose).toHaveLength(3);
    expect(hint.loose.every((c) => c.mark === "count")).toBe(true);
    const reveal = tenFrame(largerFirst, "reveal");
    expect(tally(reveal.frames[0], empty)).toBe(0);
    expect(reveal.loose).toHaveLength(3);
  });
});

describe("number line for counting on", () => {
  const largerFirst = problem("counting-on", "larger-first", { left: 9, op: "+", right: 2, result: 11, unknown: "result" }, 11);
  const smallerFirst = problem("counting-on", "smaller-first", { left: 2, op: "+", right: 9, result: 11, unknown: "result" }, 11);

  it.each([largerFirst, smallerFirst])("$structure starts at the bigger number with the landing hidden until the Reveal", (p) => {
    const asking = numberLine(p, "asking");
    expect(asking).toMatchObject({ min: 0, max: 20, start: 9, end: 11, hops: 2, showEnd: false, showHops: false });
    const hint = numberLine(p, "hint");
    expect(hint).toMatchObject({ showHops: true, showEnd: false });
    const reveal = numberLine(p, "reveal");
    expect(reveal).toMatchObject({ showHops: true, showEnd: true });
  });
});

describe("number line for unknown addend", () => {
  const subtract = problem("unknown-addend", "subtract", { left: 13, op: "-", right: 9, result: 4, unknown: "result" }, 4);
  const missingAddend = problem("unknown-addend", "missing-addend", { left: 9, op: "+", right: 4, result: 13, unknown: "right" }, 4);

  it.each([subtract, missingAddend])("$structure shows both numbers from the start and the Hint hops from 9 up to 13", (p) => {
    const asking = numberLine(p, "asking");
    expect(asking).toMatchObject({ start: 9, end: 13, hops: 4, showEnd: true, showHops: false });
    expect(numberLine(p, "hint")).toMatchObject({ showHops: true, showEnd: true });
  });
});

describe("the Power Ollie uses on the visual", () => {
  const countingOn = problem("counting-on", "larger-first", { left: 9, op: "+", right: 2, result: 11, unknown: "result" }, 11);
  const makeATen = problem("make-a-ten", "larger-first", { left: 8, op: "+", right: 5, result: 13, unknown: "result" }, 13);
  const unknownAddend = problem("unknown-addend", "subtract", { left: 13, op: "-", right: 9, result: 4, unknown: "result" }, 4);
  const wordProblem = problem("result-unknown", "add-to", { left: 5, op: "+", right: 4, result: 9, unknown: "result" }, 9);

  it("is none until the Learner has taught it, whatever the Problem", () => {
    expect(visualFor(countingOn, "asking").power).toBeNull();
    expect(visualFor(makeATen, "hint", []).power).toBeNull();
  });

  it("flies the number line's hops on a counting-on Problem once Count-On Flight is learned", () => {
    expect(visualFor(countingOn, "hint", ["count-on-flight"]).power).toBe("count-on-flight");
    expect(visualFor(makeATen, "hint", ["count-on-flight"]).power).toBeNull();
  });

  it("fills and splits the ten-frame on a make-a-ten Problem once Make-Ten Magic is learned", () => {
    expect(visualFor(makeATen, "hint", ["make-ten-magic"]).power).toBe("make-ten-magic");
  });

  it("searches the number line on an unknown-addend Problem once Missing Number Detective is learned", () => {
    expect(visualFor(unknownAddend, "asking", ["missing-number-detective"]).power).toBe("missing-number-detective");
  });

  it("opens the book on a word problem once Story Solver is learned", () => {
    expect(visualFor(wordProblem, "asking", ["story-solver"]).power).toBe("story-solver");
  });

  it("changes nothing else about the visual: the Power is how it is drawn, not what it says", () => {
    const flown = visualFor(countingOn, "hint", ["count-on-flight"]);
    expect({ ...flown, power: null }).toEqual(visualFor(countingOn, "hint"));
  });
});
