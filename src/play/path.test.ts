import { describe, expect, it } from "vitest";
import { newProfile } from "@/loop";
import { profileWithMastered } from "@/loop/testing";
import { pathStops } from "./path";

describe("pathStops", () => {
  it("shows three Units: the first current, the rest locked, with no Powers, for a fresh Profile", () => {
    expect(pathStops(newProfile(), [])).toEqual([
      { unit: 1, name: "Partners to 10", state: "current", powers: [] },
      { unit: 2, name: "Counting on and make-a-ten", state: "locked", powers: [] },
      { unit: 3, name: "Word problems", state: "locked", powers: [] },
    ]);
  });

  it("marks Unit 1 done and Unit 2 current once both Unit 1 Skills are Mastered", () => {
    const stops = pathStops(profileWithMastered("partners-to-10", "teen-numbers"), []);
    expect(stops.map((s) => s.state)).toEqual(["done", "current", "locked"]);
  });

  it("marks Unit 3 current once Units 1 and 2 are done, and done once its two Skills are Mastered", () => {
    const unit3 = pathStops(
      profileWithMastered("partners-to-10", "teen-numbers", "counting-on", "make-a-ten", "unknown-addend"),
      [],
    );
    expect(unit3.map((s) => s.state)).toEqual(["done", "done", "current"]);
    const all = pathStops(
      profileWithMastered("partners-to-10", "teen-numbers", "counting-on", "make-a-ten", "unknown-addend", "result-unknown", "change-unknown"),
      [],
    );
    expect(all.map((s) => s.state)).toEqual(["done", "done", "done"]);
  });
});

describe("the Powers on the Path", () => {
  it("names each Power Ollie has learned at the Unit whose Mastery taught it", () => {
    const stops = pathStops(newProfile(), ["count-on-flight", "make-ten-magic", "missing-number-detective", "story-solver"]);
    expect(stops.map((stop) => stop.powers.map((power) => power.name))).toEqual([
      [],
      ["Count-On Flight", "Make-Ten Magic", "Missing Number Detective"],
      ["Story Solver"],
    ]);
  });

  it("names only the Powers Ollie has learned: a Power is never shown before it is taught", () => {
    const stops = pathStops(newProfile(), ["make-ten-magic"]);
    expect(stops[1].powers.map((power) => power.name)).toEqual(["Make-Ten Magic"]);
  });
});
