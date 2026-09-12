import { describe, expect, it } from "vitest";
import { answerProblem, currentProblem, DIAGNOSTIC_PLAN, newProfile, startSession } from "@/loop";
import { AVATAR_COLORS, cleanNickname, THEMES } from "./identity";
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

describe("the identity chosen at onboarding", () => {
  const identity = { nickname: "Mia", avatarColor: "sky", theme: "puppies" } as const;

  it("is null on a fresh Profile and round-trips once set", () => {
    expect(createProfile("seed-1").identity).toBeNull();
    const profile = { ...createProfile("seed-1"), identity };
    expect(parseProfile(serializeProfile(profile))).toEqual(profile);
  });

  it("carries a version 1 Profile forward with its progress and no identity, so onboarding runs once", () => {
    const v1 = { version: 1, seed: "seed-1", progress: newProfile(), session: null };
    expect(parseProfile(JSON.stringify(v1))).toEqual({ ...v1, version: 2, identity: null });
  });

  it("starts fresh when the identity is not one the app knows", () => {
    const stored = (identity: unknown) => JSON.stringify({ ...createProfile("seed-1"), identity });
    expect(parseProfile(stored({ ...identity, theme: "robots" }))).toBeNull();
    expect(parseProfile(stored({ ...identity, avatarColor: "plum" }))).toBeNull();
    expect(parseProfile(stored({ ...identity, nickname: "" }))).toBeNull();
    expect(parseProfile(stored("Mia"))).toBeNull();
  });
});

describe("the choices onboarding offers", () => {
  it("has four Avatar colours and six Themes", () => {
    expect(AVATAR_COLORS.map((c) => c.id)).toEqual(["cream", "sky", "leaf", "berry"]);
    expect(THEMES.map((t) => t.name)).toEqual(["Puppies", "Dinosaurs", "Space", "Ocean", "Fairies", "Trucks"]);
  });

  it("keeps a Nickname to what Ollie can say: trimmed, one line, at most 20 characters", () => {
    expect(cleanNickname("  Mia ")).toBe("Mia");
    expect(cleanNickname("Mia\nRose")).toBe("Mia Rose");
    expect(cleanNickname("Bartholomew Montgomery III")).toBe("Bartholomew Montgome");
    expect(cleanNickname("   ")).toBe("");
  });
});
