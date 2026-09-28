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

**Status:** ready-for-agent

- [ ] The adapters and the Judge name Sonnet 5.5; no Opus model is called anywhere at run time
- [ ] The refusal fallback is on every call; an adapter test checks the request shape
- [ ] Telemetry prices Sonnet 5.5 correctly (unit test)
- [ ] One live `pnpm coach --real --sessions 3` run succeeds and its latency and cost are noted in the ticket
