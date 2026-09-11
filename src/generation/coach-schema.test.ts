import { describe, expect, it } from "vitest";
import { parseCoachOutput } from "@/generation/coach-schema";

/** A hand-written Coach output that is valid in shape. */
const valid = {
  notes: {
    hypotheses: [
      {
        id: "h1",
        claim: "May need more practice with Make-a-ten within 20 (missed on the first try)",
        status: "proposed",
        confidence: 0.5,
        evidence: ["p4", "p7"],
        nextTest: "Give 3 or more Make-a-ten Problems and watch the first try",
      },
    ],
    strengths: ["Partners to 10: every first try correct this Session"],
  },
  plan: {
    length: 8,
    skills: [{ skill: "make-a-ten", weight: 1, numberRange: { min: 7, max: 9 }, structures: ["larger-first"] }],
    reviewShare: 0.25,
    hypothesisUnderTest: "h1",
  },
};

/** The same output with one part swapped, so each test names one fault. */
const withPlan = (plan: unknown) => ({ ...valid, plan });
const withHypothesis = (hypothesis: unknown) => ({ ...valid, notes: { ...valid.notes, hypotheses: [hypothesis] } });

const reasonsOf = (value: unknown): readonly string[] => {
  const parsed = parseCoachOutput(value);
  return parsed.ok ? [] : parsed.reasons;
};

describe("parseCoachOutput", () => {
  it("accepts a valid output and hands it back", () => {
    expect(parseCoachOutput(valid)).toEqual({ ok: true, output: valid });
  });

  it("rejects a missing Plan, naming the path", () => {
    expect(reasonsOf({ notes: valid.notes })).toEqual([expect.stringMatching(/^plan: /)]);
  });

  it("rejects a Hypothesis missing its next test", () => {
    const { id, claim, status, confidence, evidence } = valid.notes.hypotheses[0];
    expect(reasonsOf(withHypothesis({ id, claim, status, confidence, evidence }))).toEqual([
      expect.stringMatching(/^notes\.hypotheses\.0\.nextTest: /),
    ]);
  });

  it("rejects a confidence above 1", () => {
    expect(reasonsOf(withHypothesis({ ...valid.notes.hypotheses[0], confidence: 1.5 }))).toEqual([
      expect.stringMatching(/^notes\.hypotheses\.0\.confidence: /),
    ]);
  });

  it("rejects a status outside proposed, supported, refuted", () => {
    expect(reasonsOf(withHypothesis({ ...valid.notes.hypotheses[0], status: "maybe" }))).toEqual([
      expect.stringMatching(/^notes\.hypotheses\.0\.status: /),
    ]);
  });

  it("rejects a field the Plan Space does not have", () => {
    expect(reasonsOf(withPlan({ ...valid.plan, timerSeconds: 30 }))).toEqual([expect.stringMatching(/^plan: .*timerSeconds/)]);
  });

  it("rejects a length that is not a whole number", () => {
    expect(reasonsOf(withPlan({ ...valid.plan, length: 7.5 }))).toEqual([expect.stringMatching(/^plan\.length: /)]);
  });

  it("rejects an unknown Skill id", () => {
    expect(reasonsOf(withPlan({ ...valid.plan, skills: [{ skill: "long-division", weight: 1 }] }))).toEqual([
      expect.stringMatching(/^plan\.skills\.0\.skill: /),
    ]);
  });

  it("rejects a non-object without throwing", () => {
    expect(() => parseCoachOutput("not a Coach output")).not.toThrow();
    expect(parseCoachOutput("not a Coach output").ok).toBe(false);
    expect(parseCoachOutput(null).ok).toBe(false);
  });
});
