import { describe, expect, it } from "vitest";
import { audioKey } from "./key";
import { adoptRendition, bundledRenditions, planRender, recordRendered, renditionTag, type VoiceManifest } from "./manifest";

const line = (text: string) => ({ kind: "ollie" as const, text });
const HINT = line("Start at the bigger number and count on.");
const CHEER = line("Yes! 7!");
const DONE = line("You did it!");
const k = (l: { text: string }) => audioKey(l.text);

const V3_OLD = { modelId: "eleven_v3", voiceId: "old-voice" };
const V4_NEW = { modelId: "eleven_v4", voiceId: "new-voice" };

/** Every line rendered on v3 and the old voice, and on disk. */
const manifest: VoiceManifest = [{ ...V3_OLD, keys: [k(HINT), k(CHEER), k(DONE)].sort() }];
const onDisk = new Set([k(HINT), k(CHEER), k(DONE)]);

describe("planRender", () => {
  it("skips every line when the configured model and voice are the ones it was rendered on, as it always has", () => {
    const plan = planRender([HINT, CHEER, DONE], onDisk, manifest, V3_OLD);
    expect(plan.current).toHaveLength(3);
    expect(plan.missing).toEqual([]);
    expect(plan.stale).toEqual([]);
  });

  it("marks every line stale when the configured model changes", () => {
    const plan = planRender([HINT, CHEER, DONE], onDisk, manifest, { ...V3_OLD, modelId: "eleven_v4" });
    expect(plan.stale.map((l) => l.text)).toEqual([HINT.text, CHEER.text, DONE.text]);
    expect(plan.current).toEqual([]);
  });

  it("marks every line stale when the configured voice changes", () => {
    const plan = planRender([HINT, CHEER, DONE], onDisk, manifest, { ...V3_OLD, voiceId: "new-voice" });
    expect(plan.stale).toHaveLength(3);
  });

  it("marks every line stale when both change, and counts a line with no file as missing, not stale", () => {
    const plan = planRender([HINT, CHEER, DONE, line("Try again!")], onDisk, manifest, V4_NEW);
    expect(plan.stale).toHaveLength(3);
    expect(plan.missing.map((l) => l.text)).toEqual(["Try again!"]);
  });

  it("counts a file on disk the manifest has no record of as stale, since nothing says what rendered it", () => {
    const plan = planRender([HINT], onDisk, [], V3_OLD);
    expect(plan.stale).toEqual([HINT]);
  });

  it("counts a line in the manifest whose file is gone as missing", () => {
    const plan = planRender([HINT], new Set(), manifest, V3_OLD);
    expect(plan.missing).toEqual([HINT]);
  });

  it("counts a line whose voice was never recorded as stale against a configured voice, and fixes nothing silently", () => {
    const legacy: VoiceManifest = [{ modelId: "eleven_v3", voiceId: null, keys: [k(HINT)] }];
    expect(planRender([HINT], onDisk, legacy, V3_OLD).stale).toEqual([HINT]);
  });

  it("compares the model only when no voice is configured, as in a dry run on a machine without one", () => {
    const legacy: VoiceManifest = [{ modelId: "eleven_v3", voiceId: null, keys: [k(HINT)] }];
    expect(planRender([HINT], onDisk, legacy, { modelId: "eleven_v3", voiceId: undefined }).current).toEqual([HINT]);
    expect(planRender([HINT], onDisk, manifest, { modelId: "eleven_v3", voiceId: undefined }).current).toEqual([HINT]);
    expect(planRender([HINT], onDisk, manifest, { modelId: "eleven_v4", voiceId: undefined }).stale).toEqual([HINT]);
  });
});

describe("recordRendered", () => {
  it("records the configured model and voice for what was just rendered and keeps every other line's record", () => {
    const next = recordRendered(manifest, onDisk, [k(CHEER)], V4_NEW);
    expect(next).toEqual([
      { ...V3_OLD, keys: [k(HINT), k(DONE)].sort() },
      { ...V4_NEW, keys: [k(CHEER)] },
    ]);
  });

  it("drops a record whose file is no longer on disk, so the manifest never claims audio that is not there", () => {
    const next = recordRendered(manifest, new Set([k(HINT)]), [], V3_OLD);
    expect(next).toEqual([{ ...V3_OLD, keys: [k(HINT)] }]);
  });

  it("is stable: the same records come out in the same order however they went in", () => {
    const a = recordRendered([], onDisk, [k(DONE), k(HINT)], V4_NEW);
    const b = recordRendered([], onDisk, [k(HINT), k(DONE)], V4_NEW);
    expect(a).toEqual(b);
  });
});

describe("adoptRendition", () => {
  it("records the configured voice on lines whose voice was never recorded, on the same model, and nothing else", () => {
    const legacy: VoiceManifest = [
      { modelId: "eleven_v3", voiceId: null, keys: [k(HINT), k(CHEER)].sort() },
      { modelId: "eleven_flash_v2_5", voiceId: null, keys: [k(DONE)] },
    ];
    const { manifest: next, adopted } = adoptRendition(legacy, V3_OLD);
    expect(adopted).toBe(2);
    expect(next).toEqual([
      { modelId: "eleven_flash_v2_5", voiceId: null, keys: [k(DONE)] },
      { ...V3_OLD, keys: [k(HINT), k(CHEER)].sort() },
    ]);
    expect(planRender([HINT, CHEER], onDisk, next, V3_OLD).current).toHaveLength(2);
  });
});

describe("bundledRenditions", () => {
  it("maps each line's key to a tag of what rendered it, so the same line on a new voice is a new URL", () => {
    const bundled = bundledRenditions(manifest);
    expect(bundled.get(k(HINT))).toBe(renditionTag(V3_OLD));
    expect(renditionTag(V3_OLD)).not.toBe(renditionTag(V4_NEW));
    expect(renditionTag(V3_OLD)).not.toBe(renditionTag({ modelId: "eleven_v3", voiceId: null }));
  });
});
