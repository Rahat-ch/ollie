import { describe, expect, it } from "vitest";
import { DIAGNOSTIC_PLAN, emptyNotes, newProfile, runSession, scripted } from "@/loop";
import type { SummaryOutput } from "@/generation/types";
import { summaryInput } from "./summary";
import { templateSummary } from "./template";
import { MAX_ACTIVITY_WORDS, validateSummary } from "./validate";

/** Partners to 10: 1 first-try correct, 1 Hint-assisted, 1 Revealed. Teen numbers: 2 and 1. Counting on: 3. */
const input = summaryInput(runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-s", scripted("ffhrfffhf")), emptyNotes(), []);

const activity = "Tonight, lay out ten spoons and ask your child to split them into two groups, then say the pair out loud together.";

const summary = (practiced: string): SummaryOutput => ({ practiced, activity });

describe("validateSummary", () => {
  it("accepts a Summary whose numbers are the engine's and which claims nothing about thinking", () => {
    const verdict = validateSummary(
      summary(
        "Your child worked through 9 Problems across three strategies. Partners to 10: 1 first-try correct, 1 correct after a Hint, and 1 Revealed. Counting on was 3 for 3 on the first try.",
      ),
      input,
    );

    expect(verdict).toEqual({ ok: true });
  });

  it("accepts the template Summary, which is what a Parent reads when every attempt fails", () => {
    expect(validateSummary(templateSummary(input), input)).toEqual({ ok: true });
  });

  it("rejects a number the Session Log does not support", () => {
    const verdict = validateSummary(summary("Your child answered 12 Problems and got 7 right on the first try."), input);

    expect(verdict.ok).toBe(false);
    expect(!verdict.ok && verdict.reasons.join("; ")).toContain("12");
  });

  it("rejects a claim about how the Learner was thinking", () => {
    const verdict = validateSummary(
      summary("Your child worked through 9 Problems and now understands that partners to 10 always make a whole ten."),
      input,
    );

    expect(verdict.ok).toBe(false);
    expect(!verdict.ok && verdict.reasons.join("; ")).toContain("understands");
  });

  it("rejects a claim about thinking in the activity, where the numbers are free", () => {
    const guess = { practiced: "Your child answered 9 Problems.", activity: "Ask three questions at bedtime and see what she is thinking." };
    const verdict = validateSummary(guess, input);

    expect(verdict.ok).toBe(false);
    expect(!verdict.ok && verdict.reasons.join("; ")).toContain("thinking");
  });

  it("rejects an empty part and an activity too long to do in five minutes", () => {
    const long = Array.from({ length: MAX_ACTIVITY_WORDS + 1 }, () => "count").join(" ");

    expect(validateSummary({ practiced: "  ", activity }, input).ok).toBe(false);
    expect(validateSummary({ practiced: "Your child answered 9 Problems.", activity: long }, input).ok).toBe(false);
  });
});
