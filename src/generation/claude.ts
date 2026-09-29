/**
 * What every Claude call in Ollie shares: the model, and the server-side
 * refusal fallback (decisions 12 and 18 in `.scratch/harness/decisions.md`).
 * The Coach, the Parent Summary, the Story writer and the eval Judge all run
 * on Claude Sonnet 5.5. Each call sends `fallbacks: "default"` under the
 * `server-side-fallback-2026-07-01` beta, so when Sonnet 5.5's safety
 * classifiers decline a benign request, the API re-runs it on the fallback
 * model Anthropic routes that refusal category to, inside the same call,
 * rather than the Coach ending in the Baseline. The fallback exists only on
 * the beta messages endpoint, so every call goes through
 * `client.beta.messages.parse` with `betaZodOutputFormat`, which keeps the
 * structured output. A response the whole chain refused still ends with
 * `stop_reason: "refusal"`, which each caller rejects as before; telemetry
 * reads who served the call from `usage.iterations` (`./telemetry.ts`).
 */
import type Anthropic from "@anthropic-ai/sdk";

/** Every model call runs here. The Opus 5 reports of 2026-09-18 stay as the comparison arm; nothing calls Opus at run time. */
export const CLAUDE_MODEL = "claude-sonnet-5-5";

/** The beta that carries `fallbacks: "default"`; the array form's `-2026-06-01` header would reject it. */
export const REFUSAL_FALLBACK_BETA = "server-side-fallback-2026-07-01";

/** The request fields that turn the server-side refusal fallback on, fresh for each call. */
export const refusalFallback = (): Pick<Anthropic.Beta.Messages.MessageCreateParamsNonStreaming, "betas" | "fallbacks"> => ({
  betas: [REFUSAL_FALLBACK_BETA],
  fallbacks: "default",
});
