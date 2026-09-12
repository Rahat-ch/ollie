/**
 * The Profile as the browser keeps it: the Loop's progress, the Session in
 * progress (so a reload resumes it), and the seed every Session's numbers
 * derive from, and the identity the Parent chose at onboarding. One per
 * device, in localStorage, never sent anywhere (ADR 0002).
 */
import { newProfile, SKILLS } from "@/loop";
import type { ProfileState, SessionState } from "@/loop";
import { isIdentity, type Identity } from "./identity";

/** Version 1 had no identity; a stored version 1 Profile is carried forward with none, so onboarding runs. */
export const PROFILE_VERSION = 2;

export type Profile = {
  readonly version: typeof PROFILE_VERSION;
  /** Fixed at creation; the Loop derives each Session's numbers from it. */
  readonly seed: string;
  /** The Nickname, Avatar colour, and Theme; null until onboarding is done. */
  readonly identity: Identity | null;
  readonly progress: ProfileState;
  /** The Session being played, or null between Sessions. */
  readonly session: SessionState | null;
};

export function createProfile(seed: string): Profile {
  return { version: PROFILE_VERSION, seed, identity: null, progress: newProfile(), session: null };
}

export function serializeProfile(profile: Profile): string {
  return JSON.stringify(profile);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function isProgress(value: unknown): value is ProfileState {
  if (!isRecord(value)) return false;
  const { nextProblemNumber, sessionsCompleted, skills } = value;
  return (
    typeof nextProblemNumber === "number" &&
    typeof sessionsCompleted === "number" &&
    isRecord(skills) &&
    SKILLS.every((skill) => isRecord(skills[skill.id]))
  );
}

function isSession(value: unknown): value is SessionState {
  return (
    isRecord(value) &&
    Array.isArray(value.problems) &&
    Array.isArray(value.entries) &&
    Array.isArray(value.attempts) &&
    typeof value.position === "number" &&
    typeof value.status === "string" &&
    isProgress(value.profile)
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
  const identity = value.version === 1 ? null : value.identity;
  if (value.version !== 1 && value.version !== PROFILE_VERSION) return null;
  if (typeof value.seed !== "string" || !isProgress(value.progress)) return null;
  if (identity !== null && !isIdentity(identity)) return null;
  if (value.session !== null && !isSession(value.session)) return null;
  return {
    version: PROFILE_VERSION,
    seed: value.seed,
    identity,
    progress: value.progress,
    session: value.session as SessionState | null,
  };
}
