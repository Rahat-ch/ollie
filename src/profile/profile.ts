/**
 * The Profile as the browser keeps it: the Loop's progress, the Session in
 * progress (so a reload resumes it), and the seed every Session's numbers
 * derive from. One per device, in localStorage, never sent anywhere
 * (ADR 0002). The Nickname, Avatar, and Theme join in ticket 09.
 */
import { newProfile, SKILLS } from "@/loop";
import type { ProfileState, SessionState } from "@/loop";

export const PROFILE_VERSION = 1;

export type Profile = {
  readonly version: typeof PROFILE_VERSION;
  /** Fixed at creation; the Loop derives each Session's numbers from it. */
  readonly seed: string;
  readonly progress: ProfileState;
  /** The Session being played, or null between Sessions. */
  readonly session: SessionState | null;
};

export function createProfile(seed: string): Profile {
  return { version: PROFILE_VERSION, seed, progress: newProfile(), session: null };
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
  if (!isRecord(value) || value.version !== PROFILE_VERSION) return null;
  if (typeof value.seed !== "string" || !isProgress(value.progress)) return null;
  if (value.session !== null && !isSession(value.session)) return null;
  return {
    version: PROFILE_VERSION,
    seed: value.seed,
    progress: value.progress,
    session: value.session as SessionState | null,
  };
}
