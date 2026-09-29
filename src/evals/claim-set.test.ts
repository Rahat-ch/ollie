import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Hypothesis, LearnerNotes } from "@/loop";
import { CLAIM_SET_REPORTS, CLAIM_SET_SEED, CLAIM_SET_SIZE, diagnosticEntries, drawClaimSet, readerPolarity, type ClaimSet, type ClaimSource } from "./claim-set";
import { claimPolarity } from "./hypotheses";
import { SIMULATED_LEARNERS } from "./learners";
import { LABELS_DIR, POLARITIES } from "./labels";

const hypothesis = (id: string, claim: string, evidence: string[], status: Hypothesis["status"] = "proposed"): Hypothesis => ({
  id,
  claim,
  status,
  confidence: 0.5,
  evidence,
  nextTest: "Keep watching.",
});

const notes = (...hypotheses: Hypothesis[]): LearnerNotes => ({ hypotheses, strengths: [] });

/** A report with the fields the draw reads: each Learner's Notes and its first Session's first-try rate. */
function source(file: string, notesBySession: readonly LearnerNotes[], learner = SIMULATED_LEARNERS[0]): ClaimSource {
  const diagnostic = [...diagnosticEntries().get(learner.id)!.values()];
  const firstTryRate = diagnostic.filter((e) => e.assistance === "first-try-correct").length / diagnostic.length;
  return {
    file,
    report: {
      hypotheses: { learners: [{ id: learner.id, notesBySession }] },
      convergence: { coach: { learners: [{ id: learner.id, perSession: [{ firstTryRate }] }] } },
    },
  };
}

const CLAIMS = [
  "Misses make-a-ten items when the sum crosses ten.",
  "Counting on is solid, with no Hints.",
  "First try when the smaller addend comes first, but a Hint when the larger does.",
  "Answers faster late in the Session.",
  "Needs a Hint on missing addend Problems.",
  "Teen numbers are secure on first attempts.",
  "Misses doubles but gets near-doubles on the first try.",
  "Plan more review next time.",
];

describe("drawClaimSet", () => {
  const sessions = [notes(hypothesis("h1", CLAIMS[0], ["p1", "p2"])), notes(...CLAIMS.map((claim, i) => hypothesis(`h${i + 1}`, claim, ["p2", "p40"])))];

  it("takes each distinct claim once, from the last Session it was written in, with that Session's citations", () => {
    const set = drawClaimSet([source("run.json", sessions)], { seed: "s", size: 8 });
    expect(set.items).toHaveLength(8);
    expect(new Set(set.items.map((item) => item.claim)).size).toBe(8);
    const crossing = set.items.find((item) => item.claim === CLAIMS[0])!;
    expect(crossing).toMatchObject({ report: "run.json", session: 2, hypothesis: "h1" });
    expect(crossing.evidence.map((e) => e.problem)).toEqual(["p2", "p40"]);
  });

  it("gives a cited Problem's Assistance State where the report lets it be replayed, and says so where it does not", () => {
    const set = drawClaimSet([source("run.json", sessions)], { seed: "s", size: 8 });
    const [known, unknown] = set.items[0].evidence;
    const replayed = diagnosticEntries().get(SIMULATED_LEARNERS[0].id)!.get("p2")!;
    expect(known).toEqual({
      problem: "p2",
      recorded: true,
      session: 1,
      skill: replayed.problem.skill,
      structure: replayed.problem.structure,
      equation: expect.stringContaining("="),
      answer: replayed.problem.answer,
      assistance: replayed.assistance,
    });
    expect(unknown).toEqual({ problem: "p40", recorded: false });
  });

  it("draws every Polarity the claim reader knows, in equal shares when the population allows", () => {
    const set = drawClaimSet([source("run.json", sessions)], { seed: "s", size: 8 });
    const counts = POLARITIES.map((p) => set.items.filter((item) => readerPolarity(item.claim) === p).length);
    expect(counts).toEqual([2, 2, 2, 2]);
  });

  it("is the same set for the same seed and a different one for another seed, numbered in its shuffled order", () => {
    const a = drawClaimSet([source("run.json", sessions)], { seed: "s", size: 4 });
    expect(drawClaimSet([source("run.json", sessions)], { seed: "s", size: 4 })).toEqual(a);
    expect(a.items.map((item) => item.id)).toEqual(["k001", "k002", "k003", "k004"]);
    const orders = new Set(["s", "t", "u", "v"].map((seed) => drawClaimSet([source("run.json", sessions)], { seed, size: 4 }).items.map((i) => i.claim).join("|")));
    expect(orders.size).toBeGreaterThan(1);
  });

  it("refuses a report whose Diagnostic Session no longer replays: the Simulated Learners have changed since it ran", () => {
    const stale = source("run.json", sessions);
    const report = { ...stale.report, convergence: { coach: { learners: [{ id: SIMULATED_LEARNERS[0].id, perSession: [{ firstTryRate: 0.123 }] }] } } };
    expect(() => drawClaimSet([{ file: "run.json", report }], { seed: "s", size: 4 })).toThrow(/replay/);
  });
});

describe("the committed claim set", () => {
  const committed = JSON.parse(readFileSync(path.join(LABELS_DIR, "claims.json"), "utf8")) as ClaimSet;

  it("is about 100 claims from the three live Opus reports, every Polarity among them", () => {
    expect(committed.seed).toBe(CLAIM_SET_SEED);
    expect(committed.items).toHaveLength(CLAIM_SET_SIZE);
    expect(committed.drawnFrom).toEqual([...CLAIM_SET_REPORTS]);
    const kinds = new Set(committed.items.map((item) => claimPolarity(item.claim)));
    expect([...kinds].sort()).toEqual(["contrastive", "difficulty", "neutral", "strength"]);
  });

  it("is exactly what the seeded draw gives from those reports, so anyone can draw it again", () => {
    const sources = CLAIM_SET_REPORTS.map((file) => ({ file, report: JSON.parse(readFileSync(path.join("docs/evals", file), "utf8")) as ClaimSource["report"] }));
    expect(drawClaimSet(sources, { seed: CLAIM_SET_SEED, size: CLAIM_SET_SIZE })).toEqual(committed);
  });
});
