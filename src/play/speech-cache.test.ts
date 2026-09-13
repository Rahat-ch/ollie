import { afterEach, describe, expect, it, vi } from "vitest";
import { requestSpeech, spokenText, type SpeechRequest } from "./speech-cache";
import { greeting } from "./lines";

type StorySpeech = Extract<SpeechRequest, { kind: "story" }>;

const story = (text: string): StorySpeech => ({
  kind: "story",
  nickname: "Mia",
  text,
  theme: "puppies",
  skill: "result-unknown",
  structure: "add-to",
  equation: { left: 7, op: "+", right: 5, result: 12, unknown: "result" },
  answer: 12,
});

/** The server, counting what it was asked to voice. */
function server(answer: () => Response) {
  const asked: string[] = [];
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    asked.push(String((JSON.parse(String(init.body)) as { text?: string; nickname: string }).text ?? init.body));
    return answer();
  });
  return asked;
}

afterEach(() => vi.unstubAllGlobals());

describe("spokenText", () => {
  it("is the app's own greeting for a greeting, and the Story itself for a Story", () => {
    expect(spokenText({ kind: "greeting", nickname: "Mia" })).toBe(greeting("Mia"));
    expect(spokenText(story("Mia has 7 puppies."))).toBe("Mia has 7 puppies.");
  });
});

// The answers are held for the life of the page, so each test asks about its own line.
describe("requestSpeech", () => {
  it("asks for a line once however often it is wanted, so a repeat plays what is already here", async () => {
    const asked = server(() => new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    const line = story("Mia has 7 puppies. 5 more puppies come, so how many puppies are there now?");
    const first = await requestSpeech(line);
    expect(first).toMatch(/^blob:/);
    for (let repeat = 0; repeat < 3; repeat++) expect(await requestSpeech(line)).toBe(first);
    expect(asked).toEqual([line.text]);
  });

  it("asks separately for a different line", async () => {
    const asked = server(() => new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    const a = story("Mia has 2 puppies. 3 more puppies come, so how many puppies are there now?");
    const b = story("Mia has 3 puppies. 4 more puppies come, so how many puppies are there now?");
    expect(await requestSpeech(a)).not.toBe(await requestSpeech(b));
    expect(asked).toEqual([a.text, b.text]);
  });

  it("answers with nothing when Ollie has no voice, and does not ask again: the chain falls through instead", async () => {
    const asked = server(() => new Response(JSON.stringify({ error: ["ELEVENLABS_API_KEY is not set"] }), { status: 503 }));
    const line = story("Mia has 8 puppies. 1 more puppy comes, so how many puppies are there now?");
    expect(await requestSpeech(line)).toBeNull();
    expect(await requestSpeech(line)).toBeNull();
    expect(asked).toHaveLength(1);
  });

  it("answers with nothing when the server cannot be reached at all", async () => {
    server(() => {
      throw new Error("offline");
    });
    expect(await requestSpeech(story("Mia has 9 puppies. 2 more puppies come, so how many puppies are there now?"))).toBeNull();
  });
});
