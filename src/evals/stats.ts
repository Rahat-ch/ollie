/** The small arithmetic every eval shares, and the tuning and held-out split. */

export const share = (hits: number, total: number): number => (total === 0 ? 0 : hits / total);

export const mean = (values: readonly number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

/** Consistent citations over all citations; 1 when there are none to check. */
export const integrityRate = (citations: number, bad: number): number =>
  citations === 0 ? 1 : 1 - bad / citations;

export type Split = "tuning" | "held-out";

/** The two splits as report keys. */
export type SplitKey = "tuning" | "heldOut";

export const SPLIT_OF: Readonly<Record<SplitKey, Split>> = { tuning: "tuning", heldOut: "held-out" };

/**
 * Score the tuning and the held-out Learners separately, so a held-out
 * number is never mixed into a tuning one.
 */
export function summariseSplits<T extends { readonly heldOut: boolean }, S>(
  learners: readonly T[],
  summarise: (split: Split, learners: readonly T[]) => S,
): { readonly tuning: S; readonly heldOut: S } {
  return {
    tuning: summarise("tuning", learners.filter((l) => !l.heldOut)),
    heldOut: summarise("held-out", learners.filter((l) => l.heldOut)),
  };
}
