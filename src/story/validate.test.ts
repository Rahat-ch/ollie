import { describe, expect, it } from "vitest";
import type { StoryInput } from "@/generation/types";
import { NICKNAME_PLACEHOLDER } from "./nickname";
import { MAX_STORY_WORDS, validateStory } from "./validate";

const addTo: StoryInput = {
  skill: "result-unknown",
  structure: "add-to",
  equation: { left: 7, op: "+", right: 5, result: 12, unknown: "result" },
  answer: 12,
  theme: "puppies",
  nickname: "Mia",
};
const takeFrom: StoryInput = {
  ...addTo,
  structure: "take-from",
  equation: { left: 12, op: "-", right: 5, result: 7, unknown: "result" },
  answer: 7,
};
const change: StoryInput = {
  ...addTo,
  skill: "change-unknown",
  structure: "add-to-change",
  equation: { left: 7, op: "+", right: 5, result: 12, unknown: "right" },
  answer: 5,
};

const reasons = (text: string, input: StoryInput = addTo): readonly string[] => {
  const verdict = validateStory(text, input);
  return verdict.ok ? [] : verdict.reasons;
};

describe("validateStory accepts each hand-written good Story", () => {
  it.each([
    ["two sentences, the numbers as given, puppies words only", "Mia has 7 puppies in the yard. 5 more puppies run in, so how many puppies are there now?", addTo],
    ["a take-from Story with the whole and the part", "Mia sees 12 puppies in the park. 5 puppies go home, so how many puppies are still in the park?", takeFrom],
    ["a change-unknown Story that gives the start and the end and never the change", "Mia had 7 bones by her bed. Now she has 12 bones, so how many bones did the puppies bring?", change],
    ["the Nickname as a possessive", "Mia's puppies find 7 balls. Then they find 5 more balls, so how many balls do they have?", addTo],
    ["a two-word Nickname counted as one word", "Mia Rose has 7 puppies. 5 more puppies come, so how many puppies are there now?", { ...addTo, nickname: "Mia Rose" }],
    ["the Nickname placeholder as the Nickname, the way the Pool stores a Story", `${NICKNAME_PLACEHOLDER} has 7 puppies. 5 more puppies come, so how many puppies are there now?`, { ...addTo, nickname: NICKNAME_PLACEHOLDER }],
    ["exactly 24 words", "Mia and the puppies play in the big park all day. 7 puppies dig and 5 more puppies come, so how many puppies now?", addTo],
    ["an exclamation as the first sentence", "Mia has 7 puppies! 5 more puppies come to play, so how many puppies are there now?", addTo],
  ])("%s", (_, text, input) => {
    expect(validateStory(text, input)).toEqual({ ok: true });
  });
});

describe("validateStory rejects each hand-written bad Story", () => {
  it("with no Nickname", () => {
    expect(reasons("The puppies have 7 bones. They find 5 more bones, so how many bones now?")).toEqual(["the Nickname Mia is missing"]);
  });

  it("with three sentences, or one", () => {
    expect(reasons("Mia has 7 puppies. 5 more come. How many puppies now?")).toEqual(["3 sentences instead of 2"]);
    expect(reasons("Mia has 7 puppies and 5 more come, so how many puppies are there now?")).toEqual(["1 sentence instead of 2"]);
  });

  it("that does not end with a question", () => {
    expect(reasons("Mia has 7 puppies. 5 more puppies come and now there are many puppies.")).toEqual(["the second sentence is not a question"]);
  });

  it("with too many words", () => {
    const text = "Mia and all the little puppies play in the big park all day. 7 puppies dig and 5 more puppies come, so how many puppies now?";
    expect(reasons(text)).toEqual([`26 words; a Story has fewer than ${MAX_STORY_WORDS}`]);
  });

  it("that alters a number, omits one, or adds one", () => {
    expect(reasons("Mia has 7 puppies. 6 more puppies come, so how many puppies now?")).toEqual(["the numbers are 6, 7 instead of 5, 7"]);
    expect(reasons("Mia has 7 puppies. Some more puppies come, so how many puppies now?")).toEqual(["the numbers are 7 instead of 5, 7"]);
    expect(reasons("Mia has 7 puppies. 5 more come and now she has 12, so how many puppies?")).toEqual(["the numbers are 5, 7, 12 instead of 5, 7"]);
  });

  it("that gives the change in a change-unknown Story", () => {
    expect(reasons("Mia had 7 bones. 5 more bones came and now she has 12, so how many bones came?", change)).toEqual([
      "the numbers are 5, 7, 12 instead of 7, 12",
    ]);
  });

  it("that spells a number as a word", () => {
    expect(reasons("Mia has seven puppies. 5 more puppies come, so how many puppies now?")).toEqual([
      "the numbers are 5 instead of 5, 7",
      "not in the puppies vocabulary: seven",
    ]);
  });

  it("that leaves the Theme vocabulary, even for another Theme's words", () => {
    expect(reasons("Mia has 7 kittens. 5 more kittens come, so how many kittens now?")).toEqual(["not in the puppies vocabulary: kittens"]);
    expect(reasons("Mia has 7 rockets. 5 more rockets zoom in, so how many rockets now?")).toEqual(["not in the puppies vocabulary: rockets, zoom"]);
  });

  it("that is empty", () => {
    expect(reasons("")).toEqual(["the Nickname Mia is missing", "0 sentences instead of 2", "the numbers are none instead of 5, 7"]);
  });
});

describe("the six Theme vocabularies", () => {
  it.each([
    ["puppies", "Mia has 7 puppies. 5 more puppies come to play, so how many puppies are there now?"],
    ["dinosaurs", "Mia sees 7 dinosaurs by the nest. 5 more dinosaurs stomp over, so how many dinosaurs are there now?"],
    ["space", "Mia counts 7 rockets on the moon. 5 more rockets land, so how many rockets are on the moon now?"],
    ["ocean", "Mia sees 7 fish by the reef. 5 more fish swim over, so how many fish are there now?"],
    ["fairies", "Mia sees 7 fairies in the garden. 5 more fairies fly in, so how many fairies are there now?"],
    ["trucks", "Mia has 7 trucks at the site. 5 more trucks drive in, so how many trucks are there now?"],
  ] as const)("%s accepts a Story in its own words", (theme, text) => {
    expect(validateStory(text, { ...addTo, theme })).toEqual({ ok: true });
  });
});
