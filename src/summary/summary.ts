/**
 * The Parent Summary's evidence: the engine's own tally of one Session Log
 * by Skill and Assistance State, with what was Mastered, the Powers earned,
 * and the weakest Skill practiced. The model is handed these numbers and
 * writes only words around them (ADR 0001), and it is never handed the
 * Nickname (ADR 0002).
 */
import { getSkill, SKILLS } from "@/loop";
import type { AssistanceState, SessionResult, SkillId } from "@/loop";
import type { SummaryInput, SummaryOutput, SummaryPractice } from "@/generation/types";
import type { WrittenSummary } from "./write";

/** Which count of a practice row an Assistance State falls in. */
const COUNT_OF: Readonly<Record<AssistanceState, keyof Omit<SummaryPractice, "skill" | "name">>> = {
  "first-try-correct": "firstTryCorrect",
  "hint-assisted-correct": "hintAssisted",
  revealed: "revealed",
  unresolved: "unresolved",
};

/** The Skills the Session practiced, in progression order, tallied by Assistance State. */
export function practiceRows(result: SessionResult): SummaryPractice[] {
  const practiced = new Set(result.log.entries.map((entry) => entry.problem.skill));
  return SKILLS.filter((skill) => practiced.has(skill.id)).map((skill) => {
    const row = { skill: skill.id, name: skill.name, firstTryCorrect: 0, hintAssisted: 0, revealed: 0, unresolved: 0 };
    for (const entry of result.log.entries) {
      if (entry.problem.skill === skill.id) row[COUNT_OF[entry.assistance]] += 1;
    }
    return row;
  });
}

/**
 * One Parent Summary as the Profile keeps it: the words the model wrote (or
 * the template's, when it was unreachable) over the engine's own evidence,
 * which the Parent Area renders under them. The last seven are kept.
 */
export type ParentSummary = SummaryOutput & {
  readonly sessionNumber: number;
  /** When the Session was played, ISO 8601. */
  readonly at: string;
  /** `summary` when Opus 5 wrote it; `template` when every attempt was rejected. */
  readonly source: "summary" | "template";
  readonly problems: number;
  readonly practice: readonly SummaryPractice[];
  readonly mastered: readonly string[];
  readonly powers: readonly string[];
};

/** The Summary as it is stored: the words kept with the evidence they were written from. */
export function parentSummary(input: SummaryInput, written: WrittenSummary, at: Date): ParentSummary {
  return {
    sessionNumber: input.sessionNumber,
    at: at.toISOString(),
    practiced: written.practiced,
    activity: written.activity,
    source: written.source,
    problems: input.problems,
    practice: input.practice,
    mastered: input.mastered,
    powers: input.powers,
  };
}

/**
 * The Skill the Parent's activity is for: the practiced Skill with the
 * lowest Knowledge Estimate once the Session's first attempts are in.
 */
export function weakestSkill(result: SessionResult): { readonly skill: SkillId; readonly name: string } | null {
  const rows = practiceRows(result);
  if (rows.length === 0) return null;
  const weakest = rows.reduce((lowest, row) =>
    result.profile.skills[row.skill].estimate < result.profile.skills[lowest.skill].estimate ? row : lowest,
  );
  return { skill: weakest.skill, name: weakest.name };
}

/**
 * What the Summary writer is given after a Session: the Log as a tally, the
 * Learner Notes, and the Powers this Session earned (the caller's, since
 * Powers live outside the Log).
 */
export function summaryInput(result: SessionResult, notes: SummaryInput["notes"], powers: readonly string[]): SummaryInput {
  return {
    sessionNumber: result.log.sessionNumber,
    problems: result.log.entries.length,
    practice: practiceRows(result),
    mastered: result.newlyMastered.map((id) => getSkill(id).name),
    powers,
    weakest: weakestSkill(result),
    notes,
  };
}
