/**
 * The Path on the home screen: the three Units in order and where the
 * Learner is. Powers join each stop in ticket 13.
 */
import { isUnitUnlocked, SKILLS } from "@/loop";
import type { ProfileState, Unit } from "@/loop";

export type PathStop = {
  readonly unit: Unit;
  readonly name: string;
  readonly state: "done" | "current" | "locked";
};

const UNIT_NAMES: Readonly<Record<Unit, string>> = {
  1: "Partners to 10",
  2: "Counting on and make-a-ten",
  3: "Word problems",
};

/** A Unit is done when it has Skills and every one is Mastered; a Unit with no Skills yet stays locked. */
export function pathStops(progress: ProfileState): PathStop[] {
  return ([1, 2, 3] as const).map((unit) => {
    const skills = SKILLS.filter((s) => s.unit === unit);
    const done = skills.length > 0 && skills.every((s) => progress.skills[s.id].mastered);
    const open = skills.length > 0 && isUnitUnlocked(unit, progress);
    return { unit, name: UNIT_NAMES[unit], state: done ? "done" : open ? "current" : "locked" };
  });
}
