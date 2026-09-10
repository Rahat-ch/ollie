import { SKILLS } from "./skills";
import type { ProfileState, Unit } from "./types";

const UNIT_NAMES: Record<Unit, string> = {
  1: "Partners and teens",
  2: "Counting on and make-a-ten",
  3: "Word problems",
};

/** The Units that have Skills, in progression order. */
export const UNITS: readonly { readonly unit: Unit; readonly name: string }[] = [
  ...new Set(SKILLS.map((s) => s.unit)),
].map((unit) => ({ unit, name: UNIT_NAMES[unit] }));

/** Unit 1 is always open; a later Unit opens once every Skill in every earlier Unit is Mastered. */
export function isUnitUnlocked(unit: Unit, profile: ProfileState): boolean {
  return SKILLS.filter((s) => s.unit < unit).every((s) => profile.skills[s.id].mastered);
}

export function unlockedUnits(profile: ProfileState): Unit[] {
  return UNITS.map((u) => u.unit).filter((unit) => isUnitUnlocked(unit, profile));
}
