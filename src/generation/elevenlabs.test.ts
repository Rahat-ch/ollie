import { describe, expect, it } from "vitest";
import { AUDIO_MIME } from "@/voice/key";
import { elevenLabsGeneration, elevenLabsVoiceDesign, VOICE_OUTPUT_FORMAT } from "./elevenlabs";

const KEY = "elevenlabs-test-key";

type Call = { url: string; init: RequestInit };

/** A stand-in for the vendor: records what was asked and answers with what the API reference documents. */
function recorder(answer: (call: Call) => Response) {
  const calls: Call[] = [];
  const fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({ url: String(input), init });
    return answer({ url: String(input), init });
  };
  return { calls, fetch: fetch as unknown as typeof globalThis.fetch };
}

const audioResponse = () => new Response(new Uint8Array([0x49, 0x44, 0x33, 0x04]), { status: 200 });

const body = (call: Call): Record<string, unknown> => JSON.parse(String(call.init.body)) as Record<string, unknown>;

describe("renderSpeech", () => {
  it("renders one line on the configured voice and model and hands back the audio", async () => {
    const { calls, fetch } = recorder(audioResponse);
    const speech = await elevenLabsGeneration({ apiKey: KEY, voiceId: "ollie-voice", modelId: "eleven_v3", fetch }).renderSpeech({
      text: "You did it!",
    });
    expect(speech).toEqual({ audio: new Uint8Array([0x49, 0x44, 0x33, 0x04]), mimeType: AUDIO_MIME });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`https://api.elevenlabs.io/v1/text-to-speech/ollie-voice?output_format=${VOICE_OUTPUT_FORMAT}`);
    expect(body(calls[0])).toEqual({ text: "You did it!", model_id: "eleven_v3" });
  });

  it("sends the key as a header and never in the URL, and takes the voice and the model from what it was given", async () => {
    const { calls, fetch } = recorder(audioResponse);
    await elevenLabsGeneration({ apiKey: KEY, voiceId: "another-voice", modelId: "eleven_flash_v2_5", fetch }).renderSpeech({ text: "Yes! 7!" });
    expect(calls[0].url).toContain("another-voice");
    expect(calls[0].url).not.toContain(KEY);
    expect(body(calls[0]).model_id).toBe("eleven_flash_v2_5");
    expect(new Headers(calls[0].init.headers).get("xi-api-key")).toBe(KEY);
  });

  it("throws on a refusal, saying the status and never the key", async () => {
    const { fetch } = recorder(() => new Response("nope", { status: 401, statusText: "Unauthorized" }));
    const generation = elevenLabsGeneration({ apiKey: KEY, voiceId: "ollie-voice", modelId: "eleven_v3", fetch });
    await expect(generation.renderSpeech({ text: "You did it!" })).rejects.toThrow(/401/);
    await expect(generation.renderSpeech({ text: "You did it!" })).rejects.not.toThrow(new RegExp(KEY));
  });

  it("throws rather than cache an empty file when nothing comes back", async () => {
    const { fetch } = recorder(() => new Response(new Uint8Array(0), { status: 200 }));
    await expect(
      elevenLabsGeneration({ apiKey: KEY, voiceId: "ollie-voice", modelId: "eleven_v3", fetch }).renderSpeech({ text: "You did it!" }),
    ).rejects.toThrow(/no audio/);
  });
});

describe("elevenLabsVoiceDesign", () => {
  const previews = () =>
    new Response(JSON.stringify({ previews: [{ generated_voice_id: "gen-1", audio_base_64: "SUQz" }, { generated_voice_id: "gen-2", audio_base_64: "SUQz" }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  it("asks for previews of the brief and hands back each one with its generated voice ID and audio", async () => {
    const { calls, fetch } = recorder(previews);
    const designed = await elevenLabsVoiceDesign({ apiKey: KEY, fetch }).design({ brief: "Native English. Warm.", previewText: "You did it!" });
    expect(designed.map((p) => p.generatedVoiceId)).toEqual(["gen-1", "gen-2"]);
    expect(designed[0].audio).toEqual(new Uint8Array([0x49, 0x44, 0x33]));
    expect(calls[0].url).toBe("https://api.elevenlabs.io/v1/text-to-voice/design");
    expect(body(calls[0])).toMatchObject({ voice_description: "Native English. Warm.", text: "You did it!" });
  });

  it("saves the chosen preview as a voice and answers with the ID that goes in ELEVENLABS_VOICE_ID", async () => {
    const { calls, fetch } = recorder(() => new Response(JSON.stringify({ voice_id: "ollie-voice-id" }), { status: 200, headers: { "content-type": "application/json" } }));
    const voiceId = await elevenLabsVoiceDesign({ apiKey: KEY, fetch }).save({ generatedVoiceId: "gen-2", name: "Ollie", brief: "Native English. Warm." });
    expect(voiceId).toBe("ollie-voice-id");
    expect(calls[0].url).toBe("https://api.elevenlabs.io/v1/text-to-voice");
    expect(body(calls[0])).toEqual({ voice_name: "Ollie", voice_description: "Native English. Warm.", generated_voice_id: "gen-2" });
  });

  it("throws when the answer is not the shape the API reference documents", async () => {
    const { fetch } = recorder(() => new Response(JSON.stringify({ previews: "what" }), { status: 200, headers: { "content-type": "application/json" } }));
    await expect(elevenLabsVoiceDesign({ apiKey: KEY, fetch }).design({ brief: "b", previewText: "t" })).rejects.toThrow(/previews/);
  });
});
