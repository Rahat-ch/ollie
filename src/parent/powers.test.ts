import { describe, expect, it } from "vitest";
import { powerRows } from "./powers";

describe("powerRows", () => {
  it("lists the four Powers by name, in the order they are learned, with what each one takes", () => {
    expect(powerRows([]).map((row) => [row.name, row.from])).toEqual([
      ["Count-On Flight", "Counting on from the larger number"],
      ["Make-Ten Magic", "Make-a-ten within 20"],
      ["Missing Number Detective", "Subtraction as unknown addend"],
      ["Story Solver", "Unit 3 · Word problems"],
    ]);
  });

  it("marks the Powers Ollie has learned and leaves the rest to come", () => {
    const rows = powerRows(["count-on-flight", "story-solver"]);
    expect(rows.filter((row) => row.learned).map((row) => row.name)).toEqual(["Count-On Flight", "Story Solver"]);
    expect(rows.filter((row) => !row.learned).map((row) => row.name)).toEqual([
      "Make-Ten Magic",
      "Missing Number Detective",
    ]);
  });

  it("says what Ollie does with each Power, so the Parent knows what changed on screen", () => {
    expect(powerRows([])[0].does).toBe("Ollie flies the hops on the number line, one wing beat for each one.");
  });
});
