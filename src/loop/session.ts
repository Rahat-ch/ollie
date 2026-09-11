import { bktUpdate } from "./bkt";
import { isDiagnosticPlan } from "./diagnostic";
import { validatePlan } from "./plan-space";
import { MASTERY_WINDOW, meetsMastery } from "./mastery";
import type { AnswerPolicy } from "./policies";
import { createRng, type Rng } from "./random";
import { getSkill, SKILLS } from "./skills";
import { unlockedUnits } from "./units";
import type {
  AssistanceState,
  Attempt,
  LogEntry,
  Problem,
  ProfileState,
  SessionPlan,
  SessionResult,
  SkillId,
  SkillState,
} from "./types";

/** A Session in progress. Plain data; every step returns a new one. */
export type SessionState = {
  readonly plan: SessionPlan;
  /** The Profile as it stood when the Session started. */
  readonly profile: ProfileState;
  readonly seed: string;
  readonly sessionNumber: number;
  readonly problems: readonly Problem[];
  readonly entries: readonly LogEntry[];
  /** 0-based index of the Problem being presented. */
  readonly position: number;
  readonly attempts: readonly Attempt[];
  /** Skill states as they stand mid-Session; Estimates move on first attempts. */
  readonly skills: Readonly<Record<SkillId, SkillState>>;
  readonly nextProblemNumber: number;
  readonly status: "in-progress" | "complete" | "abandoned";
};

export function newProfile(): ProfileState {
  const skills = {} as Record<SkillId, SkillState>;
  for (const skill of SKILLS) {
    skills[skill.id] = {
      estimate: skill.bkt.prior,
      recentFirstAttempts: [],
      mastered: false,
    };
  }
  return { nextProblemNumber: 1, sessionsCompleted: 0, skills };
}

/** Largest-remainder allocation of `length` Problems across the Plan's Skill weights. */
function allocateMix(plan: SessionPlan, length: number): SkillId[] {
  const total = plan.skills.reduce((sum, s) => sum + s.weight, 0);
  const exact = plan.skills.map((s) => (length * s.weight) / total);
  const counts = exact.map(Math.floor);
  let remaining = length - counts.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of byRemainder) {
    if (remaining === 0) break;
    counts[index] += 1;
    remaining -= 1;
  }
  return plan.skills.flatMap((s, i) => Array<SkillId>(counts[i]).fill(s.skill));
}

type Slot = { readonly skill: SkillId; readonly review: boolean };

/**
 * The review share of the length goes to Mastered Skills outside the mix,
 * spread round-robin from a random start; the rest is the mix by weight.
 */
function allocateSlots(plan: SessionPlan, profile: ProfileState, rng: Rng): Slot[] {
  const inMix = new Set(plan.skills.map((s) => s.skill));
  const reviewable = SKILLS.map((s) => s.id).filter((id) => profile.skills[id].mastered && !inMix.has(id));
  const review: Slot[] = [];
  if (reviewable.length > 0) {
    const start = rng.int(0, reviewable.length - 1);
    for (let i = 0; i < Math.round(plan.length * plan.reviewShare); i++) {
      review.push({ skill: reviewable[(start + i) % reviewable.length], review: true });
    }
  }
  const reviewCount = review.length;
  const mix = allocateMix(plan, plan.length - reviewCount).map((skill) => ({ skill, review: false }));
  return [...mix, ...review];
}

const sameNumbers = (a: Problem, b: Problem): boolean =>
  a.skill === b.skill &&
  a.structure === b.structure &&
  a.equation.left === b.equation.left &&
  a.equation.right === b.equation.right;

function buildProblems(
  plan: SessionPlan,
  profile: ProfileState,
  rng: Rng,
  firstProblemNumber: number,
): Problem[] {
  const order = rng.shuffle(allocateSlots(plan, profile, rng));
  const problems: Problem[] = [];
  order.forEach((slot, index) => {
    const skill = getSkill(slot.skill);
    const planSkill = slot.review ? undefined : plan.skills.find((s) => s.skill === slot.skill);
    const options = {
      range: planSkill?.numberRange ?? skill.defaultRange,
      structures: planSkill?.structures ?? skill.structures,
    };
    let problem: Problem | undefined;
    for (let attempt = 0; attempt < 20; attempt++) {
      const draft = skill.generate(rng, options);
      const candidate: Problem = {
        id: `p${firstProblemNumber + index}`,
        skill: slot.skill,
        review: slot.review,
        ...draft,
      };
      problem = candidate;
      if (!problems.some((p) => sameNumbers(p, candidate))) break;
    }
    problems.push(problem!);
  });
  return problems;
}

/**
 * Build the Session. Every Plan is checked against the Plan Space first and
 * rejected with its reasons; only the bundled Diagnostic Plan is exempt.
 */
export function startSession(
  plan: SessionPlan,
  profile: ProfileState,
  seed: string,
): SessionState {
  if (!isDiagnosticPlan(plan)) {
    const verdict = validatePlan(plan, profile);
    if (!verdict.ok) throw new Error(`Session Plan rejected: ${verdict.reasons.join("; ")}`);
  }
  const rng = createRng(`${seed}:session-${profile.sessionsCompleted + 1}`);
  const problems = buildProblems(plan, profile, rng, profile.nextProblemNumber);
  return {
    plan,
    profile,
    seed,
    sessionNumber: profile.sessionsCompleted + 1,
    problems,
    entries: [],
    position: 0,
    attempts: [],
    skills: profile.skills,
    nextProblemNumber: profile.nextProblemNumber + problems.length,
    status: "in-progress",
  };
}

export function currentProblem(state: SessionState): Problem | undefined {
  return state.status === "in-progress" ? state.problems[state.position] : undefined;
}

function recordFirstAttempt(
  skills: SessionState["skills"],
  skillId: SkillId,
  correct: boolean,
): SessionState["skills"] {
  const before = skills[skillId];
  const estimate = bktUpdate(before.estimate, correct, getSkill(skillId).bkt);
  const recentFirstAttempts = [...before.recentFirstAttempts, correct].slice(-MASTERY_WINDOW);
  const after: SkillState = { estimate, recentFirstAttempts, mastered: before.mastered };
  return { ...skills, [skillId]: { ...after, mastered: after.mastered || meetsMastery(after) } };
}

function closeProblem(
  state: SessionState,
  attempts: readonly Attempt[],
  assistance: AssistanceState,
): SessionState {
  const problem = state.problems[state.position];
  const entry: LogEntry = { problem, position: state.position + 1, attempts, assistance };
  const entries = [...state.entries, entry];
  const position = state.position + 1;
  return {
    ...state,
    entries,
    attempts: [],
    position,
    status: position >= state.problems.length ? "complete" : "in-progress",
  };
}

/** Apply one tap. The first attempt moves the Knowledge Estimate; the second never does. */
export function answerProblem(
  state: SessionState,
  answer: number,
  responseMs: number,
): SessionState {
  const problem = currentProblem(state);
  if (!problem) throw new Error("No Problem is being presented");
  const attempt: Attempt = { answer, correct: answer === problem.answer, responseMs };
  const attempts = [...state.attempts, attempt];

  if (attempts.length === 1) {
    const skills = recordFirstAttempt(state.skills, problem.skill, attempt.correct);
    if (attempt.correct) {
      return closeProblem({ ...state, skills }, attempts, "first-try-correct");
    }
    return { ...state, skills, attempts };
  }
  return closeProblem(state, attempts, attempt.correct ? "hint-assisted-correct" : "revealed");
}

/** End the Session early: the Problem being presented is logged as unresolved. */
export function abandonSession(state: SessionState): SessionState {
  if (state.status !== "in-progress") return state;
  const closed = closeProblem(state, state.attempts, "unresolved");
  return { ...closed, status: "abandoned" };
}

export function finishSession(state: SessionState): SessionResult {
  if (state.status === "in-progress") {
    throw new Error("The Session is still in progress");
  }
  const { profile } = state;
  const newlyMastered = (Object.keys(state.skills) as SkillId[]).filter(
    (id) => state.skills[id].mastered && !profile.skills[id].mastered,
  );
  const next: ProfileState = {
    nextProblemNumber: state.nextProblemNumber,
    sessionsCompleted: state.status === "complete" ? profile.sessionsCompleted + 1 : profile.sessionsCompleted,
    skills: state.skills,
  };
  const before = unlockedUnits(profile);
  const newlyUnlockedUnits = unlockedUnits(next).filter((unit) => !before.includes(unit));
  return {
    log: {
      sessionNumber: state.sessionNumber,
      seed: state.seed,
      plan: state.plan,
      entries: state.entries,
    },
    profile: next,
    newlyMastered,
    newlyUnlockedUnits,
  };
}

/**
 * The Loop: a Plan, a Profile, a seed, and a policy in; the Session Log and
 * the next Profile out. Same inputs, same outputs, no I/O.
 */
export function runSession(
  plan: SessionPlan,
  profile: ProfileState,
  seed: string,
  policy: AnswerPolicy,
): SessionResult {
  const policyRng = createRng(`${seed}:policy-${profile.sessionsCompleted + 1}`);
  let state = startSession(plan, profile, seed);
  while (state.status === "in-progress") {
    const problem = currentProblem(state)!;
    const { answer, responseMs } = policy(problem, {
      attempt: state.attempts.length === 0 ? 1 : 2,
      position: state.position + 1,
      rng: policyRng,
    });
    state = answerProblem(state, answer, responseMs);
  }
  return finishSession(state);
}
