import { describe, expect, it } from "vitest";
import { OLLIE_VOICE_BRIEF, OLLIE_VOICE_NAME, OLLIE_VOICE_PREVIEW, PREVIEW_LIMITS } from "./design";
import { ollieLines } from "./lines";

describe("the Voice Design brief", () => {
  it("asks for the voice the spec describes, in the shape Voice Design documents", () => {
    const brief = OLLIE_VOICE_BRIEF.toLowerCase();
    for (const quality of ["warm", "playful", "gently energetic", "older kid", "slow", "clear", "gender-neutral"]) {
      expect(brief).toContain(quality);
    }
    expect(brief).toContain("persona:");
    expect(brief).toContain("emotion:");
  });

  it("says what Ollie is not, so a rendered preview can be judged against it", () => {
    expect(OLLIE_VOICE_BRIEF.toLowerCase()).toContain("not a baby voice");
    expect(OLLIE_VOICE_BRIEF.toLowerCase()).toContain("not a teacher voice");
  });

  it("previews the voice on Ollie's own lines and nothing invented", () => {
    const said = new Set(ollieLines().map((line) => line.text));
    for (const sentence of OLLIE_VOICE_PREVIEW.split("\n")) expect(said).toContain(sentence);
  });

  it("gives Voice Design a preview long enough to judge and short enough to accept", () => {
    expect(OLLIE_VOICE_PREVIEW.length).toBeGreaterThanOrEqual(PREVIEW_LIMITS.min);
    expect(OLLIE_VOICE_PREVIEW.length).toBeLessThanOrEqual(PREVIEW_LIMITS.max);
    expect(OLLIE_VOICE_NAME).toBe("Ollie");
  });
});
