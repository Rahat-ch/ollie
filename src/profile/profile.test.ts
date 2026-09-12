import { describe, expect, it } from "vitest";
import { answerProblem, currentProblem, DIAGNOSTIC_PLAN, newProfile, startSession } from "@/loop";
import { createProfile, parseProfile, serializeProfile } from "./profile";

describe("createProfile", () => {
  it("starts with fresh progress, no Session in progress, and the seed it was given", () => {
    const profile = createProfile("seed-1");
    expect(profile.seed).toBe("seed-1");
    expect(profile.progress).toEqual(newProfile());
    expect(profile.session).toBeNull();
  });
});

describe("parseProfile", () => {
  it("round-trips a Profile with a Session in progress, Estimates intact", () => {
    let session = startSession(DIAGNOSTIC_PLAN, newProfile(), "seed-1");
    session = answerProblem(session, currentProblem(session)!.answer, 2500);
    const profile = { ...createProfile("seed-1"), session };
    const parsed = parseProfile(serializeProfile(profile));
    expect(parsed).toEqual(profile);
    expect(parsed?.session?.skills[currentProblem(session)!.skill].estimate).toBe(
      session.skills[currentProblem(session)!.skill].estimate,
    );
  });

  it("returns null for nothing, for text that is not JSON, and for a shape it does not know", () => {
    expect(parseProfile(null)).toBeNull();
    expect(parseProfile("")).toBeNull();
    expect(parseProfile("{not json")).toBeNull();
    expect(parseProfile(JSON.stringify({ version: 99, seed: "x" }))).toBeNull();
    expect(parseProfile(JSON.stringify({ version: 1, seed: "x", progress: {}, session: null }))).toBeNull();
    expect(parseProfile(JSON.stringify([1, 2, 3]))).toBeNull();
  });
});
