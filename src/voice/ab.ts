/**
 * The blind A/B of Ollie's voice (decisions.md #30, #31 in
 * .scratch/harness): a fixed set of about 15 lines, rendered on two model
 * and voice pairs by `pnpm voice:ab`, and rated blind on a small listening
 * page (`pnpm voice:ab --listen`) that plays each pair in random order.
 * Which clip is which side lives only on the server that serves the page;
 * the page learns it from the tally it saves, and not before.
 *
 * Everything here is pure: the CLI does the rendering, the files, and the
 * HTTP, and hands `respondAb` each request.
 */
import { getSkill, hintFor, rangeFor, type SkillId } from "@/loop";
import { cheerFor } from "@/play/lines";
import { BUNDLED_POOL } from "@/story/bundled";
import { withNickname } from "@/story/nickname";
import { listeningPage } from "./ab-page";
import { everyDraft } from "./drafts";

/** The model a new voice is tried on. Not `eleven_v4_turbo`: every line but a Story is pre-rendered, and a Story is fetched ahead of time. */
export const NEW_VOICE_MODEL_ID = "eleven_v4";

/** A model and a voice to render the A/B lines on. */
export type AbSide = { readonly modelId: string; readonly voiceId: string };
export type AbSides = { readonly a: AbSide; readonly b: AbSide };
export type SideName = keyof AbSides;

export type AbLineKind = "hint" | "cheer" | "problem" | "story";
export type AbLine = { readonly kind: AbLineKind; readonly text: string };

/** The Nickname a Story in the A/B is voiced with, as the speech route would voice it for a Learner so named. */
export const AB_NICKNAME = "Mia";

const AB_HINTS = [
  { skill: "counting-on", structure: "larger-first" },
  { skill: "make-a-ten", structure: "larger-first" },
  { skill: "partners-to-10", structure: "missing-partner" },
  { skill: "unknown-addend", structure: "missing-addend" },
] as const;

const AB_CHEERS = [
  [1, 7],
  [2, 12],
  [3, 10],
  [4, 5],
] as const;

const AB_PROBLEM_SKILLS: readonly SkillId[] = ["partners-to-10", "teen-numbers", "counting-on", "make-a-ten", "unknown-addend"];

/** Two Stories from the bundled Content Pool, one per Unit 3 Skill. */
const AB_STORY_KEYS = ["space/result-unknown/add-to/3+4=7", "puppies/change-unknown/add-to-change/5+3=8"] as const;

/** One Problem's spoken line per Skill, from the middle of the Skill's default range, so it names ordinary numbers. */
function problemLine(id: SkillId): string {
  const skill = getSkill(id);
  const drafts = everyDraft(skill, { range: rangeFor(skill, "default"), structures: skill.structures });
  return drafts[Math.floor(drafts.length / 2)].spoken;
}

/** The fixed A/B set: four Hints, four cheers, five Problems, and two Stories. The same every run. */
export function abLines(): AbLine[] {
  return [
    ...AB_HINTS.map((hint): AbLine => ({ kind: "hint", text: hintFor(hint) })),
    ...AB_CHEERS.map(([position, answer]): AbLine => ({ kind: "cheer", text: cheerFor(position, answer) })),
    ...AB_PROBLEM_SKILLS.map((skill): AbLine => ({ kind: "problem", text: problemLine(skill) })),
    ...AB_STORY_KEYS.map((key): AbLine => {
      const story = BUNDLED_POOL[key]?.[0];
      if (story === undefined) throw new Error(`The bundled Content Pool has no Story at ${key}`);
      return { kind: "story", text: withNickname(story, AB_NICKNAME) };
    }),
  ];
}

/** What one side costs to render, in characters, which is what ElevenLabs charges for. */
export const abCharacters = (lines: readonly AbLine[]): number => lines.reduce((total, line) => total + line.text.length, 0);

/** One line to rate: which side plays first is the server's secret. */
export type BlindPair = AbLine & { readonly id: number; readonly first: SideName };

/** The lines in a random order, each with a random side first. `random` is Math.random, or a seeded stand-in in a test. */
export function blindPairs(lines: readonly AbLine[], random: () => number): BlindPair[] {
  const shuffled = [...lines];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.map((line, id) => ({ ...line, id, first: random() < 0.5 ? "a" : "b" }));
}

/** The clip heard first or second: 1 or 2. */
export type Slot = 1 | 2;

const sideIn = (pair: BlindPair, slot: Slot): SideName => (slot === 1 ? pair.first : pair.first === "a" ? "b" : "a");

type Wins = { a: number; b: number };

export type AbTally = {
  readonly ranAt: string;
  readonly sides: AbSides;
  readonly wins: Wins;
  readonly byKind: Record<AbLineKind, Wins>;
  readonly winner: SideName | "tie";
  readonly lines: readonly (AbLine & { readonly winner: SideName })[];
};

/** The tally of a blind rating: each chosen slot turned back into the side that won. Every pair must be rated. */
export function tallyAb(sides: AbSides, pairs: readonly BlindPair[], choices: Readonly<Record<string, number>>, ranAt: string): AbTally {
  const wins: Wins = { a: 0, b: 0 };
  const byKind: Record<AbLineKind, Wins> = { hint: { a: 0, b: 0 }, cheer: { a: 0, b: 0 }, problem: { a: 0, b: 0 }, story: { a: 0, b: 0 } };
  const lines = pairs.map((pair) => {
    const slot = choices[pair.id];
    if (slot !== 1 && slot !== 2) throw new Error("Rate every pair before saving the tally");
    const winner = sideIn(pair, slot);
    wins[winner] += 1;
    byKind[pair.kind][winner] += 1;
    return { kind: pair.kind, text: pair.text, winner };
  });
  const winner = wins.a === wins.b ? "tie" : wins.a > wins.b ? "a" : "b";
  return { ranAt, sides, wins, byKind, winner, lines };
}

/** The listening page's server state: the sides, the blind pairs, and the tally once it is saved. */
export type AbState = {
  readonly sides: AbSides;
  readonly pairs: readonly BlindPair[];
  saved: AbTally | undefined;
};

export type AbRequest = { readonly method: string; readonly path: string; readonly body?: string };

export type AbResponse = {
  readonly status: number;
  readonly type?: string;
  readonly body?: string;
  /** For a clip: the side and line whose audio the server should send. */
  readonly clip?: { readonly side: SideName; readonly text: string };
  /** For a saved tally: what the server should write to the tally file. */
  readonly save?: AbTally;
};

const json = (status: number, value: unknown): AbResponse => ({ status, type: "application/json", body: JSON.stringify(value) });

/**
 * Answers one request of the listening page. Before the tally is saved,
 * nothing it answers names a model, a voice, or a side: `/pairs` is each
 * line's text and ID, and `/clip/<id>/<1|2>` is audio the server looks up.
 */
export function respondAb(state: AbState, request: AbRequest, now: () => string = () => new Date().toISOString()): AbResponse {
  if (request.method === "GET" && request.path === "/") return { status: 200, type: "text/html; charset=utf-8", body: listeningPage() };
  if (request.method === "GET" && request.path === "/pairs") {
    return json(200, { pairs: state.pairs.map(({ id, kind, text }) => ({ id, kind, text })), tally: state.saved ?? null });
  }
  const clip = /^\/clip\/(\d+)\/([12])$/.exec(request.path);
  if (request.method === "GET" && clip) {
    const pair = state.pairs.find((p) => p.id === Number(clip[1]));
    if (!pair) return { status: 404 };
    return { status: 200, clip: { side: sideIn(pair, Number(clip[2]) as Slot), text: pair.text } };
  }
  if (request.method === "POST" && request.path === "/tally") {
    let choices: unknown;
    try {
      choices = (JSON.parse(request.body ?? "{}") as { choices?: unknown }).choices;
    } catch {
      return json(400, { error: "The tally is not JSON" });
    }
    if (typeof choices !== "object" || choices === null) return json(400, { error: "The tally has no choices" });
    try {
      state.saved = tallyAb(state.sides, state.pairs, choices as Record<string, number>, now());
    } catch (error) {
      return json(400, { error: error instanceof Error ? error.message : String(error) });
    }
    return { ...json(200, { tally: state.saved }), save: state.saved };
  }
  return { status: 404 };
}
