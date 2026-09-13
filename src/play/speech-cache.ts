/**
 * The audio for the lines with the Nickname in them, asked of the server
 * once each. A line is rendered on ElevenLabs the first time any device asks
 * for it and kept on the volume after that, so this is asked as soon as a
 * Story is known and is usually answered before the Problem comes up. The
 * answer is held for the life of the page, so the Repeat button replays the
 * same audio and never sets off a new render.
 */
import type { PoolInput } from "@/story/pool";
import { audioKey } from "@/voice/key";
import { greeting } from "./lines";

export type SpeechRequest =
  | { readonly kind: "greeting"; readonly nickname: string }
  | ({ readonly kind: "story"; readonly nickname: string; readonly text: string } & PoolInput);

/** A first render takes a few seconds; after that the server reads the file. */
export const SPEECH_TIMEOUT_MS = 15_000;

/** What Ollie says for a request: the app's own line for a greeting, the Story itself otherwise. */
export const spokenText = (request: SpeechRequest): string =>
  request.kind === "greeting" ? greeting(request.nickname) : request.text;

const asked = new Map<string, Promise<string | null>>();

async function fetchSpeech(request: SpeechRequest): Promise<string | null> {
  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(SPEECH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const audio = await response.blob();
    return audio.size === 0 ? null : URL.createObjectURL(audio);
  } catch {
    return null;
  }
}

/**
 * The audio for one line, or nothing when Ollie's voice is not there. A line
 * that could not be rendered is not asked for again while the page is open:
 * the chain falls through instead, which is what it is for.
 */
export function requestSpeech(request: SpeechRequest): Promise<string | null> {
  const key = audioKey(spokenText(request));
  const already = asked.get(key);
  if (already) return already;
  const started = fetchSpeech(request);
  asked.set(key, started);
  return started;
}
