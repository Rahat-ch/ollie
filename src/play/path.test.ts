import { describe, expect, it } from "vitest";
import { newProfile } from "@/loop";
import { profileWithMastered } from "@/loop/testing";
import { pathStops } from "./path";

describe("pathStops", () => {
  it("shows three Units: the first current, the rest locked, for a fresh Profile", () => {
    expect(pathStops(newProfile())).toEqual([
      { unit: 1, name: "Partners to 10", state: "current" },
      { unit: 2, name: "Counting on and make-a-ten", state: "locked" },
      { unit: 3, name: "Word problems", state: "locked" },
    ]);
  });

  it("marks Unit 1 done and Unit 2 current once both Unit 1 Skills are Mastered", () => {
    const stops = pathStops(profileWithMastered("partners-to-10", "teen-numbers"));
    expect(stops.map((s) => s.state)).toEqual(["done", "current", "locked"]);
  });

  it("keeps Unit 3 locked until it has Skills, even with Units 1 and 2 done", () => {
    const stops = pathStops(
      profileWithMastered("partners-to-10", "teen-numbers", "counting-on", "make-a-ten", "unknown-addend"),
    );
    expect(stops.map((s) => s.state)).toEqual(["done", "done", "locked"]);
  });
});
