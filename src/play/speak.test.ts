import { describe, expect, it } from "vitest";
import type { SpeechStep } from "@/voice/chain";
import { cuesFor, pending, sayChain, type Players, type SpeechState } from "./speak";

const CHAIN: readonly SpeechStep[] = [
  { source: "pool", url: "blob:story" },
  { source: "synthesis", text: "You did it!" },
  { source: "text", text: "You did it!" },
];

/**
 * A stand-in for a player: nothing starts, ends, or fails on its own, so a
 * test says when each happens and nothing is timed.
 */
function stagedPlayer() {
  const started: (() => void)[] = [];
  const stops: number[] = [];
  const settles: ((said: boolean) => void)[] = [];
  const player = (_what: string, onStart: () => void) => {
    const index = started.length;
    const { speaking, settle } = pending(() => stops.push(index));
    started.push(onStart);
    settles.push(settle);
    return speaking;
  };
  return {
    player,
    /** The step at `index` begins to speak. */
    begin: (index: number) => started[index](),
    /** The step at `index` finishes the line, or gives up on it. */
    finish: (index: number, said: boolean) => settles[index](said),
    /** Which steps have been released, in order. */
    stopped: () => stops,
    playing: () => started.length,
  };
}

const players = (player: Players["pool"]): Players => ({ pool: player, bundled: player, synthesis: player, text: player });

function watch() {
  const states: SpeechState[] = [];
  return { states, say: (state: SpeechState) => states.push(state) };
}

describe("cuesFor", () => {
  it("hands each step's player what that step is played from: the audio's URL, or the words", () => {
    const given: string[] = [];
    const player: Players["pool"] = (what, onStart) => {
      given.push(what);
      onStart();
      return pending(() => undefined).speaking;
    };
    for (const cue of cuesFor(CHAIN, players(player))) cue.play(() => undefined);
    expect(given).toEqual(["blob:story", "You did it!", "You did it!"]);
  });
});

describe("sayChain", () => {
  it("sets Ollie talking when the step begins to speak, not when it is started", async () => {
    const staged = stagedPlayer();
    const seen = watch();
    sayChain(cuesFor(CHAIN, players(staged.player)), seen.say);
    await Promise.resolve();
    expect(seen.states).toEqual([{ speaking: false, source: "pool" }]);

    staged.begin(0);
    expect(seen.states.at(-1)).toEqual({ speaking: true, source: "pool" });
  });

  it("stops Ollie talking when the audio ends, and asks for nothing else", async () => {
    const staged = stagedPlayer();
    const seen = watch();
    const walk = sayChain(cuesFor(CHAIN, players(staged.player)), seen.say);
    await Promise.resolve();
    staged.begin(0);
    staged.finish(0, true);
    await walk.done;

    expect(seen.states).toEqual([
      { speaking: false, source: "pool" },
      { speaking: true, source: "pool" },
      { speaking: false, source: "pool" },
    ]);
    expect(staged.playing()).toBe(1);
    expect(staged.stopped()).toEqual([0]);
  });

  it("hands over to the next step when one never speaks, and releases the one it left", async () => {
    const staged = stagedPlayer();
    const seen = watch();
    sayChain(cuesFor(CHAIN, players(staged.player)), seen.say);
    await Promise.resolve();
    staged.finish(0, false);
    await Promise.resolve();
    await Promise.resolve();

    expect(staged.stopped()).toEqual([0]);
    expect(seen.states.at(-1)).toEqual({ speaking: false, source: "synthesis" });
  });

  it("says the line on screen when every step before it has given up", async () => {
    const staged = stagedPlayer();
    const seen = watch();
    const walk = sayChain(cuesFor(CHAIN, players(staged.player)), seen.say);
    for (const step of [0, 1]) {
      await Promise.resolve();
      await Promise.resolve();
      staged.finish(step, false);
    }
    await Promise.resolve();
    await Promise.resolve();
    staged.begin(2);
    staged.finish(2, true);
    await walk.done;

    expect(seen.states.map((state) => state.source)).toEqual(["pool", "synthesis", "text", "text", "text"]);
    expect(seen.states.at(-1)).toEqual({ speaking: false, source: "text" });
  });

  it("ignores a step that starts late, so a handed-over step never speaks over the one that took its place", async () => {
    const staged = stagedPlayer();
    const seen = watch();
    sayChain(cuesFor(CHAIN, players(staged.player)), seen.say);
    await Promise.resolve();
    staged.finish(0, false);
    await Promise.resolve();
    await Promise.resolve();
    staged.begin(1);
    const while1 = seen.states.at(-1);

    // The first step, long since handed over from, finally starts.
    staged.begin(0);
    expect(seen.states.at(-1)).toEqual(while1);
    expect(seen.states.at(-1)).toEqual({ speaking: true, source: "synthesis" });
  });

  it("says nothing more once it is stopped, and releases the step under way", async () => {
    const staged = stagedPlayer();
    const seen = watch();
    const walk = sayChain(cuesFor(CHAIN, players(staged.player)), seen.say);
    await Promise.resolve();
    walk.stop();
    const after = seen.states.length;

    staged.begin(0);
    expect(seen.states).toHaveLength(after);
    expect(staged.stopped()).toEqual([0]);
    await walk.done;
    expect(staged.playing()).toBe(1);
  });

  it("says nothing at all for a line with nothing in it", async () => {
    const staged = stagedPlayer();
    const seen = watch();
    await sayChain(cuesFor([], players(staged.player)), seen.say).done;
    expect(seen.states).toEqual([]);
    expect(staged.playing()).toBe(0);
  });
});

describe("pending", () => {
  it("settles once and releases once, however often it is stopped", async () => {
    let released = 0;
    const { speaking, settle } = pending(() => (released += 1));
    settle(true);
    speaking.stop();
    speaking.stop();
    expect(await speaking.said).toBe(true);
    expect(released).toBe(1);
  });

  it("settles false when it is stopped before it has said anything", async () => {
    const { speaking } = pending(() => undefined);
    speaking.stop();
    expect(await speaking.said).toBe(false);
  });
});
