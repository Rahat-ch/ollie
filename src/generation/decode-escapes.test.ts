import { describe, expect, it } from "vitest";
import { decodeEscapes, decodeStrings } from "./decode-escapes";

describe("decodeEscapes", () => {
  it("turns a literal \\u2014 into an em-dash so the validator does not read 2014 as a number", () => {
    expect(decodeEscapes("a hint \\u2014 not a conclusion")).toBe("a hint — not a conclusion");
  });

  it("decodes escaped quotes, newlines, and backslashes", () => {
    expect(decodeEscapes('say \\"nine, ten\\"\\nthen stop \\\\ done')).toBe('say "nine, ten"\nthen stop \\ done');
  });

  it("leaves text with no escapes as it is", () => {
    const text = "Your child answered 9 Problems. Partners to 10: 3 first-try correct.";
    expect(decodeEscapes(text)).toBe(text);
  });
});

describe("decodeStrings", () => {
  it("decodes every string inside a nested output and leaves numbers and nulls alone", () => {
    const output = { practiced: "a \\u2014 b", nested: { list: ['c\\"d', 3, null] }, n: 0.4 };
    expect(decodeStrings(output)).toEqual({ practiced: "a — b", nested: { list: ['c"d', 3, null] }, n: 0.4 });
  });
});
