/**
 * The claim set: about 100 Hypothesis claims drawn, with a fixed seed, from
 * the three live Opus reports of 2026-09-18, for people to label by hand.
 * The labels calibrate whatever reads the Coach's prose (the regex reader in
 * hypotheses.ts today, the claim reader later) and measure Claim Agreement
 * by hand.
 *
 * The draw is stratified on what today's reader makes of each claim, so every
 * Polarity is in the set in equal shares; the reader's verdict is never
 * written into the set, and the page never shows it.
 *
 * The reports keep every Session's Notes but not the Session Logs, so a
 * cited Problem's Assistance State can be given only where the Log can be
 * rebuilt. The Diagnostic Session can: its Plan is fixed and the Simulated
 * Learners are seeded, so it is replayed here and checked against the
 * report's own first-try rate. Every later Session was planned by the Coach,
 * whose Plans the reports do not keep, so its Problems are marked not
 * recorded rather than guessed at.
 */
import { createRng, DIAGNOSTIC_PLAN, newProfile, runSession, type AssistanceState, type LearnerNotes, type LogEntry, type ProblemId, type SkillId } from "@/loop";
import { formatEquation } from "@/loop/format";
import { claimPolarity, type ClaimPolarity } from "./hypotheses";
import { getSimulatedLearner, SIMULATED_LEARNERS, simulatedLearner, type SimulatedLearnerId } from "./learners";
import { POLARITIES, type Polarity } from "./labels";

/** The three live Opus runs the claims are drawn from, under docs/evals. */
export const CLAIM_SET_REPORTS = ["2026-09-18T18-12-41Z.json", "2026-09-18T18-41-44Z.json", "2026-09-18T19-09-56Z.json"] as const;
export const CLAIM_SET_SEED = "claim-set-2026-09-28";
export const CLAIM_SET_SIZE = 100;

export type CitedProblem =
  | {
      readonly problem: ProblemId;
      readonly recorded: true;
      readonly session: number;
      readonly skill: SkillId;
      readonly structure: string;
      /** `8 + ? = 13`, the unknown blanked. */
      readonly equation: string;
      readonly answer: number;
      readonly assistance: AssistanceState;
    }
  | { readonly problem: ProblemId; readonly recorded: false };

export type ClaimItem = {
  /** `k001`: the item's id in the set, in the order it is labelled. */
  readonly id: string;
  /** Where it came from, for the record; the page does not show it. */
  readonly report: string;
  readonly learner: SimulatedLearnerId;
  /** The Session whose Notes the claim is taken from: the last one that carried it in these words. */
  readonly session: number;
  readonly hypothesis: string;
  readonly claim: string;
  readonly status: "proposed" | "supported" | "refuted";
  readonly evidence: readonly CitedProblem[];
};

export type ClaimSet = {
  readonly seed: string;
  readonly drawnFrom: readonly string[];
  readonly items: readonly ClaimItem[];
};

/** What the draw reads from a report: each Coach run's Notes, and its first Session's first-try rate for the replay check. */
export type ClaimSource = {
  readonly file: string;
  readonly report: {
    readonly hypotheses: { readonly learners: readonly { readonly id: SimulatedLearnerId; readonly notesBySession: readonly LearnerNotes[] }[] };
    readonly convergence: { readonly coach: { readonly learners: readonly { readonly id: SimulatedLearnerId; readonly perSession: readonly { readonly firstTryRate: number }[] }[] } };
  };
};

const READER_TO_POLARITY: Readonly<Record<ClaimPolarity, Polarity>> = {
  difficulty: "difficulty",
  strength: "strength",
  contrastive: "contrast",
  neutral: "neither",
};

/** Today's regex reader's Polarity for a claim, in the label's terms. Used to stratify the draw, never shown to a labeller. */
export const readerPolarity = (claim: string): Polarity => READER_TO_POLARITY[claimPolarity(claim)];

export type ReplayedEntry = LogEntry & { readonly session: number };

/** Each Simulated Learner's Diagnostic Session, replayed from its seed: the one Session of a Coach run whose Log can be rebuilt. */
export function diagnosticEntries(): ReadonlyMap<SimulatedLearnerId, ReadonlyMap<ProblemId, ReplayedEntry>> {
  return new Map(
    SIMULATED_LEARNERS.map((learner) => {
      const { log } = runSession(DIAGNOSTIC_PLAN, newProfile(), learner.seed, simulatedLearner(learner));
      return [learner.id, new Map(log.entries.map((entry) => [entry.problem.id, { ...entry, session: log.sessionNumber }]))];
    }),
  );
}

type Candidate = Omit<ClaimItem, "id" | "evidence"> & { readonly cited: readonly ProblemId[] };

/** Every distinct claim in the reports, each from the last Session its Hypothesis carried it in those words. */
function population(sources: readonly ClaimSource[]): Candidate[] {
  const byText = new Map<string, Candidate>();
  for (const { file, report } of sources) {
    for (const learner of report.hypotheses.learners) {
      learner.notesBySession.forEach((notes, index) => {
        for (const h of notes.hypotheses) {
          const text = h.claim.trim();
          const seen = byText.get(text);
          const same = seen && seen.report === file && seen.learner === learner.id && seen.hypothesis === h.id;
          if (seen && !same) continue;
          byText.set(text, { report: file, learner: learner.id, session: index + 1, hypothesis: h.id, claim: text, status: h.status, cited: h.evidence });
        }
      });
    }
  }
  return [...byText.values()];
}

function checkReplay(sources: readonly ClaimSource[], replayed: ReturnType<typeof diagnosticEntries>): void {
  for (const { file, report } of sources) {
    for (const learner of report.convergence.coach.learners) {
      const entries = [...(replayed.get(learner.id)?.values() ?? [])];
      const rate = entries.filter((e) => e.assistance === "first-try-correct").length / entries.length;
      const stored = learner.perSession[0]?.firstTryRate;
      if (stored === undefined || Math.abs(stored - rate) > 1e-9) {
        throw new Error(
          `${file}: ${getSimulatedLearner(learner.id).name}'s Diagnostic Session does not replay (first-try rate ${stored} stored, ${rate} now); the Simulated Learners have changed since the run, so no Assistance State can be given`,
        );
      }
    }
  }
}

function cite(problem: ProblemId, entries: ReadonlyMap<ProblemId, ReplayedEntry> | undefined): CitedProblem {
  const entry = entries?.get(problem);
  if (!entry) return { problem, recorded: false };
  return {
    problem,
    recorded: true,
    session: entry.session,
    skill: entry.problem.skill,
    structure: entry.problem.structure,
    equation: formatEquation(entry.problem.equation),
    answer: entry.problem.answer,
    assistance: entry.assistance,
  };
}

/**
 * Draw `size` claims with the seed: an equal share of each Polarity the
 * reader finds (the remainder to the first Polarities in glossary order),
 * topped up from the rest when a Polarity runs short, then shuffled so the
 * order says nothing about the stratum, and numbered in that order.
 */
export function drawClaimSet(sources: readonly ClaimSource[], { seed, size }: { readonly seed: string; readonly size: number }): ClaimSet {
  const replayed = diagnosticEntries();
  checkReplay(sources, replayed);
  const rng = createRng(seed);
  const strata = POLARITIES.map((polarity) => rng.shuffle(population(sources).filter((c) => readerPolarity(c.claim) === polarity)));
  const quota = (i: number) => Math.floor(size / POLARITIES.length) + (i < size % POLARITIES.length ? 1 : 0);
  const chosen = strata.flatMap((stratum, i) => stratum.slice(0, quota(i)));
  const rest = rng.shuffle(strata.flatMap((stratum, i) => stratum.slice(quota(i))));
  const drawn = rng.shuffle([...chosen, ...rest.slice(0, Math.max(0, size - chosen.length))]);
  return {
    seed,
    drawnFrom: sources.map((s) => s.file),
    items: drawn.map(({ cited, ...candidate }, i) => ({
      id: `k${String(i + 1).padStart(3, "0")}`,
      ...candidate,
      evidence: cited.map((problem) => cite(problem, replayed.get(candidate.learner))),
    })),
  };
}
