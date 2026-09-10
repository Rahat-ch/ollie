import { bktUpdate } from "./bkt";
import { meetsMastery } from "./mastery";
import type { AnswerPolicy } from "./policies";
import { createRng, type Rng } from "./random";
import { getSkill, SKILLS } from "./skills";
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
function allocateSkills(plan: SessionPlan): SkillId[] {
  const total = plan.skills.reduce((sum, s) => sum + s.weight, 0);
  const exact = plan.skills.map((s) => (plan.length * s.weight) / total);
  const counts = exact.map(Math.floor);
  let remaining = plan.length - counts.reduce((a, b) => a + b, 0);
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

const sameNumbers = (a: Problem, b: Problem): boolean =>
  a.skill === b.skill &&
  a.structure === b.structure &&
  a.equation.left === b.equation.left &&
  a.equation.right === b.equation.right;

function buildProblems(
  plan: SessionPlan,
  rng: Rng,
  firstProblemNumber: number,
): Problem[] {
  const order = rng.shuffle(allocateSkills(plan));
  const problems: Problem[] = [];
  order.forEach((skillId, index) => {
    const skill = getSkill(skillId);
    const planSkill = plan.skills.find((s) => s.skill === skillId)!;
    const options = {
      range: planSkill.numberRange ?? skill.defaultRange,
      structures: planSkill.structures ?? skill.structures,
    };
    let problem: Problem | undefined;
    for (let attempt = 0; attempt < 20; attempt++) {
      const draft = skill.generate(rng, options);
      const candidate: Problem = {
        id: `p${firstProblemNumber + index}`,
        skill: skillId,
        ...draft,
      };
      problem = candidate;
      if (!problems.some((p) => sameNumbers(p, candidate))) break;
    }
    problems.push(problem!);
  });
  return problems;
}

export function startSession(
  plan: SessionPlan,
  profile: ProfileState,
  seed: string,
): SessionState {
  const rng = createRng(`${seed}:session-${profile.sessionsCompleted + 1}`);
  const problems = buildProblems(plan, rng, profile.nextProblemNumber);
  return {
    plan,
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
  const recentFirstAttempts = [...before.recentFirstAttempts, correct].slice(-10);
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

export function finishSession(state: SessionState, profile: ProfileState): SessionResult {
  if (state.status === "in-progress") {
    throw new Error("The Session is still in progress");
  }
  const newlyMastered = (Object.keys(state.skills) as SkillId[]).filter(
    (id) => state.skills[id].mastered && !profile.skills[id].mastered,
  );
  return {
    log: {
      sessionNumber: state.sessionNumber,
      seed: state.seed,
      plan: state.plan,
      entries: state.entries,
    },
    profile: {
      nextProblemNumber: state.nextProblemNumber,
      sessionsCompleted: state.status === "complete" ? profile.sessionsCompleted + 1 : profile.sessionsCompleted,
      skills: state.skills,
    },
    newlyMastered,
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
  return finishSession(state, profile);
}
