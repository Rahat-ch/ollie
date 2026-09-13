/**
 * The Profile as the browser keeps it: the Loop's progress, the Session in
 * progress (so a reload resumes it), and the seed every Session's numbers
 * derive from, and the identity the Parent chose at onboarding. One per
 * device, in localStorage, never sent anywhere (ADR 0002).
 */
import { newProfile, SKILLS } from "@/loop";
import type { ProfileState, SessionState } from "@/loop";
import { emptyRecord, type CoachRecord } from "@/coach/record";
import { parseCoachRecord } from "@/coach/record-schema";
import { newRewards, type Rewards } from "@/rewards/rewards";
import { AVATAR_SLOTS, SHOP_ITEMS, shopItem, type AvatarItemId } from "@/rewards/shop";
import { isIdentity, type Identity } from "./identity";

/**
 * Version 1 had no identity; a stored version 1 Profile is carried forward
 * with none, so onboarding runs. Version 2 had no Unit 3 Skills; a stored
 * version 2 Profile gets their fresh states. Version 3 had no Coins, Streak,
 * or Shop; a stored version 3 Profile gets fresh rewards, so a Learner
 * playing before the Shop existed keeps her progress and starts earning.
 * Version 4 had no Coach on the device; a stored version 4 Profile gets an
 * empty record, so the next Session is the Baseline's until the Coach has
 * run once.
 */
export const PROFILE_VERSION = 5;

export type Profile = {
  readonly version: typeof PROFILE_VERSION;
  /** Fixed at creation; the Loop derives each Session's numbers from it. */
  readonly seed: string;
  /** The Nickname, Avatar colour, and Theme; null until onboarding is done. */
  readonly identity: Identity | null;
  readonly progress: ProfileState;
  /** Coins, the Streak, the Freezes, and what the Avatar wears. */
  readonly rewards: Rewards;
  /** The Learner Notes, the next Session Plan, and the Parent Summaries the Coach has left. */
  readonly coach: CoachRecord;
  /** The Session being played, or null between Sessions. */
  readonly session: SessionState | null;
};

export function createProfile(seed: string): Profile {
  return { version: PROFILE_VERSION, seed, identity: null, progress: newProfile(), rewards: newRewards(), coach: emptyRecord(), session: null };
}

export function serializeProfile(profile: Profile): string {
  return JSON.stringify(profile);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The Skills a stored version had states for: versions 1 and 2 predate Unit 3. */
const skillsInVersion = (version: number): readonly (typeof SKILLS)[number][] =>
  version < 3 ? SKILLS.filter((skill) => skill.unit < 3) : SKILLS;

function isProgress(value: unknown, version: number): value is ProfileState {
  if (!isRecord(value)) return false;
  const { nextProblemNumber, sessionsCompleted, skills } = value;
  return (
    typeof nextProblemNumber === "number" &&
    typeof sessionsCompleted === "number" &&
    isRecord(skills) &&
    skillsInVersion(version).every((skill) => isRecord(skills[skill.id]))
  );
}

/** A Skill that did not exist when the Profile was stored gets the fresh state, as a new Profile would. */
function withEverySkill(skills: ProfileState["skills"]): ProfileState["skills"] {
  const fresh = newProfile().skills;
  const missing = SKILLS.filter((skill) => !isRecord(skills[skill.id]));
  if (missing.length === 0) return skills;
  const filled = { ...skills };
  for (const skill of missing) filled[skill.id] = fresh[skill.id];
  return filled;
}

const withEverySkillState = (progress: ProfileState): ProfileState => ({ ...progress, skills: withEverySkill(progress.skills) });

const isItemId = (value: unknown): value is AvatarItemId => SHOP_ITEMS.some((item) => item.id === value);

/** An Item is worn only if the Learner bought it and it belongs in that slot. */
function isWorn(worn: unknown, owned: readonly AvatarItemId[]): boolean {
  if (!isRecord(worn)) return false;
  return AVATAR_SLOTS.every((slot) => {
    const id = worn[slot];
    return id === null || (isItemId(id) && owned.includes(id) && shopItem(id).slot === slot);
  });
}

function isRewards(value: unknown): value is Rewards {
  if (!isRecord(value)) return false;
  const { coins, lastSessionPaid, streak, lastSessionDay, freezes, owned, worn } = value;
  return (
    [coins, lastSessionPaid, streak, freezes].every((n) => typeof n === "number") &&
    (lastSessionDay === null || typeof lastSessionDay === "string") &&
    Array.isArray(owned) &&
    owned.every(isItemId) &&
    isWorn(worn, owned)
  );
}

function isSession(value: unknown, version: number): value is SessionState {
  return (
    isRecord(value) &&
    Array.isArray(value.problems) &&
    Array.isArray(value.entries) &&
    Array.isArray(value.attempts) &&
    typeof value.position === "number" &&
    typeof value.status === "string" &&
    isProgress(value.profile, version)
  );
}

/**
 * The stored text back into a Profile, or null when there is none or it is
 * not a Profile this version knows, in which case the caller starts fresh.
 */
export function parseProfile(text: string | null): Profile | null {
  if (!text) return null;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(value)) return null;
  const { version } = value;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1 || version > PROFILE_VERSION) return null;
  const identity = version === 1 ? null : value.identity;
  if (typeof value.seed !== "string" || !isProgress(value.progress, version)) return null;
  if (identity !== null && !isIdentity(identity)) return null;
  if (value.session !== null && !isSession(value.session, version)) return null;
  // Versions before 4 had no rewards at all; every later Profile must carry them.
  const rewards = version < 4 ? newRewards() : value.rewards;
  if (!isRewards(rewards)) return null;
  // Versions before 5 had no Coach on the device, and a record this version
  // does not know is lost on its own: the progress beside it is not.
  const coach = parseCoachRecord(value.coach, version);
  const session = value.session as SessionState | null;
  return {
    version: PROFILE_VERSION,
    seed: value.seed,
    identity,
    progress: withEverySkillState(value.progress),
    rewards,
    coach,
    session: session && { ...session, profile: withEverySkillState(session.profile), skills: withEverySkill(session.skills) },
  };
}
