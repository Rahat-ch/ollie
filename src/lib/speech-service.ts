/**
 * The server's side of Ollie's voice: the audio for one line, from the
 * Content Pool on the volume if it was ever rendered here, else rendered
 * once on ElevenLabs and added to it. A line is rendered at most once
 * however many times it is asked for, so the Repeat button and a replayed
 * Session cost nothing; a line that cannot be rendered is passed on as a
 * refusal and the browser falls through the Speech Chain (src/voice/chain).
 */
import type { Generation } from "@/generation/types";
import { AUDIO_MIME, audioFileName } from "@/voice/key";
import { readAudioFile, writeAudioFile } from "./audio-file";

export type SpeechAnswer = {
  readonly audio: Uint8Array;
  readonly mimeType: string;
  readonly source: "pool" | "rendered";
};

export type SpeechServiceOptions = {
  readonly audioDir: string;
  readonly renderer: Pick<Generation, "renderSpeech">;
};

/** One render in flight per file, so a Session asking for the same line twice at once renders it once. */
const rendering = new Map<string, Promise<SpeechAnswer>>();

function begin(options: SpeechServiceOptions, text: string, name: string, key: string): Promise<SpeechAnswer> {
  const started = (async (): Promise<SpeechAnswer> => {
    const pooled = await readAudioFile(options.audioDir, name);
    if (pooled) return { audio: pooled, mimeType: AUDIO_MIME, source: "pool" };
    const { audio, mimeType } = await options.renderer.renderSpeech({ text });
    await writeAudioFile(options.audioDir, name, audio);
    return { audio, mimeType, source: "rendered" };
  })();
  rendering.set(key, started);
  return started.finally(() => rendering.delete(key));
}

/** The audio for one line, rendered at most once ever on this volume. */
export function speechFor(options: SpeechServiceOptions, text: string): Promise<SpeechAnswer> {
  const name = audioFileName(text);
  const key = `${options.audioDir}/${name}`;
  return rendering.get(key) ?? begin(options, text, name, key);
}
