import { describe, expect, it } from "vitest";
import {
  alwaysFirstTry,
  baselinePlan,
  DIAGNOSTIC_PLAN,
  emptyNotes,
  isUnitUnlocked,
  knownProblemIds,
  newProfile,
  planSpace,
  runSession,
  scripted,
  SKILLS,
} from "@/loop";
import type { LearnerNotes, ProfileState, SessionPlan, SessionResult, SkillId } from "@/loop";
import { profileWithMastered } from "@/loop/testing";
import { fakeGeneration } from "@/generation/fake";
import type { CoachInput, CoachOutput } from "@/generation/types";
import { boundsFromInput, coachInput } from "./coach";
import { acceptServerStep, serverCoachStep } from "./server";

const practise = (skill: SkillId, length = 10): SessionPlan => ({ length, skills: [{ skill, weight: 1 }], reviewShare: 0, hypothesisUnderTest: null });

/** A Profile one Session from Mastering `skill`: nine of the last ten first tries right and the Estimate just short. */
function oneSessionFrom(skill: SkillId, profile: ProfileState): ProfileState {
  return { ...profile, sessionsCompleted: 3, skills: { ...profile.skills, [skill]: { estimate: 0.9, recentFirstAttempts: Array(10).fill(true), mastered: false } } };
}

const UNIT_1 = SKILLS.filter((s) => s.unit === 1).map((s) => s.id);
const UNIT_2 = SKILLS.filter((s) => s.unit === 2).map((s) => s.id);

describe("the Plan Space the server rebuilds", () => {
  const lastOfUnit2 = UNIT_2[UNIT_2.length - 1];
  const beforeUnit2 = oneSessionFrom(UNIT_1[UNIT_1.length - 1], profileWithMastered(...UNIT_1.slice(0, -1)));
  const beforeUnit3 = oneSessionFrom(lastOfUnit2, profileWithMastered(...UNIT_1, ...UNIT_2.slice(0, -1)));
  /** Sessions whose Profiles, after the Session, sit in each Unit and on each Unit's threshold. */
  const sessions: { readonly name: string; readonly result: SessionResult }[] = [
    { name: "the Diagnostic Session", result: runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-p1", scripted("ffhrfffhf")) },
    { name: "a Session inside Unit 1", result: runSession(practise(UNIT_1[0]), { ...newProfile(), sessionsCompleted: 2 }, "seed-p2", scripted("frfrfrfrfr")) },
    { name: "the Session that Masters Unit 1 and opens Unit 2", result: runSession(practise(UNIT_1[UNIT_1.length - 1]), beforeUnit2, "seed-p3", alwaysFirstTry) },
    { name: "a Session inside Unit 2", result: runSession(practise(UNIT_2[0], 8), { ...profileWithMastered(...UNIT_1), sessionsCompleted: 5 }, "seed-p4", alwaysFirstTry) },
    { name: "the Session that Masters Unit 2 and opens Unit 3", result: runSession(practise(lastOfUnit2), beforeUnit3, "seed-p5", alwaysFirstTry) },
    { name: "a Session with every Skill Mastered", result: runSession(practise("change-unknown", 6), { ...profileWithMastered(...SKILLS.map((s) => s.id)), sessionsCompleted: 20 }, "seed-p6", alwaysFirstTry) },
  ];

  it("is tested on Sessions that cross both Unit thresholds", () => {
    expect([isUnitUnlocked(2, beforeUnit2), isUnitUnlocked(2, sessions[2].result.profile)]).toEqual([false, true]);
    expect([isUnitUnlocked(3, beforeUnit3), isUnitUnlocked(3, sessions[4].result.profile)]).toEqual([false, true]);
  });

  for (const { name, result } of sessions) {
    it(`equals the device's for ${name}`, () => {
      const input = coachInput(result, emptyNotes());

      expect(planSpace(boundsFromInput(input).profile)).toEqual(planSpace(result.profile));
      expect(planSpace(boundsFromInput(input).profile)).toEqual(input.planSpace);
    });
  }

  it("knows the same Problem IDs the device does: this Session's and those the Notes already cite", () => {
    const { result } = sessions[1];
    const notes: LearnerNotes = {
      hypotheses: [{ id: "h1", claim: "Counts on from one", status: "proposed", confidence: 0.4, evidence: ["p0", "p2"], nextTest: "Watch counting on" }],
      strengths: [],
    };

    expect(boundsFromInput(coachInput(result, notes)).known).toEqual(knownProblemIds(result.log, notes));
  });
});

const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-s", scripted("ffhrfffhf"));
const notes = emptyNotes();
const input = coachInput(result, notes);
const valid = (given: CoachInput): Promise<CoachOutput> => fakeGeneration().runCoach(given);

describe("serverCoachStep", () => {
  it("does not retry a call its caller has abandoned: nobody is waiting for the retry", async () => {
    const abandoned = new AbortController();
    let calls = 0;
    const generation = fakeGeneration({
      runCoach: async () => {
        calls += 1;
        abandoned.abort();
        throw new Error("Request was aborted.");
      },
    });

    const step = await serverCoachStep(generation, input, abandoned.signal);

    expect(calls).toBe(1);
    expect(step).toMatchObject({ source: "baseline", rejections: [{ attempt: 1, reasons: ["Request was aborted."] }] });
  });

  it("passes its signal into the model call, so the call is cancelled when the caller goes", async () => {
    const signals: (AbortSignal | undefined)[] = [];
    const generation = fakeGeneration({
      runCoach: async (given, options) => {
        signals.push(options?.signal);
        return valid(given);
      },
    });
    const caller = new AbortController();

    await serverCoachStep(generation, input, caller.signal);

    expect(signals).toHaveLength(1);
    expect(signals[0]?.aborted).toBe(false);
    caller.abort();
    expect(signals[0]?.aborted).toBe(true);
  });
});

describe("acceptServerStep, the device's own check of what the route answered", () => {
  it("keeps a Coach output the route answered and the device's check allows, with where it came from", async () => {
    const output = await valid(input);

    expect(acceptServerStep({ ...output, source: "coach", rejections: [] }, result, notes)).toEqual({ ...output, source: "coach", rejections: [] });
    const rejections = [{ attempt: 1, reasons: ["length 12 is outside 6 to 10"] }];
    expect(acceptServerStep({ ...output, source: "retry", rejections }, result, notes)).toEqual({ ...output, source: "retry", rejections });
  });

  it("uses its own Baseline Plan and the Notes from before the Session when the route used the Baseline, with the route's reasons", () => {
    const rejections = [
      { attempt: 1, reasons: ['h9 cites "p99", which is not a Problem the Coach was shown'] },
      { attempt: 2, reasons: ['h9 cites "p99", which is not a Problem the Coach was shown'] },
    ];
    // Whatever Plan the route claims, the device plans the Baseline from its own Profile.
    const answer = { notes: { hypotheses: [], strengths: ["claimed"] }, plan: practise("change-unknown"), source: "baseline", rejections };

    expect(acceptServerStep(answer, result, notes)).toEqual({ notes, plan: baselinePlan(result.profile), source: "baseline", rejections });
  });

  it("keeps the route's word that the Coach could not be reached, so the Notebook says so", () => {
    const rejections = [{ attempt: 1, reasons: ["the model did not answer within the server's deadline of 75 s"], unavailable: true }];
    const answer = { notes, plan: baselinePlan(result.profile), source: "baseline", rejections };

    expect(acceptServerStep(answer, result, notes).rejections).toEqual(rejections);
  });

  it("still rejects an output the device's own check does not allow, as the attempt it was", async () => {
    const output = await valid(input);
    const invented = { ...output, notes: { ...output.notes, hypotheses: [{ ...output.notes.hypotheses[0], evidence: ["p99"] }] } };

    const step = acceptServerStep({ ...invented, source: "coach", rejections: [] }, result, notes);

    expect(step.source).toBe("baseline");
    expect(step.plan).toEqual(baselinePlan(result.profile));
    expect(step.notes).toEqual(notes);
    expect(step.rejections).toEqual([{ attempt: 1, output: invented, reasons: [expect.stringContaining('cites "p99"')] }]);
  });

  it("rejects an answer that is not a Coach step at all", () => {
    const step = acceptServerStep({ notes, plan: baselinePlan(result.profile) }, result, notes);

    expect(step.source).toBe("baseline");
    expect(step.rejections).toHaveLength(1);
    expect(step.rejections[0].reasons[0]).toContain("source");
  });
});
