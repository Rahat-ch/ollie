/**
 * A Session as the Learner plays it: the Loop's step functions driven tap by
 * tap, plus the moments between them where Ollie reacts. Plain data and pure
 * functions; the screen renders the state and forwards taps.
 */
import { answerProblem, baselinePlan, currentProblem, finishSession, startSession } from "@/loop";
import type { Problem, SessionResult, SessionState } from "@/loop";
import type { Profile } from "@/profile/profile";
import { awardSession, type Award, type Rewards } from "@/rewards/rewards";

export type Phase =
  /** Waiting for a tap on the number pad. */
  | { readonly kind: "asking" }
  /** After the first miss: the Hint is shown and the pad waits for the retry. */
  | { readonly kind: "hint" }
  /** Ollie celebrates a correct answer before the next Problem. */
  | { readonly kind: "correct"; readonly assistance: "first-try-correct" | "hint-assisted-correct" }
  /** After the second miss: Ollie shows the answer and the strategy. */
  | { readonly kind: "reveal" }
  /** The Session is over and the Profile has moved on, with the Coins and the Streak it earned. */
  | { readonly kind: "celebration"; readonly result: SessionResult; readonly award: Award };

export type PlayState = {
  readonly session: SessionState;
  /** The rewards as they stand: the Session's Coins and Streak land on them at the celebration. */
  readonly rewards: Rewards;
  /**
   * When the Session's last Problem was answered, in ms; the Streak's day
   * comes from it. Null while the Session is in progress, and for a Session
   * that ended in an earlier visit, whose day this device no longer knows.
   */
  readonly completedAt: number | null;
  readonly phase: Phase;
  /** When the Problem (or its retry after the Hint) was put to the Learner, in ms; the response time runs from it. */
  readonly askedAt: number;
};

export type PlayEvent =
  | { readonly type: "tap"; readonly answer: number; readonly at: number }
  /** Move on from Ollie's reaction to the next Problem, or to the celebration. */
  | { readonly type: "next"; readonly at: number };

/**
 * The Session is over: the Loop's result, and the Coins and Streak it earned
 * on the day its last Problem was answered, which is the day the Learner
 * played and not the day she tapped through the celebration. A Session pays
 * its Coins once, so celebrating the same Session again (a Session left
 * uncelebrated, finished on the next visit) adds nothing.
 */
function celebrate(session: SessionState, rewards: Rewards, completedAt: number): PlayState {
  const result = finishSession(session);
  const award = awardSession(rewards, { sessionNumber: result.log.sessionNumber, status: session.status }, new Date(completedAt));
  return { session, rewards: award.rewards, phase: { kind: "celebration", result, award }, askedAt: 0, completedAt };
}

/**
 * Resume the Session in progress where it was, finish one that ended without
 * being celebrated, or start the next Session from the Profile's Plan. Until
 * the Coach reaches the app (ticket 12) the Plan is the Baseline's: the
 * Diagnostic Session first, then 6 from the current Skill plus 2 Review.
 */
export function beginPlay(profile: Profile, now: number): PlayState {
  const { session, rewards } = profile;
  // A Session that ended without its celebration is paid for on the day it is
  // picked up again: the device kept the Session, not the moment it ended.
  if (session && session.status !== "in-progress") return celebrate(session, rewards, now);
  if (session) {
    return { session, rewards, completedAt: null, phase: { kind: session.attempts.length === 0 ? "asking" : "hint" }, askedAt: now };
  }
  const plan = baselinePlan(profile.progress);
  return {
    session: startSession(plan, profile.progress, profile.seed),
    rewards,
    completedAt: null,
    phase: { kind: "asking" },
    askedAt: now,
  };
}

export function playReducer(state: PlayState, event: PlayEvent): PlayState {
  const { kind } = state.phase;
  if (event.type === "tap") {
    if (kind !== "asking" && kind !== "hint") return state;
    const session = answerProblem(state.session, event.answer, event.at - state.askedAt);
    if (session.entries.length === state.session.entries.length) {
      return { ...state, session, phase: { kind: "hint" }, askedAt: event.at };
    }
    const { assistance } = session.entries[session.entries.length - 1];
    // The tap that answers the last Problem is when the Session was played.
    const completedAt = session.status === "in-progress" ? state.completedAt : event.at;
    if (assistance === "revealed") return { ...state, session, completedAt, phase: { kind: "reveal" } };
    if (assistance === "unresolved") throw new Error("A tap never leaves a Problem unresolved");
    return { ...state, session, completedAt, phase: { kind: "correct", assistance } };
  }
  if (kind !== "correct" && kind !== "reveal") return state;
  if (state.session.status !== "in-progress") return celebrate(state.session, state.rewards, state.completedAt ?? event.at);
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
