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

  it("marks Unit 3 current once Units 1 and 2 are done, and done once its two Skills are Mastered", () => {
    const unit3 = pathStops(
      profileWithMastered("partners-to-10", "teen-numbers", "counting-on", "make-a-ten", "unknown-addend"),
    );
    expect(unit3.map((s) => s.state)).toEqual(["done", "done", "current"]);
    const all = pathStops(
      profileWithMastered("partners-to-10", "teen-numbers", "counting-on", "make-a-ten", "unknown-addend", "result-unknown", "change-unknown"),
    );
    expect(all.map((s) => s.state)).toEqual(["done", "done", "done"]);
  });
});
