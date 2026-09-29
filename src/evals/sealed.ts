/**
 * The seal: the one way code reaches the labelled sets. Half of each set,
 * the Stories, the Parent Summaries and the claims, was sealed at random with
 * a fixed seed on 2026-09-28 (src/evals/split.ts), before any tuning against
 * the labels, and the split is committed as docs/evals/labels/split.json.
 *
 * Tuning code, meaning anything that is changed until its numbers look
 * right (the Judge's rubric, the claim reader, their prompts), reads a set
 * with the access `"tuning"` and gets the open half only. The sealed half
 * comes back only to a `finalRun`, which must say why, and a test reads the
 * source to hold the list of callers to two: the Eval Run, whose Judge gate
 * Pre-registration 1 fixes on the whole of both Calibration Sets, and the
 * labelling page, which labels every item. Nothing else imports the sets or
 * their label files, so there is no way round.
 */
import claimSetJson from "../../docs/evals/labels/claims.json";
import splitJson from "../../docs/evals/labels/split.json";
import ownerStoryLabels from "../../docs/evals/labels/stories.owner.json";
import ownerSummaryLabels from "../../docs/evals/labels/summaries.owner.json";
import { STORY_ITEMS, SUMMARY_ITEMS, type StoryItem, type SummaryItem } from "./calibration";
import type { ClaimItem, ClaimSet } from "./claim-set";
import type { CalibrationStory, CalibrationSummary } from "./judge";
import { parseLabelFile, type LabelFile, type LabelSet, type VerdictLabel } from "./labels";
import type { SealedSplit } from "./split";

export { sealHalf, sealSplit, SPLIT_SEED, type Halves, type SealedSplit } from "./split";
export type { StoryItem, SummaryItem } from "./calibration";

declare const FINAL_RUN: unique symbol;

/** Permission to read a sealed half, with the reason it was given. Made only by `finalRun`. */
export type FinalRun = { readonly [FINAL_RUN]: true; readonly reason: string };

/** How a set is read: the open half for tuning, or both halves in a final run. */
export type Access = "tuning" | FinalRun;

/** Ask for the sealed half too, saying why. Only the final runs the seal's test names may call this. */
export function finalRun(reason: string): FinalRun {
  if (reason.trim() === "") throw new Error("A final run must give its reason for reading the sealed half");
  return { reason } as FinalRun;
}

/** The committed split. */
export const SEALED_SPLIT = splitJson as SealedSplit;

/**
 * The items of a set that the access may read, in the set's order. Every
 * item must be in the split, so an item added after the seal cannot be read
 * at all until the split is drawn again.
 */
export function readable<T extends { readonly id: string }>(set: LabelSet, items: readonly T[], access: Access, split: SealedSplit = SEALED_SPLIT): T[] {
  const { open, sealed } = split.sets[set];
  const unknown = items.find((item) => !open.includes(item.id) && !sealed.includes(item.id));
  if (unknown) throw new Error(`${set} ${unknown.id} is in neither half of the sealed split; draw the split again before reading it`);
  return access === "tuning" ? items.filter((item) => open.includes(item.id)) : [...items];
}

/** The owner's hand labels of 2026-09-13, the verdicts the Judge must agree with. */
const OWNER_LABELS = {
  stories: parseLabelFile(ownerStoryLabels) as LabelFile<"stories">,
  summaries: parseLabelFile(ownerSummaryLabels) as LabelFile<"summaries">,
};

function withVerdict<T extends { readonly id: string }>(set: "stories" | "summaries", item: T): T & Omit<VerdictLabel, "id"> & { readonly note: string } {
  const label = OWNER_LABELS[set].labels.find((l) => l.id === item.id);
  if (!label) throw new Error(`The owner has no label for ${set} ${item.id}: the Calibration Set needs one for every item`);
  return { ...item, pass: label.pass, note: label.note ?? "" };
}

/** The Story Calibration Set as the Judge gate scores it: each Story with the owner's verdict. */
export const storyCalibrationSet = (access: Access): CalibrationStory[] => readable("stories", STORY_ITEMS, access).map((item) => withVerdict("stories", item));

/** The Parent Summary Calibration Set as the Judge gate scores it. */
export const summaryCalibrationSet = (access: Access): CalibrationSummary[] => readable("summaries", SUMMARY_ITEMS, access).map((item) => withVerdict("summaries", item));

/** The Stories as a labeller sees them: no verdict, no note. */
export const storyItems = (access: Access): StoryItem[] => readable("stories", STORY_ITEMS, access);

export const summaryItems = (access: Access): SummaryItem[] => readable("summaries", SUMMARY_ITEMS, access);

/** The claim set drawn from the three live Opus reports (src/evals/claim-set.ts). */
export const claimItems = (access: Access): ClaimItem[] => readable("claims", (claimSetJson as ClaimSet).items, access);

/** Every item id of a set the access may read; for filtering label files. */
export function readableIds(set: LabelSet, access: Access): ReadonlySet<string> {
  const items = { stories: storyItems, summaries: summaryItems, claims: claimItems }[set](access);
  return new Set(items.map((item) => item.id));
}
