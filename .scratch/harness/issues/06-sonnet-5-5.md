# 06: Every model call runs on Sonnet 5.5

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 1 › Models; `.scratch/harness/decisions.md` #12, 18; ADR 0003; use the `claude-api` skill for current Sonnet 5.5 request details (effort, refusal fallback); `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** These all run on Claude Sonnet 5.5 (`claude-sonnet-5-5`):
- the Coach, at effort `high`;
- the Parent Summary;
- the Story writer;
- the eval Judge.

Every call sends the server-side refusal fallback (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`), so a false safety decline does not end in the Baseline.

The telemetry's price table gains Sonnet 5.5 at $2 input and $10 output per million tokens, so cost per Session is measured. ADR 0003 already records the change. The model names in the README and in the evals methods doc follow it.

**Blocked by:** 03

**Status:** resolved

- [x] The adapters and the Judge name Sonnet 5.5; no Opus model is called anywhere at run time
- [x] The refusal fallback is on every call; an adapter test checks the request shape
- [x] Telemetry prices Sonnet 5.5 correctly (unit test)
- [x] One live `pnpm coach --real --sessions 3` run succeeds and its latency and cost are noted in the ticket

## Comments

**2026-09-28, implementation.** One model id, `CLAUDE_MODEL = "claude-sonnet-5-5"`, in a new `src/generation/claude.ts`, with `refusalFallback()`: `{ betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }`. `COACH_MODEL`, `SUMMARY_MODEL`, `STORY_MODEL` (`src/generation/anthropic.ts`) and `JUDGE_MODEL` (`src/evals/judge-anthropic.ts`) are all that id, and every one of the four calls spreads `refusalFallback()` into its request. `grep` finds no Opus id in `src/` outside the price table, which keeps Opus 5 for the stored reports. The fallback is a beta parameter and exists only on the beta messages endpoint, so the four calls moved from `client.messages.parse` with `zodOutputFormat` to `client.beta.messages.parse` with `betaZodOutputFormat` (`@anthropic-ai/sdk/helpers/beta/zod`), both in the installed SDK 0.125.0. That keeps the structured output: the SDK's beta `parse` adds its own `structured-outputs-2025-12-15` beta next to ours, and `parsed_output` works as before. Efforts: the Coach `high`, set explicitly (the model's default, recalibrated from Sonnet 5, per decision 12); the Summary `medium`, the Judge `medium` and the Story `low`, all unchanged, since the decision says no effort sweep. No call sends `thinking` or a forced `tool_choice`, the two things Sonnet 5.5 answers with a 400. A response the whole fallback chain refused still ends with `stop_reason: "refusal"` and is rejected as before.

Request shape, tested off the wire. `anthropicGeneration` and `anthropicJudge` take an optional `fetch`, which only tests pass. `src/generation/anthropic.test.ts` answers each call from a stubbed `fetch` with the fake's own output, so the SDK's parser runs for real, and checks each of the four requests: `/v1/messages?beta=true`, `model: "claude-sonnet-5-5"`, `fallbacks: "default"`, the `server-side-fallback-2026-07-01` header (and not the array form's `-2026-06-01`), a `json_schema` output format, no `thinking` and no `tool_choice`, effort `high` on the Coach. It also checks that a refusal the whole chain returned is still rejected.

Telemetry. `MODEL_PRICES` gains `claude-sonnet-5-5` at $2 in and $10 out per million tokens. The cache shares already in the table give its published cache read ($0.20) and 5-minute write ($2.50), and a test checks all four. Sonnet 5 stays in the table because it is where the fallback sends a declined call (`cyber` and `frontier_llm` declines on this model). A fallback changes who served a call. The API reports each attempt in `usage.iterations`: a `message` entry for the requested model, a `fallback_message` entry for the fallback, each with its own model and tokens. The top-level usage then covers only the serving attempt. `recordApiCall` now reads that through `usageAttempts`. With no `fallback_message` the call is recorded as before, as the model it named, with the top-level usage. With one, it is recorded as the fallback's model and tokens, and each declined attempt is kept in a new optional `ModelCall.declined`. `callDollars` prices each attempt at its own model's rate, and `costTotals` counts the declined attempts' tokens and models toward the call. `telemetry.byModel` adds each attempt to the model it ran on, and the call's wall time is counted once. A declined attempt is counted in full. Whether a decline before any output is billed depends on its refusal category, so the estimate errs high. Stored reports have no `declined` field and read unchanged. Tests are in `telemetry.test.ts` (the attempts read from iterations, the pricing, the per-model split) and in `anthropic.test.ts` (a call the fallback served, recorded through the adapter).

`pnpm coach` now installs a recorder and ends with the eval's Cost block (calls, tokens, p50, p95, dollars per Coach call and per Session). Before this it printed no cost or latency, so the live run below could not have noted them.

Docs: README (the pool, `/api/coach`, `pnpm coach --real`, the `src/generation/` entry), `docs/evals/README.md` (the Judge's model; the price table and the fallback attribution in the telemetry section), and the CLI headers. CONTEXT.md names no model. The write-up of the three Opus 5 runs and the stored reports are history and were left as they are.

Verified with `pnpm typecheck`, `pnpm lint`, `pnpm test` (70 files, 645 tests), `pnpm eval --fake` (its report and redrawn charts not committed) and `pnpm build`.

Not done here. The live run is unticked because no model was called in this work. The orchestrator runs `pnpm coach --real --sessions 3` after merge and notes the latency and cost from its Cost block here. The comments in `src/app/api/coach/route.ts`, `src/app/api/summary/route.ts`, `src/app/api/story/route.ts` and `src/play/coaching.ts` still say Opus 5 or Sonnet 5 (and `coaching.ts` still quotes Opus 5's 71 s). Ticket 04 is changing those files in parallel, so they were left for it or a follow-up. That the server accepts this exact body (`fallbacks: "default"` with a structured-output format on `claude-sonnet-5-5`) is taken from the API reference and the SDK's types, not from a live call.

**2026-09-28, the live check (orchestrator).** After merge, `pnpm coach --real --sessions 2 --assert` ran on the real `claude-sonnet-5-5` with the refusal fallback: the crossing-ten-weakness Learner, the Diagnostic Session plus two Coach-planned Sessions, three Coach calls. Evidence Integrity 1.00 over 22 citations; Plans 3 Coach, 0 retry, 0 Baseline; the smoke check passed. Coach latency p50 11.0 s, p95 17.9 s (38.7 s over three calls); cost $0.0621 in all, **$0.0207 per Session**, against about 71 s and $0.21 per Session on Opus 5 at high effort in the live reports of 2026-09-18. Three early Sessions are not a measurement: the Notes the Coach carries grow over twenty Sessions, and so will its input, output and latency. Ticket 07's pre-registered runs are the measurement; this is the evidence that the request shape (beta parse, `fallbacks: "default"`, structured output) is accepted by the API and that p95 sits far under the route's 75 s deadline.

