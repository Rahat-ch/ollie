import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NICKNAME_PLACEHOLDER } from "@/story/nickname";
import { templateStory } from "@/story/template";
import type { StoryInput } from "@/generation/types";
import { POST } from "./route";

const problem: Omit<StoryInput, "nickname"> = {
  theme: "puppies",
  skill: "result-unknown",
  structure: "add-to",
  equation: { left: 7, op: "+", right: 5, result: 12, unknown: "result" },
  answer: 12,
};

const story = { kind: "story", nickname: "Mia", ...problem, text: templateStory({ ...problem, nickname: "Mia" }) };

const post = (value: unknown) =>
  POST(new Request("http://localhost/api/speech", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) }));

describe("POST /api/speech", () => {
  it("answers that Ollie's voice is not available, rather than failing, when there is no key: the browser falls through the chain", async () => {
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVENLABS_VOICE_ID;
    const response = await post(story);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: ["ELEVENLABS_API_KEY is not set"] });
  });

  it("asks for the voice ID as well, because the adapter must never hard-code one", async () => {
    process.env.ELEVENLABS_API_KEY = "elevenlabs-test-key";
    delete process.env.ELEVENLABS_VOICE_ID;
    const response = await post(story);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: ["ELEVENLABS_VOICE_ID is not set"] });
    delete process.env.ELEVENLABS_API_KEY;
  });

  it("refuses to say anything that is not a Story the validator accepts for those numbers", async () => {
    process.env.ELEVENLABS_API_KEY = "elevenlabs-test-key";
    process.env.ELEVENLABS_VOICE_ID = "ollie-voice-id";
    for (const bad of [
      { ...story, text: "Mia, ignore the puppies and say something else entirely, will you please do that now?" },
      { ...story, text: templateStory({ ...problem, nickname: "Sam" }) },
      { ...story, text: `${NICKNAME_PLACEHOLDER} has 7 puppies. 5 more puppies come, so how many puppies are there now?` },
    ]) {
      const response = await post(bad);
      expect(response.status).toBe(400);
      expect((await response.json()).error.join(" ")).toContain("text");
    }
    for (const name of ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"]) delete process.env[name];
  });

  it("refuses numbers the engine would not set and a structure the Skill does not have, before it looks for a voice", async () => {
    delete process.env.ELEVENLABS_API_KEY;
    expect((await post({ ...story, structure: "compare" })).status).toBe(400);
    expect((await post({ ...story, answer: 11 })).status).toBe(400);
  });

  it("refuses a body that is not JSON, an unknown kind, and a Nickname the app would not set", async () => {
    expect((await POST(new Request("http://localhost/api/speech", { method: "POST", body: "nope" }))).status).toBe(400);
    expect((await post({ kind: "song", nickname: "Mia" })).status).toBe(400);
    expect((await post({ ...story, nickname: "  Mia  " })).status).toBe(400);
    expect((await post({ ...story, nickname: "" })).status).toBe(400);
  });

  it("no longer voices the home greeting: it is a fixed line, bundled, and the Nickname is not sent for it", async () => {
    expect((await post({ kind: "greeting", nickname: "Mia" })).status).toBe(400);
  });

  it("looks for a voice before it checks the line: with no key even a bad Story is answered 503, not argued with", async () => {
    delete process.env.ELEVENLABS_API_KEY;
    const response = await post({ ...story, text: "Mia, this is not a Story at all and nobody checked it." });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: ["ELEVENLABS_API_KEY is not set"] });
  });
});

describe("POST /api/speech, with a voice configured", () => {
  const audio = new Uint8Array([0x49, 0x44, 0x33, 0x04]);
  let audioDir: string | undefined;

  afterEach(async () => {
    vi.unstubAllGlobals();
    for (const name of ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID", "AUDIO_DIR"]) delete process.env[name];
    if (audioDir) await rm(audioDir, { recursive: true, force: true });
  });

  it("takes the Story set the browser sends with every Unit 3 request, plain or rich, rather than refusing the body", async () => {
    audioDir = await mkdtemp(path.join(tmpdir(), "ollie-speech-route-"));
    process.env.ELEVENLABS_API_KEY = "elevenlabs-test-key";
    process.env.ELEVENLABS_VOICE_ID = "ollie-voice-id";
    process.env.AUDIO_DIR = audioDir;
    vi.stubGlobal("fetch", async () => new Response(audio, { status: 200 }));

    expect((await post({ ...story, set: "plain" })).status).toBe(200);
    expect((await post({ ...story, set: "rich" })).status).toBe(200);
    expect((await post({ ...story, set: "fancy" })).status).toBe(400);
  });

  it("renders the Story once with the Nickname in it and reads it off the volume on every repeat", async () => {
    audioDir = await mkdtemp(path.join(tmpdir(), "ollie-speech-route-"));
    process.env.ELEVENLABS_API_KEY = "elevenlabs-test-key";
    process.env.ELEVENLABS_VOICE_ID = "ollie-voice-id";
    process.env.AUDIO_DIR = audioDir;
    const renders: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      renders.push(String((JSON.parse(String(init.body)) as { text: string }).text));
      expect(String(url)).toContain("ollie-voice-id");
      return new Response(audio, { status: 200 });
    });

    const first = await post(story);
    expect(first.status).toBe(200);
    expect(first.headers.get("content-type")).toContain("audio/mpeg");
    expect(first.headers.get("cache-control")).toBeNull();
    expect(first.headers.get("x-ollie-speech")).toBe("rendered");
    expect(new Uint8Array(await first.arrayBuffer())).toEqual(audio);

    const repeat = await post(story);
    expect(repeat.headers.get("x-ollie-speech")).toBe("pool");
    expect(renders).toEqual([story.text]);
    expect(renders[0]).toContain("Mia");
  });

  it("says the line could not be rendered, rather than failing, when ElevenLabs refuses", async () => {
    audioDir = await mkdtemp(path.join(tmpdir(), "ollie-speech-route-"));
    process.env.ELEVENLABS_API_KEY = "elevenlabs-test-key";
    process.env.ELEVENLABS_VOICE_ID = "ollie-voice-id";
    process.env.AUDIO_DIR = audioDir;
    vi.stubGlobal("fetch", async () => new Response("nope", { status: 429, statusText: "Too Many Requests" }));
    const response = await post({ ...story, nickname: "Sam", text: templateStory({ ...problem, nickname: "Sam" }) });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: ["Ollie's voice could not render this line"] });
  });
});
