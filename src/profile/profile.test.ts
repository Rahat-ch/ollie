import { describe, expect, it } from "vitest";
import { answerProblem, currentProblem, DIAGNOSTIC_PLAN, newProfile, startSession } from "@/loop";
import { awardSession, buyItem, newRewards } from "@/rewards/rewards";
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

  const fresh = newProfile();
  const beforeUnit3 = Object.fromEntries(Object.entries(fresh.skills).filter(([id]) => id !== "result-unknown" && id !== "change-unknown"));

  it("carries a version 1 Profile forward with its progress, no identity, and fresh Unit 3 states, so onboarding runs once", () => {
    const v1 = { version: 1, seed: "seed-1", progress: { ...fresh, skills: beforeUnit3 }, session: null };
    expect(parseProfile(JSON.stringify(v1))).toEqual({ ...v1, version: 4, identity: null, progress: fresh, rewards: newRewards() });
  });

  it("carries a version 2 Profile, stored before Unit 3 had Skills, forward with fresh states for them, so nothing is lost", () => {
    const stored = { ...createProfile("seed-1"), version: 2, identity, progress: { ...fresh, skills: beforeUnit3 } };
    expect(parseProfile(JSON.stringify(stored))).toEqual({ ...createProfile("seed-1"), identity, progress: fresh });
  });

  it("starts fresh when a current Profile lacks a Skill, or an old one lacks a Skill of its own time", () => {
    expect(parseProfile(JSON.stringify({ ...createProfile("seed-1"), progress: { ...fresh, skills: beforeUnit3 } }))).toBeNull();
    const missingUnit1 = Object.fromEntries(Object.entries(beforeUnit3).filter(([id]) => id !== "teen-numbers"));
    expect(parseProfile(JSON.stringify({ ...createProfile("seed-1"), version: 2, progress: { ...fresh, skills: missingUnit1 } }))).toBeNull();
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

describe("the rewards the Profile keeps", () => {
  const identity = { nickname: "Mia", avatarColor: "sky", theme: "puppies" } as const;

  it("starts a fresh Profile with no Coins, no Streak, both Freezes, and nothing worn", () => {
    expect(createProfile("seed-1").rewards).toEqual({
      coins: 0,
      lastSessionPaid: 0,
      streak: 0,
      lastSessionDay: null,
      freezes: 2,
      owned: [],
      worn: { hat: null, accessory: null, pet: null },
    });
  });

  it("round-trips Coins, the Streak, and a bought Avatar Item", () => {
    const played = awardSession(newRewards(), { sessionNumber: 1, status: "complete" }, new Date(2026, 8, 13));
    const rewards = buyItem(played.rewards, "party-hat");
    const profile = { ...createProfile("seed-1"), identity, rewards };
    const parsed = parseProfile(serializeProfile(profile));
    expect(parsed).toEqual(profile);
    expect(parsed?.rewards.worn.hat).toBe("party-hat");
  });

  it("carries a version 3 Profile, stored before there were Coins, forward with fresh rewards", () => {
    const stored = { ...createProfile("seed-1"), version: 3, identity, rewards: undefined };
    expect(parseProfile(JSON.stringify(stored))).toEqual({ ...createProfile("seed-1"), identity });
  });

  it("starts fresh when the rewards are not a shape this version knows", () => {
    const stored = (rewards: unknown) => JSON.stringify({ ...createProfile("seed-1"), identity, rewards });
    expect(parseProfile(stored({ ...newRewards(), coins: "ten" }))).toBeNull();
    expect(parseProfile(stored({ ...newRewards(), owned: ["jetpack"] }))).toBeNull();
    expect(parseProfile(stored(null))).toBeNull();
  });

  it("starts fresh when the Avatar wears an Item it does not own, or one in the wrong slot", () => {
    const stored = (rewards: unknown) => JSON.stringify({ ...createProfile("seed-1"), identity, rewards });
    const fresh = newRewards();
    expect(parseProfile(stored({ ...fresh, worn: { ...fresh.worn, hat: "party-hat" } }))).toBeNull();
    const owned = { ...fresh, owned: ["party-hat"] };
    expect(parseProfile(stored({ ...owned, worn: { ...fresh.worn, pet: "party-hat" } }))).toBeNull();
    expect(parseProfile(stored({ ...owned, worn: { ...fresh.worn, hat: "party-hat" } }))).not.toBeNull();
  });
});
