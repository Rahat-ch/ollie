/**
 * How each step of the Speech Chain is actually played in a browser. Each
 * player reports when it begins to speak and when it has finished, so Ollie's
 * beak is driven by the playback and not by a guessed clip length, and each
 * releases what it was using when it is stopped: a step that has been handed
 * over from must not go on playing under the step that took its place.
 */
"use client";

import { speakingMs } from "./lines";
import { pending, type Players, type Speaking } from "./speak";

/** A step that has not begun to speak by now is treated as one that never will. */
export const SPEECH_START_MS = 2000;

/** Slow and clear, as Ollie's own voice is, on whatever voice the platform has. */
const PLATFORM_RATE = 0.9;
const PLATFORM_PITCH = 1.15;

/** A step's own timers, cleared when it is released. Held in a list so the release can be written first. */
const timers = (): { readonly clear: () => void; readonly add: (timer: ReturnType<typeof setTimeout>) => void } => {
  const running: ReturnType<typeof setTimeout>[] = [];
  return { clear: () => running.forEach(clearTimeout), add: (timer) => running.push(timer) };
};

function playAudio(url: string, onStart: () => void): Speaking {
  const audio = new Audio(url);
  const listeners = new AbortController();
  const clock = timers();
  const { speaking, settle } = pending(() => {
    clock.clear();
    listeners.abort();
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  });
  clock.add(setTimeout(() => settle(false), SPEECH_START_MS));
  // Speaking has begun, so the deadline that would have handed over is off.
  const begin = () => {
    clock.clear();
    onStart();
  };
  audio.addEventListener("playing", begin, { signal: listeners.signal });
  audio.addEventListener("ended", () => settle(true), { signal: listeners.signal });
  audio.addEventListener("error", () => settle(false), { signal: listeners.signal });
  void audio.play().catch(() => settle(false));
  return speaking;
}

/**
 * The platform's own voice. It is offered whenever the platform has speech at
 * all, without asking first whether a voice has loaded: on Safari and on a
 * cold Chrome the list is empty until it is not, and a platform that cannot
 * speak says so through `onerror` or by never starting, which hands over.
 */
function speakOnPlatform(text: string, onStart: () => void): Speaking {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = PLATFORM_RATE;
  utterance.pitch = PLATFORM_PITCH;
  const clock = timers();
  const { speaking, settle } = pending(() => {
    clock.clear();
    utterance.onstart = null;
    utterance.onend = null;
    utterance.onerror = null;
    window.speechSynthesis.cancel();
  });
  clock.add(setTimeout(() => settle(false), SPEECH_START_MS));
  utterance.onstart = () => {
    clock.clear();
    onStart();
  };
  utterance.onend = () => settle(true);
  utterance.onerror = () => settle(false);
  window.speechSynthesis.speak(utterance);
  return speaking;
}

/** The line on screen with no audio behind it: Ollie is on it for as long as it takes to read. */
function showOnly(text: string, onStart: () => void): Speaking {
  const clock = timers();
  const { speaking, settle } = pending(clock.clear);
  onStart();
  clock.add(setTimeout(() => settle(true), speakingMs(text)));
  return speaking;
}

export const PLAYERS: Players = {
  pool: playAudio,
  bundled: playAudio,
  synthesis: speakOnPlatform,
  text: showOnly,
};

/** Whether the platform has speech synthesis at all. Whether it has a voice loaded is the player's problem. */
export const hasPlatformSpeech = (): boolean =>
  typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";
