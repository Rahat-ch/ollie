/**
 * The fixed lines as shipped: rendered once by `pnpm voice:lines` into
 * public/voice/ and bundled with the app, so Ollie speaks them offline and
 * with no call at all. The manifest holds the audio key of each line that
 * has a file, so a line whose wording has changed since it was rendered
 * falls through the chain instead of playing the old audio.
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
