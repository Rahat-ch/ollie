import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AUDIO_MIME } from "@/voice/key";
import { speechFor } from "./speech-service";

const LINE = "Mia has 7 puppies. 5 more puppies come, so how many puppies are there now?";

/** A renderer that counts what it was asked to say, and answers with audio that carries the line's length. */
function countingRenderer() {
  const said: string[] = [];
  return {
    said,
    renderSpeech: async ({ text }: { readonly text: string }) => {
      said.push(text);
      return { audio: new Uint8Array([0x49, 0x44, 0x33, text.length & 0xff]), mimeType: AUDIO_MIME };
    },
  };
}

describe("the speech service", () => {
  let audioDir: string;
  beforeEach(async () => {
    audioDir = await mkdtemp(path.join(tmpdir(), "ollie-audio-"));
  });
  afterEach(() => rm(audioDir, { recursive: true, force: true }));

  it("renders a line once, adds it to the Pool on the volume, and reads it back on every repeat", async () => {
    const renderer = countingRenderer();
    const first = await speechFor({ audioDir, renderer }, LINE);
    expect(first.source).toBe("rendered");
    expect(first.mimeType).toBe(AUDIO_MIME);

    for (let repeat = 0; repeat < 3; repeat++) {
      const again = await speechFor({ audioDir, renderer }, LINE);
      expect(again).toEqual({ audio: first.audio, mimeType: AUDIO_MIME, source: "pool" });
    }
    expect(renderer.said).toEqual([LINE]);
  });

  it("leaves one file on the volume holding that line's audio, under a name that is not the Nickname", async () => {
    const renderer = countingRenderer();
    const rendered = await speechFor({ audioDir, renderer }, LINE);
    const files = await readdir(audioDir);
    expect(files).toHaveLength(1);
    expect(files[0]).not.toContain("Mia");
    expect(files[0]).toMatch(/\.mp3$/);
    expect(new Uint8Array(await readFile(path.join(audioDir, files[0])))).toEqual(rendered.audio);
  });

  it("renders once when the same line is asked for twice at the same moment", async () => {
    const renderer = countingRenderer();
    const answers = await Promise.all([speechFor({ audioDir, renderer }, LINE), speechFor({ audioDir, renderer }, LINE)]);
    expect(renderer.said).toEqual([LINE]);
    expect(answers[0].audio).toEqual(answers[1].audio);
  });

  it("renders two different lines separately", async () => {
    const renderer = countingRenderer();
    await speechFor({ audioDir, renderer }, LINE);
    await speechFor({ audioDir, renderer }, "You did it!");
    expect(renderer.said).toEqual([LINE, "You did it!"]);
  });

  it("passes a refusal on and leaves nothing on the volume, so the Speech Chain falls through", async () => {
    const failing = {
      renderSpeech: async () => {
        throw new Error("ELEVENLABS_API_KEY is not set");
      },
    };
    await expect(speechFor({ audioDir, renderer: failing }, LINE)).rejects.toThrow("ELEVENLABS_API_KEY is not set");
    expect(await readdir(audioDir)).toEqual([]);
  });
});
