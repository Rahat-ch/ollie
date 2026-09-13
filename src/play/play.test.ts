import { describe, expect, it } from "vitest";
import { currentProblem, DIAGNOSTIC_PLAN, newProfile, startSession } from "@/loop";
import { createProfile, type Profile } from "@/profile/profile";
import { COINS_PER_SESSION, newRewards } from "@/rewards/rewards";
import { beginPlay, playReducer, problemShown, triedAnswer, type PlayState } from "./play";

const wrong = (answer: number): number => (answer === 0 ? 1 : answer - 1);

function tap(state: PlayState, answer: number, at = 1000): PlayState {
  return playReducer(state, { type: "tap", answer, at });
}
const next = (state: PlayState, at = 2000): PlayState => playReducer(state, { type: "next", at });

/** Answer the Problem being asked with the given outcome: f first-try, h Hint-assisted, r Revealed. */
function play(state: PlayState, outcome: "f" | "h" | "r"): PlayState {
  const { answer } = problemShown(state)!;
  if (outcome === "f") return tap(state, answer);
  const hinted = tap(state, wrong(answer));
  return tap(hinted, outcome === "h" ? answer : wrong(answer));
}

describe("beginPlay", () => {
  it("starts the Diagnostic Session for a fresh Profile and asks its first Problem", () => {
    const state = beginPlay(createProfile("seed-1"), 500);
    expect(state.phase).toEqual({ kind: "asking" });
    expect(state.session.plan).toBe(DIAGNOSTIC_PLAN);
    expect(state.session.problems).toHaveLength(9);
    expect(problemShown(state)).toBe(currentProblem(state.session));
    expect(state.askedAt).toBe(500);
  });

  it("resumes a Session in progress where it was, in the Hint phase after one miss", () => {
    let session = startSession(DIAGNOSTIC_PLAN, newProfile(), "seed-1");
    const first = currentProblem(session)!;
    session = { ...session, attempts: [{ answer: wrong(first.answer), correct: false, responseMs: 1200 }] };
    const state = beginPlay({ ...createProfile("seed-1"), session }, 500);
    expect(state.phase).toEqual({ kind: "hint" });
    expect(problemShown(state)).toBe(first);
    expect(triedAnswer(state)).toBe(wrong(first.answer));
  });
});

describe("playReducer", () => {
  const fresh = beginPlay(createProfile("seed-1"), 0);

  it("a first-try correct answer moves to the correct phase, then next asks the following Problem", () => {
    const problem = problemShown(fresh)!;
    const answered = tap(fresh, problem.answer, 3000);
    expect(answered.phase).toEqual({ kind: "correct", assistance: "first-try-correct" });
    expect(problemShown(answered)).toBe(problem);
    expect(answered.session.entries[0]).toMatchObject({
      assistance: "first-try-correct",
      attempts: [{ answer: problem.answer, correct: true, responseMs: 3000 }],
    });
    const following = next(answered, 4000);
    expect(following.phase).toEqual({ kind: "asking" });
    expect(problemShown(following)).toBe(fresh.session.problems[1]);
    expect(following.askedAt).toBe(4000);
  });

  it("a first miss shows the Hint and the tried answer; a correct retry is Hint-assisted", () => {
    const problem = problemShown(fresh)!;
    const hinted = tap(fresh, wrong(problem.answer), 3000);
    expect(hinted.phase).toEqual({ kind: "hint" });
    expect(problemShown(hinted)).toBe(problem);
    expect(triedAnswer(hinted)).toBe(wrong(problem.answer));
    expect(hinted.askedAt).toBe(3000);
    const retried = tap(hinted, problem.answer, 5500);
    expect(retried.phase).toEqual({ kind: "correct", assistance: "hint-assisted-correct" });
    expect(retried.session.entries[0].assistance).toBe("hint-assisted-correct");
    expect(retried.session.entries[0].attempts[1].responseMs).toBe(2500);
  });

  it("a second miss shows the Reveal and the Problem is Revealed", () => {
    const problem = problemShown(fresh)!;
    const revealed = tap(tap(fresh, wrong(problem.answer)), wrong(problem.answer));
    expect(revealed.phase).toEqual({ kind: "reveal" });
    expect(problemShown(revealed)).toBe(problem);
    expect(revealed.session.entries[0].assistance).toBe("revealed");
  });

  it("ignores taps while Ollie is reacting and next while a Problem is being asked", () => {
    const problem = problemShown(fresh)!;
    expect(next(fresh)).toBe(fresh);
    const answered = tap(fresh, problem.answer);
    expect(tap(answered, 3)).toBe(answered);
  });

  it("after the last Problem, next finishes the Session and celebrates with the result", () => {
    let state = fresh;
    const outcomes = "fhrffffff";
    for (const outcome of outcomes) state = next(play(state, outcome as "f" | "h" | "r"));
    expect(state.phase.kind).toBe("celebration");
    if (state.phase.kind !== "celebration") throw new Error("unreachable");
    const { result } = state.phase;
    expect(result.log.entries.map((e) => e.assistance)).toEqual([
      "first-try-correct",
      "hint-assisted-correct",
      "revealed",
      ...Array<string>(6).fill("first-try-correct"),
    ]);
    expect(result.profile.sessionsCompleted).toBe(1);
    expect(problemShown(state)).toBeUndefined();
    expect(next(state)).toBe(state);
  });
});

describe("the rewards a Session earns", () => {
  /** Play every Problem of a Session first-try, finishing at the given moment. */
  function playThrough(profile: Profile, at: number): PlayState {
    let state = beginPlay(profile, at);
    while (state.phase.kind !== "celebration") state = next(play(state, "f"), at);
    return state;
  }

  it("hands the celebration the Coins, the Streak, and no milestone on the first day", () => {
    const day = new Date(2026, 8, 13, 10).getTime();
    const state = playThrough(createProfile("seed-1"), day);
    if (state.phase.kind !== "celebration") throw new Error("unreachable");
    const { award } = state.phase;
    expect(award.coins).toBe(COINS_PER_SESSION);
    expect(award.milestone).toBeNull();
    expect(award.rewards.streak).toBe(1);
    expect(state.rewards).toBe(award.rewards);
  });

  it("earns Coins on the rewards the Profile already holds, and pays the Session once when it is celebrated again", () => {
    const day = new Date(2026, 8, 13, 10).getTime();
    const held = { ...createProfile("seed-1"), rewards: { ...newRewards(), coins: 40 } };
    const state = playThrough(held, day);
    if (state.phase.kind !== "celebration") throw new Error("unreachable");
    expect(state.phase.award.rewards.coins).toBe(50);

    // The Session that ended without its celebration, finished on the next visit.
    const ended = { ...held, rewards: state.phase.award.rewards, session: state.session };
    const again = beginPlay(ended, day);
    if (again.phase.kind !== "celebration") throw new Error("unreachable");
    expect(again.phase.award.coins).toBe(0);
    expect(again.phase.award.rewards.coins).toBe(50);
  });
});
