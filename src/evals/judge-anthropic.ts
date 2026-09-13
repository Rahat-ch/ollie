/**
 * The Judge on Opus 5 with its written rubrics and structured output. Only
 * the eval command imports this, so nothing that runs on the fake loads
 * the SDK. The same-family limitation (the Judge and the Story writer are
 * both Claude models) is stated in the write-up, not hidden here.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  STORY_JUDGE_SYSTEM_PROMPT,
  storyJudgeUserMessage,
  SUMMARY_JUDGE_SYSTEM_PROMPT,
  summaryJudgeUserMessage,
  type Judge,
  type Judgement,
} from "./judge";

export const JUDGE_MODEL = "claude-opus-5";

const JudgementSchema = z.strictObject({
  pass: z.boolean(),
  reason: z.string().min(1).describe("One sentence"),
});

export function anthropicJudge(options: { readonly apiKey: string }): Judge {
  const client = new Anthropic({ apiKey: options.apiKey });

  async function judge(system: string, message: string): Promise<Judgement> {
    const response = await client.messages.parse({
      model: JUDGE_MODEL,
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: message }],
      output_config: { effort: "medium", format: zodOutputFormat(JudgementSchema) },
    });
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
