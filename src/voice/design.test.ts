import { describe, expect, it } from "vitest";
import { OLLIE_VOICE_PREVIEW, PREVIEW_LIMITS } from "./design";
import { ollieLines } from "./lines";

describe("the Voice Design brief", () => {
  it("previews the voice on Ollie's own lines and nothing invented", () => {
    const said = new Set(ollieLines().map((line) => line.text));
    for (const sentence of OLLIE_VOICE_PREVIEW.split("\n")) expect(said).toContain(sentence);
  });

  it("gives Voice Design a preview long enough to judge and short enough to accept", () => {
    expect(OLLIE_VOICE_PREVIEW.length).toBeGreaterThanOrEqual(PREVIEW_LIMITS.min);
    expect(OLLIE_VOICE_PREVIEW.length).toBeLessThanOrEqual(PREVIEW_LIMITS.max);
  });
});
