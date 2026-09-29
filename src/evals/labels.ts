/**
 * The hand labels, one JSON file per labeller and set under
 * docs/evals/labels, named `<set>.<labeller>.json`. The labelling page
 * writes them; the Judge gate reads the owner's Story and Summary labels;
 * the Eval Run reads every pair of labellers for human-human agreement.
 *
 * The schema is kept flat so another tool (an annotation queue exported to
 * JSON, say) can write the same file: a set, a labeller, and a list of
 * labels, each carrying the item's id and nothing but the labeller's
 * answers. The items themselves (the Story, the Summary and its tally, the
 * claim and its cited Problems) live elsewhere and are never copied here.
 *
 *   stories, summaries: { id, pass, note? }
 *   claims:             { id, polarity, namesAsDifficulty: { crossing-ten, change-unknown }, citedSupport, note? }
 */
import { z } from "zod";
import type { WeaknessTag } from "./learners";

export type LabelSet = "stories" | "summaries" | "claims";

export const LABEL_SETS: readonly LabelSet[] = ["stories", "summaries", "claims"];

/** Where every label file, the claim set and the sealed split are committed, relative to the repo root. */
export const LABELS_DIR = "docs/evals/labels";

/** A Story or Parent Summary judged against its rubric, as the Judge is: pass or fail, and why. */
export type VerdictLabel = { readonly id: string; readonly pass: boolean; readonly note?: string };

/**
 * What a claim declares it is about, in the glossary's terms: a difficulty,
 * a strength, a contrast between the two, or neither (a response-time
 * pattern, a plan for the next Session).
 */
export type Polarity = "difficulty" | "strength" | "contrast" | "neither";

export const POLARITIES: readonly Polarity[] = ["difficulty", "strength", "contrast", "neither"];

/** Whether the Assistance States of the cited Problems say what the claim says (Claim Agreement, by hand). */
export type CitedSupport = "supports" | "does-not-support" | "cannot-tell";

export const CITED_SUPPORT: readonly CitedSupport[] = ["supports", "does-not-support", "cannot-tell"];

export type ClaimLabel = {
  readonly id: string;
  readonly polarity: Polarity;
  /** For each planted weakness, whether the claim names it as a difficulty the Learner has. */
  readonly namesAsDifficulty: Readonly<Record<WeaknessTag, boolean>>;
  readonly citedSupport: CitedSupport;
  readonly note?: string;
};

export type LabelOf<S extends LabelSet> = S extends "claims" ? ClaimLabel : VerdictLabel;

export type LabelFile<S extends LabelSet = LabelSet> = {
  readonly set: S;
  readonly labeller: string;
  /** One per item labelled, sorted by id; an item not yet labelled is absent. */
  readonly labels: readonly LabelOf<S>[];
};

export type AnyLabelFile = LabelFile<"stories"> | LabelFile<"summaries"> | LabelFile<"claims">;

const LABELLER = /^[a-z0-9][a-z0-9-]{0,39}$/;

function checkLabeller(labeller: string): string {
  if (!LABELLER.test(labeller)) {
    throw new Error(`"${labeller}" is not a labeller name: use lower-case letters, digits and hyphens, such as owner or second`);
  }
  return labeller;
}

export const labelFileName = (set: LabelSet, labeller: string): string => `${set}.${checkLabeller(labeller)}.json`;

/** The set and labeller a file name stands for, or null when it is not a label file (the claim set, the split). */
export function parseLabelFileName(name: string): { set: LabelSet; labeller: string } | null {
  const match = /^(stories|summaries|claims)\.([a-z0-9][a-z0-9-]{0,39})\.json$/.exec(name);
  return match ? { set: match[1] as LabelSet, labeller: match[2] } : null;
}

export const emptyLabelFile = <S extends LabelSet>(set: S, labeller: string): LabelFile<S> => ({ set, labeller: checkLabeller(labeller), labels: [] });

const note = z.string().optional();
const VerdictSchema = z.strictObject({ id: z.string().min(1), pass: z.boolean(), note });
const ClaimSchema = z.strictObject({
  id: z.string().min(1),
  polarity: z.enum(["difficulty", "strength", "contrast", "neither"]),
  namesAsDifficulty: z.strictObject({ "crossing-ten": z.boolean(), "change-unknown": z.boolean() }),
  citedSupport: z.enum(["supports", "does-not-support", "cannot-tell"]),
  note,
});
const FileSchema = z.discriminatedUnion("set", [
  z.strictObject({ set: z.literal("stories"), labeller: z.string().regex(LABELLER), labels: z.array(VerdictSchema) }),
  z.strictObject({ set: z.literal("summaries"), labeller: z.string().regex(LABELLER), labels: z.array(VerdictSchema) }),
  z.strictObject({ set: z.literal("claims"), labeller: z.string().regex(LABELLER), labels: z.array(ClaimSchema) }),
]);

/** A label file read from JSON, checked against the schema; one label per item. */
export function parseLabelFile(value: unknown): AnyLabelFile {
  const file = FileSchema.parse(value) as AnyLabelFile;
  const ids = file.labels.map((label) => label.id);
  const twice = ids.find((id, i) => ids.indexOf(id) !== i);
  if (twice !== undefined) throw new Error(`${file.set}.${file.labeller}: ${twice} is labelled twice`);
  return file;
}

/** A label for one item added, or put in place of the one it had; one label per item, sorted by id. */
export function withLabel<S extends LabelSet>(file: LabelFile<S>, label: LabelOf<S>): LabelFile<S> {
  const labels = [...file.labels.filter((l) => l.id !== label.id), label].sort((a, b) => a.id.localeCompare(b.id));
  return { ...file, labels };
}

/** A label as the schema checks it, for a label posted by the page. */
export function parseLabel<S extends LabelSet>(set: S, value: unknown): LabelOf<S> {
  return (set === "claims" ? ClaimSchema.parse(value) : VerdictSchema.parse(value)) as LabelOf<S>;
}
