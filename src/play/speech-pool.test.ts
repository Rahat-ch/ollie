import { afterEach, describe, expect, it, vi } from "vitest";
import { requestSpeech, SPEECH_RETRY_MS, type SpeechRequest } from "./speech-pool";

const story = (text: string): SpeechRequest => ({
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

// An answer is held for the life of the page, so each test asks about its own line.
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

  it("answers with nothing when Ollie has no voice, and leaves the line alone for a while rather than asking over and over", async () => {
    const asked = server(() => new Response(JSON.stringify({ error: ["ELEVENLABS_API_KEY is not set"] }), { status: 503 }));
    const line = story("Mia has 8 puppies. 1 more puppy comes, so how many puppies are there now?");
    const at = Date.now();
    expect(await requestSpeech(line, at)).toBeNull();
    expect(await requestSpeech(line, at + SPEECH_RETRY_MS - 1)).toBeNull();
    expect(asked).toHaveLength(1);
  });

  it("asks again once the back-off is over, so a key that arrives later is not shut out for the life of the page", async () => {
    let voice = false;
    const asked = server(() => (voice ? new Response(new Uint8Array([1, 2, 3]), { status: 200 }) : new Response("no voice", { status: 503 })));
    const line = story("Mia has 4 puppies. 4 more puppies come, so how many puppies are there now?");
    const at = Date.now();
    expect(await requestSpeech(line, at)).toBeNull();
    voice = true;
    expect(await requestSpeech(line, at + SPEECH_RETRY_MS)).toMatch(/^blob:/);
    expect(asked).toHaveLength(2);
  });

  it("answers with nothing when the server cannot be reached at all", async () => {
    server(() => {
      throw new Error("offline");
    });
    expect(await requestSpeech(story("Mia has 9 puppies. 2 more puppies come, so how many puppies are there now?"))).toBeNull();
  });
});
