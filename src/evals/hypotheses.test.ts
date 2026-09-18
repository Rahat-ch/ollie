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

  /** The Coach says the crossing in its own words, with a word or two in the way. */
  it("allows up to two words between the crossing and the ten, and still refuses the Skill name", () => {
    expect(namesWeakness("crossing-ten", "the items with the smallest crossing of ten (sum 11)")).toBe(true);
    expect(namesWeakness("crossing-ten", "subtract items whose answer requires crossing back over ten")).toBe(true);
    expect(namesWeakness("crossing-ten", "The Learner counts on until it crosses the ten")).toBe(true);
    expect(namesWeakness("crossing-ten", "Sums that go a little past the ten are missed")).toBe(true);
    expect(namesWeakness("crossing-ten", "Make-a-ten is the one unsettled Skill")).toBe(false);
  });
});

describe("claimPolarity", () => {
  it("reads a negated difficulty word as a strength, and a one-sided claim as its one side", () => {
    expect(claimPolarity("Solves teen numbers with no hints")).toBe("strength");
    expect(claimPolarity("Never needs a Hint on partners to 10")).toBe("strength");
    expect(claimPolarity("Not yet secure on counting on")).toBe("difficulty");
    expect(claimPolarity("Answers teen numbers faster than partners")).toBe("neutral");
  });

  it("reads a claim that says both things, or draws a contrast, as contrastive", () => {
    expect(claimPolarity("Misses make-a-ten but no hints needed on partners")).toBe("contrastive");
    expect(claimPolarity("Composing a teen number is not yet reliable, after a first-try correct compose item")).toBe("contrastive");
    expect(claimPolarity("Answers on the first try when the smaller addend is written first, but needed a Hint on 9 + 3")).toBe("contrastive");
    expect(claimPolarity("Solid on partners to 10, although the teens took a Hint")).toBe("contrastive");
  });

  it("reads the help the Coach names as a difficulty, and a named Problem form as neither side", () => {
    expect(claimPolarity("Items whose sum is 11 have drawn help every time they have appeared")).toBe("difficulty");
    expect(claimPolarity("Partners to 10 are answered with no help at all")).toBe("strength");
    expect(claimPolarity("Change-unknown in add-to-change form (a missing change added on to reach a total) is as secure at high wholes")).toBe("strength");
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

  /**
   * The three Hypotheses a live two-Session smoke run wrote (Opus 5 Coach,
   * 2026-09-17), on the Assistance States this Log has. Every citation in
   * them is right, and the polarity check used to call the first-try ones
   * inconsistent because the claim also said "Hint" or "not yet".
   */
  it("accepts a contrastive claim whose citations show one outcome of each kind", () => {
    const countingOn = hypothesis({
      claim:
        "On counting-on, the Learner answers on the first try when the smaller addend is written first, but needed a Hint on the one item where the larger addend came first (9 + 3).",
      status: "proposed",
      confidence: 0.35,
      evidence: ["p1", "p2", "p3"],
    });
    const composing = hypothesis({
      id: "h4",
      claim:
        "Composing a teen number (10 + 5 = ?) is not yet reliable: after a first-try correct compose item last Session, this Session's single compose item ended in a Reveal.",
      status: "proposed",
      confidence: 0.45,
      evidence: ["p1", "p4"],
    });

    const verdicts = checkEvidence([countingOn, composing], entries).map((c) => c.verdict);

    expect(verdicts).toEqual(["consistent", "consistent", "consistent", "consistent", "consistent"]);
  });

  it("accepts a strength claim whose structural words read as difficulty, citing first-try correct Problems", () => {
    const partners = hypothesis({
      id: "h2",
      claim: "Partners to 10 is reliable in the missing-partner form as well as the take-from-ten form",
      confidence: 0.9,
      evidence: ["p1", "p2", "p5", "p6", "p7", "p9"],
    });

    expect(checkEvidence([partners], entries).every((c) => c.verdict === "consistent")).toBe(true);
  });

  it("still flags a one-sided difficulty claim, and a contrast whose citations show one kind only", () => {
    const struggles = hypothesis({ id: "h5", claim: "Struggles with partners to 10", evidence: ["p1", "p2"] });
    const contrast = hypothesis({ id: "h6", claim: "Needed a Hint on counting on, but the numbers were small", evidence: ["p1", "p2"] });

    expect(checkEvidence([struggles, contrast], entries).map((c) => c.verdict)).toEqual([
      "inconsistent",
      "inconsistent",
      "inconsistent",
      "inconsistent",
    ]);
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
    expect(score.evidence).toMatchObject({ unknownIds: 0, inconsistent: 0, integrity: 1, claimAgreement: 1 });
    expect(score.evidence.existing).toBe(score.evidence.citations);
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
    // The invented ID is a fabrication, not a disagreement: it is not in the agreement's denominator at all.
    expect(score.evidence.existing).toBe(score.evidence.citations - 1);
    expect(score.evidence.claimAgreement).toBe(1);
  });

  it("keeps the Notes the engine accepted after every Session, so a stored report can be scored again", async () => {
    const run = await runLearner(learner, coachPlanner(fakeGeneration()), 3);
    const score = scoreHypotheses(run);

    expect(score.notesBySession).toHaveLength(3);
    expect(score.notesBySession[2]).toEqual(score.finalNotes);
  });
});

/**
 * The claims here are the real ones from the first live Eval Run
 * (`docs/evals/2026-09-18T13-49-20Z.json`, Opus 5 Coach, 20 Sessions), which
 * the phrase list alone read wrongly: the Strong child's Hypotheses were
 * counted as false positives for saying a Skill's name in a claim about what
 * it can do, and the crossing-ten child's own words for the pattern were
 * never matched at all.
 */
describe("scoreHypotheses, the polarity gate", () => {
  /** A Coach that supports the given claims every Session, citing the Problems it was shown. */
  const claimingCoach = (claims: readonly string[]) =>
    fakeGeneration({
      async runCoach(input) {
        const { plan } = await fakeGeneration().runCoach(input);
        const evidence = input.evidence.map((e) => e.id);
        const hypotheses: Hypothesis[] = claims.map((claim, index) => ({
          id: `h${index + 1}`,
          claim,
          status: "supported",
          confidence: 0.6,
          evidence,
          nextTest: "More Problems of the same kind",
        }));
        return { notes: { hypotheses, strengths: [] }, plan: { ...plan, hypothesisUnderTest: null } };
      },
    });

  const score = async (id: Parameters<typeof getSimulatedLearner>[0], claims: readonly string[]) =>
    scoreHypotheses(await runLearner(getSimulatedLearner(id), coachPlanner(claimingCoach(claims)), 2));

  const STRONG = [
    "The Learner's fluency with equations carries over to the new Unit 3 Skills: result-unknown (add-to, take-from, put-together) and change-unknown (add-to-change, take-from-change).",
    "Change-unknown holds when the change itself is large (6 to 9) and the whole is in the teens, not only when the change is small.",
    "Change-unknown in add-to-change form (a missing change added on to reach a total) is as secure at high wholes as take-from-change, which has carried the recent clean evidence.",
    "The two pieces make-a-ten depends on — completing a partner to 10 and naming 10 + n as a teen number — combine successfully on single problems that cross ten.",
  ];

  it("counts no false positive for a strength or neutral claim that only mentions the Skill", async () => {
    const strong = await score("strong", STRONG);

    expect(strong.supportedHypotheses).toBe(4);
    expect(strong.falsePositives).toBe(0);
    expect(strong.falsePositiveRate).toBe(0);
  });

  it("names crossing ten from a contrastive claim and from a difficulty claim in the Coach's own words", async () => {
    const contrastive = await score("crossing-ten-weakness", [
      "On make-a-ten, the items that needed help were the ones with the smallest crossing of ten (larger addend 6, sum 11, in both orders), while larger addends of 7, 8 and 9 were first-try correct.",
    ]);
    const difficulty = await score("crossing-ten-weakness", [
      "On unknown-addend, subtract items whose answer requires crossing back over ten draw help.",
    ]);

    expect(contrastive.sessionsToDetection).toEqual({ "crossing-ten": 1 });
    expect(difficulty.sessionsToDetection).toEqual({ "crossing-ten": 1 });
  });

  it("names nothing when a supported claim only names the Skill", async () => {
    const skillOnly = await score("crossing-ten-weakness", [
      "Make-a-ten is the one unsettled Skill, and first-try success on it is intermittent rather than sorted by structure or by the size of the larger addend.",
    ]);

    expect(skillOnly.sessionsToDetection).toEqual({ "crossing-ten": null });
    expect(skillOnly.detected).toBe(0);
  });

  it("names change unknown from the difficulty claims of the child with that weakness", async () => {
    const changeUnknown = await score("change-unknown-weakness", [
      "The support needed on change-unknown is not explained by the size of the numbers: small and large wholes both show clean first tries and both show misses.",
      "Change-unknown misses are intermittent rather than tied to the structure, the size of the whole, or the size of the change.",
    ]);

    expect(changeUnknown.sessionsToDetection).toEqual({ "change-unknown": 1 });
    expect(changeUnknown.falsePositives).toBe(0);
  });
});
