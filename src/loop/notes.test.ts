import { describe, expect, it } from "vitest";
import { alwaysFirstTry, DIAGNOSTIC_PLAN, emptyNotes, knownProblemIds, newProfile, runSession, validateNotes } from "@/loop";
import type { HypothesisStatus, LearnerNotes, ProblemId } from "@/loop";

const known: ReadonlySet<ProblemId> = new Set(["p1", "p2", "p3"]);

const valid: LearnerNotes = {
  hypotheses: [
    {
      id: "h1",
      claim: "Crossing ten is where first attempts fail",
      status: "supported",
      confidence: 0.7,
      evidence: ["p2", "p3"],
      nextTest: "Ask counting-on with a larger addend past 10",
    },
    { id: "h2", claim: "Partners to 10 are automatic", status: "proposed", confidence: 0.4, evidence: [], nextTest: "Mix in partners-to-10" },
  ],
  strengths: ["Answers partners to 10 quickly"],
};

function reasons(notes: LearnerNotes): string {
  const verdict = validateNotes(notes, known);
  return verdict.ok ? "" : verdict.reasons.join("\n");
}

describe("emptyNotes", () => {
  it("starts with no Hypotheses and no strengths", () => {
    expect(emptyNotes()).toEqual({ hypotheses: [], strengths: [] });
  });
});

describe("validateNotes", () => {
  it("accepts Notes whose every Hypothesis cites Problems the Coach was shown", () => {
    expect(validateNotes(valid, known)).toEqual({ ok: true });
    expect(validateNotes(emptyNotes(), known)).toEqual({ ok: true });
  });

  it("rejects a Hypothesis citing a Problem ID that is not in the Log or the prior Notes", () => {
    const notes = { ...valid, hypotheses: [{ ...valid.hypotheses[0], evidence: ["p2", "p99"] }] };
    expect(reasons(notes)).toMatch(/h1 cites "p99".*not/);
  });

  it("rejects two Hypotheses with the same id", () => {
    const notes = { ...valid, hypotheses: [valid.hypotheses[0], { ...valid.hypotheses[1], id: "h1" }] };
    expect(reasons(notes)).toMatch(/h1 appears more than once/);
  });

  it("rejects an empty id and an empty claim", () => {
    expect(reasons({ ...valid, hypotheses: [{ ...valid.hypotheses[1], id: " " }] })).toMatch(/Hypothesis 1 has no id/);
    expect(reasons({ ...valid, hypotheses: [{ ...valid.hypotheses[1], claim: "" }] })).toMatch(/h2 has no claim/);
  });

  it("rejects a confidence outside 0 to 1 or not a number", () => {
    expect(reasons({ ...valid, hypotheses: [{ ...valid.hypotheses[1], confidence: 1.2 }] })).toMatch(/h2 has confidence 1.2.*0 to 1/);
    expect(reasons({ ...valid, hypotheses: [{ ...valid.hypotheses[1], confidence: -0.1 }] })).toMatch(/h2 has confidence/);
    expect(reasons({ ...valid, hypotheses: [{ ...valid.hypotheses[1], confidence: Number.NaN }] })).toMatch(/h2 has confidence/);
    expect(reasons({ ...valid, hypotheses: [{ ...valid.hypotheses[1], confidence: 0 }] })).toBe("");
    expect(reasons({ ...valid, hypotheses: [{ ...valid.hypotheses[1], confidence: 1 }] })).toBe("");
  });

  it("rejects a status that is not proposed, supported, or refuted", () => {
    const notes = { ...valid, hypotheses: [{ ...valid.hypotheses[1], status: "confirmed" as HypothesisStatus }] };
    expect(reasons(notes)).toMatch(/h2 has status "confirmed".*proposed, supported, refuted/);
  });

  it("rejects a supported or refuted Hypothesis with no evidence, but lets a proposed one wait for some", () => {
    expect(reasons({ ...valid, hypotheses: [{ ...valid.hypotheses[0], evidence: [] }] })).toMatch(/h1 is supported.*no evidence/);
    expect(reasons({ ...valid, hypotheses: [{ ...valid.hypotheses[0], status: "refuted", evidence: [] }] })).toMatch(/h1 is refuted.*no evidence/);
    expect(reasons({ ...valid, hypotheses: [{ ...valid.hypotheses[1], evidence: [] }] })).toBe("");
  });

  it("rejects the same Problem cited twice by one Hypothesis", () => {
    const notes = { ...valid, hypotheses: [{ ...valid.hypotheses[0], evidence: ["p2", "p3", "p2"] }] };
    expect(reasons(notes)).toMatch(/h1 cites "p2" more than once/);
  });

  it("lists every reason at once", () => {
    const notes: LearnerNotes = {
      hypotheses: [
        { ...valid.hypotheses[0], evidence: ["p7"], confidence: 2 },
        { ...valid.hypotheses[1], id: "h1", claim: "" },
      ],
      strengths: [],
    };
    const verdict = validateNotes(notes, known);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reasons).toHaveLength(4);
  });
});

describe("knownProblemIds", () => {
  it("is every Problem in the Log plus every Problem the prior Notes already cite", () => {
    const { log } = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-n", alwaysFirstTry);
    const prior: LearnerNotes = {
      hypotheses: [{ ...valid.hypotheses[0], evidence: ["p2", "p12"] }, { ...valid.hypotheses[1], evidence: ["p15"] }],
      strengths: [],
    };
    expect([...knownProblemIds(log, prior)].sort()).toEqual(
      ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p12", "p15"].sort(),
    );
  });

  it("is only the Log's Problems when the Notes are empty", () => {
    const { log } = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-n", alwaysFirstTry);
    expect(knownProblemIds(log, emptyNotes()).size).toBe(9);
  });
});
