/**
 * The Generation seam: one interface with four operations, every model and
 * voice call behind it. A fake implements it for every test and the CLI; the
 * real adapters call Claude and ElevenLabs. Nothing here decides a Problem,
 * a number, or an answer (ADR 0001).
 */
import type {
  AssistanceState,
  Equation,
  LearnerNotes,
  PlanSpace,
  ProblemId,
  SessionLog,
  SessionPlan,
  SkillId,
  SkillState,
} from "@/loop";

/** Story input: the engine's numbers and answer, which the Story only dresses. Shape settled by ticket 10. */
export type StoryInput = {
  readonly skill: SkillId;
  readonly structure: string;
  readonly equation: Equation;
  readonly answer: number;
  readonly theme: string;
  readonly nickname: string;
};

export type StoryOutput = { readonly text: string };

/**
 * One Problem as the Coach sees it: the evidence, never the Problem. The
 * equation has its unknown blanked and the answer is not here at all, so the
 * Coach can neither receive nor repeat a number to ask or an answer.
 */
export type CoachEvidence = {
  readonly id: ProblemId;
  readonly skill: SkillId;
  readonly structure: string;
  /** `8 + 5 = ?` */
  readonly equation: string;
  readonly review: boolean;
  /** 1-based position in the Session. */
  readonly position: number;
  readonly assistance: AssistanceState;
  /** Context only; never lowers Mastery. Null when the Problem was left unresolved before a first attempt. */
  readonly firstTryMs: number | null;
};

export type CoachOutput = {
  readonly notes: LearnerNotes;
  readonly plan: SessionPlan;
};

export type CoachInput = {
  readonly sessionNumber: number;
  /** This Session's Log, one entry per Problem. */
  readonly evidence: readonly CoachEvidence[];
  /** The Notes as they stood before this Session. */
  readonly notes: LearnerNotes;
  /** The Knowledge Estimates per Skill. */
  readonly estimates: Readonly<Record<SkillId, SkillState>>;
  /** The only levers, with their bounds. */
  readonly planSpace: PlanSpace;
  /** Set on the retry: what the engine rejected and every reason. No output when the call itself failed. */
  readonly rejected?: {
    readonly output?: CoachOutput;
    readonly reasons: readonly string[];
  };
};

/** Parent Summary input. Shape settled by ticket 12. */
export type SummaryInput = {
  readonly log: SessionLog;
  readonly notes: LearnerNotes;
};

export type SummaryOutput = { readonly text: string };

/** Speech input. Shape settled by ticket 11. */
export type SpeechInput = { readonly text: string };

export type SpeechOutput = {
  readonly audio: Uint8Array;
  readonly mimeType: string;
};

/** Exactly four operations. Adding a fifth is a spec change. */
export type Generation = {
  writeStory(input: StoryInput): Promise<StoryOutput>;
  runCoach(input: CoachInput): Promise<CoachOutput>;
  writeSummary(input: SummaryInput): Promise<SummaryOutput>;
  renderSpeech(input: SpeechInput): Promise<SpeechOutput>;
};
