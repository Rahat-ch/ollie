/**
 * The Judge on Sonnet 5.5 with its written rubrics and structured output,
 * sending the same server-side refusal fallback as every other call
 * (`src/generation/claude.ts`). Only the eval command imports this, so
 * nothing that runs on the fake loads the SDK. The same-family limitation
 * (the Judge and the writers it grades are the same Claude model) is stated
 * in docs/evals/README.md, not hidden here; the calibration gate re-checks
 * the Judge on every run.
 */
import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL, refusalFallback } from "@/generation/claude";
import { recordApiCall, type Telemetry } from "@/generation/telemetry";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import {
  STORY_JUDGE_SYSTEM_PROMPT,
  storyJudgeUserMessage,
  SUMMARY_JUDGE_SYSTEM_PROMPT,
  summaryJudgeUserMessage,
  type Judge,
  type Judgement,
} from "./judge";

export const JUDGE_MODEL = CLAUDE_MODEL;

const JudgementSchema = z.strictObject({
  pass: z.boolean(),
  reason: z.string().min(1).describe("One sentence"),
});

export type AnthropicJudgeOptions = {
  readonly apiKey: string;
  readonly telemetry?: Telemetry;
  /** The HTTP client the SDK sends with; only tests pass one, to read the request the Judge builds. */
  readonly fetch?: typeof fetch;
};

export function anthropicJudge(options: AnthropicJudgeOptions): Judge {
  const client = new Anthropic({ apiKey: options.apiKey, fetch: options.fetch });

  async function judge(system: string, message: string): Promise<Judgement> {
    const response = await recordApiCall(options.telemetry, "judge", JUDGE_MODEL, () => client.beta.messages.parse({
      model: JUDGE_MODEL,
      ...refusalFallback(),
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: message }],
      output_config: { effort: "medium", format: betaZodOutputFormat(JudgementSchema) },
    }));
    if (response.parsed_output === null) {
      throw new Error(`Judge output rejected: the model stopped with ${response.stop_reason}`);
    }
    return response.parsed_output;
  }

  return {
    judgeStory: (story) => judge(STORY_JUDGE_SYSTEM_PROMPT, storyJudgeUserMessage(story)),
    judgeSummary: (summary) => judge(SUMMARY_JUDGE_SYSTEM_PROMPT, summaryJudgeUserMessage(summary)),
  };
}
