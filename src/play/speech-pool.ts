/**
 * The device's side of the Content Pool's audio: the lines with the Nickname
 * in them, asked of the server once each. A line is rendered on ElevenLabs
 * the first time any device asks for it and added to the Pool on the volume,
 * so this is asked as soon as a Story is known and is usually answered
 * before the Problem comes up. What comes back is held for the life of the
 * page, so the Repeat button replays the same audio and never sets off a new
 * render.
 */
import type { Problem } from "@/loop";
import type { Identity } from "@/profile/identity";
import type { PoolInput } from "@/story/pool";
import { audioKey } from "@/voice/key";
import { greeting } from "./lines";
import { storyInputFor } from "./stories";

export type SpeechRequest =
  | { readonly kind: "greeting"; readonly nickname: string }
  | ({ readonly kind: "story"; readonly nickname: string; readonly text: string } & PoolInput);

/** A first render takes a few seconds; after that the server reads the file. */
export const SPEECH_TIMEOUT_MS = 15_000;

/** How long a line that could not be rendered is left alone before it is asked for again. */
export const SPEECH_RETRY_MS = 30_000;

/** What Ollie says for a request: the app's own line for a greeting, the Story itself otherwise. */
export const spokenText = (request: SpeechRequest): string =>
  request.kind === "greeting" ? greeting(request.nickname) : request.text;

/** The request for a Unit 3 Problem's Story, or nothing for a Problem that has none. */
export function storySpeechRequest(problem: Problem, identity: Identity, text: string): SpeechRequest | undefined {
  const input = storyInputFor(problem, identity.theme);
  return input ? { kind: "story", nickname: identity.nickname, text, ...input } : undefined;
}

const held = new Map<string, Promise<string | null>>();
const refused = new Map<string, number>();

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
 * The audio for one line, or nothing when Ollie has no voice for it yet. An
 * answer is held and handed back to every later ask; a line that could not be
 * rendered is left alone for SPEECH_RETRY_MS and then asked for again, so a
 * key that arrives, or a vendor that was busy, is not shut out for the life
 * of the page. Nothing waits on this: the Speech Chain falls through meanwhile.
 */
export function requestSpeech(request: SpeechRequest, now: number = Date.now()): Promise<string | null> {
  const key = audioKey(spokenText(request));
  const already = held.get(key);
  if (already) return already;
  const refusedAt = refused.get(key);
  if (refusedAt !== undefined && now - refusedAt < SPEECH_RETRY_MS) return Promise.resolve(null);

  const asked = fetchSpeech(request).then((url) => {
    if (url === null) {
      held.delete(key);
      refused.set(key, Date.now());
    }
    return url;
  });
  held.set(key, asked);
  return asked;
}
