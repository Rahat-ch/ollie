/**
 * The fixed lines as shipped: rendered once by `pnpm voice:lines` into
 * public/voice/ and bundled with the app, so Ollie says them with no vendor
 * call at all and, because each file is named after what it says, a device
 * fetches one once (next.config sets a year's cache-control on /voice). The
 * manifest holds the audio key of each line that has a file, so a line whose
 * wording has changed since it was rendered falls through the Speech Chain
 * instead of playing the old audio; and what each was rendered on, which the
 * URL carries, so a line re-rendered on a new voice is fetched again.
 */
import { audioFileName, audioKey } from "./key";
import manifest from "./lines.generated.json";
import { bundledRenditions, type VoiceManifest } from "./manifest";

/** Where the bundled audio is served from, under public/. */
export const VOICE_PATH = "/voice";

/** Each bundled line's audio key, with the tag of the model and voice it was rendered on. */
export const BUNDLED_LINES: ReadonlyMap<string, string> = bundledRenditions(manifest as VoiceManifest);

export const voiceUrl = (text: string): string => `${VOICE_PATH}/${audioFileName(text)}`;

/** The bundled audio for a line, or nothing when it was never rendered. */
export function bundledLineUrl(text: string, bundled: ReadonlyMap<string, string> = BUNDLED_LINES): string | undefined {
  const rendition = bundled.get(audioKey(text));
  return rendition === undefined ? undefined : `${voiceUrl(text)}?r=${rendition}`;
}
