/**
 * The fallback chain for speech, in the order the spec lays down: the audio
 * cached for this exact line, the bundled fixed line, the platform's own
 * speech synthesis, and the line on screen, which is always there. Nothing
 * here waits on anything: a step that is not ready is simply not in the
 * chain, so no Session ever blocks on ElevenLabs.
 */
export type SpeechStep =
  | { readonly source: "cached"; readonly url: string }
  | { readonly source: "bundled"; readonly url: string }
  | { readonly source: "synthesis"; readonly text: string }
  | { readonly source: "text"; readonly text: string };

export type SpeechSource = SpeechStep["source"];

export type SpeechAvailability = {
  /** Audio rendered for this line with the Nickname in it, once it has arrived from the server. */
  readonly cachedUrl?: string;
  /** The fixed line rendered at build time and bundled with the app. */
  readonly bundledUrl?: string;
  /** Whether the platform has a voice of its own to read the line with. */
  readonly synthesis: boolean;
};

/** What to try, in order. Every chain for a line that says something ends on screen. */
export function speechChain(text: string, available: SpeechAvailability): SpeechStep[] {
  if (text === "") return [];
  const chain: SpeechStep[] = [];
  if (available.cachedUrl) chain.push({ source: "cached", url: available.cachedUrl });
  if (available.bundledUrl) chain.push({ source: "bundled", url: available.bundledUrl });
  if (available.synthesis) chain.push({ source: "synthesis", text });
  chain.push({ source: "text", text });
  return chain;
}
