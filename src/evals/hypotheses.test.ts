import { describe, expect, it } from "vitest";
import { DIAGNOSTIC_PLAN, newProfile, runSession, scripted } from "@/loop";
import type { Hypothesis, LogEntry, ProblemId } from "@/loop";
import type { CoachInput } from "@/generation";
import { fakeGeneration } from "@/generation";
import { getSimulatedLearner } from "@/evals/learners";
import { checkEvidence, claimPolarity, namesWeakness, scoreHypotheses } from "@/evals/hypotheses";
import { coachPlanner, runLearner } from "@/evals/run";

describe("namesWeakness", () => {
  it("is true when the claim says the pattern in its own words, not when it only names the Skill", () => {
    expect(namesWeakness("crossing-ten", "May struggle when addition crosses ten")).toBe(true);
    expect(namesWeakness("crossing-ten", "Misses sums that bridge 10 (8 + 5, 9 + 7)")).toBe(true);
    expect(namesWeakness("crossing-ten", "May need more practice with Make-a-ten within 20")).toBe(false);
    expect(namesWeakness("crossing-ten", "Partners to 10 are solid")).toBe(false);
    expect(namesWeakness("crossing-ten", "Teen numbers above 10 are shaky")).toBe(false);
    expect(namesWeakness("crossing-ten", "Sums that go over ten are missed on the first try")).toBe(true);

    expect(namesWeakness("change-unknown", "Misses missing-addend Problems but not plain subtraction")).toBe(true);
    expect(namesWeakness("change-unknown", "Finds the change unknown hard: 9 + ? = 13")).toBe(true);
    expect(namesWeakness("change-unknown", "May need more practice with Subtraction as unknown addend")).toBe(false);
  });
});

describe("claimPolarity", () => {
  it("reads a negated difficulty word as a strength, and a difficulty beside one as a difficulty", () => {
    expect(claimPolarity("Solves teen numbers with no hints")).toBe("strength");
    expect(claimPolarity("Never needs a Hint on partners to 10")).toBe("strength");
    expect(claimPolarity("Misses make-a-ten but no hints needed on partners")).toBe("difficulty");
    expect(claimPolarity("Not yet secure on counting on")).toBe("difficulty");
  });
});

describe("checkEvidence", () => {
  /** A Diagnostic Session with p3 Hint-assisted, p4 Revealed, and p8 Hint-assisted; the rest first-try correct. */
  const { log } = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-e", scripted("ffhrfffhf"));
  const entries = new Map<ProblemId, LogEntry>(log.entries.map((entry) => [entry.problem.id, entry]));
  const hypothesis = (overrides: Partial<Hypothesis>): Hypothesis => ({
    id: "h1",
    claim: "Misses partners to 10 on the first try",
    status: "supported",
    confidence: 0.6,
    evidence: ["p3", "p4"],
    nextTest: "Three more partners Problems",
    ...overrides,
  });

  it("accepts a difficulty claim citing Problems that were not first-try correct", () => {
    expect(checkEvidence([hypothesis({})], entries)).toEqual([
      { hypothesis: "h1", problem: "p3", verdict: "consistent" },
      { hypothesis: "h1", problem: "p4", verdict: "consistent" },
    ]);
  });

  it("flags a citation whose ID is not in the Log and one whose Assistance State contradicts the claim", () => {
    const checks = checkEvidence([hypothesis({ evidence: ["p3", "p99", "p1"] })], entries);
    expect(checks.map((c) => c.verdict)).toEqual(["consistent", "unknown-id", "inconsistent"]);
  });

  it("expects first-try correct Problems behind a strength claim and behind a refuted difficulty claim either state", () => {
    const strength = hypothesis({ id: "h2", claim: "Teen numbers are solid on the first try", evidence: ["p1", "p3"] });
    const refuted = hypothesis({ id: "h3", status: "refuted", evidence: ["p3", "p1"] });
    expect(checkEvidence([strength, refuted], entries).map((c) => c.verdict)).toEqual([
      "consistent",
      "inconsistent",
      "consistent",
      "consistent",
    ]);
  });

  it("checks only that the ID exists when the claim is neither a difficulty nor a strength", () => {
    const neutral = hypothesis({ claim: "Answers teen numbers faster than partners", evidence: ["p1", "p3"] });
    expect(checkEvidence([neutral], entries).map((c) => c.verdict)).toEqual(["consistent", "consistent"]);
  });
});

describe("scoreHypotheses", () => {
  const learner = getSimulatedLearner("crossing-ten-weakness");
  const missesSoFar = (input: CoachInput, id: string): ProblemId[] => [
    ...new Set([
      ...(input.notes.hypotheses.find((h) => h.id === id)?.evidence ?? []),
      ...input.evidence.filter((e) => e.assistance !== "first-try-correct").map((e) => e.id),
    ]),
  ];
  const supportedOnce = (evidence: readonly ProblemId[], from: number, session: number): Hypothesis["status"] =>
    session >= from && evidence.length > 0 ? "supported" : "proposed";

  /**
   * A scripted Coach: from Session 3 it supports a Hypothesis that names
   * crossing ten, and from Session 2 one that names missing addends (a
   * weakness this Learner does not have), both citing every miss so far.
   */
  const scriptedCoach = fakeGeneration({
    async runCoach(input) {
      const { plan } = await fakeGeneration().runCoach(input);
      const crossing = missesSoFar(input, "h-crossing");
      const change = missesSoFar(input, "h-change");
      const hypotheses: Hypothesis[] = [
        {
          id: "h-crossing",
          claim: "Misses sums when the addition crosses ten",
          status: supportedOnce(crossing, 3, input.sessionNumber),
          confidence: 0.7,
          evidence: crossing,
          nextTest: "More sums that cross ten",
        },
        {
          id: "h-change",
          claim: "Misses missing-addend Problems",
          status: supportedOnce(change, 2, input.sessionNumber),
          confidence: 0.5,
          evidence: change,
          nextTest: "More missing-addend Problems",
        },
      ];
      return { notes: { hypotheses, strengths: [] }, plan: { ...plan, hypothesisUnderTest: null } };
    },
  });

  it("counts a planted weakness as detected in the Session a supported Hypothesis first names it", async () => {
    const score = scoreHypotheses(await runLearner(learner, coachPlanner(scriptedCoach), 5));

    expect(score.planted).toEqual(["crossing-ten"]);
    expect(score.sessionsToDetection).toEqual({ "crossing-ten": 3 });
    expect(score.detected).toBe(1);
  });

  it("counts a supported Hypothesis naming a weakness the Learner does not have as a false positive", async () => {
    const score = scoreHypotheses(await runLearner(learner, coachPlanner(scriptedCoach), 5));

    expect(score.supportedHypotheses).toBe(2);
    expect(score.falsePositives).toBe(1);
    expect(score.falsePositiveRate).toBe(0.5);
  });

  it("scores Evidence Integrity over every citation in every Session's Notes, and tallies where each Plan came from", async () => {
    const score = scoreHypotheses(await runLearner(learner, coachPlanner(fakeGeneration()), 5));

    expect(score.evidence.citations).toBeGreaterThan(0);
    expect(score.evidence).toMatchObject({ unknownIds: 0, inconsistent: 0, integrity: 1 });
    expect(score.sources).toEqual({ coach: 5, retry: 0, baseline: 0 });
    expect(score.finalNotes.hypotheses.length).toBeGreaterThan(0);
  });

  it("counts an invented Problem ID in a rejected Coach output, even though the engine refused it", async () => {
    let calls = 0;
    const inventingOnce = fakeGeneration({
      async runCoach(input) {
        const output = await fakeGeneration().runCoach(input);
        if (calls++ > 0) return output;
        const [first, ...rest] = output.notes.hypotheses;
        return { ...output, notes: { ...output.notes, hypotheses: [{ ...first, evidence: ["p99"] }, ...rest] } };
      },
    });

    const score = scoreHypotheses(await runLearner(learner, coachPlanner(inventingOnce), 1));

    expect(score.sources).toEqual({ coach: 0, retry: 1, baseline: 0 });
    expect(score.evidence.unknownIds).toBe(1);
    expect(score.evidence.integrity).toBeLessThan(1);
  });
});
