import { describe, expect, it } from "vitest";
import { baselinePlan, DIAGNOSTIC_PLAN, newProfile, planSpace, runSession, scripted, validatePlan } from "@/loop";
import type { LearnerNotes, SkillId } from "@/loop";
import { profileWithMastered } from "@/loop/testing";
import { coachInput } from "@/coach";
import { fakeGeneration } from "@/generation/fake";
import { parseCoachOutput } from "@/generation/coach-schema";
import type { CoachEvidence, CoachInput, CoachOutput, StoryInput } from "@/generation/types";

const emptyNotes: LearnerNotes = { hypotheses: [], strengths: [] };

/** A Diagnostic Session: p3 and p8 (teen numbers) Hint-assisted, p4 (partners to 10) Revealed. */
const diagnostic = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-f", scripted("ffhrfffhf"));

const story: StoryInput = {
  skill: "make-a-ten",
  structure: "larger-first",
  equation: { left: 8, op: "+", right: 5, result: 13, unknown: "result" },
  answer: 13,
  theme: "puppies",
  nickname: "Sam",
};

describe("the Generation fake", () => {
  it("has exactly the four operations", () => {
    expect(Object.keys(fakeGeneration()).sort()).toEqual(["renderSpeech", "runCoach", "writeStory", "writeSummary"]);
  });

  it("lets an override replace one operation and keep the other three", async () => {
    const bad: CoachOutput = { notes: emptyNotes, plan: { length: 99, skills: [], reviewShare: 0, hypothesisUnderTest: null } };
    const generation = fakeGeneration({ runCoach: async () => bad });
    expect(await generation.runCoach(coachInput(diagnostic, emptyNotes))).toBe(bad);
    expect((await generation.writeStory(story)).text).toContain("Sam");
    expect((await generation.writeSummary({ log: diagnostic.log, notes: emptyNotes })).text).toContain("Session 1");
    expect((await generation.renderSpeech({ text: "" })).mimeType).toBe("audio/mpeg");
  });
});

describe("the fake Coach on a real Session", () => {
  const input = coachInput(diagnostic, emptyNotes);

  it("returns Notes and a Plan that pass the schema", async () => {
    const output = await fakeGeneration().runCoach(input);
    expect(parseCoachOutput(output)).toEqual({ ok: true, output });
  });

  it("returns a Plan inside the Plan Space", async () => {
    const { plan } = await fakeGeneration().runCoach(input);
    expect(validatePlan(plan, diagnostic.profile)).toEqual({ ok: true });
  });

  it("forms one Hypothesis per Skill missed this Session, citing exactly those misses", async () => {
    const { notes } = await fakeGeneration().runCoach(input);
    expect(notes.hypotheses.map((h) => [h.id, h.evidence, h.status, h.confidence])).toEqual([
      ["h-teen-numbers", ["p3", "p8"], "proposed", 0.7],
      ["h-partners-to-10", ["p4"], "proposed", 0.5],
    ]);
  });

  it("cites only Problem IDs from this Session", async () => {
    const { notes } = await fakeGeneration().runCoach(input);
    const known = new Set(diagnostic.log.entries.map((e) => e.problem.id));
    const cited = notes.hypotheses.flatMap((h) => h.evidence);
    expect(cited.length).toBeGreaterThan(0);
    expect(cited.every((id) => known.has(id))).toBe(true);
  });

  it("grows the existing Hypothesis on a second Session's misses instead of adding a second one", async () => {
    const { notes: afterFirst } = await fakeGeneration().runCoach(input);
    const second = runSession(baselinePlan(diagnostic.profile), diagnostic.profile, "seed-f", scripted("hhhfff"));
    expect(second.log.entries.map((e) => e.problem.skill)).toEqual(Array(6).fill("partners-to-10"));
    const { notes } = await fakeGeneration().runCoach(coachInput(second, afterFirst));

    expect(notes.hypotheses.filter((h) => h.id === "h-partners-to-10")).toEqual([
      expect.objectContaining({ evidence: ["p4", "p10", "p11", "p12"], status: "supported", confidence: 0.9 }),
    ]);
    expect(notes.hypotheses.filter((h) => h.id !== "h-partners-to-10")).toEqual(
      afterFirst.hypotheses.filter((h) => h.id !== "h-partners-to-10"),
    );
  });

  it("answers the same input the same way twice", async () => {
    expect(await fakeGeneration().runCoach(input)).toEqual(await fakeGeneration().runCoach(input));
  });
});

describe("the fake Coach's decisions", () => {
  const entry = (id: string, skill: SkillId, assistance: CoachEvidence["assistance"], position: number): CoachEvidence => ({
    id,
    skill,
    structure: "missing-partner",
    equation: "7 + ? = 10",
    review: false,
    position,
    assistance,
    firstTryMs: 3000,
  });
  const profile = profileWithMastered("partners-to-10");
  const handInput: CoachInput = {
    sessionNumber: 2,
    evidence: [
      entry("p10", "partners-to-10", "first-try-correct", 1),
      entry("p11", "teen-numbers", "hint-assisted-correct", 2),
      entry("p12", "partners-to-10", "first-try-correct", 3),
      entry("p13", "teen-numbers", "first-try-correct", 4),
    ],
    notes: { hypotheses: [], strengths: ["an old strength"] },
    estimates: profile.skills,
    planSpace: planSpace(profile),
  };

  it("plans the first unmastered Skill, reviews the Mastered one, and tests that Skill's Hypothesis", async () => {
    const { plan } = await fakeGeneration().runCoach(handInput);
    expect(plan).toEqual({
      length: 8,
      skills: [{ skill: "teen-numbers", weight: 1 }],
      reviewShare: 0.25,
      hypothesisUnderTest: "h-teen-numbers",
    });
  });

  it("plans no review and no Hypothesis under test when nothing is Mastered and nothing was missed", async () => {
    const fresh = newProfile();
    const { notes, plan } = await fakeGeneration().runCoach({
      ...handInput,
      evidence: [entry("p1", "partners-to-10", "first-try-correct", 1), entry("p2", "partners-to-10", "first-try-correct", 2)],
      notes: emptyNotes,
      estimates: fresh.skills,
      planSpace: planSpace(fresh),
    });
    expect(notes.hypotheses).toEqual([]);
    expect(plan).toEqual({ length: 8, skills: [{ skill: "partners-to-10", weight: 1 }], reviewShare: 0, hypothesisUnderTest: null });
  });
});

describe("the other three operations", () => {
  it("writes a one-line Story addressed by Nickname in the Theme", async () => {
    const { text } = await fakeGeneration().writeStory(story);
    expect(text).toContain("Sam");
    expect(text).toContain("puppies");
    expect(text).not.toContain("\n");
  });

  it("writes a Parent Summary that names the Session number and Problem count", async () => {
    const { text } = await fakeGeneration().writeSummary({ log: diagnostic.log, notes: emptyNotes });
    expect(text).toContain("Session 1");
    expect(text).toContain("9 Problems");
  });

  it("renders no audio, so nothing waits on it", async () => {
    expect(await fakeGeneration().renderSpeech({ text: "8 and 5 more?" })).toEqual({
      audio: new Uint8Array(0),
      mimeType: "audio/mpeg",
    });
  });
});
