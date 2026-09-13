/**
 * The Path on the home screen: the three Units in order and where the
 * Learner is. Powers join each stop in ticket 13.
 */
import { isUnitUnlocked, SKILLS, unitName } from "@/loop";
import type { ProfileState, Unit } from "@/loop";

export type PathStop = {
  readonly unit: Unit;
  readonly name: string;
  readonly state: "done" | "current" | "locked";
};

/** A Unit is done when every one of its Skills is Mastered. */
export function pathStops(progress: ProfileState): PathStop[] {
  return ([1, 2, 3] as const).map((unit) => {
    const skills = SKILLS.filter((s) => s.unit === unit);
    const done = skills.every((s) => progress.skills[s.id].mastered);
    const open = isUnitUnlocked(unit, progress);
    return { unit, name: unitName(unit), state: done ? "done" : open ? "current" : "locked" };
  });
}
