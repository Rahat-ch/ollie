/**
 * The Content Pool: Story variants keyed by Theme, Skill, structure, and
 * the engine's numbers, written with the Nickname placeholder so one
 * variant serves every Profile. Filled at build time by `pnpm pool`, grown
 * at run time when a Session needs a variant it lacks. It never decides
 * what a Session contains: the engine asks it for the Stories of Problems
 * it has already chosen.
 */
import type { Generation, StoryInput } from "@/generation/types";
import { NICKNAME_PLACEHOLDER } from "./nickname";
import { templateStory } from "./template";
import { writeValidStory } from "./write";

/** The Pool as plain data: key to variants, every variant in placeholder form. */
export type ContentPool = Readonly<Record<string, readonly string[]>>;

/** What a Story is keyed by: the input without the Nickname. */
export type PoolInput = Omit<StoryInput, "nickname">;

/** `puppies/result-unknown/add-to/7+5=12`, and `rich/puppies/...` for the rich set. */
export function poolKey({ theme, skill, structure, equation, rich }: PoolInput): string {
  return `${rich ? "rich/" : ""}${theme}/${skill}/${structure}/${equation.left}${equation.op}${equation.right}=${equation.result}`;
}

export const poolVariants = (pool: ContentPool, input: PoolInput): readonly string[] => pool[poolKey(input)] ?? [];

export function addToPool(pool: ContentPool, input: PoolInput, text: string): ContentPool {
  const key = poolKey(input);
  const variants = pool[key] ?? [];
  if (variants.includes(text)) return pool;
  return { ...pool, [key]: [...variants, text] };
}

export type FilledStory = {
  /** In placeholder form; `withNickname` fills it in. */
  readonly text: string;
  readonly source: "pool" | "generated" | "template";
  /** The Pool afterwards: grown by the generated Story, or as it was. */
  readonly pool: ContentPool;
};

/**
 * The Story for one Problem: from the Pool when a variant exists (the
 * `variant`-th, wrapping), else written live and added to the Pool, else
 * the template sentence, which is never pooled.
 */
export async function fillStory(
  pool: ContentPool,
  generation: Pick<Generation, "writeStory">,
  input: PoolInput,
  variant = 0,
): Promise<FilledStory> {
  const variants = poolVariants(pool, input);
  if (variants.length > 0) return { text: variants[variant % variants.length], source: "pool", pool };
  const placeholder: StoryInput = { ...input, nickname: NICKNAME_PLACEHOLDER };
  const written = await writeValidStory(generation, placeholder);
  if (written.source === "story") return { text: written.text, source: "generated", pool: addToPool(pool, input, written.text) };
  return { text: templateStory(placeholder), source: "template", pool };
}
