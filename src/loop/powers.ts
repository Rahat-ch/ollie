/**
 * Ollie's Powers: the abilities Ollie learns when the Learner Masters a
 * strategy, and then visibly uses on every matching Problem. Four exist and
 * no more; each is a pure function of Mastery, so a Power is never bought,
 * never deducted, and never lost, and it is earned on exactly one Session —
 * the one where the Skill (or the Unit) becomes Mastered.
 */
import { SKILLS } from "./skills";
import type { PowerId, Problem, ProfileState, SkillId, Unit } from "./types";

/** What the Learner Masters to teach Ollie the Power: one Skill, or every Skill of a Unit. */
export type PowerMastery =
  | { readonly kind: "skill"; readonly skill: SkillId }
  | { readonly kind: "unit"; readonly unit: Unit };

export type Power = {
  readonly id: PowerId;
  /** The Power's name, said aloud and written on the Path, in the Parent Area, and in the Parent Summary. */
  readonly name: string;
  readonly mastery: PowerMastery;
  /** The Skills whose Problems Ollie uses it on. */
  readonly usedOn: readonly SkillId[];
  /** What Ollie does with it, in the Learner's own words. */
  readonly does: string;
};

const UNIT_3_SKILLS: readonly SkillId[] = ["result-unknown", "change-unknown"];

/** The four Powers, in the order the progression teaches them. A fifth is a spec change. */
export const POWERS: readonly Power[] = [
  {
    id: "count-on-flight",
    name: "Count-On Flight",
    mastery: { kind: "skill", skill: "counting-on" },
    usedOn: ["counting-on"],
    does: "Ollie flies the hops on the number line, one wing beat for each one.",
  },
  {
    id: "make-ten-magic",
    name: "Make-Ten Magic",
    mastery: { kind: "skill", skill: "make-a-ten" },
    usedOn: ["make-a-ten"],
    does: "Ollie fills the ten-frame to ten and splits what is left over.",
  },
  {
    id: "missing-number-detective",
    name: "Missing Number Detective",
    mastery: { kind: "skill", skill: "unknown-addend" },
    usedOn: ["unknown-addend"],
    does: "Ollie hunts for the missing part with a magnifying glass.",
  },
  {
    id: "story-solver",
    name: "Story Solver",
    mastery: { kind: "unit", unit: 3 },
    usedOn: UNIT_3_SKILLS,
    does: "Ollie opens the story book: richer Stories in the Theme.",
  },
];

export function powerFor(id: PowerId): Power {
  const power = POWERS.find((p) => p.id === id);
  if (!power) throw new Error(`Unknown Power: ${id}`);
  return power;
}

/** Whether what the Power asks to be Mastered is Mastered. A Unit's Power waits for every Skill in it. */
function isTaught(mastery: PowerMastery, profile: ProfileState): boolean {
  if (mastery.kind === "skill") return profile.skills[mastery.skill].mastered;
  return SKILLS.filter((skill) => skill.unit === mastery.unit).every((skill) => profile.skills[skill.id].mastered);
}

/** The Powers a Profile's Mastery has taught Ollie, in the order they are learned. */
export const powersFor = (profile: ProfileState): PowerId[] =>
  POWERS.filter((power) => isTaught(power.mastery, profile)).map((power) => power.id);

/** The Powers taught between two Profiles: what `after` holds and `before` did not. */
export function powersEarned(before: ProfileState, after: ProfileState): PowerId[] {
  const held = powersFor(before);
  return powersFor(after).filter((id) => !held.includes(id));
}

/** The Powers held afterwards: every one kept, every new one added once, in the order they are learned. */
export const withPowers = (held: readonly PowerId[], earned: readonly PowerId[]): PowerId[] =>
  POWERS.map((power) => power.id).filter((id) => held.includes(id) || earned.includes(id));

/** The Power Ollie uses on this Problem, or null when the Learner has taught none that fits it. */
export function powerUsedOn(held: readonly PowerId[], problem: Pick<Problem, "skill">): PowerId | null {
  const power = POWERS.find((p) => held.includes(p.id) && p.usedOn.includes(problem.skill));
  return power ? power.id : null;
}
