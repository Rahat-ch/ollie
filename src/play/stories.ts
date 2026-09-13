/**
 * Stories for a Session as the Learner plays it: which Problems get one,
 * how they are keyed into the Content Pool, and every key the Pool is
 * filled with at build time. Pure; the hook and the API route do the I/O.
 */
import { getSkill, type Equation, type Problem, type SkillId } from "@/loop";
import type { ThemeId } from "@/profile/identity";
import { poolVariants, type ContentPool, type PoolInput } from "@/story/pool";

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

/** Every whole and part the engine can draw, in the Skill's default range, mirroring its generator. */
function equationsFor(skill: SkillId, structure: string): Equation[] {
  const { defaultRange: range } = getSkill(skill);
  const equations: Equation[] = [];
  for (let whole = range.min; whole <= range.max; whole++) {
    const maxPart = skill === "change-unknown" ? Math.min(9, whole - 1) : whole - 1;
    for (let part = 1; part <= maxPart; part++) {
      const other = whole - part;
      switch (structure) {
        case "add-to":
        case "put-together":
          equations.push({ left: part, op: "+", right: other, result: whole, unknown: "result" });
          break;
        case "take-from":
          equations.push({ left: whole, op: "-", right: part, result: other, unknown: "result" });
          break;
        case "add-to-change":
          equations.push({ left: other, op: "+", right: part, result: whole, unknown: "right" });
          break;
        case "take-from-change":
          equations.push({ left: whole, op: "-", right: part, result: other, unknown: "right" });
          break;
        default:
          throw new Error(`No Pool equations for ${skill} structure ${structure}`);
      }
    }
  }
  return equations;
}

/** Every Pool key `pnpm pool` fills: each Theme, each Unit 3 Skill and structure, each equation in the default range. */
export function poolInputs(themes: readonly ThemeId[]): PoolInput[] {
  return themes.flatMap((theme) =>
    UNIT_3.flatMap((skill) =>
      getSkill(skill).structures.flatMap((structure) =>
        equationsFor(skill, structure).map((equation): PoolInput => ({ skill, structure, equation, answer: equation[equation.unknown], theme })),
      ),
    ),
  );
}
