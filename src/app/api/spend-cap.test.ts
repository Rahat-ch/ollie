/**
 * The daily spend cap across the four model routes, as the server runs them:
 * the Anthropic adapter is the Generation fake reporting what each call
 * cost, and ElevenLabs is a stubbed fetch. The clock is the system clock,
 * faked to a fixed day, so the cap's midnight UTC is reached by moving it.
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { coachInput } from "@/coach";
import { DIAGNOSTIC_PLAN, emptyNotes, newProfile, runSession, scripted } from "@/loop";
import { zeroCall, type ModelCall, type Telemetry, type TelemetryOperation } from "@/generation/telemetry";
import type { StoryInput } from "@/generation/types";
import { CAP_REACHED, DAILY_SPEECH_CHARACTERS, modelSpend, speechCharacters } from "@/lib/spend-cap";
import { summaryInput } from "@/summary/summary";
import { templateStory } from "@/story/template";
import { POST as coach } from "./coach/route";
import { POST as speech } from "./speech/route";
import { POST as story } from "./story/route";
import { POST as summary } from "./summary/route";

/** Every model call the fake adapter made, by operation. */
const made = vi.hoisted(() => ({ calls: [] as string[] }));

/** A Sonnet 5.5 call costing $2: 200,000 output tokens at $10 per million. */
const twoDollars = (operation: TelemetryOperation): ModelCall => ({ ...zeroCall(operation), model: "claude-sonnet-5-5", outputTokens: 200_000 });

vi.mock("@/generation/anthropic", async () => {
  const { fakeGeneration } = await import("@/generation/fake");
  return {
    anthropicGeneration: ({ telemetry }: { telemetry?: Telemetry }) => {
      const fake = fakeGeneration();
      const priced =
        <I, O>(operation: TelemetryOperation, run: (input: I) => Promise<O>) =>
        async (input: I): Promise<O> => {
          made.calls.push(operation);
          const output = await run(input);
          telemetry?.record(twoDollars(operation));
          return output;
        };
      return fakeGeneration({
        runCoach: priced("coach", fake.runCoach),
        writeSummary: priced("summary", fake.writeSummary),
        writeStory: priced("story", fake.writeStory),
      });
    },
  };
});

const result = runSession(DIAGNOSTIC_PLAN, newProfile(), "seed-r", scripted("ffhrfffhf"));
const problem: Omit<StoryInput, "nickname"> = {
  theme: "puppies",
  skill: "result-unknown",
  structure: "add-to",
  equation: { left: 9, op: "+", right: 11, result: 20, unknown: "result" },
  answer: 20,
};
const spoken = (nickname: string) => ({ kind: "story", nickname, ...problem, text: templateStory({ ...problem, nickname }) });

const post = (handler: (request: Request) => Promise<Response>, route: string, value: unknown) =>
  handler(new Request(`http://localhost/api/${route}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) }));

const askCoach = () => post(coach, "coach", coachInput(result, emptyNotes()));
const askSummary = () => post(summary, "summary", summaryInput(result, emptyNotes(), []));
const askStory = () => post(story, "story", problem);
const askSpeech = (nickname: string) => post(speech, "speech", spoken(nickname));

let dir: string;
const rendered: string[] = [];

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2031-03-04T10:00:00Z"));
  dir = await mkdtemp(path.join(tmpdir(), "ollie-cap-"));
  Object.assign(process.env, {
    ANTHROPIC_API_KEY: "test-key",
    ELEVENLABS_API_KEY: "elevenlabs-test-key",
    ELEVENLABS_VOICE_ID: "ollie-voice-id",
    AUDIO_DIR: dir,
  });
  made.calls.length = 0;
  rendered.length = 0;
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    rendered.push(String((JSON.parse(String(init.body)) as { text: string }).text));
    return new Response(new Uint8Array([0x49, 0x44, 0x33, 0x04]), { status: 200 });
  });
});

afterEach(async () => {
  // Each allowance is read on a day no test plays on, so the next test's day is a new one and starts from nothing.
  vi.setSystemTime(new Date("2031-01-01T00:00:00Z"));
  modelSpend().spent();
  speechCharacters().spent();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  for (const name of ["ANTHROPIC_API_KEY", "ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID", "AUDIO_DIR"]) delete process.env[name];
  await rm(dir, { recursive: true, force: true });
});

describe("the daily spend cap on the model routes", () => {
  it("prices each route's calls into the day and, past $5, answers every model route as unreachable", async () => {
    // A line voiced while the day is open, so it is on the volume later.
    expect((await askSpeech("Mia")).status).toBe(200);

    expect((await askCoach()).status).toBe(200);
    expect((await askSummary()).status).toBe(200);
    expect(modelSpend().spent()).toBeCloseTo(4);
    expect(await (await askStory()).json()).toMatchObject({ source: "generated" });
    expect(modelSpend().spent()).toBeCloseTo(6);
    expect(made.calls).toEqual(["coach", "summary", "story"]);

    // Past the cap: the Coach and the Summary say 503, which the device takes as a model it could not reach.
    for (const answer of [await askCoach(), await askSummary()]) {
      expect(answer.status).toBe(503);
      expect(await answer.json()).toEqual({ error: CAP_REACHED });
    }
    // The Story route answers the template, as it does with no key.
    const another = { ...problem, equation: { ...problem.equation, left: 8, result: 19 }, answer: 19 };
    const text = await (await post(story, "story", another)).json();
    expect(text).toMatchObject({ source: "template" });
    // No model was called for any of them.
    expect(made.calls).toEqual(["coach", "summary", "story"]);

    // Speech: a line already on the volume is still served; a new one is not rendered.
    expect((await askSpeech("Mia")).headers.get("x-ollie-speech")).toBe("pool");
    expect((await askSpeech("Sam")).status).toBe(503);
    expect(rendered).toEqual([spoken("Mia").text]);
  });

  it("opens again at midnight UTC, and not a moment before", async () => {
    modelSpend().spend(5);
    vi.setSystemTime(new Date("2031-03-04T23:59:59.999Z"));
    expect((await askCoach()).status).toBe(503);
    vi.setSystemTime(new Date("2031-03-05T00:00:00.000Z"));
    expect((await askCoach()).status).toBe(200);
    expect(made.calls).toEqual(["coach"]);
  });

  it("stops new speech renders once the day's characters are spent, while the model routes stay open", async () => {
    speechCharacters().spend(DAILY_SPEECH_CHARACTERS);
    expect((await askSpeech("Sam")).status).toBe(503);
    expect(rendered).toEqual([]);
    expect((await askCoach()).status).toBe(200);
    vi.setSystemTime(new Date("2031-03-05T00:00:00Z"));
    expect((await askSpeech("Sam")).status).toBe(200);
  });

  it("counts each render's characters toward the day", async () => {
    await askSpeech("Mia");
    expect(speechCharacters().spent()).toBe(spoken("Mia").text.length);
    // A repeat comes off the volume and costs nothing.
    await askSpeech("Mia");
    expect(speechCharacters().spent()).toBe(spoken("Mia").text.length);
  });
});
