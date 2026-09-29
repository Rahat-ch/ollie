import { describe, expect, it } from "vitest";
import { agreeOn, humanAgreement, labellerPairs } from "./agreement";
import { emptyLabelFile, withLabel, type ClaimLabel, type LabelFile } from "./labels";
import { cohensKappa } from "./stats";

const verdicts = (labeller: string, passes: readonly boolean[]): LabelFile<"stories"> =>
  passes.reduce((file, pass, i) => withLabel(file, { id: `c${String(i + 1).padStart(2, "0")}`, pass }), emptyLabelFile("stories", labeller));

const claim = (id: string, over: Partial<ClaimLabel> = {}): ClaimLabel => ({
  id,
  polarity: "difficulty",
  namesAsDifficulty: { "crossing-ten": false, "change-unknown": false },
  citedSupport: "supports",
  ...over,
});

describe("cohensKappa", () => {
  it("is 1 for perfect agreement and 0 when agreement is what the marginals give", () => {
    expect(cohensKappa([["a", "a"], ["b", "b"], ["a", "a"]])).toBe(1);
    // Each rater says a half the time, independently: chance agreement is 0.5, observed is 0.5.
    expect(cohensKappa([["a", "a"], ["a", "b"], ["b", "a"], ["b", "b"]])).toBe(0);
  });

  it("matches the textbook two-by-two example", () => {
    // 20 yes/yes, 5 yes/no, 10 no/yes, 15 no/no: po 0.70, pe 0.50, kappa 0.40.
    const pairs = [
      ...Array.from({ length: 20 }, () => ["yes", "yes"] as const),
      ...Array.from({ length: 5 }, () => ["yes", "no"] as const),
      ...Array.from({ length: 10 }, () => ["no", "yes"] as const),
      ...Array.from({ length: 15 }, () => ["no", "no"] as const),
    ];
    expect(cohensKappa(pairs)).toBeCloseTo(0.4, 10);
  });

  it("handles more than two categories", () => {
    // po = 3/6; A says x 3, y 2, z 1 times, B x 2, y 3, z 1; pe = (3·2 + 2·3 + 1·1)/36.
    const pairs: [string, string][] = [["x", "x"], ["x", "x"], ["x", "y"], ["y", "y"], ["z", "y"], ["y", "z"]];
    const po = 3 / 6;
    const pe = (3 * 2 + 2 * 3 + 1 * 1) / 36;
    expect(cohensKappa(pairs)).toBeCloseTo((po - pe) / (1 - pe), 10);
  });

  it("is null when chance already explains everything: both raters used one category", () => {
    expect(cohensKappa([["a", "a"], ["a", "a"]])).toBeNull();
    expect(cohensKappa([])).toBeNull();
  });
});

describe("agreeOn", () => {
  it("counts the items both labelled, lists the disagreements, and carries the interval", () => {
    const result = agreeOn("pass", [
      { id: "c01", a: "pass", b: "pass" },
      { id: "c02", a: "fail", b: "pass" },
      { id: "c03", a: "fail", b: "fail" },
      { id: "c04", a: "pass", b: "pass" },
    ]);
    expect(result).toMatchObject({ question: "pass", items: 4, agreements: 3, agreement: 0.75, disagreements: [{ id: "c02", a: "fail", b: "pass" }] });
    expect(result.agreementInterval).not.toBeNull();
    expect(result.kappa).toBeCloseTo(0.5, 10);
  });
});

describe("humanAgreement", () => {
  it("scores two Story files on pass, over the items both labelled only", () => {
    const owner = verdicts("owner", [true, true, false, false, true]);
    const second = verdicts("second", [true, false, false, false]);
    const result = humanAgreement(owner, second);
    expect(result.labellers).toEqual(["owner", "second"]);
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]).toMatchObject({ question: "pass", items: 4, agreements: 3, disagreements: [{ id: "c02", a: "pass", b: "fail" }] });
  });

  it("scores claims on Polarity, each planted weakness, and cited support, separately", () => {
    const a = [claim("k1"), claim("k2", { polarity: "contrast" }), claim("k3", { namesAsDifficulty: { "crossing-ten": true, "change-unknown": false } })].reduce(
      (file, label) => withLabel(file, label),
      emptyLabelFile("claims", "owner"),
    );
    const b = [claim("k1"), claim("k2", { polarity: "strength" }), claim("k3", { citedSupport: "cannot-tell" })].reduce(
      (file, label) => withLabel(file, label),
      emptyLabelFile("claims", "second"),
    );
    const result = humanAgreement(a, b);
    const by = Object.fromEntries(result.questions.map((q) => [q.question, q]));
    expect(Object.keys(by)).toEqual(["polarity", "names crossing-ten", "names change-unknown", "cited support"]);
    expect(by.polarity).toMatchObject({ items: 3, agreements: 2, disagreements: [{ id: "k2", a: "contrast", b: "strength" }] });
    expect(by["names crossing-ten"]).toMatchObject({ agreements: 2, disagreements: [{ id: "k3", a: "yes", b: "no" }] });
    expect(by["names change-unknown"]).toMatchObject({ agreements: 3, kappa: null });
    expect(by["cited support"]).toMatchObject({ agreements: 2, disagreements: [{ id: "k3", a: "supports", b: "cannot-tell" }] });
  });

  it("refuses two files of different sets, or the same labeller twice", () => {
    expect(() => humanAgreement(verdicts("owner", [true]), emptyLabelFile("claims", "second"))).toThrow(/set/);
    expect(() => humanAgreement(verdicts("owner", [true]), verdicts("owner", [true]))).toThrow(/labeller/);
  });
});

describe("labellerPairs", () => {
  it("pairs every two labellers of the same set, in name order, and nothing across sets", () => {
    const files = [verdicts("second", [true]), emptyLabelFile("claims", "owner"), verdicts("owner", [true]), verdicts("third", [false])];
    expect(labellerPairs(files).map(([a, b]) => `${a.set}:${a.labeller}-${b.labeller}`)).toEqual([
      "stories:owner-second",
      "stories:owner-third",
      "stories:second-third",
    ]);
  });
});
