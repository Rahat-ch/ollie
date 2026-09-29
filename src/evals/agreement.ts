/**
 * Human-human agreement: two people's label files for the same set, scored
 * question by question with raw agreement, its Wilson interval, and Cohen's
 * kappa, over the items both of them labelled. It is the ceiling the Judge
 * and the claim reader are held to, reported beside the Judge's own
 * calibration. The disagreements are listed, never resolved here.
 */
import type { AnyLabelFile, ClaimLabel, LabelFile, LabelSet, VerdictLabel } from "./labels";
import { WEAKNESS_TAGS } from "./hypotheses";
import { cohensKappa, share, wilsonInterval, type Interval } from "./stats";

export type QuestionAgreement = {
  /** `pass` for Stories and Summaries; `polarity`, `names <weakness>` and `cited support` for claims. */
  readonly question: string;
  /** Items both labellers answered. */
  readonly items: number;
  readonly agreements: number;
  readonly agreement: number;
  readonly agreementInterval: Interval | null;
  /** Null when there is nothing to score or both labellers gave one and the same answer throughout. */
  readonly kappa: number | null;
  readonly disagreements: readonly { readonly id: string; readonly a: string; readonly b: string }[];
};

export type PairAgreement = {
  readonly set: LabelSet;
  /** The two labellers, in the order `a` and `b` are reported. */
  readonly labellers: readonly [string, string];
  readonly questions: readonly QuestionAgreement[];
};

export type Answered = { readonly id: string; readonly a: string; readonly b: string };

/** One question scored over the items both labellers answered. */
export function agreeOn(question: string, answered: readonly Answered[]): QuestionAgreement {
  const disagreements = answered.filter(({ a, b }) => a !== b);
  const agreements = answered.length - disagreements.length;
  return {
    question,
    items: answered.length,
    agreements,
    agreement: share(agreements, answered.length),
    agreementInterval: wilsonInterval(agreements, answered.length),
    kappa: cohensKappa(answered.map(({ a, b }) => [a, b] as const)),
    disagreements,
  };
}

const yesNo = (value: boolean): string => (value ? "yes" : "no");

/** Each question a set asks, as a string answer read off one label. */
const VERDICT_QUESTIONS: readonly [string, (label: VerdictLabel) => string][] = [["pass", (label) => (label.pass ? "pass" : "fail")]];

const CLAIM_QUESTIONS: readonly [string, (label: ClaimLabel) => string][] = [
  ["polarity", (label) => label.polarity],
  ...WEAKNESS_TAGS.map((tag): [string, (label: ClaimLabel) => string] => [`names ${tag}`, (label) => yesNo(label.namesAsDifficulty[tag])]),
  ["cited support", (label) => label.citedSupport],
];

function score<L extends { readonly id: string }>(
  a: readonly L[],
  b: readonly L[],
  questions: readonly (readonly [string, (label: L) => string])[],
): QuestionAgreement[] {
  const byId = new Map(b.map((label) => [label.id, label]));
  const both = a.flatMap((label) => {
    const other = byId.get(label.id);
    return other ? [[label, other] as const] : [];
  });
  return questions.map(([question, answer]) => agreeOn(question, both.map(([x, y]) => ({ id: x.id, a: answer(x), b: answer(y) }))));
}

/** Two labellers of one set, every question the set asks. */
export function humanAgreement(a: AnyLabelFile, b: AnyLabelFile): PairAgreement {
  if (a.set !== b.set) throw new Error(`Cannot compare a ${a.set} file with a ${b.set} file: agreement is within one set`);
  if (a.labeller === b.labeller) throw new Error(`Both files are the labeller ${a.labeller}'s: agreement needs two people`);
  const questions =
    a.set === "claims"
      ? score((a as LabelFile<"claims">).labels, (b as LabelFile<"claims">).labels, CLAIM_QUESTIONS)
      : score((a as LabelFile<"stories">).labels, (b as LabelFile<"stories">).labels, VERDICT_QUESTIONS);
  return { set: a.set, labellers: [a.labeller, b.labeller], questions };
}

/** Every two labellers of the same set, each pair once, in set then name order. */
export function labellerPairs(files: readonly AnyLabelFile[]): (readonly [AnyLabelFile, AnyLabelFile])[] {
  const order: readonly LabelSet[] = ["stories", "summaries", "claims"];
  const sorted = [...files].sort((x, y) => order.indexOf(x.set) - order.indexOf(y.set) || x.labeller.localeCompare(y.labeller));
  return sorted.flatMap((x, i) => sorted.slice(i + 1).filter((y) => y.set === x.set).map((y) => [x, y] as const));
}

/** Human-human agreement for every pair of labellers the files hold; empty until some set has two. */
export const agreementOfAll = (files: readonly AnyLabelFile[]): PairAgreement[] => labellerPairs(files).map(([a, b]) => humanAgreement(a, b));
