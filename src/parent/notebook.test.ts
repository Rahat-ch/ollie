import { describe, expect, it } from "vitest";
import { applyCoachStep, emptyRecord } from "@/coach";
import { baselinePlan, DIAGNOSTIC_PLAN, emptyNotes, newProfile, runSession, scripted } from "@/loop";
import type { Hypothesis } from "@/loop";
import { notebook } from "./notebook";

/** A Diagnostic Session: p3 Hint-assisted and p4 Revealed, both partners to 10. */
const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-r", scripted("ffhrfffhf"));

const hypothesis: Hypothesis = {
  id: "h1",
  claim: "May need more practice when a partner to 10 is missing",
  status: "proposed",
  confidence: 0.4,
  evidence: ["p3", "p4"],
  nextTest: "Give 3 more partners to 10 Problems and watch the first try",
};

const plan = { length: 8, skills: [{ skill: "partners-to-10" as const, weight: 1 }], reviewShare: 0, hypothesisUnderTest: "h1" };

const coached = applyCoachStep(
  emptyRecord(),
  { notes: { hypotheses: [hypothesis], strengths: ["Counting on: every first try correct"] }, plan, source: "coach", rejections: [] },
  result,
);

describe("notebook", () => {
  it("shows each Hypothesis as a belief with its evidence as the actual Problems, their numbers and Assistance State", () => {
    const { beliefs } = notebook(coached);

    expect(beliefs).toHaveLength(1);
    expect(beliefs[0]).toMatchObject({ claim: hypothesis.claim, status: "proposed", confidence: 0.4, missing: [] });
    expect(beliefs[0].evidence).toEqual([
      { id: "p3", skill: "partners-to-10", equation: "4 + ? = 10", assistance: "hint-assisted-correct", sessionNumber: 1 },
      { id: "p4", skill: "partners-to-10", equation: "10 - 8 = ?", assistance: "revealed", sessionNumber: 1 },
    ]);
  });

  it("says what changed after the last Session and what is being tested next", () => {
    const view = notebook(coached);

    expect(view.coached).toBe(true);
    expect(view.changed).toEqual([`New: "${hypothesis.claim}"`, "Strength: Counting on: every first try correct"]);
    expect(view.testingNext).toEqual({ claim: hypothesis.claim, nextTest: hypothesis.nextTest });
    expect(view.baseline).toBeNull();
  });

  it("says the Baseline Plan is in use, and describes it from the Plan itself, when the Coach's output was rejected twice", () => {
    const record = applyCoachStep(
      emptyRecord(),
      {
        notes: emptyNotes(),
        plan: baselinePlan(result.profile),
        source: "baseline",
        rejections: [
          { attempt: 1, reasons: ["/api/coach answered 503: ANTHROPIC_API_KEY is not set"] },
          { attempt: 2, reasons: ["/api/coach answered 503: ANTHROPIC_API_KEY is not set"] },
        ],
      },
      result,
    );

    // The Baseline Plan after the Diagnostic Session: 6 Problems on the current Skill, nothing yet to review.
    expect(notebook(record).baseline).toEqual({ unavailable: false, plan: "6 Problems on Partners to 10" });
    expect(notebook(record).beliefs).toEqual([]);
    // The reasons stay on the record; the Parent is not shown them.
    expect(record.reasons).toHaveLength(2);
  });

  it("says the Coach could not be reached when that is what happened", () => {
    const record = applyCoachStep(
      emptyRecord(),
      {
        notes: emptyNotes(),
        plan: baselinePlan(result.profile),
        source: "baseline",
        rejections: [{ attempt: 1, reasons: ["/api/coach answered 503: ANTHROPIC_API_KEY is not set"], unavailable: true }],
      },
      result,
    );

    expect(notebook(record).baseline).toEqual({ unavailable: true, plan: "6 Problems on Partners to 10" });
  });

  it("is empty before the Coach has ever run", () => {
    expect(notebook(emptyRecord())).toEqual({
      coached: false,
      beliefs: [],
      strengths: [],
      changed: [],
      testingNext: null,
      baseline: null,
    });
  });

  it("names a cited Problem the device no longer holds rather than showing one fewer", () => {
    const record = { ...coached, cited: coached.cited.filter((problem) => problem.id !== "p4") };
    const [belief] = notebook(record).beliefs;

    expect(belief.evidence.map((problem) => problem.id)).toEqual(["p3"]);
    expect(belief.missing).toEqual(["p4"]);
  });
});
