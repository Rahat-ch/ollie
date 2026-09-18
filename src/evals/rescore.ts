/**
 * Score a written report's Hypotheses again with the scorer as it stands
 * now. Detection and false positives read nothing but the Notes the engine
 * kept, which every report carries as `notesBySession`, so a change to how a
 * claim is read can be held against a run that has already happened without
 * paying for the run again. Nothing is written: the recomputed numbers are
 * returned beside the stored ones for a reader to compare.
 */
import type { LearnerNotes } from "@/loop";
import { namesWeaknessAsDifficulty, WEAKNESS_TAGS, type LearnerHypotheses } from "./hypotheses";
import type { SimulatedLearnerId, WeaknessTag } from "./learners";
import type { EvalReport } from "./report";
import { share } from "./stats";

/** The two scores a stored report can be asked for again. */
export type NamingScores = {
  readonly sessionsToDetection: Readonly<Partial<Record<WeaknessTag, number | null>>>;
  readonly detected: number;
  readonly supportedHypotheses: number;
  readonly falsePositives: number;
  readonly falsePositiveRate: number;
};

/**
 * Detection and false positives over a run's kept Notes. The Notes' place in
 * the list is its Session number: a run's Sessions are numbered from 1 and
 * every Session leaves one Notes, the Coach's or the ones it started with.
 */
export function scoreNaming(planted: readonly WeaknessTag[], notesBySession: readonly LearnerNotes[]): NamingScores {
  const detection: Partial<Record<WeaknessTag, number | null>> = Object.fromEntries(planted.map((tag) => [tag, null]));
  const supported = new Set<string>();
  const falsePositives = new Set<string>();

  notesBySession.forEach((notes, index) => {
    for (const hypothesis of notes.hypotheses) {
      if (hypothesis.status !== "supported") continue;
      supported.add(hypothesis.id);
      for (const tag of WEAKNESS_TAGS) {
        if (!namesWeaknessAsDifficulty(tag, hypothesis.claim)) continue;
        if (planted.includes(tag)) detection[tag] ??= index + 1;
        else falsePositives.add(hypothesis.id);
      }
    }
  });

  return {
    sessionsToDetection: detection,
    detected: planted.filter((tag) => detection[tag] !== null).length,
    supportedHypotheses: supported.size,
    falsePositives: falsePositives.size,
    falsePositiveRate: share(falsePositives.size, supported.size),
  };
}

export type LearnerRescore = {
  readonly id: SimulatedLearnerId;
  readonly name: string;
  readonly planted: readonly WeaknessTag[];
  /** What the run was scored as when the report was written. */
  readonly stored: NamingScores;
  readonly rescored: NamingScores;
};

const storedScores = (learner: LearnerHypotheses): NamingScores => ({
  sessionsToDetection: learner.sessionsToDetection,
  detected: learner.detected,
  supportedHypotheses: learner.supportedHypotheses,
  falsePositives: learner.falsePositives,
  falsePositiveRate: learner.falsePositiveRate,
});

/** Every Learner in a report, scored again. A report written before the Notes history was kept cannot be. */
export function rescoreReport(report: EvalReport): LearnerRescore[] {
  return report.hypotheses.learners.map((learner) => {
    // A report read from disk was written by whatever scorer ran then, so the field can be missing.
    const notes = learner.notesBySession as readonly LearnerNotes[] | undefined;
    if (notes === undefined) {
      throw new Error(`${learner.id} has no notesBySession; the report predates the Notes history and cannot be scored again`);
    }
    return {
      id: learner.id,
      name: learner.name,
      planted: learner.planted,
      stored: storedScores(learner),
      rescored: scoreNaming(learner.planted, notes),
    };
  });
}

const detectionOf = (planted: readonly WeaknessTag[], scores: NamingScores): string =>
  planted.length === 0
    ? "no weakness planted"
    : planted.map((tag) => `${tag} ${scores.sessionsToDetection[tag] ?? "never"}`).join(", ");

/** One Learner per line: detection then false positives, stored on the left of the arrow and rescored on its right. */
export function formatRescore(learners: readonly LearnerRescore[]): string {
  const width = Math.max(...learners.map((l) => l.name.length));
  return learners
    .map(({ name, planted, stored, rescored }) =>
      [
        name.padEnd(width),
        `detection ${detectionOf(planted, stored)} -> ${detectionOf(planted, rescored)}`,
        `false positives ${stored.falsePositives} of ${stored.supportedHypotheses} -> ${rescored.falsePositives} of ${rescored.supportedHypotheses}`,
      ].join("  |  "),
    )
    .join("\n");
}
