import { describe, expect, it } from "vitest";
import { emptyLabelFile, labelFileName, parseLabelFile, parseLabelFileName, withLabel, type ClaimLabel } from "./labels";

const claim = (id: string, over: Partial<ClaimLabel> = {}): ClaimLabel => ({
  id,
  polarity: "difficulty",
  namesAsDifficulty: { "crossing-ten": true, "change-unknown": false },
  citedSupport: "supports",
  ...over,
});

describe("label files", () => {
  it("are named <set>.<labeller>.json, and a name that is not is refused", () => {
    expect(labelFileName("claims", "owner")).toBe("claims.owner.json");
    expect(parseLabelFileName("stories.second.json")).toEqual({ set: "stories", labeller: "second" });
    expect(parseLabelFileName("claims.json")).toBeNull();
    expect(parseLabelFileName("split.json")).toBeNull();
    expect(parseLabelFileName("widgets.owner.json")).toBeNull();
  });

  it("refuse a labeller name that could leave the labels directory", () => {
    expect(() => labelFileName("stories", "../owner")).toThrow(/labeller/);
    expect(() => labelFileName("stories", "Owner Name")).toThrow(/labeller/);
    expect(() => emptyLabelFile("stories", "")).toThrow(/labeller/);
  });

  it("round-trip a verdict file and a claim file", () => {
    const stories = withLabel(emptyLabelFile("stories", "owner"), { id: "c01", pass: true, note: "Fine." });
    expect(parseLabelFile(JSON.parse(JSON.stringify(stories)))).toEqual(stories);
    const claims = withLabel(emptyLabelFile("claims", "second"), claim("k001"));
    expect(parseLabelFile(JSON.parse(JSON.stringify(claims)))).toEqual(claims);
  });

  it("refuse a label that does not fit its set", () => {
    expect(() => parseLabelFile({ set: "stories", labeller: "owner", labels: [{ id: "c01", polarity: "strength" }] })).toThrow();
    expect(() => parseLabelFile({ set: "claims", labeller: "owner", labels: [{ id: "k001", pass: true }] })).toThrow();
    expect(() => parseLabelFile({ set: "claims", labeller: "owner", labels: [claim("k001", { polarity: "sentiment" as never })] })).toThrow();
    expect(() => parseLabelFile({ set: "claims", labeller: "owner", labels: [{ ...claim("k001"), namesAsDifficulty: { "crossing-ten": true } }] })).toThrow();
  });

  it("refuse the same item labelled twice in one file", () => {
    expect(() => parseLabelFile({ set: "stories", labeller: "owner", labels: [{ id: "c01", pass: true }, { id: "c01", pass: false }] })).toThrow(/twice/);
  });

  it("replace a label on the same item and keep the list sorted by id", () => {
    let file = emptyLabelFile("claims", "owner");
    file = withLabel(file, claim("k010"));
    file = withLabel(file, claim("k002"));
    file = withLabel(file, claim("k010", { polarity: "strength" }));
    expect(file.labels.map((l) => l.id)).toEqual(["k002", "k010"]);
    expect(file.labels[1]).toMatchObject({ polarity: "strength" });
  });
});
