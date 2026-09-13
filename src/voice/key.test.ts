import { describe, expect, it } from "vitest";
import { audioFileName, audioKey } from "./key";

describe("audioKey", () => {
  it("is the same for the same line and different for lines that differ at all", () => {
    expect(audioKey("You did it!")).toBe(audioKey("You did it!"));
    expect(audioKey("You did it!")).not.toBe(audioKey("You did it"));
    expect(audioKey("Yes! 7!")).not.toBe(audioKey("Yes! 8!"));
    expect(audioKey("Hi, Mia! Ready to play?")).not.toBe(audioKey("Hi, Sam! Ready to play?"));
  });

  it("is a short name safe on any filesystem and in a URL, so a line's audio is addressed by what it says", () => {
    for (const text of ["You did it!", "It's 12. Look, let's see why.", "Hi, Mia's friend! Ready to play?"]) {
      expect(audioKey(text)).toMatch(/^[0-9a-z]{1,16}$/);
      expect(audioFileName(text)).toBe(`${audioKey(text)}.mp3`);
    }
  });

  it("gives every one of a thousand near-identical lines its own key", () => {
    const keys = new Set(Array.from({ length: 1000 }, (_, n) => audioKey(`What is ${n} and ${n + 1} more?`)));
    expect(keys.size).toBe(1000);
  });

  it("never carries the line itself, so a Nickname is not written into a file name on the volume", () => {
    expect(audioKey("Hi, Mia! Ready to play?")).not.toContain("mia");
  });
});
