/**
 * The Anthropic adapter behind the Generation seam. The Coach (ticket 06)
 * runs once per Session on Opus 5 with structured output, schema-checked
 * before the engine sees it; it never receives or produces a Problem, a
 * number to ask, or an answer (ADR 0001, ADR 0003). The Story writer
 * (ticket 10) runs on Sonnet 5 around the engine's numbers; what it
 * returns is checked by the Story validator, not here.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { STORY_SYSTEM_PROMPT, storyUserMessage } from "@/story/prompt";
import { COACH_SYSTEM_PROMPT, coachUserMessage } from "./coach-prompt";
import { CoachOutputSchema, parseCoachOutput } from "./coach-schema";
import type { CoachInput, CoachOutput, Generation, StoryInput, StoryOutput } from "./types";

export const COACH_MODEL = "claude-opus-5";
export const STORY_MODEL = "claude-sonnet-5";

const StoryOutputSchema = z.strictObject({ text: z.string().describe("The Story: two sentences, nothing else") });

export type AnthropicGenerationOptions = { readonly apiKey: string };

const notBuilt = (op: string, ticket: string) => async (): Promise<never> => {
  throw new Error(`${op} is not built yet (ticket ${ticket})`);
};

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
    writeSummary: notBuilt("writeSummary", "12"),
    renderSpeech: notBuilt("renderSpeech", "11"),
  };
}
