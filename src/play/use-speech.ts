/**
 * Ollie saying one line, and whether the beak is moving while it plays. The
 * chain is src/voice/chain: the line's audio from the Content Pool, the fixed
 * line bundled with the app, the platform's own speech, and the line on
 * screen, which is always there. Walking it is src/play/speak, which is pure
 * and tested; this hook only decides what is available, keeps React's state
 * in step with it, and stops everything when the line changes.
 *
 * Ollie talks for as long as the step is actually speaking, not for a clip
 * length guessed in advance. Only the last step, the line on screen with no
 * audio at all, falls back to reading pace (`speakingMs`).
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { bundledLineUrl } from "@/voice/bundled";
import { speechChain } from "@/voice/chain";
import { hasPlatformSpeech, PLAYERS } from "./play-steps";
import { requestSpeech, type SpeechRequest } from "./speech-pool";
import { cuesFor, sayChain, type SpeechState, type Walk } from "./speak";

/** How long a line with the Nickname in it waits for its own audio before falling through. */
export const SPEECH_WAIT_MS = 1500;

export type SpokenLine = {
  /** What is on screen, and what Ollie says. */
  readonly text: string;
  /** Set only for a line with the Nickname in it, which the server renders (see the speech API route). */
  readonly request?: SpeechRequest;
};

export type Speech = SpeechState;

/** What is being said, and of which line: a line that has moved on is silent until the new one starts. */
type Spoken = Speech & { readonly line: string };

const SILENT: Speech = { speaking: false, source: null };

const wait = (ms: number): Promise<undefined> => new Promise((resolve) => setTimeout(() => resolve(undefined), ms));

/**
 * Say `line` again whenever `key` changes: a new Problem, a new phase, or
 * the Repeat button. Repeating replays what is already on the device and
 * never asks for a new render.
 */
export function useSpeech(line: SpokenLine, key: string): Speech {
  const [spoken, setSpoken] = useState<Spoken>({ ...SILENT, line: "" });
  const { text } = line;
  const saying = `${key}\n${text}`;
  // A request is data, so its own text is its identity: a new object of the
  // same request on the next render must not start the line again.
  const asked = line.request ? JSON.stringify(line.request) : "";
  const request = useMemo((): SpeechRequest | undefined => (asked ? (JSON.parse(asked) as SpeechRequest) : undefined), [asked]);

  useEffect(() => {
    let live = true;
    let walk: Walk | undefined;

    void (async () => {
      // A line with the Nickname in it is rendered on the server; give it a
      // moment to arrive before falling through, but never more than that.
      const poolUrl = request ? ((await Promise.race([requestSpeech(request), wait(SPEECH_WAIT_MS)])) ?? undefined) : undefined;
      if (!live) return;
      const chain = speechChain(text, { poolUrl, bundledUrl: bundledLineUrl(text), synthesis: hasPlatformSpeech() });
      walk = sayChain(cuesFor(chain, PLAYERS), (state) => {
        if (live) setSpoken({ ...state, line: saying });
      });
    })();

    return () => {
      live = false;
      walk?.stop();
    };
  }, [saying, text, request]);

  return spoken.line === saying ? { speaking: spoken.speaking, source: spoken.source } : SILENT;
}
