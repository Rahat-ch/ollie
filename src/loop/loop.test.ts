import { describe, expect, it } from "vitest";
import {
  DIAGNOSTIC_PLAN,
  abandonSession,
  alwaysFirstTry,
  alwaysHintAssisted,
  alwaysRevealed,
  answerProblem,
  currentProblem,
  finishSession,
  newProfile,
  runSession,
  scripted,
  startSession,
  type AnswerPolicy,
} from "@/loop";

describe("runSession through the Diagnostic Session", () => {
  it("logs one entry per planned Problem, all first-try correct under a perfect policy", () => {
    const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-1", alwaysFirstTry);

    expect(result.log.entries).toHaveLength(DIAGNOSTIC_PLAN.length);
    expect(result.log.entries.map((e) => e.assistance)).toEqual(
      Array(DIAGNOSTIC_PLAN.length).fill("first-try-correct"),
    );
  });
});

describe("the Loop is pure and deterministic", () => {
  it("produces an identical Log and Profile for the same seed and policy", () => {
    const a = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-7", alwaysHintAssisted);
    const b = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-7", alwaysHintAssisted);
    expect(a).toEqual(b);
  });

  it("produces different Problems for a different seed", () => {
    const a = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-7", alwaysFirstTry);
    const b = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-8", alwaysFirstTry);
    expect(a.log.entries.map((e) => e.problem.spoken)).not.toEqual(
      b.log.entries.map((e) => e.problem.spoken),
    );
  });
});

describe("every Problem in the Log", () => {
  const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-3", alwaysFirstTry);

  it("has a Skill from the Plan, a structure, its numbers, and one Assistance State", () => {
    for (const entry of result.log.entries) {
      expect(["partners-to-10", "teen-numbers"]).toContain(entry.problem.skill);
      expect(entry.problem.structure).toBeTruthy();
      expect(entry.problem.equation).toMatchObject({ op: expect.any(String) });
      expect(["first-try-correct", "hint-assisted-correct", "revealed", "unresolved"]).toContain(
        entry.assistance,
      );
    }
  });

  it("has an ID unique across the Profile's history, not just the Session", () => {
    const second = runSession(DIAGNOSTIC_PLAN, result.profile, "seed-3", alwaysFirstTry);
    const ids = [...result.log.entries, ...second.log.entries].map((e) => e.problem.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is numbered by its 1-based position in the Session", () => {
    expect(result.log.entries.map((e) => e.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("Assistance State", () => {
  it("is Hint-assisted correct when the second attempt is right", () => {
    const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-2", alwaysHintAssisted);
    expect(result.log.entries[0].assistance).toBe("hint-assisted-correct");
    expect(result.log.entries[0].attempts.map((a) => a.correct)).toEqual([false, true]);
  });

  it("is Revealed after two misses, with no third attempt", () => {
    const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-2", alwaysRevealed);
    expect(result.log.entries[0].assistance).toBe("revealed");
    expect(result.log.entries[0].attempts).toHaveLength(2);
  });
});

describe("the Knowledge Estimate", () => {
  it("rises after a first-try correct answer", () => {
    const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-4", alwaysFirstTry);
    expect(result.profile.skills["partners-to-10"].estimate).toBeGreaterThan(0.3);
    expect(result.profile.skills["teen-numbers"].estimate).toBeGreaterThan(0.3);
  });

  it("moves the same way for a Hint-assisted success as for a Reveal: only the miss counts", () => {
    const hinted = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-4", alwaysHintAssisted);
    const revealed = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-4", alwaysRevealed);
    expect(hinted.profile.skills).toEqual(revealed.profile.skills);
    expect(hinted.profile.skills["partners-to-10"].estimate).toBeLessThan(0.3);
  });

  it("ignores response time entirely", () => {
    const fast: AnswerPolicy = (p, { attempt }) => ({ answer: attempt === 1 ? -1 : p.answer, responseMs: 200 });
    const slow: AnswerPolicy = (p, { attempt }) => ({ answer: attempt === 1 ? -1 : p.answer, responseMs: 90_000 });
    const a = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-5", fast);
    const b = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-5", slow);
    expect(a.profile.skills).toEqual(b.profile.skills);
    expect(a.log.entries[0].attempts[0].responseMs).toBe(200);
    expect(b.log.entries[0].attempts[0].responseMs).toBe(90_000);
  });
});

describe("Mastery through the Loop", () => {
  const partnersOnly = { ...DIAGNOSTIC_PLAN, length: 10, skills: [{ skill: "partners-to-10" as const, weight: 1 }] };

  it("marks a Skill Mastered after 8 first-try correct answers", () => {
    const result = runSession(partnersOnly, newProfile(), "seed-m", alwaysFirstTry);
    expect(result.profile.skills["partners-to-10"].mastered).toBe(true);
    expect(result.newlyMastered).toEqual(["partners-to-10"]);
    expect(result.profile.skills["teen-numbers"].mastered).toBe(false);
  });

  it("does not Master a Skill on 7 of 10", () => {
    const result = runSession(partnersOnly, newProfile(), "seed-m", scripted("fffffffrrr"));
    expect(result.profile.skills["partners-to-10"].mastered).toBe(false);
    expect(result.newlyMastered).toEqual([]);
  });

  it("counts a Hint-assisted success as a miss for the 8-of-10 rule", () => {
    const result = runSession(partnersOnly, newProfile(), "seed-m", scripted("fffffffhhh"));
    expect(result.profile.skills["partners-to-10"].mastered).toBe(false);
  });

  it("waits for the 8-of-10 count even once the Estimate is already high", () => {
    const eightOfTen = runSession(partnersOnly, newProfile(), "seed-m", scripted("rrffffffff"));
    expect(eightOfTen.profile.skills["partners-to-10"].mastered).toBe(true);

    const sixOfEight = runSession({ ...partnersOnly, length: 8 }, newProfile(), "seed-m", scripted("rrffffff"));
    expect(sixOfEight.profile.skills["partners-to-10"].estimate).toBeGreaterThanOrEqual(0.95);
    expect(sixOfEight.profile.skills["partners-to-10"].mastered).toBe(false);
  });

  it("stays Mastered: a later Session does not report it again or take it away", () => {
    const first = runSession(partnersOnly, newProfile(), "seed-m", alwaysFirstTry);
    const second = runSession(partnersOnly, first.profile, "seed-m", alwaysRevealed);
    expect(second.profile.skills["partners-to-10"].mastered).toBe(true);
    expect(second.newlyMastered).toEqual([]);
  });
});

describe("an abandoned Session", () => {
  it("logs the Problem being presented as unresolved and does not count as completed", () => {
    let state = startSession(DIAGNOSTIC_PLAN, newProfile(), "seed-a");
    state = answerProblem(state, currentProblem(state)!.answer, 2500);
    state = answerProblem(state, -1, 4000);
    const result = finishSession(abandonSession(state));

    expect(result.log.entries.map((e) => e.assistance)).toEqual(["first-try-correct", "unresolved"]);
    expect(result.log.entries[1].attempts).toHaveLength(1);
    expect(result.profile.sessionsCompleted).toBe(0);
  });

  it("never lets a later Session reuse the IDs of Problems it left unpresented", () => {
    const abandoned = finishSession(abandonSession(startSession(DIAGNOSTIC_PLAN, newProfile(), "seed-a")));
    const next = runSession(DIAGNOSTIC_PLAN, abandoned.profile, "seed-a", alwaysFirstTry);
    expect(abandoned.log.entries).toHaveLength(1);
    expect(next.log.entries.map((e) => e.problem.id)).not.toContain("p1");
    expect(next.log.entries.map((e) => e.problem.id)).not.toContain("p8");
  });
});

describe("a completed Session", () => {
  it("advances the Session number so the next Log is numbered after it", () => {
    const first = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-n", alwaysFirstTry);
    const second = runSession(DIAGNOSTIC_PLAN, first.profile, "seed-n", alwaysFirstTry);
    expect(first.log.sessionNumber).toBe(1);
    expect(second.log.sessionNumber).toBe(2);
  });

  it("runs hundreds of Sessions in well under a second", () => {
    let profile = newProfile();
    const started = performance.now();
    for (let i = 0; i < 300; i++) {
      profile = runSession(DIAGNOSTIC_PLAN, profile, `perf-${i}`, alwaysHintAssisted).profile;
    }
    expect(performance.now() - started).toBeLessThan(1000);
    expect(profile.sessionsCompleted).toBe(300);
  });
});
