/**
 * Ollie saying one line, and whether Ollie's beak is moving while it plays.
 * The chain is src/voice/chain: the audio rendered for this line, the fixed
 * line bundled with the app, the platform's own speech, and the line on
 * screen, which is always there. Each step is tried in turn and the next one
 * takes over when one does not start, so nothing waits on ElevenLabs and no
 * Problem is ever silent and blank.
 *
 * Ollie talks for as long as the audio plays, not for a clip length guessed
 * in advance: the talking state is set by the playback's own events. Only
 * the last step, the line on screen with no audio at all, falls back to
 * reading pace (`speakingMs`).
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { bundledLineUrl } from "@/voice/bundled";
import { speechChain, type SpeechSource, type SpeechStep } from "@/voice/chain";
import { requestSpeech, type SpeechRequest } from "./speech-cache";
import { speakingMs } from "./lines";

/** A step that has not started by now is treated as one that never will. */
export const SPEECH_START_MS = 2000;

/** How long a line with the Nickname in it waits for its own audio before falling through. */
export const SPEECH_WAIT_MS = 1500;

export type SpokenLine = {
  /** What is on screen, and what Ollie says. */
  readonly text: string;
  /** Set only for a line with the Nickname in it, which the server renders (see the speech API route). */
  readonly request?: SpeechRequest;
};

export type Speech = {
  /** True while audio is playing, so Ollie's mouth moves with it. */
  readonly speaking: boolean;
  /** Which step of the chain is speaking, for the browser tests and for the stage. */
  readonly source: SpeechSource | null;
};

type Playing = {
  /** True once the line has been said; false when this step never started. */
  readonly said: Promise<boolean>;
  readonly stop: () => void;
};

const wait = (ms: number): Promise<undefined> => new Promise((resolve) => setTimeout(() => resolve(undefined), ms));

/** Whether the platform has a voice of its own. A platform with no voice cannot read the line. */
function hasPlatformVoice(): boolean {
  return typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined" && window.speechSynthesis.getVoices().length > 0;
}

function playAudio(url: string, onStart: () => void): Playing {
  const audio = new Audio(url);
  let settle: (said: boolean) => void = () => undefined;
  const said = new Promise<boolean>((resolve) => (settle = resolve));
  const neverStarted = setTimeout(() => settle(false), SPEECH_START_MS);
  audio.addEventListener("playing", () => {
    clearTimeout(neverStarted);
    onStart();
  });
  audio.addEventListener("ended", () => settle(true));
  audio.addEventListener("error", () => settle(false));
  void audio.play().catch(() => settle(false));
  return {
    said,
    stop: () => {
      clearTimeout(neverStarted);
      audio.pause();
      settle(false);
    },
  };
}

/** Slow and clear, as Ollie's own voice is, on whatever voice the platform has. */
function speakOnPlatform(text: string, onStart: () => void): Playing {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.15;
  let settle: (said: boolean) => void = () => undefined;
  const said = new Promise<boolean>((resolve) => (settle = resolve));
  const neverStarted = setTimeout(() => settle(false), SPEECH_START_MS);
  utterance.onstart = () => {
    clearTimeout(neverStarted);
    onStart();
  };
  utterance.onend = () => settle(true);
  utterance.onerror = () => settle(false);
  window.speechSynthesis.speak(utterance);
  return {
    said,
    stop: () => {
      clearTimeout(neverStarted);
      window.speechSynthesis.cancel();
      settle(false);
    },
  };
}

/** The line on screen with no audio behind it: Ollie is on it for as long as it takes to read. */
function showOnly(text: string, onStart: () => void): Playing {
  onStart();
  let settle: (said: boolean) => void = () => undefined;
  const said = new Promise<boolean>((resolve) => (settle = resolve));
  const read = setTimeout(() => settle(true), speakingMs(text));
  return {
    said,
    stop: () => {
      clearTimeout(read);
      settle(false);
    },
  };
}

const start = (step: SpeechStep, onStart: () => void): Playing =>
  step.source === "synthesis"
    ? speakOnPlatform(step.text, onStart)
    : step.source === "text"
      ? showOnly(step.text, onStart)
      : playAudio(step.url, onStart);

const SILENT: Speech = { speaking: false, source: null };

/** What is being said, and of which line: a line that has moved on is silent until the new one starts. */
type Said = Speech & { readonly said: string };

/**
 * Say `line` again whenever `key` changes: a new Problem, a new phase, or
 * the Repeat button. Repeating replays what is already on the device and
 * never asks for a new render.
 */
export function useSpeech(line: SpokenLine, key: string): Speech {
  const [said, setSaid] = useState<Said>({ ...SILENT, said: "" });
  const { text } = line;
  const saying = `${key}\n${text}`;
  // A request is data, so its own text is its identity: a new object of the
  // same request on the next render must not start the line again.
  const asked = line.request ? JSON.stringify(line.request) : "";
  const request = useMemo((): SpeechRequest | undefined => (asked ? (JSON.parse(asked) as SpeechRequest) : undefined), [asked]);

  useEffect(() => {
    let live = true;
    let playing: Playing | undefined;
    const say = (speech: Speech) => live && setSaid({ ...speech, said: saying });

    void (async () => {
      // A line with the Nickname in it is rendered on the server; give it a
      // moment to arrive before falling through, but never more than that.
      const cachedUrl = request ? ((await Promise.race([requestSpeech(request), wait(SPEECH_WAIT_MS)])) ?? undefined) : undefined;
      if (!live) return;
      const chain = speechChain(text, { cachedUrl, bundledUrl: bundledLineUrl(text), synthesis: hasPlatformVoice() });
      for (const step of chain) {
        if (!live) return;
        say({ speaking: false, source: step.source });
        playing = start(step, () => say({ speaking: true, source: step.source }));
        if (await playing.said) {
          say({ speaking: false, source: step.source });
          return;
        }
      }
    })();

    return () => {
      live = false;
      playing?.stop();
    };
  }, [saying, text, request]);

  return said.said === saying ? { speaking: said.speaking, source: said.source } : SILENT;
}
