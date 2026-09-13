/**
 * The Speech Chain: what Ollie says a line with, in the order the spec lays
 * down. The line's audio from the Content Pool on the server (rendered with
 * the Nickname in it), the bundled fixed line, the platform's own speech
 * synthesis, and the line on screen, which is always there. Nothing here
 * waits on anything: a step that is not ready is simply not in the chain, so
 * no Session ever blocks on ElevenLabs.
 */
export type SpeechStep =
  | { readonly source: "pool"; readonly url: string }
  | { readonly source: "bundled"; readonly url: string }
  | { readonly source: "synthesis"; readonly text: string }
  | { readonly source: "text"; readonly text: string };

export type SpeechSource = SpeechStep["source"];

export type SpeechAvailability = {
  /** The line's audio from the Pool on the server, once it has reached the device. */
  readonly poolUrl?: string;
  /** The fixed line rendered at build time and bundled with the app. */
  readonly bundledUrl?: string;
  /** Whether the platform has a voice of its own to read the line with. */
  readonly synthesis: boolean;
};

/** What to try, in order. Every chain for a line that says something ends on screen. */
export function speechChain(text: string, available: SpeechAvailability): SpeechStep[] {
  if (text === "") return [];
  const chain: SpeechStep[] = [];
  if (available.poolUrl) chain.push({ source: "pool", url: available.poolUrl });
  if (available.bundledUrl) chain.push({ source: "bundled", url: available.bundledUrl });
  if (available.synthesis) chain.push({ source: "synthesis", text });
  chain.push({ source: "text", text });
  return chain;
}
