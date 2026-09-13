import { describe, expect, it } from "vitest";
import { baselinePlan, DIAGNOSTIC_PLAN, emptyNotes, newProfile, runSession, scripted } from "@/loop";
import type { Hypothesis, LearnerNotes } from "@/loop";
import type { ParentSummary } from "@/summary/summary";
import type { CoachStep } from "./types";
import { addSummary, applyCoachStep, awaitCoach, emptyRecord, notesChanges, SUMMARIES_KEPT } from "./record";

/** A Diagnostic Session: p3 and p8 Hint-assisted, p4 Revealed. */
const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-r", scripted("ffhrfffhf"));

const hypothesis = (over: Partial<Hypothesis> = {}): Hypothesis => ({
  id: "h1",
  claim: "May need more practice with partners to 10",
  status: "proposed",
  confidence: 0.4,
  evidence: ["p3", "p4"],
  nextTest: "Give 3 more partners to 10 Problems",
  ...over,
});

const notes = (...hypotheses: Hypothesis[]): LearnerNotes => ({ hypotheses, strengths: [] });

const step = (over: Partial<CoachStep> = {}): CoachStep => ({
  notes: notes(hypothesis()),
  plan: { length: 8, skills: [{ skill: "partners-to-10", weight: 1 }], reviewShare: 0, hypothesisUnderTest: "h1" },
  source: "coach",
  rejections: [],
  ...over,
});

const summary = (sessionNumber: number): ParentSummary => ({
  sessionNumber,
  at: `2026-09-1${sessionNumber}T10:00:00.000Z`,
  practiced: `Session ${sessionNumber}.`,
  activity: "Count ten spoons together.",
  source: "summary",
  problems: 8,
  practice: [],
  mastered: [],
  powers: [],
});

describe("applyCoachStep", () => {
  it("keeps the Notes, the next Session Plan, and the Session the Coach ran on", () => {
    const record = applyCoachStep(emptyRecord(), step(), result);

    expect(record.notes).toEqual(notes(hypothesis()));
    expect(record.plan).toEqual(step().plan);
    expect(record.source).toBe("coach");
    expect(record.reasons).toEqual([]);
    expect(record.lastSessionCoached).toBe(1);
  });

  it("keeps every Problem the Notes cite, with its numbers and Assistance State, so the Notebook can show the evidence", () => {
    const record = applyCoachStep(emptyRecord(), step(), result);

    expect(record.cited).toEqual([
      { id: "p3", skill: "partners-to-10", equation: "4 + ? = 10", assistance: "hint-assisted-correct", sessionNumber: 1 },
      { id: "p4", skill: "partners-to-10", equation: "10 - 8 = ?", assistance: "revealed", sessionNumber: 1 },
    ]);
  });

  it("drops a Problem no Hypothesis cites any more and keeps one cited from an earlier Session", () => {
    const first = applyCoachStep(emptyRecord(), step(), result);
    const later = runSession(baselinePlan(result.profile), result.profile, "seed-r", scripted("rf"));
    const carried = step({ notes: notes(hypothesis({ evidence: ["p4", later.log.entries[0].problem.id] })) });

    const record = applyCoachStep(first, carried, later);

    expect(record.cited.map((problem) => problem.id)).toEqual(["p4", later.log.entries[0].problem.id]);
    expect(record.cited[0].sessionNumber).toBe(1);
    expect(record.cited[1].sessionNumber).toBe(2);
  });

  it("records the Baseline fallback and why, so the Notebook can say so", () => {
    const fallback = step({
      notes: emptyNotes(),
      plan: baselinePlan(result.profile),
      source: "baseline",
      rejections: [
        { attempt: 1, reasons: ["the Coach could not be reached"] },
        { attempt: 2, reasons: ["the Coach could not be reached"] },
      ],
    });

    const record = applyCoachStep(emptyRecord(), fallback, result);

    expect(record.source).toBe("baseline");
    expect(record.reasons).toEqual(["the Coach could not be reached", "the Coach could not be reached"]);
    expect(record.unavailable).toBe(false);
    expect(record.lastSessionCoached).toBe(1);
  });

  it("says what changed after the Session: a new Hypothesis, a status that moved, and evidence that grew", () => {
    const before = notes(hypothesis(), hypothesis({ id: "h2", claim: "Counting on is becoming independent" }));
    const after = notes(
      hypothesis({ status: "supported", evidence: ["p3", "p4", "p5"] }),
      hypothesis({ id: "h2", claim: "Counting on is becoming independent" }),
      hypothesis({ id: "h3", claim: "Teen numbers may be shaky when the Problem asks for the whole" }),
    );

    expect(notesChanges(before, after)).toEqual([
      'Now supported: "May need more practice with partners to 10", with more evidence',
      'New: "Teen numbers may be shaky when the Problem asks for the whole"',
    ]);
  });
});

describe("awaitCoach", () => {
  it("keeps the Session the Coach has still to run on, and never a Session it has already run on", () => {
    const waiting = awaitCoach(emptyRecord(), result);
    expect(waiting.awaiting).toBe(result);

    const coached = applyCoachStep(waiting, step(), result);
    expect(coached.awaiting).toBe(result);
    expect(awaitCoach({ ...coached, awaiting: null }, result).awaiting).toBeNull();
  });
});

describe("addSummary", () => {
  it("keeps the last seven Parent Summaries, newest first", () => {
    const record = Array.from({ length: SUMMARIES_KEPT + 2 }, (_, i) => i + 1).reduce(
      (current, sessionNumber) => addSummary(current, summary(sessionNumber)),
      emptyRecord(),
    );

    expect(record.summaries).toHaveLength(7);
    expect(record.summaries.map((s) => s.sessionNumber)).toEqual([9, 8, 7, 6, 5, 4, 3]);
  });

  it("orders the Summaries by Session, newest first, whatever order they were written in", () => {
    const record = [3, 1, 5, 2].reduce((current, sessionNumber) => addSummary(current, summary(sessionNumber)), emptyRecord());

    expect(record.summaries.map((s) => s.sessionNumber)).toEqual([5, 3, 2, 1]);
  });

  it("replaces the Summary of a Session that already has one", () => {
    const once = addSummary(emptyRecord(), summary(1));
    const again = addSummary(once, { ...summary(1), practiced: "Written again." });

    expect(again.summaries).toHaveLength(1);
    expect(again.summaries[0].practiced).toBe("Written again.");
  });
});
