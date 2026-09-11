import { describe, expect, it } from "vitest";
import type { CoachInput } from "./types";
import { COACH_SYSTEM_PROMPT, coachUserMessage } from "./coach-prompt";

const input: CoachInput = {
  sessionNumber: 3,
  evidence: [
    {
      id: "p17",
      skill: "partners-to-10",
      structure: "missing-partner",
      equation: "7 + ? = 10",
      review: false,
      position: 1,
      assistance: "first-try-correct",
      firstTryMs: 4200,
    },
    {
      id: "p18",
      skill: "counting-on",
      structure: "smaller-first",
      equation: "3 + 8 = ?",
      review: false,
      position: 2,
      assistance: "hint-assisted-correct",
      firstTryMs: 9100,
    },
    {
      id: "p19",
      skill: "counting-on",
      structure: "larger-first",
      equation: "9 + 4 = ?",
      review: false,
      position: 3,
      assistance: "revealed",
      firstTryMs: 12000,
    },
    {
      id: "p20",
      skill: "partners-to-10",
      structure: "take-from-ten",
      equation: "10 - 6 = ?",
      review: true,
      position: 4,
      assistance: "unresolved",
      firstTryMs: null,
    },
  ],
  notes: {
    hypotheses: [
      {
        id: "h1",
        claim: "Counts on from the smaller number when it comes first",
        status: "proposed",
        confidence: 0.4,
        evidence: ["p12"],
        nextTest: "Show larger-first and smaller-first side by side",
      },
    ],
    strengths: ["Partners to 10 come quickly"],
  },
  estimates: {
    "partners-to-10": { estimate: 0.96, recentFirstAttempts: [true, true, true], mastered: true },
    "teen-numbers": { estimate: 0.9, recentFirstAttempts: [true], mastered: false },
    "counting-on": { estimate: 0.45, recentFirstAttempts: [false, true], mastered: false },
    "make-a-ten": { estimate: 0.3, recentFirstAttempts: [], mastered: false },
    "unknown-addend": { estimate: 0.2, recentFirstAttempts: [], mastered: false },
  },
  planSpace: {
    skills: [
      {
        skill: "partners-to-10",
        name: "Partners to 10",
        unit: 1,
        structures: ["missing-partner", "take-from-ten"],
        numberRange: { min: 0, max: 10 },
        rangeOf: "the partner the Learner is given",
        mastered: true,
      },
      {
        skill: "counting-on",
        name: "Counting on",
        unit: 2,
        structures: ["smaller-first", "larger-first"],
        numberRange: { min: 3, max: 19 },
        rangeOf: "the larger addend",
        mastered: false,
      },
    ],
    length: { min: 6, max: 10 },
    reviewShare: { min: 0, max: 1 },
  },
};

const rejected: CoachInput = {
  ...input,
  rejected: {
    output: {
      notes: input.notes,
      plan: { length: 12, skills: [{ skill: "make-a-ten", weight: 1 }], reviewShare: 0, hypothesisUnderTest: null },
    },
    reasons: ["length 12 is outside 6 to 10", "make-a-ten is in Unit 2, which is not unlocked yet"],
  },
};

describe("coachUserMessage", () => {
  it("carries every Problem ID and Assistance State from the evidence", () => {
    const message = coachUserMessage(input);
    for (const entry of input.evidence) {
      expect(message).toContain(entry.id);
      expect(message).toContain(entry.assistance);
    }
  });

  it("states the Plan Space bounds, each Skill's standard range as min to max", () => {
    const message = coachUserMessage(input);
    expect(message).toContain("0 to 10");
    expect(message).toContain("3 to 19");
    expect(message).toContain("6 to 10");
    expect(message).toContain("0 to 1");
    expect(message).toContain("the larger addend");
  });

  it("lists every reason when the previous output was rejected", () => {
    const message = coachUserMessage(rejected);
    expect(message).toMatch(/rejected/i);
    for (const reason of rejected.rejected!.reasons) {
      expect(message).toContain(reason);
    }
  });

  it("does not mention a rejection when there was none", () => {
    expect(coachUserMessage(input)).not.toMatch(/rejected/i);
  });

  it("never carries an answer or a spoken line: the input has neither", () => {
    const keys = new Set<string>();
    JSON.stringify(rejected, (key, value) => {
      keys.add(key);
      return value;
    });
    expect(keys.has("answer")).toBe(false);
    expect(keys.has("spoken")).toBe(false);
    expect(coachUserMessage(rejected)).not.toMatch(/^\s*(answer|spoken)\s*:/m);
  });
});

describe("COACH_SYSTEM_PROMPT", () => {
  it("says the Coach never writes a Problem or an answer", () => {
    expect(COACH_SYSTEM_PROMPT).toMatch(/never write[s]? a Problem/i);
  });
});
