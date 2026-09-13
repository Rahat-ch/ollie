/**
 * Every Problem a Skill can draw in a range, without restating how it draws
 * one. A Skill's `generate` is a pure function of the numbers its Rng hands
 * it, so running it with an Rng that reports the choices open to it, once
 * for each combination, enumerates the whole family: the engine stays the
 * one place that knows what a Problem is (ADR 0001). Ticket 11 needs this
 * to know every line Ollie can say about a Problem.
 */
import type { GenerateOptions, ProblemDraft, Rng, Skill } from "@/loop";

/** A Skill that could draw more Problems than this is a bug, not a big family. */
const MAX_DRAFTS = 50_000;

const unused = (method: string) => (): never => {
  throw new Error(`everyDraft cannot enumerate a Skill whose generate calls rng.${method}`);
};

const draftKey = ({ structure, equation, spoken }: ProblemDraft): string =>
  `${structure}/${equation.left}${equation.op}${equation.right}=${equation.result}/${equation.unknown}/${spoken}`;

/**
 * The Skill's Problems in the range, each once. Depth-first over the choices
 * `generate` makes: every run takes the first option at each choice it has
 * not been given, and each other option is queued as its own run.
 */
export function everyDraft(skill: Skill, options: GenerateOptions): ProblemDraft[] {
  const drafts: ProblemDraft[] = [];
  const seen = new Set<string>();
  const paths: number[][] = [[]];

  while (paths.length > 0) {
    const path = paths.pop() as number[];
    const opened: { readonly at: number; readonly size: number }[] = [];
    let depth = 0;
    const choose = (size: number): number => {
      const at = depth++;
      opened.push({ at, size: Math.max(1, size) });
      return path[at] ?? 0;
    };
    const rng: Rng = {
      next: unused("next"),
      shuffle: unused("shuffle"),
      int: (min, max) => min + choose(max - min + 1),
      pick: (items) => items[choose(items.length)],
    };

    const draft = skill.generate(rng, options);
    if (!seen.has(draftKey(draft))) {
      seen.add(draftKey(draft));
      drafts.push(draft);
    }
    if (drafts.length > MAX_DRAFTS) throw new Error(`${skill.id} draws more than ${MAX_DRAFTS} Problems in this range`);

    // Choices the run had already been given were branched by the run that gave them.
    for (const { at, size } of opened) {
      if (at < path.length) continue;
      const prefix = [...path, ...Array<number>(at - path.length).fill(0)];
      for (let other = 1; other < size; other++) paths.push([...prefix, other]);
    }
  }
  return drafts;
}
