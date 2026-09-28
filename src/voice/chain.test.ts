import { describe, expect, it } from "vitest";
import { audioKey } from "./key";
import { bundledLineUrl, voiceUrl } from "./bundled";
import { speechChain } from "./chain";
import { renditionTag } from "./manifest";

const LINE = "You did it!";
const V3 = renditionTag({ modelId: "eleven_v3", voiceId: "old-voice" });
const V4 = renditionTag({ modelId: "eleven_v4", voiceId: "new-voice" });
const bundled = new Map([[audioKey(LINE), V3]]);

describe("bundledLineUrl", () => {
  it("finds a line's own audio under public/voice and nothing for a line that was never rendered", () => {
    expect(bundledLineUrl(LINE, bundled)).toBe(`${voiceUrl(LINE)}?r=${V3}`);
    expect(bundledLineUrl("Yes! 7!", bundled)).toBeUndefined();
  });

  it("gives the same line a new URL once it is rendered on a new model and voice, so a year's cache never keeps the old Ollie", () => {
    const rerendered = bundledLineUrl(LINE, new Map([[audioKey(LINE), V4]]));
    expect(rerendered).not.toBe(bundledLineUrl(LINE, bundled));
    expect(rerendered?.startsWith(voiceUrl(LINE))).toBe(true);
  });

  it("finds nothing at all while no line has been rendered, which is how the app ships without a key", () => {
    expect(bundledLineUrl(LINE, new Map())).toBeUndefined();
  });
});

describe("speechChain", () => {
  it("falls through in the order the spec lays down: the line's audio from the Pool, the bundled fixed line, platform speech synthesis, the line on screen", () => {
    const chain = speechChain(LINE, { poolUrl: "blob:pooled", bundledUrl: voiceUrl(LINE), synthesis: true });
    expect(chain).toEqual([
      { source: "pool", url: "blob:pooled" },
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
    for (const poolUrl of [undefined, "blob:pooled"]) {
      for (const bundledUrl of [undefined, voiceUrl(LINE)]) {
        for (const synthesis of [true, false]) {
          const chain = speechChain(LINE, { poolUrl, bundledUrl, synthesis });
          expect(chain[chain.length - 1]).toEqual({ source: "text", text: LINE });
        }
      }
    }
  });

  it("has nothing to say about an empty line", () => {
    expect(speechChain("", { poolUrl: "blob:pooled", synthesis: true })).toEqual([]);
  });
});
