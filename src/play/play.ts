/**
 * A Session as the Learner plays it: the Loop's step functions driven tap by
 * tap, plus the moments between them where Ollie reacts. Plain data and pure
 * functions; the screen renders the state and forwards taps.
 */
import { answerProblem, baselinePlan, currentProblem, finishSession, startSession } from "@/loop";
import type { Problem, SessionResult, SessionState } from "@/loop";
import type { Profile } from "@/profile/profile";

export type Phase =
  /** Waiting for a tap on the number pad. */
  | { readonly kind: "asking" }
  /** After the first miss: the Hint is shown and the pad waits for the retry. */
  | { readonly kind: "hint" }
  /** Ollie celebrates a correct answer before the next Problem. */
  | { readonly kind: "correct"; readonly assistance: "first-try-correct" | "hint-assisted-correct" }
  /** After the second miss: Ollie shows the answer and the strategy. */
  | { readonly kind: "reveal" }
  /** The Session is over and the Profile has moved on. */
  | { readonly kind: "celebration"; readonly result: SessionResult };

export type PlayState = {
  readonly session: SessionState;
  readonly phase: Phase;
  /** When the current question was put to the Learner (ms); the response time runs from it. */
  readonly askedAt: number;
};

export type PlayEvent =
  | { readonly type: "tap"; readonly answer: number; readonly at: number }
  /** Move on from Ollie's reaction to the next Problem, or to the celebration. */
  | { readonly type: "next"; readonly at: number };

function celebrate(session: SessionState): PlayState {
  return { session, phase: { kind: "celebration", result: finishSession(session) }, askedAt: 0 };
}

/**
 * Resume the Session in progress where it was, finish one that ended without
 * being celebrated, or start the next Session from the Profile's Plan. Until
 * the Coach reaches the app (ticket 12) the Plan is the Baseline's: the
 * Diagnostic Session first, then 6 from the current Skill plus 2 Review.
 */
export function beginPlay(profile: Profile, now: number): PlayState {
  const { session } = profile;
  if (session && session.status !== "in-progress") return celebrate(session);
  if (session) {
    return { session, phase: { kind: session.attempts.length === 0 ? "asking" : "hint" }, askedAt: now };
  }
  const plan = baselinePlan(profile.progress);
  return { session: startSession(plan, profile.progress, profile.seed), phase: { kind: "asking" }, askedAt: now };
}

export function playReducer(state: PlayState, event: PlayEvent): PlayState {
  const { kind } = state.phase;
  if (event.type === "tap") {
    if (kind !== "asking" && kind !== "hint") return state;
    const session = answerProblem(state.session, event.answer, event.at - state.askedAt);
    if (session.entries.length === state.session.entries.length) {
      return { session, phase: { kind: "hint" }, askedAt: event.at };
    }
    const { assistance } = session.entries[session.entries.length - 1];
    if (assistance === "revealed") return { ...state, session, phase: { kind: "reveal" } };
    if (assistance === "unresolved") throw new Error("A tap never leaves a Problem unresolved");
    return { ...state, session, phase: { kind: "correct", assistance } };
  }
  if (kind !== "correct" && kind !== "reveal") return state;
  if (state.session.status !== "in-progress") return celebrate(state.session);
  return { ...state, phase: { kind: "asking" }, askedAt: event.at };
}

/** The Problem on screen: the one being asked, or the one Ollie is reacting to. */
export function problemShown(state: PlayState): Problem | undefined {
  const { kind } = state.phase;
  if (kind === "asking" || kind === "hint") return currentProblem(state.session);
  if (kind === "celebration") return undefined;
  return state.session.entries[state.session.entries.length - 1]?.problem;
}

/** The answer tapped on the first miss, so the pad can show it was tried. */
export function triedAnswer(state: PlayState): number | undefined {
  return state.phase.kind === "hint" ? state.session.attempts[0]?.answer : undefined;
}
