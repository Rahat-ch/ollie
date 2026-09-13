/**
 * Mastery per Skill for the Parent Area: every Skill of the curriculum in
 * progression order, with the Knowledge Estimate and Mastered state the
 * Loop holds.
 */
import { SKILLS } from "@/loop";
import type { ProfileState, Unit } from "@/loop";

export type MasteryState = "not-started" | "in-progress" | "mastered";

export type MasteryRow = {
  readonly unit: Unit;
  readonly name: string;
  /** The Knowledge Estimate, 0 to 1. */
  readonly estimate: number;
  readonly state: MasteryState;
};

export function masteryRows(progress: ProfileState): MasteryRow[] {
  return SKILLS.map((skill): MasteryRow => {
    const { estimate, mastered, recentFirstAttempts } = progress.skills[skill.id];
    const state: MasteryState = mastered ? "mastered" : recentFirstAttempts.length > 0 ? "in-progress" : "not-started";
    return { unit: skill.unit, name: skill.name, estimate, state };
  });
}
