/**
 * The Anthropic adapter behind the Generation seam. The Coach (ticket 06)
 * runs once per Session on Sonnet 5.5 at effort high with structured output, schema-checked
 * before the engine sees it; it never receives or produces a Problem, a
 * number to ask, or an answer (ADR 0001, ADR 0003). The Story writer
 * (ticket 10) runs on Sonnet 5.5 around the engine's numbers; what it
 * returns is checked by the Story validator, not here. The Parent Summary
 * (ticket 12) runs on Sonnet 5.5 over the engine's tally of the Session Log and
 * the Learner Notes, and never sees the Nickname (ADR 0002); the Summary
 * validator, not this adapter, decides whether a Parent reads it. The Coach
 * and the Summary hand the caller's abort signal to the SDK call, so the
 * route can cancel a call the device gave up on or that passed its deadline.
 * Every call sends the server-side refusal fallback (`./claude.ts`), so a
 * false safety decline is answered by the fallback model, not the Baseline.
 */
import { decodeEscapes, decodeStrings } from "./decode-escapes";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { STORY_SYSTEM_PROMPT, storyUserMessage } from "@/story/prompt";
import { SUMMARY_SYSTEM_PROMPT, summaryUserMessage } from "@/summary/prompt";
import { COACH_SYSTEM_PROMPT, coachUserMessage } from "./coach-prompt";
import { CoachOutputSchema, parseCoachOutput } from "./coach-schema";
import { SummaryOutputSchema, parseSummaryOutput } from "./summary-schema";
import { CLAUDE_MODEL, refusalFallback } from "./claude";
import { recordApiCall, type Telemetry } from "./telemetry";
import type { CallOptions, CoachInput, CoachOutput, Generation, StoryInput, StoryOutput, SummaryInput, SummaryOutput } from "./types";

export const COACH_MODEL = CLAUDE_MODEL;
export const STORY_MODEL = CLAUDE_MODEL;
export const SUMMARY_MODEL = CLAUDE_MODEL;

const StoryOutputSchema = z.strictObject({ text: z.string().describe("The Story: two sentences, nothing else") });

export type AnthropicGenerationOptions = {
  readonly apiKey: string;
  /** Where each call reports its tokens and its wall time. The eval CLI installs a recorder; the app's routes install the daily spend cap, which keeps only the dollars (src/lib/spend-cap.ts). */
  readonly telemetry?: Telemetry;
  /** The HTTP client the SDK sends with; only tests pass one, to read the request the adapter builds. */
  readonly fetch?: typeof fetch;
};

export function anthropicGeneration(options: AnthropicGenerationOptions): Generation {
  const client = new Anthropic({ apiKey: options.apiKey, fetch: options.fetch });
  const { telemetry } = options;

  async function runCoach(input: CoachInput, options: CallOptions = {}): Promise<CoachOutput> {
    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: coachUserMessage(input) }];
    const response = await recordApiCall(telemetry, "coach", COACH_MODEL, () => client.beta.messages.parse({
      model: COACH_MODEL,
      ...refusalFallback(),
      max_tokens: 16000,
      system: COACH_SYSTEM_PROMPT,
      messages,
      output_config: { effort: "high", format: betaZodOutputFormat(CoachOutputSchema) },
    }, { signal: options.signal }));
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      throw new Error(`Coach output rejected: the model stopped with ${response.stop_reason}`);
    }
    if (response.parsed_output === null) {
      throw new Error("Coach output rejected: the response could not be parsed as a Coach output");
    }
    const parsed = parseCoachOutput(decodeStrings(response.parsed_output));
    if (!parsed.ok) {
      throw new Error(`Coach output rejected: ${parsed.reasons.join("; ")}`);
    }
    return parsed.output;
  }

  async function writeSummary(input: SummaryInput, options: CallOptions = {}): Promise<SummaryOutput> {
    const response = await recordApiCall(telemetry, "summary", SUMMARY_MODEL, () => client.beta.messages.parse({
      model: SUMMARY_MODEL,
      ...refusalFallback(),
      max_tokens: 4000,
      system: SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: summaryUserMessage(input) }],
      output_config: { effort: "medium", format: betaZodOutputFormat(SummaryOutputSchema) },
    }, { signal: options.signal }));
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      throw new Error(`Parent Summary rejected: the model stopped with ${response.stop_reason}`);
    }
    if (response.parsed_output === null) {
      throw new Error("Parent Summary rejected: the response could not be parsed as a Summary");
    }
    const parsed = parseSummaryOutput(decodeStrings(response.parsed_output));
    if (!parsed.ok) {
      throw new Error(`Parent Summary rejected: ${parsed.reasons.join("; ")}`);
    }
    return parsed.output;
  }

  async function writeStory(input: StoryInput): Promise<StoryOutput> {
    const response = await recordApiCall(telemetry, "story", STORY_MODEL, () => client.beta.messages.parse({
      model: STORY_MODEL,
      ...refusalFallback(),
      max_tokens: 4000,
      system: STORY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: storyUserMessage(input) }],
      output_config: { effort: "low", format: betaZodOutputFormat(StoryOutputSchema) },
    }));
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      throw new Error(`Story rejected: the model stopped with ${response.stop_reason}`);
    }
    if (response.parsed_output === null) {
      throw new Error("Story rejected: the response could not be parsed as a Story");
    }
    return { text: decodeEscapes(response.parsed_output.text).trim() };
  }

  return {
    writeStory,
    runCoach,
    writeSummary,
    // Ollie's voice is ElevenLabs, not Claude: src/generation/elevenlabs.ts.
    renderSpeech: async (): Promise<never> => {
      throw new Error("renderSpeech is ElevenLabs, not Anthropic (src/generation/elevenlabs.ts)");
    },
  };
}
