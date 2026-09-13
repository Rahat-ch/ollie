import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AUDIO_MIME, audioFileName } from "@/voice/key";
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

  it("renders a line once, keeps it on the volume, and reads it back on every repeat", async () => {
    const renderer = countingRenderer();
    const first = await speechFor({ audioDir, renderer }, LINE);
    expect(first.source).toBe("rendered");
    expect(first.mimeType).toBe(AUDIO_MIME);
    expect(new Uint8Array(await readFile(path.join(audioDir, audioFileName(LINE))))).toEqual(first.audio);

    for (let repeat = 0; repeat < 3; repeat++) {
      const again = await speechFor({ audioDir, renderer }, LINE);
      expect(again).toEqual({ audio: first.audio, mimeType: AUDIO_MIME, source: "cache" });
    }
    expect(renderer.said).toEqual([LINE]);
  });

  it("names the file after what is said and never after who it is said to, so no Nickname is written to the volume", async () => {
    const renderer = countingRenderer();
    await speechFor({ audioDir, renderer }, LINE);
    expect(audioFileName(LINE)).not.toContain("Mia");
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

  it("passes a refusal on and leaves nothing behind, so the chain falls through", async () => {
    const failing = {
      renderSpeech: async () => {
        throw new Error("ELEVENLABS_API_KEY is not set");
      },
    };
    await expect(speechFor({ audioDir, renderer: failing }, LINE)).rejects.toThrow("ELEVENLABS_API_KEY is not set");
    await expect(readFile(path.join(audioDir, audioFileName(LINE)))).rejects.toThrow();
  });
});
