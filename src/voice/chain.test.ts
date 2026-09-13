import { describe, expect, it } from "vitest";
import { audioKey } from "./key";
import { bundledLineUrl, voiceUrl } from "./bundled";
import { speechChain } from "./chain";

const LINE = "You did it!";
const bundled = new Set([audioKey(LINE)]);

describe("bundledLineUrl", () => {
  it("finds a line's own audio under public/voice and nothing for a line that was never rendered", () => {
    expect(bundledLineUrl(LINE, bundled)).toBe(voiceUrl(LINE));
    expect(bundledLineUrl("Yes! 7!", bundled)).toBeUndefined();
  });

  it("finds nothing at all while no line has been rendered, which is how the app ships without a key", () => {
    expect(bundledLineUrl(LINE, new Set())).toBeUndefined();
  });
});

describe("speechChain", () => {
  it("falls through in the order the spec lays down: cached audio, the bundled fixed line, platform speech synthesis, the line on screen", () => {
    const chain = speechChain(LINE, { cachedUrl: "blob:cached", bundledUrl: voiceUrl(LINE), synthesis: true });
    expect(chain).toEqual([
      { source: "cached", url: "blob:cached" },
      { source: "bundled", url: voiceUrl(LINE) },
      { source: "synthesis", text: LINE },
      { source: "text", text: LINE },
    ]);
  });

  it("leaves out what is not there: no Story audio yet, nothing bundled, no voice on the platform", () => {
    expect(speechChain(LINE, { bundledUrl: voiceUrl(LINE), synthesis: true }).map((s) => s.source)).toEqual(["bundled", "synthesis", "text"]);
    expect(speechChain(LINE, { synthesis: true }).map((s) => s.source)).toEqual(["synthesis", "text"]);
    expect(speechChain(LINE, { synthesis: false }).map((s) => s.source)).toEqual(["text"]);
  });

  it("always ends with the line on screen, so every Problem has something audible or visible", () => {
    for (const cachedUrl of [undefined, "blob:cached"]) {
      for (const bundledUrl of [undefined, voiceUrl(LINE)]) {
        for (const synthesis of [true, false]) {
          const chain = speechChain(LINE, { cachedUrl, bundledUrl, synthesis });
          expect(chain[chain.length - 1]).toEqual({ source: "text", text: LINE });
        }
      }
    }
  });

  it("has nothing to say about an empty line", () => {
    expect(speechChain("", { cachedUrl: "blob:cached", synthesis: true })).toEqual([]);
  });
});
