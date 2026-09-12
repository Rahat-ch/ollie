/**
 * Mastery per Skill for the Parent Area: every Skill of the curriculum in
 * progression order, with the Knowledge Estimate and Mastered state the
 * Loop holds. Unit 3's Skills are named here until ticket 10 gives them
 * template families; they show as not started with no Estimate.
 */
import { SKILLS } from "@/loop";
import type { ProfileState, SkillId, Unit } from "@/loop";

export type MasteryState = "not-started" | "in-progress" | "mastered";

export type MasteryRow = {
  /** The Loop's id, or null for a Skill the Loop does not track yet. */
  readonly skill: SkillId | null;
  readonly unit: Unit;
  readonly name: string;
  readonly standard: string;
  /** The Knowledge Estimate, 0 to 1, or null when the Loop does not track the Skill yet. */
  readonly estimate: number | null;
  readonly mastered: boolean;
  readonly state: MasteryState;
};

/** Unit 3's Skills, mapped to their standard in the README, until the Loop has them. */
const UNIT_3_SKILLS: readonly { readonly name: string; readonly standard: string }[] = [
  { name: "Result or total unknown", standard: "1.OA.1" },
  { name: "Change unknown", standard: "1.OA.1" },
];

export function masteryRows(progress: ProfileState): MasteryRow[] {
  const tracked = SKILLS.map((skill): MasteryRow => {
    const { estimate, mastered, recentFirstAttempts } = progress.skills[skill.id];
    const state: MasteryState = mastered ? "mastered" : recentFirstAttempts.length > 0 ? "in-progress" : "not-started";
    return { skill: skill.id, unit: skill.unit, name: skill.name, standard: skill.standard, estimate, mastered, state };
  });
  const unit3 = UNIT_3_SKILLS.map(
    ({ name, standard }): MasteryRow => ({ skill: null, unit: 3, name, standard, estimate: null, mastered: false, state: "not-started" }),
  );
  return [...tracked, ...unit3];
}
