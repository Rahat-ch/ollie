import { describe, expect, it } from "vitest";
import type { StoryInput } from "@/generation/types";
import { NICKNAME_PLACEHOLDER } from "./nickname";
import { describeProblem, STORY_SYSTEM_PROMPT, storyUserMessage } from "./prompt";

const addTo: StoryInput = {
  skill: "result-unknown",
  structure: "add-to",
  equation: { left: 7, op: "+", right: 5, result: 12, unknown: "result" },
  answer: 12,
  theme: "puppies",
  nickname: NICKNAME_PLACEHOLDER,
};
const change: StoryInput = {
  ...addTo,
  skill: "change-unknown",
  structure: "take-from-change",
  equation: { left: 12, op: "-", right: 5, result: 7, unknown: "right" },
  answer: 5,
};

describe("the Story prompt", () => {
  it("states the rules the validator enforces", () => {
    expect(STORY_SYSTEM_PROMPT).toMatch(/two sentences/i);
    expect(STORY_SYSTEM_PROMPT).toMatch(/fewer than 25 words/i);
    expect(STORY_SYSTEM_PROMPT).toMatch(/digits/i);
    expect(STORY_SYSTEM_PROMPT).toMatch(/never/i);
  });

  it("describes each structure as what happens to the things, with the numbers the Learner is told and never the answer", () => {
    expect(describeProblem(addTo)).toBe("There are 7 at the start. Then 5 more come. Ask how many there are now.");
    expect(describeProblem({ ...addTo, structure: "take-from", equation: { left: 12, op: "-", right: 5, result: 7, unknown: "result" }, answer: 7 })).toBe(
      "There are 12 at the start. Then 5 go away. Ask how many are left.",
    );
    expect(describeProblem({ ...addTo, structure: "put-together" })).toBe("There are 7 of one kind and 5 of another kind. Ask how many there are altogether.");
    expect(describeProblem({ ...change, structure: "add-to-change", equation: { left: 7, op: "+", right: 5, result: 12, unknown: "right" } })).toBe(
      "There are 7 at the start. Some more come, and now there are 12. Ask how many came. Never say how many came.",
    );
    expect(describeProblem(change)).toBe("There are 12 at the start. Some go away, and now there are 7. Ask how many went away. Never say how many went away.");
  });

  it("gives the Theme's words, the Nickname to use verbatim, and the Problem, and no other number", () => {
    const message = storyUserMessage(change);
    expect(message).toContain("puppies");
    expect(message).toContain("bones");
    expect(message).toContain(NICKNAME_PLACEHOLDER);
    expect(message).toContain("There are 12 at the start.");
    expect(message.match(/\d+/g)).toEqual(["12", "7"]);
  });
});

describe("the rich Story set's brief", () => {
  it("says the Nickname is a placeholder to copy verbatim when the Pool is filled, so the writer does not invent a name", () => {
    const message = storyUserMessage({ ...addTo, nickname: NICKNAME_PLACEHOLDER });
    expect(message).toContain("not known yet");
    expect(message).toContain(`write exactly ${NICKNAME_PLACEHOLDER}`);
    expect(message).toContain("Do not invent a name");
    expect(storyUserMessage({ ...addTo, nickname: "Mia" })).not.toContain("not known yet");
  });

  it("asks for the scene where the Theme happens, under the same rules", () => {
    const message = storyUserMessage({ ...addTo, set: "rich" as const });
    expect(message).toContain("Say where it happens");
    expect(message).toContain("at the park");
    expect(storyUserMessage(addTo)).not.toContain("Say where it happens");
  });
});
