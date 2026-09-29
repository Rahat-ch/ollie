import { describe, expect, it } from "vitest";
import { NICKNAME_PLACEHOLDER } from "@/story/nickname";
import { abCharacters, abLines, blindPairs, respondAb, tallyAb, type AbSides, type AbState } from "./ab";

const SIDES: AbSides = {
  a: { modelId: "eleven_v3", voiceId: "old-voice" },
  b: { modelId: "eleven_v4", voiceId: "new-voice" },
};

/** A seeded stand-in for Math.random, so a test's blind order is the same every run. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

describe("abLines", () => {
  const lines = abLines();

  it("is about 15 lines: Hints, cheers, a few Problems and a Story, each said once", () => {
    expect(lines.length).toBeGreaterThanOrEqual(13);
    expect(lines.length).toBeLessThanOrEqual(17);
    expect(new Set(lines.map((l) => l.text)).size).toBe(lines.length);
    for (const kind of ["hint", "cheer", "problem", "story"] as const) expect(lines.some((l) => l.kind === kind)).toBe(true);
  });

  it("puts a Nickname in every Story, as the speech route would, and never the placeholder", () => {
    for (const line of lines.filter((l) => l.kind === "story")) {
      expect(line.text).not.toContain(NICKNAME_PLACEHOLDER);
      expect(line.text).toContain("Mia");
    }
  });

  it("is the same set every run, so a second A/B hears the same lines", () => {
    expect(abLines()).toEqual(lines);
  });

  it("counts the characters one side costs", () => {
    expect(abCharacters(lines)).toBe(lines.reduce((n, l) => n + l.text.length, 0));
  });
});

describe("blindPairs", () => {
  it("puts each line once, and puts A first on some pairs and B first on others", () => {
    const pairs = blindPairs(abLines(), seeded(7));
    expect(new Set(pairs.map((p) => p.text))).toEqual(new Set(abLines().map((l) => l.text)));
    expect(pairs.some((p) => p.first === "a")).toBe(true);
    expect(pairs.some((p) => p.first === "b")).toBe(true);
  });
});

describe("tallyAb", () => {
  const pairs = blindPairs(abLines(), seeded(3));

  it("turns each choice of clip 1 or clip 2 back into the side that won, and counts the wins", () => {
    const choices = Object.fromEntries(pairs.map((p) => [p.id, p.first === "b" ? 1 : 2]));
    const tally = tallyAb(SIDES, pairs, choices, "2026-09-28T12:00:00Z");
    expect(tally.wins).toEqual({ a: 0, b: pairs.length });
    expect(tally.winner).toBe("b");
    expect(tally.sides).toEqual(SIDES);
    expect(tally.lines.every((l) => l.winner === "b")).toBe(true);
    expect(tally.byKind.story).toEqual({ a: 0, b: pairs.filter((p) => p.kind === "story").length });
  });

  it("calls an even split a tie", () => {
    const even = pairs.slice(0, 4);
    const choices = Object.fromEntries(even.map((p, i) => [p.id, (i % 2 === 0) === (p.first === "a") ? 1 : 2]));
    expect(tallyAb(SIDES, even, choices, "2026-09-28T12:00:00Z").winner).toBe("tie");
  });

  it("refuses a tally with a pair left unrated", () => {
    expect(() => tallyAb(SIDES, pairs, {}, "2026-09-28T12:00:00Z")).toThrow(/every pair/);
  });
});

describe("respondAb, the listening page's server", () => {
  const state = (): AbState => ({ sides: SIDES, pairs: blindPairs(abLines(), seeded(11)), saved: undefined });
  const secrets = [SIDES.a.modelId, SIDES.a.voiceId, SIDES.b.modelId, SIDES.b.voiceId, '"a"', '"b"', '"first"'];

  it("serves the page and the pairs with nothing that says which side is which", () => {
    const s = state();
    const page = respondAb(s, { method: "GET", path: "/" });
    expect(page.status).toBe(200);
    expect(page.type).toContain("text/html");
    for (const secret of secrets.slice(0, 4)) expect(String(page.body)).not.toContain(secret);
    const pairs = respondAb(s, { method: "GET", path: "/pairs" });
    expect(pairs.status).toBe(200);
    for (const secret of secrets) expect(String(pairs.body)).not.toContain(secret);
    expect(JSON.parse(String(pairs.body)).pairs).toHaveLength(s.pairs.length);
  });

  it("serves each clip by pair and slot, mapping the slot to the side's audio only on the server", () => {
    const s = state();
    const pair = s.pairs[0];
    const one = respondAb(s, { method: "GET", path: `/clip/${pair.id}/1` });
    const two = respondAb(s, { method: "GET", path: `/clip/${pair.id}/2` });
    expect(one.clip).toEqual({ side: pair.first, text: pair.text });
    expect(two.clip?.side).toBe(pair.first === "a" ? "b" : "a");
    expect(respondAb(s, { method: "GET", path: "/clip/999/1" }).status).toBe(404);
  });

  it("reveals the sides only once the tally is saved, and then to every later look", () => {
    const s = state();
    const choices = Object.fromEntries(s.pairs.map((p) => [p.id, 1]));
    const saved = respondAb(s, { method: "POST", path: "/tally", body: JSON.stringify({ choices }) });
    expect(saved.status).toBe(200);
    expect(saved.save).toBeDefined();
    expect(String(saved.body)).toContain("new-voice");
    expect(String(respondAb(s, { method: "GET", path: "/pairs" }).body)).toContain("new-voice");
  });

  it("refuses to save a tally with a pair unrated, and still reveals nothing", () => {
    const s = state();
    const refused = respondAb(s, { method: "POST", path: "/tally", body: JSON.stringify({ choices: {} }) });
    expect(refused.status).toBe(400);
    expect(refused.save).toBeUndefined();
    for (const secret of secrets.slice(0, 4)) expect(String(respondAb(s, { method: "GET", path: "/pairs" }).body)).not.toContain(secret);
  });
});
