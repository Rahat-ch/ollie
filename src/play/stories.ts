/**
 * Stories for a Session as the Learner plays it: which Problems get one,
 * how they are keyed into the Content Pool, and every key the Pool is
 * filled with at build time. Pure; the hook and the API route do the I/O.
 */
import { getSkill, rangeFor, type Equation, type Problem, type SkillId, type SkillRange } from "@/loop";
import type { ThemeId } from "@/profile/identity";
import { poolVariants, type ContentPool, type PoolInput } from "@/story/pool";
import { storyShape } from "@/story/shapes";

/** The Pool key for a Unit 3 Problem in the Profile's Theme; null for any other Problem. */
export function storyInputFor(problem: Problem, theme: ThemeId): PoolInput | null {
  if (getSkill(problem.skill).unit !== 3) return null;
  const { skill, structure, equation, answer } = problem;
  return { skill, structure, equation, answer, theme };
}

/** Which Pool variant a Problem shows: its own number, so a reload shows the same Story and neighbours differ. */
export const variantFor = (problem: Problem): number => Number(problem.id.replace(/\D/g, "")) || 0;

/** The Problem's Story from a Pool, in placeholder form, or undefined when the Pool has no variant (or the Problem is not Unit 3). */
export function pooledStory(pool: ContentPool, problem: Problem, theme: ThemeId): string | undefined {
  const input = storyInputFor(problem, theme);
  if (!input) return undefined;
  const variants = poolVariants(pool, input);
  return variants.length > 0 ? variants[variantFor(problem) % variants.length] : undefined;
}

const UNIT_3: readonly SkillId[] = ["result-unknown", "change-unknown"];

/** Every whole and part the engine can draw for a structure in the range, laid out by the structure's shape. */
function equationsFor(skill: SkillId, structure: string, range: SkillRange): Equation[] {
  const shape = storyShape(structure);
  const bounds = rangeFor(getSkill(skill), range);
  const equations: Equation[] = [];
  for (let whole = bounds.min; whole <= bounds.max; whole++) {
    for (let part = 1; part <= shape.maxPart(whole); part++) equations.push(shape.equation(whole, part));
  }
  return equations;
}

/** Every Pool key `pnpm pool` fills: each Theme, each Unit 3 Skill and structure, each equation in the Skill's default (or standard) range. */
export function poolInputs(themes: readonly ThemeId[], range: SkillRange = "default"): PoolInput[] {
  return themes.flatMap((theme) =>
    UNIT_3.flatMap((skill) =>
      getSkill(skill).structures.flatMap((structure) =>
        equationsFor(skill, structure, range).map((equation): PoolInput => ({ skill, structure, equation, answer: equation[equation.unknown], theme })),
      ),
    ),
  );
}
