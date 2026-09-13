/**
 * The fixed lines as shipped: rendered once by `pnpm voice:lines` into
 * public/voice/ and bundled with the app, so Ollie says them with no vendor
 * call at all and, because each file is named after what it says, a device
 * fetches one once (next.config sets a year's cache-control on /voice). The
 * manifest holds the audio key of each line that has a file, so a line whose
 * wording has changed since it was rendered falls through the Speech Chain
 * instead of playing the old audio.
 */
import { audioFileName, audioKey } from "./key";
import keys from "./lines.generated.json";

/** Where the bundled audio is served from, under public/. */
export const VOICE_PATH = "/voice";

export const BUNDLED_LINE_KEYS: ReadonlySet<string> = new Set(keys as string[]);

export const voiceUrl = (text: string): string => `${VOICE_PATH}/${audioFileName(text)}`;

/** The bundled audio for a line, or nothing when it was never rendered. */
export function bundledLineUrl(text: string, bundled: ReadonlySet<string> = BUNDLED_LINE_KEYS): string | undefined {
  return bundled.has(audioKey(text)) ? voiceUrl(text) : undefined;
}
