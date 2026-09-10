import { SKILLS } from "./skills";
import type { NumberRange, PlanSkill, ProfileState, SessionPlan, SkillId, Unit } from "./types";
import { isUnitUnlocked } from "./units";

export const SESSION_LENGTH: NumberRange = { min: 6, max: 10 };
export const REVIEW_SHARE: NumberRange = { min: 0, max: 1 };

/** One Skill a planner may choose, with the bounds it must stay inside. */
export type PlanSpaceSkill = {
  readonly skill: SkillId;
  readonly name: string;
  readonly unit: Unit;
  readonly structures: readonly string[];
  /** The Skill's standard range; a Plan may only narrow it. */
  readonly numberRange: NumberRange;
  readonly rangeOf: string;
  readonly mastered: boolean;
};

/** The bounded set of choices the engine lets a planner make (ADR 0003). */
export type PlanSpace = {
  readonly skills: readonly PlanSpaceSkill[];
  readonly length: NumberRange;
  readonly reviewShare: NumberRange;
};

export type PlanValidation = { readonly ok: true } | { readonly ok: false; readonly reasons: readonly string[] };

export function planSpace(profile: ProfileState): PlanSpace {
  return {
    skills: SKILLS.filter((s) => isUnitUnlocked(s.unit, profile)).map((s) => ({
      skill: s.id,
      name: s.name,
      unit: s.unit,
      structures: s.structures,
      numberRange: s.standardRange,
      rangeOf: s.rangeOf,
      mastered: profile.skills[s.id].mastered,
    })),
    length: SESSION_LENGTH,
    reviewShare: REVIEW_SHARE,
  };
}

const describeRange = ({ min, max }: NumberRange): string => `${min} to ${max}`;

const PLAN_KEYS = ["length", "skills", "reviewShare", "hypothesisUnderTest"];
const PLAN_SKILL_KEYS = ["skill", "weight", "numberRange", "structures"];

/** A Plan carries only the Plan Space's levers; anything else is rejected. */
function unknownKeys(value: object, allowed: readonly string[], where: string): string[] {
  return Object.keys(value)
    .filter((key) => !allowed.includes(key))
    .map((key) => `${where} has no field "${key}"; the fields are ${allowed.join(", ")}`);
}

const isIntegerRange = (range: NumberRange): boolean =>
  Number.isInteger(range.min) && Number.isInteger(range.max) && range.min <= range.max;

function skillReasons(planSkill: PlanSkill, profile: ProfileState): string[] {
  const skill = SKILLS.find((s) => s.id === planSkill.skill);
  if (!skill) return [`unknown Skill "${planSkill.skill}"`];
  const reasons = unknownKeys(planSkill, PLAN_SKILL_KEYS, skill.id);
  if (!isUnitUnlocked(skill.unit, profile)) {
    reasons.push(`${skill.id} is in Unit ${skill.unit}, which is not unlocked yet`);
  }
  if (!(Number.isFinite(planSkill.weight) && planSkill.weight > 0)) {
    reasons.push(`${skill.id} has weight ${planSkill.weight}; a weight must be a positive number`);
  }
  const range = planSkill.numberRange;
  if (range) {
    if (!isIntegerRange(range)) {
      reasons.push(`${skill.id} has a range of ${describeRange(range)}; a range is two whole numbers, min at most max`);
    } else if (range.min < skill.standardRange.min || range.max > skill.standardRange.max) {
      reasons.push(
        `${skill.id} range ${describeRange(range)} is outside its standard's ${describeRange(skill.standardRange)}`,
      );
    }
  }
  const structures = planSkill.structures;
  if (structures) {
    if (structures.length === 0) {
      reasons.push(`${skill.id} allows no structure; leave structures out to allow all of them`);
    }
    for (const structure of structures) {
      if (!skill.structures.includes(structure)) {
        reasons.push(`${skill.id} has no structure "${structure}"; it has ${skill.structures.join(", ")}`);
      }
    }
  }
  return reasons;
}

/**
 * Check a Session Plan against the Plan Space for this Profile. Every reason
 * is reported so a planner can fix the whole Plan in one retry.
 */
export function validatePlan(plan: SessionPlan, profile: ProfileState): PlanValidation {
  const reasons = unknownKeys(plan, PLAN_KEYS, "the Plan");
  if (!Number.isInteger(plan.length) || plan.length < SESSION_LENGTH.min || plan.length > SESSION_LENGTH.max) {
    reasons.push(`length ${plan.length} is outside ${describeRange(SESSION_LENGTH)}`);
  }
  if (!(plan.reviewShare >= REVIEW_SHARE.min && plan.reviewShare <= REVIEW_SHARE.max)) {
    reasons.push(`review share ${plan.reviewShare} is outside ${describeRange(REVIEW_SHARE)}`);
  }
  if (plan.skills.length === 0) {
    reasons.push("a Plan names at least one Skill");
  }
  const seen = new Set<SkillId>();
  for (const planSkill of plan.skills) {
    if (seen.has(planSkill.skill)) {
      reasons.push(`${planSkill.skill} appears more than once`);
      continue;
    }
    seen.add(planSkill.skill);
    reasons.push(...skillReasons(planSkill, profile));
  }
  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}
