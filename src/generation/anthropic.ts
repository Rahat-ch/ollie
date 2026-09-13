/**
 * The Anthropic adapter behind the Generation seam. The Coach (ticket 06)
 * runs once per Session on Opus 5 with structured output, schema-checked
 * before the engine sees it; it never receives or produces a Problem, a
 * number to ask, or an answer (ADR 0001, ADR 0003). The Story writer
 * (ticket 10) runs on Sonnet 5 around the engine's numbers; what it
 * returns is checked by the Story validator, not here. The Parent Summary
 * (ticket 12) runs on Opus 5 over the engine's tally of the Session Log and
 * the Learner Notes, and never sees the Nickname (ADR 0002); the Summary
 * validator, not this adapter, decides whether a Parent reads it.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { STORY_SYSTEM_PROMPT, storyUserMessage } from "@/story/prompt";
import { SUMMARY_SYSTEM_PROMPT, summaryUserMessage } from "@/summary/prompt";
import { COACH_SYSTEM_PROMPT, coachUserMessage } from "./coach-prompt";
import { CoachOutputSchema, parseCoachOutput } from "./coach-schema";
import { SummaryOutputSchema, parseSummaryOutput } from "./summary-schema";
import type { CoachInput, CoachOutput, Generation, StoryInput, StoryOutput, SummaryInput, SummaryOutput } from "./types";

export const COACH_MODEL = "claude-opus-5";
export const STORY_MODEL = "claude-sonnet-5";
export const SUMMARY_MODEL = "claude-opus-5";

const StoryOutputSchema = z.strictObject({ text: z.string().describe("The Story: two sentences, nothing else") });

export type AnthropicGenerationOptions = { readonly apiKey: string };

export function anthropicGeneration(options: AnthropicGenerationOptions): Generation {
  const client = new Anthropic({ apiKey: options.apiKey });

  async function runCoach(input: CoachInput): Promise<CoachOutput> {
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: coachUserMessage(input) }];
    const response = await client.messages.parse({
      model: COACH_MODEL,
      max_tokens: 16000,
      system: COACH_SYSTEM_PROMPT,
      messages,
      output_config: { effort: "high", format: zodOutputFormat(CoachOutputSchema) },
    });
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      throw new Error(`Coach output rejected: the model stopped with ${response.stop_reason}`);
    }
    if (response.parsed_output === null) {
      throw new Error("Coach output rejected: the response could not be parsed as a Coach output");
    }
    const parsed = parseCoachOutput(response.parsed_output);
    if (!parsed.ok) {
      throw new Error(`Coach output rejected: ${parsed.reasons.join("; ")}`);
    }
    return parsed.output;
  }

  async function writeSummary(input: SummaryInput): Promise<SummaryOutput> {
    const response = await client.messages.parse({
      model: SUMMARY_MODEL,
      max_tokens: 4000,
      system: SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: summaryUserMessage(input) }],
      output_config: { effort: "medium", format: zodOutputFormat(SummaryOutputSchema) },
    });
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      throw new Error(`Parent Summary rejected: the model stopped with ${response.stop_reason}`);
    }
    if (response.parsed_output === null) {
      throw new Error("Parent Summary rejected: the response could not be parsed as a Summary");
    }
    const parsed = parseSummaryOutput(response.parsed_output);
    if (!parsed.ok) {
      throw new Error(`Parent Summary rejected: ${parsed.reasons.join("; ")}`);
    }
    return parsed.output;
  }

  async function writeStory(input: StoryInput): Promise<StoryOutput> {
    const response = await client.messages.parse({
      model: STORY_MODEL,
      max_tokens: 4000,
      system: STORY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: storyUserMessage(input) }],
      output_config: { effort: "low", format: zodOutputFormat(StoryOutputSchema) },
    });
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      throw new Error(`Story rejected: the model stopped with ${response.stop_reason}`);
    }
    if (response.parsed_output === null) {
      throw new Error("Story rejected: the response could not be parsed as a Story");
    }
    return { text: response.parsed_output.text.trim() };
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
