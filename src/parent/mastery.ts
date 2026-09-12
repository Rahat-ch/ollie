/**
 * Mastery per Skill for the Parent Area: every Skill of the curriculum in
 * progression order, with the Knowledge Estimate and Mastered state the
 * Loop holds. Unit 3's Skills are named here until ticket 10 gives them
 * template families; they show as not started with no Estimate.
 */
import { SKILLS } from "@/loop";
import type { ProfileState, Unit } from "@/loop";

export type MasteryState = "not-started" | "in-progress" | "mastered";

export type MasteryRow = {
  readonly unit: Unit;
  readonly name: string;
  /** The Knowledge Estimate, 0 to 1, or null when the Loop does not track the Skill yet. */
  readonly estimate: number | null;
  readonly state: MasteryState;
};

/** Unit 3's Skills by name until the Loop has them; ticket 10 deletes this list when it adds them to SKILLS. */
const UNIT_3_SKILLS = ["Result or total unknown", "Change unknown"] as const;

export function masteryRows(progress: ProfileState): MasteryRow[] {
  const tracked = SKILLS.map((skill): MasteryRow => {
    const { estimate, mastered, recentFirstAttempts } = progress.skills[skill.id];
    const state: MasteryState = mastered ? "mastered" : recentFirstAttempts.length > 0 ? "in-progress" : "not-started";
    return { unit: skill.unit, name: skill.name, estimate, state };
  });
  const unit3 = UNIT_3_SKILLS.map((name): MasteryRow => ({ unit: 3, name, estimate: null, state: "not-started" }));
  return [...tracked, ...unit3];
}
