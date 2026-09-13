/**
 * Vocabulary is the glossary in CONTEXT.md. Everything here is plain data:
 * the Loop is a pure function over these shapes and does no I/O.
 */

export type SkillId =
  | "partners-to-10"
  | "teen-numbers"
  | "counting-on"
  | "make-a-ten"
  | "unknown-addend"
  | "result-unknown"
  | "change-unknown";

export type Unit = 1 | 2 | 3;

/** A Skill named for a reader: the id the engine uses and the name a Parent sees. */
export type SkillRef = { readonly skill: SkillId; readonly name: string };

export type Visual = "ten-frame" | "number-line" | "theme-picture";

/** Inclusive bounds on the number a Skill's template family draws. */
export type NumberRange = { readonly min: number; readonly max: number };

/**
 * The arithmetic behind a Problem, with every number filled in. The Learner
 * is asked for the value at `unknown`; the engine already knows it.
 */
export type Equation = {
  readonly left: number;
  readonly op: "+" | "-";
  readonly right: number;
  readonly result: number;
  readonly unknown: "left" | "right" | "result";
};

export type ProblemId = string;

export type Problem = {
  /** Unique across the Profile's whole history, e.g. `p17`. */
  readonly id: ProblemId;
  readonly skill: SkillId;
  readonly structure: string;
  readonly equation: Equation;
  /** The single correct answer, decided by the engine. */
  readonly answer: number;
  /** The line Ollie speaks. Hand-written template text, never model-written. */
  readonly spoken: string;
  /** A Review Problem: drawn from a Mastered Skill to keep it warm, not from the Plan's mix. */
  readonly review: boolean;
};

export type AssistanceState =
  | "first-try-correct"
  | "hint-assisted-correct"
  | "revealed"
  | "unresolved";

export type Attempt = {
  readonly answer: number;
  readonly correct: boolean;
  /** Context for the Coach only. Never read by the Knowledge Estimate. */
  readonly responseMs: number;
};

export type LogEntry = {
  readonly problem: Problem;
  /** 1-based position in the Session. */
  readonly position: number;
  readonly attempts: readonly Attempt[];
  readonly assistance: AssistanceState;
};

export type PlanSkill = {
  readonly skill: SkillId;
  /** Relative share of the Session's Problems. */
  readonly weight: number;
  /** Narrows the Skill's standard range; defaults to the Skill's own default. */
  readonly numberRange?: NumberRange;
  /** Restricts the Skill's structures; defaults to all of them. */
  readonly structures?: readonly string[];
};

export type SessionPlan = {
  /** 6 to 10 Problems. */
  readonly length: number;
  readonly skills: readonly PlanSkill[];
  /**
   * Share of the length, 0 to 1, given to Review Problems from Mastered
   * Skills outside the mix. Slots with no such Skill go back to the mix.
   */
  readonly reviewShare: number;
  readonly hypothesisUnderTest: string | null;
};

export type SessionLog = {
  /** 1-based count of Sessions including this one. */
  readonly sessionNumber: number;
  readonly seed: string;
  readonly plan: SessionPlan;
  readonly entries: readonly LogEntry[];
};

export type SkillState = {
  /** Bayesian Knowledge Tracing probability that the Skill is known. */
  readonly estimate: number;
  /** Outcome of the last ten first attempts, oldest first. */
  readonly recentFirstAttempts: readonly boolean[];
  /** Latched: once Mastered, a Skill stays Mastered. */
  readonly mastered: boolean;
};

export type ProfileState = {
  /** The next Problem number to allocate; keeps IDs unique across history. */
  readonly nextProblemNumber: number;
  readonly sessionsCompleted: number;
  readonly skills: Readonly<Record<SkillId, SkillState>>;
};

export type SessionResult = {
  readonly log: SessionLog;
  readonly profile: ProfileState;
  /** Skills that became Mastered during this Session. */
  readonly newlyMastered: readonly SkillId[];
  /** Units whose Skills all became Mastered during this Session, opening the next. */
  readonly newlyUnlockedUnits: readonly Unit[];
};

export type HypothesisStatus = "proposed" | "supported" | "refuted";

/**
 * One belief in the Learner Notes. Evidence is Problem IDs only; the engine
 * rejects any ID it cannot find (ADR 0003). IDs like `h1` are the Coach's
 * own and stay stable from one Session to the next.
 */
export type Hypothesis = {
  readonly id: string;
  readonly claim: string;
  readonly status: HypothesisStatus;
  /** 0 to 1. */
  readonly confidence: number;
  readonly evidence: readonly ProblemId[];
  /** What the next Session should show to move the status. */
  readonly nextTest: string;
};

/** What the Coach currently believes about the Learner. Shown to the Parent as Ollie's Notebook. */
export type LearnerNotes = {
  readonly hypotheses: readonly Hypothesis[];
  /** Plain-English strengths, no evidence needed: they are not claims under test. */
  readonly strengths: readonly string[];
};
