/**
 * The ElevenLabs adapter behind the Generation seam: `renderSpeech`, the one
 * operation Claude does not do. The voice is the one designed in Voice
 * Design and named by ELEVENLABS_VOICE_ID; the model by ELEVENLABS_MODEL_ID
 * (src/lib/env). Neither is written down here. Nothing on the Learner's
 * path awaits this adapter: a Story's audio is rendered once at creation
 * time and cached, and every fixed line is rendered at build time, so a
 * Session that cannot reach ElevenLabs falls through the chain instead
 * (src/voice/chain).
 *
 * Endpoints, from the API reference (docs/research/k5-math-game/06):
 *   POST /v1/text-to-speech/{voice_id}   one line of speech, as an MP3 body
 *   POST /v1/text-to-voice/design        three previews of a described voice
 *   POST /v1/text-to-voice               save a preview as a reusable voice
 */
import { AUDIO_MIME } from "@/voice/key";
import type { Generation, SpeechInput, SpeechOutput } from "./types";

export const VOICE_API = "https://api.elevenlabs.io/v1";

/** 128 kbps MP3: 192 needs the Creator tier, and this is what the Starter tier renders (see THIRD_PARTY.md). */
export const VOICE_OUTPUT_FORMAT = "mp3_44100_128";

/** The platform's fetch, unless a test hands one in. */
export type ElevenLabsFetch = typeof globalThis.fetch;

export type ElevenLabsOptions = {
  readonly apiKey: string;
  readonly voiceId: string;
  readonly modelId: string;
  readonly fetch?: ElevenLabsFetch;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** The key goes in the header and never in a URL, a message, or a file name. */
function headers(apiKey: string, accept: string): HeadersInit {
  return { "xi-api-key": apiKey, "content-type": "application/json", accept };
}

async function refuse(where: string, response: Response): Promise<never> {
  throw new Error(`ElevenLabs refused to ${where}: ${response.status} ${response.statusText}`);
}

export function elevenLabsGeneration(options: ElevenLabsOptions): Pick<Generation, "renderSpeech"> {
  const call = options.fetch ?? globalThis.fetch;

  async function renderSpeech({ text }: SpeechInput): Promise<SpeechOutput> {
    const url = `${VOICE_API}/text-to-speech/${encodeURIComponent(options.voiceId)}?output_format=${VOICE_OUTPUT_FORMAT}`;
    const response = await call(url, {
      method: "POST",
      headers: headers(options.apiKey, AUDIO_MIME),
      body: JSON.stringify({ text, model_id: options.modelId }),
    });
    if (!response.ok) await refuse("render a line", response);
    const audio = new Uint8Array(await response.arrayBuffer());
    if (audio.length === 0) throw new Error("ElevenLabs returned no audio for a line");
    return { audio, mimeType: AUDIO_MIME };
  }

  return { renderSpeech };
}

export type VoiceDesignOptions = {
  readonly apiKey: string;
  readonly fetch?: ElevenLabsFetch;
};

/** One of the three voices Voice Design proposes for a brief: keep its ID, listen to its audio. */
export type VoicePreview = {
  readonly generatedVoiceId: string;
  readonly audio: Uint8Array;
};

const decodeBase64 = (text: string): Uint8Array => Uint8Array.from(Buffer.from(text, "base64"));

/** Voice Design, used once by `pnpm voice:design` and never on the Learner's path. */
export function elevenLabsVoiceDesign(options: VoiceDesignOptions) {
  const call = options.fetch ?? globalThis.fetch;

  async function design({ brief, previewText }: { readonly brief: string; readonly previewText: string }): Promise<VoicePreview[]> {
    const response = await call(`${VOICE_API}/text-to-voice/design`, {
      method: "POST",
      headers: headers(options.apiKey, "application/json"),
      body: JSON.stringify({ voice_description: brief, text: previewText }),
    });
    if (!response.ok) await refuse("design a voice", response);
    const answer: unknown = await response.json();
    const previews = isRecord(answer) ? answer.previews : undefined;
    if (!Array.isArray(previews)) throw new Error("ElevenLabs answered Voice Design without previews");
    return previews.map((preview: unknown): VoicePreview => {
      if (!isRecord(preview) || typeof preview.generated_voice_id !== "string" || typeof preview.audio_base_64 !== "string") {
        throw new Error("ElevenLabs answered Voice Design with a preview that has no generated voice ID and audio");
      }
      return { generatedVoiceId: preview.generated_voice_id, audio: decodeBase64(preview.audio_base_64) };
    });
  }

  /** Saves one preview as a voice in the library and answers with the ID to put in ELEVENLABS_VOICE_ID. */
  async function save({ generatedVoiceId, name, brief }: { readonly generatedVoiceId: string; readonly name: string; readonly brief: string }): Promise<string> {
    const response = await call(`${VOICE_API}/text-to-voice`, {
      method: "POST",
      headers: headers(options.apiKey, "application/json"),
      body: JSON.stringify({ voice_name: name, voice_description: brief, generated_voice_id: generatedVoiceId }),
    });
    if (!response.ok) await refuse("save a designed voice", response);
    const answer: unknown = await response.json();
    if (!isRecord(answer) || typeof answer.voice_id !== "string") throw new Error("ElevenLabs saved a voice without answering with its voice ID");
    return answer.voice_id;
  }

  return { design, save };
}
