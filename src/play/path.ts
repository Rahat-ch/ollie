/**
 * The Path on the home screen: the three Units in order, where the Learner
 * is, and the Powers Ollie has learned at each of them.
 */
import { isUnitUnlocked, POWERS, SKILLS, unitName } from "@/loop";
import type { Power, PowerId, ProfileState, Unit } from "@/loop";

export type PathStop = {
  readonly unit: Unit;
  readonly name: string;
  readonly state: "done" | "current" | "locked";
  /** The Powers Ollie has learned here, in the order they are learned. */
  readonly powers: readonly Power[];
};

/** A Unit is done when every one of its Skills is Mastered. */
export function pathStops(progress: ProfileState, held: readonly PowerId[]): PathStop[] {
  return ([1, 2, 3] as const).map((unit) => {
    const skills = SKILLS.filter((s) => s.unit === unit);
    const done = skills.every((s) => progress.skills[s.id].mastered);
    const open = isUnitUnlocked(unit, progress);
    return {
      unit,
      name: unitName(unit),
      state: done ? "done" : open ? "current" : "locked",
      powers: POWERS.filter((power) => held.includes(power.id) && power.unit === unit),
    };
  });
}
