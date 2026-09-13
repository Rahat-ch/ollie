/**
 * Ollie's Powers for the Parent Area: all four by name, what each one takes
 * to learn, what Ollie does with it on screen, and which the Learner has
 * taught so far. A Power is never lost, so a row only ever goes one way.
 */
import { getSkill, POWERS, unitName } from "@/loop";
import type { Power, PowerId } from "@/loop";

export type PowerRow = {
  readonly id: PowerId;
  readonly name: string;
  /** What the Learner Masters to teach it, in the Parent's words. */
  readonly from: string;
  readonly does: string;
  readonly learned: boolean;
};

const from = (power: Power): string =>
  power.mastery.kind === "skill" ? getSkill(power.mastery.skill).name : `Unit ${power.unit} · ${unitName(power.unit)}`;

export function powerRows(held: readonly PowerId[]): PowerRow[] {
  return POWERS.map((power) => ({
    id: power.id,
    name: power.name,
    from: from(power),
    does: power.does,
    learned: held.includes(power.id),
  }));
}
