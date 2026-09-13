/** The small arithmetic every eval shares, and the tuning and held-out split. */

export const share = (hits: number, total: number): number => (total === 0 ? 0 : hits / total);

export const mean = (values: readonly number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

/** Consistent citations over all citations; 1 when there are none to check. */
export const integrityRate = (citations: number, bad: number): number =>
  citations === 0 ? 1 : 1 - bad / citations;

/** One thing written through the Generation seam and checked by its validator, with every rejection on the way. */
export type WrittenTrace = {
  /** `template` when every attempt was rejected; anything else is the model's own work, kept. */
  readonly source: string;
  readonly rejections: readonly { readonly reasons: readonly string[] }[];
};

export type Validity = {
  readonly sample: number;
  readonly attempts: number;
  /** Written and accepted on the model's first attempt, over the sample. */
  readonly firstAttemptRate: number;
  /** Ended as the model's own, within the bounded attempts, over the sample. */
  readonly validRate: number;
  readonly templates: number;
  /** Every rejection reason seen, most frequent first. */
  readonly rejectionReasons: readonly { readonly reason: string; readonly count: number }[];
};

/**
 * What a validator made of a sample the model wrote: how often it was right
 * first time, how often the bounded attempts got there, how often the
 * hand-written template had to stand in, and why. `reasonKind` drops a
 * reason's particulars so the same kind of failure counts together.
 */
export function writtenValidity(traces: readonly WrittenTrace[], reasonKind: (reason: string) => string): Validity {
  const counts = new Map<string, number>();
  let attempts = 0;
  for (const trace of traces) {
    attempts += trace.rejections.length + (trace.source === "template" ? 0 : 1);
    for (const rejection of trace.rejections) {
      for (const reason of rejection.reasons) {
        const kind = reasonKind(reason);
        counts.set(kind, (counts.get(kind) ?? 0) + 1);
      }
    }
  }
  const kept = traces.filter((trace) => trace.source !== "template");
  return {
    sample: traces.length,
    attempts,
    firstAttemptRate: share(kept.filter((trace) => trace.rejections.length === 0).length, traces.length),
    validRate: share(kept.length, traces.length),
    templates: traces.length - kept.length,
    rejectionReasons: [...counts].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason)),
  };
}

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
