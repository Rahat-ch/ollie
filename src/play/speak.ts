/**
 * Walking the Speech Chain: start each step in turn, and hand over to the
 * next as soon as one does not say the line. Pure, and told how to play each
 * kind of step, so what it does can be watched without a browser: the players
 * themselves live in play-steps.ts.
 *
 * Ollie talks for as long as the step is actually speaking, not for a clip
 * length guessed in advance — `say` is called with `speaking: true` from the
 * step's own start event and `false` when it ends. A step that has been
 * handed over from is stopped and can no longer say anything, so a late
 * start never sets Ollie talking over the step that took its place.
 */
import type { SpeechSource, SpeechStep } from "@/voice/chain";

/** A step under way: `said` is true once the line has been said, false when the step never spoke. */
export type Speaking = {
  readonly said: Promise<boolean>;
  /** Idempotent: releases whatever is playing and settles `said` false if it has not settled. */
  readonly stop: () => void;
};

/** Start one step. `onStart` is called when it actually begins to speak. */
export type Play = (onStart: () => void) => Speaking;

/** One step of the chain with the way it is played, so nothing downstream asks what kind it is. */
export type Cue = {
  readonly source: SpeechSource;
  readonly play: Play;
};

/**
 * How each kind of step is played. Every player is handed one string — a URL
 * for the steps that have audio, the words for the steps that do not.
 */
export type Players = Readonly<Record<SpeechSource, (what: string, onStart: () => void) => Speaking>>;

/** The chain with a player attached to each step. The one place a step's kind decides anything. */
export function cuesFor(chain: readonly SpeechStep[], players: Players): Cue[] {
  return chain.map((step): Cue => {
    const what = step.source === "synthesis" || step.source === "text" ? step.text : step.url;
    return { source: step.source, play: (onStart) => players[step.source](what, onStart) };
  });
}

export type SpeechState = {
  readonly speaking: boolean;
  readonly source: SpeechSource | null;
};

export type Walk = {
  /** Settles when the line has been said, or when every step has been tried, or when stopped. */
  readonly done: Promise<void>;
  /** Idempotent. Stops the step under way and says nothing more. */
  readonly stop: () => void;
};

/**
 * Say the line: the first cue that speaks wins, and `say` reports what is
 * being said as it changes. Nothing is reported after `stop`.
 */
export function sayChain(cues: readonly Cue[], say: (state: SpeechState) => void): Walk {
  let live = true;
  let current: Speaking | undefined;

  const done = (async () => {
    for (const cue of cues) {
      if (!live) return;
      say({ speaking: false, source: cue.source });
      // `mine` closes the step off the moment it is done with, so an event
      // that arrives late cannot speak over the step that followed it.
      let mine = true;
      const speaking = cue.play(() => {
        if (live && mine) say({ speaking: true, source: cue.source });
      });
      current = speaking;
      const said = await speaking.said;
      mine = false;
      speaking.stop();
      if (said) {
        if (live) say({ speaking: false, source: cue.source });
        return;
      }
    }
  })();

  return {
    done,
    stop: () => {
      live = false;
      current?.stop();
    },
  };
}

/**
 * A step's settled-or-not promise with its own idempotent stop. Every player
 * is this shape: it settles once, and stopping it after that does nothing.
 */
export function pending(release: () => void): { readonly speaking: Speaking; readonly settle: (said: boolean) => void } {
  let resolve: (said: boolean) => void = () => undefined;
  const said = new Promise<boolean>((settled) => (resolve = settled));
  let over = false;
  let released = false;
  const settle = (value: boolean) => {
    if (over) return;
    over = true;
    resolve(value);
  };
  return {
    speaking: {
      said,
      stop: () => {
        settle(false);
        if (released) return;
        released = true;
        release();
      },
    },
    settle,
  };
}
