import { describe, expect, it } from "vitest";
import { POWERS } from "@/loop";
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

  it("says what Ollie does with each Power in a sentence of its own, so the Parent knows what changed on screen", () => {
    const rows = powerRows([]);
    expect(new Set(rows.map((row) => row.does)).size).toBe(rows.length);
    for (const row of rows) {
      expect(row.does.startsWith("Ollie ")).toBe(true);
      expect(row.does.endsWith(".")).toBe(true);
      // Every one of them says what it does with, which is what the Learner sees change.
      expect(row.does).toMatch(/number line|ten-frame|magnifying glass|story book/);
    }
  });

  it("lists every Power there is, in the order they are learned, and marks nothing else", () => {
    const rows = powerRows(POWERS.map((power) => power.id));
    expect(rows.map((row) => row.id)).toEqual(POWERS.map((power) => power.id));
    expect(rows.every((row) => row.learned)).toBe(true);
  });
});
