import { newProfile } from "./session";
import type { ProfileState, SkillId } from "./types";

/** A fresh Profile with the given Skills already Mastered. For tests only. */
export function profileWithMastered(...skills: SkillId[]): ProfileState {
  const profile = newProfile();
  const states = { ...profile.skills };
  for (const id of skills) {
    states[id] = { estimate: 0.99, recentFirstAttempts: Array(10).fill(true), mastered: true };
  }
  return { ...profile, skills: states };
}
