/**
 * The sealed split, as arithmetic: half of each labelled set chosen at
 * random with a fixed seed. The committed split (docs/evals/labels/split.json)
 * is exactly what this gives for the sets' ids, which a test checks, so the
 * half that is sealed was never picked by hand. It was drawn on 2026-09-28,
 * before any tuning against the labels.
 */
import { createRng } from "@/loop";
import type { LabelSet } from "./labels";

export const SPLIT_SEED = "sealed-2026-09-28";

export type Halves = { readonly open: readonly string[]; readonly sealed: readonly string[] };

export type SealedSplit = { readonly seed: string; readonly sets: Readonly<Record<LabelSet, Halves>> };

/** Seal half of the ids (the smaller half when the count is odd), each half kept in the set's own order. */
export function sealHalf(ids: readonly string[], seed: string): Halves {
  const sealed = new Set(createRng(seed).shuffle(ids).slice(0, Math.floor(ids.length / 2)));
  return { open: ids.filter((id) => !sealed.has(id)), sealed: ids.filter((id) => sealed.has(id)) };
}

/** Every set sealed with its own stream of the seed, so adding a set never moves another's half. */
export const sealSplit = (ids: Readonly<Record<LabelSet, readonly string[]>>, seed: string): SealedSplit => ({
  seed,
  sets: {
    stories: sealHalf(ids.stories, `${seed}:stories`),
    summaries: sealHalf(ids.summaries, `${seed}:summaries`),
    claims: sealHalf(ids.claims, `${seed}:claims`),
  },
});
