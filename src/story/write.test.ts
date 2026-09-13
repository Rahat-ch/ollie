import { describe, expect, it } from "vitest";
import type { StoryInput } from "@/generation/types";
import { templateStory } from "./template";
import { STORY_ATTEMPTS, writeValidStory } from "./write";

const input: StoryInput = {
  skill: "result-unknown",
  structure: "add-to",
  equation: { left: 7, op: "+", right: 5, result: 12, unknown: "result" },
  answer: 12,
  theme: "puppies",
  nickname: "Mia",
};

const good = "Mia has 7 puppies in the yard. 5 more puppies run in, so how many puppies are there now?";
const altered = "Mia has 7 puppies in the yard. 6 more puppies run in, so how many puppies are there now?";

/** A writer that answers from a script, one text per call, and counts its calls. */
function scripted(texts: readonly (string | Error)[]) {
  let calls = 0;
  return {
    calls: () => calls,
    writeStory: async () => {
      const next = texts[Math.min(calls, texts.length - 1)];
      calls += 1;
      if (next instanceof Error) throw next;
      return { text: next };
    },
  };
}

describe("writeValidStory", () => {
  it("keeps a valid Story from the first call", async () => {
    const writer = scripted([good]);
    expect(await writeValidStory(writer, input)).toEqual({ text: good, source: "story", rejections: [] });
    expect(writer.calls()).toBe(1);
  });

  it("retries a rejected Story with the reasons and keeps the valid retry", async () => {
    const writer = scripted([altered, good]);
    const story = await writeValidStory(writer, input);
    expect(story.text).toBe(good);
    expect(story.source).toBe("story");
    expect(story.rejections).toEqual([{ attempt: 1, text: altered, reasons: ["the numbers are 6, 7 instead of 5, 7"] }]);
  });

  it("uses the template sentence after the bounded attempts all fail, recording each", async () => {
    const writer = scripted([altered]);
    const story = await writeValidStory(writer, input);
    expect(story).toMatchObject({ text: templateStory(input), source: "template" });
    expect(story.rejections.map((r) => r.attempt)).toEqual([1, 2, 3]);
    expect(writer.calls()).toBe(STORY_ATTEMPTS);
  });

  it("treats a thrown call as a rejection with the message and still ends on the template", async () => {
    const writer = scripted([new Error("ANTHROPIC_API_KEY is not set")]);
    const story = await writeValidStory(writer, input);
    expect(story.source).toBe("template");
    expect(story.rejections[0]).toEqual({ attempt: 1, reasons: ["ANTHROPIC_API_KEY is not set"] });
  });
});
