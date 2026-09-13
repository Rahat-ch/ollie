import { getSkill } from "@/loop";
import { templateStory } from "@/story/template";
import type { Hypothesis, LearnerNotes, PlanSpace, ProblemId, SessionPlan, SkillId } from "@/loop";
import type { CoachEvidence, CoachInput, CoachOutput, Generation, SpeechInput, SpeechOutput, StoryInput, StoryOutput, SummaryInput, SummaryOutput } from "./types";

const hypothesisId = (skill: SkillId): string => `h-${skill}`;

/** The Session's misses per Skill, in Log order: every entry not first-try correct. */
function missesBySkill(evidence: readonly CoachEvidence[]): Map<SkillId, ProblemId[]> {
  const misses = new Map<SkillId, ProblemId[]>();
  for (const entry of evidence) {
    if (entry.assistance === "first-try-correct") continue;
    misses.set(entry.skill, [...(misses.get(entry.skill) ?? []), entry.id]);
  }
  return misses;
}

/** Cited Problem IDs, oldest first, deduplicated: last Session's then this one's. */
const mergeEvidence = (previous: readonly ProblemId[], added: readonly ProblemId[]): ProblemId[] => [
  ...new Set([...previous, ...added]),
];

function hypothesisFor(skill: SkillId, evidence: readonly ProblemId[]): Hypothesis {
  const { name } = getSkill(skill);
  return {
    id: hypothesisId(skill),
    claim: `May need more practice with ${name} (missed on the first try)`,
    status: evidence.length < 3 ? "proposed" : "supported",
    confidence: Math.round(Math.min(0.9, 0.3 + 0.2 * evidence.length) * 100) / 100,
    evidence,
    nextTest: `Give 3 or more ${name} Problems and watch the first try`,
  };
}

/** Upsert one Hypothesis per Skill missed this Session; Skills with no misses keep their Hypothesis as it was. */
function rewriteHypotheses(notes: LearnerNotes, misses: ReadonlyMap<SkillId, readonly ProblemId[]>): Hypothesis[] {
  const kept = notes.hypotheses.map((hypothesis) => {
    const skill = [...misses.keys()].find((id) => hypothesisId(id) === hypothesis.id);
    return skill ? hypothesisFor(skill, mergeEvidence(hypothesis.evidence, misses.get(skill) ?? [])) : hypothesis;
  });
  const existing = new Set(kept.map((h) => h.id));
  const added = [...misses]
    .filter(([skill]) => !existing.has(hypothesisId(skill)))
    .map(([skill, ids]) => hypothesisFor(skill, ids));
  return [...kept, ...added];
}

/** One strength per Skill with at least two entries this Session and every first try correct. Replaces the old list. */
function strengths(evidence: readonly CoachEvidence[]): string[] {
  const seen = new Map<SkillId, { count: number; allFirstTry: boolean }>();
  for (const entry of evidence) {
    const tally = seen.get(entry.skill) ?? { count: 0, allFirstTry: true };
    seen.set(entry.skill, { count: tally.count + 1, allFirstTry: tally.allFirstTry && entry.assistance === "first-try-correct" });
  }
  return [...seen]
    .filter(([, tally]) => tally.count >= 2 && tally.allFirstTry)
    .map(([skill]) => `${getSkill(skill).name}: every first try correct this Session`);
}

/**
 * Plan the first unmastered Skill in the Plan Space (the last one once all
 * are Mastered), eight Problems, with a quarter given to Review Problems
 * whenever some other Skill is Mastered. The Hypothesis under test is the
 * chosen Skill's if it has one, else none: a Plan only tests what it asks.
 */
function planFor(space: PlanSpace, hypotheses: readonly Hypothesis[]): SessionPlan {
  const chosen = space.skills.find((s) => !s.mastered) ?? space.skills[space.skills.length - 1];
  const reviewable = space.skills.some((s) => s.mastered && s.skill !== chosen.skill);
  const ownHypothesis = hypotheses.find((h) => h.id === hypothesisId(chosen.skill));
  return {
    length: 8,
    skills: [{ skill: chosen.skill, weight: 1 }],
    reviewShare: reviewable ? 0.25 : 0,
    hypothesisUnderTest: ownHypothesis?.id ?? null,
  };
}

/**
 * The fake Coach: one Hypothesis per Skill missed on the first try, kept and
 * grown across Sessions; strengths where every first try was correct; a Plan
 * for the first unmastered Skill. A rejected output on the retry is ignored
 * and the same answer given: a test of the retry overrides `runCoach`.
 */
async function runCoach(input: CoachInput): Promise<CoachOutput> {
  const hypotheses = rewriteHypotheses(input.notes, missesBySkill(input.evidence));
  return {
    notes: { hypotheses, strengths: strengths(input.evidence) },
    plan: planFor(input.planSpace, hypotheses),
  };
}

/** A valid Story in the Theme around the engine's numbers: the template shape counting the Theme's second thing, so it is not the fallback itself. */
async function writeStory(input: StoryInput): Promise<StoryOutput> {
  return { text: templateStory(input, 1) };
}

/** Two fixed sentences about the Session, nothing about how the Learner was thinking. */
async function writeSummary({ log }: SummaryInput): Promise<SummaryOutput> {
  return {
    text: `Session ${log.sessionNumber} had ${log.entries.length} Problems. Ollie's Notebook has what to try next.`,
  };
}

/**
 * Not audio: a stand-in for a rendered line, so a dry run of the render
 * script writes a file and can be seen to resume. Nothing ever plays it, and
 * the script refuses to write the fake into the bundled voice directory.
 */
async function renderSpeech({ text }: SpeechInput): Promise<SpeechOutput> {
  return { audio: new TextEncoder().encode(`not audio, the Generation fake: ${text}\n`), mimeType: "audio/mpeg" };
}

/**
 * The Generation fake: deterministic, valid, no I/O. Every test and the CLI
 * run on it. `overrides` swap one operation and keep the rest, so a test of
 * the engine can hand it a Coach that misbehaves.
 */
export function fakeGeneration(overrides: Partial<Generation> = {}): Generation {
  return { writeStory, runCoach, writeSummary, renderSpeech, ...overrides };
}
