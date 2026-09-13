/**
 * How a line of Ollie's is addressed as audio: by what it says, not by where
 * it is said. The key is a hash of the exact text, so the bundled fixed
 * lines and the Story audio on the volume are both found without a table,
 * changing a line's wording retires its audio on its own, and a Nickname
 * never appears in a file name (ADR 0002).
 */

/** Ollie is rendered as MP3 (see THIRD_PARTY.md for the output format). */
export const AUDIO_MIME = "audio/mpeg";

/** FNV-1a, twice over the same text from two offsets, so ~64 bits stand behind one key. */
function fnv1a(text: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function audioKey(text: string): string {
  const low = fnv1a(text, 0x811c9dc5).toString(36);
  const high = fnv1a(text, 0x01000193).toString(36);
  return `${high}${low.padStart(7, "0")}`;
}

export const audioFileName = (text: string): string => `${audioKey(text)}.mp3`;
