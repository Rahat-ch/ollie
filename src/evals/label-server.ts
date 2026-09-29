/**
 * The labelling page's server, as a pure function of its state and one
 * request, served on localhost by `pnpm label` (src/cli/label.ts) and never
 * by the app. It sends each item with the evidence a labeller needs and
 * nothing else: no other labeller's label or note, and not which run or
 * Simulated Learner a claim came from (a Learner's id names the weakness
 * planted in it). It returns this labeller's own labels so they can pick up
 * where they left off, and hands back the whole file on every save.
 */
import { createRng, getSkill } from "@/loop";
import { formatEquation } from "@/loop/format";
import { NICKNAME_PLACEHOLDER } from "@/story/nickname";
import { ASSISTANCE_WORDS, evidenceParts } from "@/summary/assistance";
import type { CitedProblem, ClaimItem } from "./claim-set";
import { labelPage } from "./label-page";
import { parseLabel, withLabel, type AnyLabelFile, type LabelFile, type LabelSet } from "./labels";
import type { StoryItem, SummaryItem } from "./sealed";

/** How the page shows the Nickname placeholder: plainly a stand-in, never a name. */
const NICKNAME_SHOWN = "[Nickname]";

export type StoryView = {
  readonly id: string;
  readonly theme: string;
  readonly skill: string;
  readonly structure: string;
  readonly equation: string;
  readonly answer: number;
  readonly text: string;
};

export type SummaryView = {
  readonly id: string;
  readonly sessionNumber: number;
  readonly problems: number;
  readonly tally: readonly { readonly skill: string; readonly parts: readonly string[] }[];
  readonly mastered: readonly string[];
  readonly powers: readonly string[];
  readonly weakest: string | null;
  readonly watching: readonly { readonly claim: string; readonly status: string }[];
  readonly practiced: string;
  readonly activity: string;
};

export type ClaimView = {
  readonly id: string;
  readonly claim: string;
  readonly status: string;
  readonly evidence: readonly (
    | { readonly problem: string; readonly recorded: false }
    | { readonly problem: string; readonly recorded: true; readonly session: number; readonly skill: string; readonly equation: string; readonly answer: number; readonly assistance: string }
  )[];
};

const storyView = ({ id, input, text }: StoryItem): StoryView => ({
  id,
  theme: input.theme,
  skill: getSkill(input.skill).name,
  structure: input.structure,
  equation: formatEquation(input.equation),
  answer: input.answer,
  text: text.split(NICKNAME_PLACEHOLDER).join(NICKNAME_SHOWN),
});

const summaryView = ({ id, input, output }: SummaryItem): SummaryView => ({
  id,
  sessionNumber: input.sessionNumber,
  problems: input.problems,
  tally: input.practice.map((row) => ({ skill: row.name, parts: evidenceParts(row, true) })),
  mastered: input.mastered,
  powers: input.powers,
  weakest: input.weakest?.name ?? null,
  watching: input.notes.hypotheses.map((h) => ({ claim: h.claim, status: h.status })),
  practiced: output.practiced,
  activity: output.activity,
});

const citedView = (cited: CitedProblem): ClaimView["evidence"][number] =>
  cited.recorded
    ? { problem: cited.problem, recorded: true, session: cited.session, skill: getSkill(cited.skill).name, equation: cited.equation, answer: cited.answer, assistance: ASSISTANCE_WORDS[cited.assistance] }
    : { problem: cited.problem, recorded: false };

const claimView = ({ id, claim, status, evidence }: ClaimItem): ClaimView => ({ id, claim, status, evidence: evidence.map(citedView) });

export type LabelViews = { readonly stories: readonly StoryView[]; readonly summaries: readonly SummaryView[]; readonly claims: readonly ClaimView[] };

/** The page's server state: who is labelling, every item in the order they see it, and their own labels so far. */
export type LabelState = {
  readonly labeller: string;
  readonly views: LabelViews;
  files: { stories: LabelFile<"stories">; summaries: LabelFile<"summaries">; claims: LabelFile<"claims"> };
};

/**
 * The state for one labeller: each set shuffled with a seed of their name,
 * the same order every time they open it and a different one for the next
 * person, so the order the items were written in says nothing about them.
 */
export function labelState({
  labeller,
  items,
  files,
}: {
  labeller: string;
  items: { stories: readonly StoryItem[]; summaries: readonly SummaryItem[]; claims: readonly ClaimItem[] };
  files: LabelState["files"];
}): LabelState {
  const order = <T>(set: LabelSet, list: readonly T[]): T[] => createRng(`label-order:${labeller}:${set}`).shuffle(list);
  return {
    labeller,
    views: {
      stories: order("stories", items.stories.map(storyView)),
      summaries: order("summaries", items.summaries.map(summaryView)),
      claims: order("claims", items.claims.map(claimView)),
    },
    files,
  };
}

export type LabelRequest = { readonly method: string; readonly path: string; readonly body?: string };

export type LabelResponse = {
  readonly status: number;
  readonly type?: string;
  readonly body?: string;
  /** For a saved label: the labeller's whole file for that set, for the server to write. */
  readonly save?: AnyLabelFile;
};

const json = (status: number, value: unknown): LabelResponse => ({ status, type: "application/json", body: JSON.stringify(value) });

const SETS: readonly LabelSet[] = ["stories", "summaries", "claims"];

const byId = (file: AnyLabelFile): Record<string, unknown> => Object.fromEntries(file.labels.map((label) => [label.id, label]));

/** Answers one request of the labelling page. */
export function respondLabel(state: LabelState, request: LabelRequest): LabelResponse {
  if (request.method === "GET" && request.path === "/") return { status: 200, type: "text/html; charset=utf-8", body: labelPage() };
  if (request.method === "GET" && request.path === "/items") {
    const sets = Object.fromEntries(SETS.map((set) => [set, { items: state.views[set], labels: byId(state.files[set]) }]));
    return json(200, { labeller: state.labeller, sets });
  }
  if (request.method === "POST" && request.path === "/label") {
    let posted: { set?: unknown; label?: unknown };
    try {
      posted = JSON.parse(request.body ?? "{}") as typeof posted;
    } catch {
      return json(400, { error: "The label is not JSON" });
    }
    const set = SETS.find((s) => s === posted.set);
    if (!set) return json(400, { error: `There is no set "${String(posted.set)}"` });
    try {
      const label = parseLabel(set, posted.label);
      if (!state.views[set].some((item) => item.id === label.id)) return json(400, { error: `${label.id} is not in the ${set}` });
      const file = withLabel(state.files[set] as LabelFile, label) as AnyLabelFile;
      (state.files as Record<LabelSet, AnyLabelFile>)[set] = file;
      return { ...json(200, { label }), save: file };
    } catch (error) {
      return json(400, { error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { status: 404 };
}
