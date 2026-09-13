import { describe, expect, it } from "vitest";
import { DIAGNOSTIC_PLAN, emptyNotes, newProfile, runSession, scripted } from "@/loop";
import { fakeGeneration } from "@/generation/fake";
import type { SummaryOutput } from "@/generation/types";
import { summaryInput } from "./summary";
import { templateSummary } from "./template";
import { SUMMARY_ATTEMPTS, writeValidSummary } from "./write";

const input = summaryInput(runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-s", scripted("ffhrfffhf")), emptyNotes(), []);

/** A Summary writer that answers each call from the list in turn. */
function writerAnswering(...outputs: SummaryOutput[]) {
  let calls = 0;
  return { writeSummary: async () => outputs[calls++] };
}

const good: SummaryOutput = {
  practiced: "Your child answered 9 Problems across three strategies, with 1 Revealed and 1 correct after a Hint.",
  activity: "Count ten pebbles together and hide a few for your child to find.",
};

describe("writeValidSummary", () => {
  it("keeps the model's Summary when the validator accepts it", async () => {
    const written = await writeValidSummary(writerAnswering(good), input);

    expect(written).toEqual({ ...good, source: "summary", rejections: [] });
  });

  it("asks again when the Summary claims something the Log does not support, and keeps the second", async () => {
    const wrong: SummaryOutput = { ...good, practiced: "Your child answered 12 Problems and understands partners to 10." };
    const written = await writeValidSummary(writerAnswering(wrong, good), input);

    expect(written.source).toBe("summary");
    expect(written.practiced).toBe(good.practiced);
    expect(written.rejections).toHaveLength(1);
    expect(written.rejections[0]).toMatchObject({ attempt: 1, output: wrong });
    expect(written.rejections[0].reasons.join("; ")).toContain("12");
  });

  it("falls back to the template Summary when every attempt is rejected, and keeps every reason", async () => {
    const mindReading: SummaryOutput = { ...good, practiced: "Your child understands partners to 10 now." };
    const written = await writeValidSummary(writerAnswering(mindReading, mindReading), input);

    expect(written).toMatchObject({ ...templateSummary(input), source: "template" });
    expect(written.rejections).toHaveLength(SUMMARY_ATTEMPTS);
  });

  it("treats a thrown call as a rejection with its message, so no key on the server ends in the template", async () => {
    const writer = {
      writeSummary: async () => {
        throw new Error("ANTHROPIC_API_KEY is not set");
      },
    };
    const written = await writeValidSummary(writer, input);

    expect(written.source).toBe("template");
    expect(written.rejections.map((r) => r.reasons)).toEqual([["ANTHROPIC_API_KEY is not set"], ["ANTHROPIC_API_KEY is not set"]]);
    expect(written.rejections.every((r) => r.output === undefined)).toBe(true);
  });

  it("accepts the Generation fake, so every test and the eval command run on it", async () => {
    const written = await writeValidSummary(fakeGeneration(), input);

    expect(written.source).toBe("summary");
    expect(written.practiced).not.toBe("");
  });
});
