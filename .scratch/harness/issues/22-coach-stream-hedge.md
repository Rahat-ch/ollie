# 22: The Coach call streams, is abandoned on silence, and is hedged

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/decisions.md` #9, 38, 39, 41; `docs/evals/preregistration-1.md`, Results › Findings outside the pre-registered lines (1) and the follow-up probe; `scripts/latency-probe.ts` and `docs/evals/latency-probe-2026-09-29T19-50-09-896Z.json`; ticket 03 and ticket 06's Comments; use the `claude-api` skill for current streaming, structured-output and refusal-fallback details. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** Today the Coach call is one non-streamed `client.beta.messages.parse` request. The latency probe showed the tail is occasional slow generation on the API side: one call in about ten stalls for roughly 70 s, in serial use too. The route's 75 s deadline then gives the Learner the Baseline Plan. Waiting on total time cannot tell a stalled call from a long, healthy one.

In the adapter's `runCoach` (behind the `Generation` seam, so the route, the eval, the CLI and the probe all make the same call):
- **Stream the call.** Keep structured output and the refusal fallback exactly as they are. Verify with the `claude-api` skill and the installed SDK's types and source, not from memory, that:
  - a streamed beta request takes `output_config.format` with `betaZodOutputFormat` and still gives a parsed output;
  - `fallbacks: "default"` works on a stream, and where `usage.iterations` arrives in it, so telemetry's attribution of who served the call still holds;
  - which events arrive during effort `high` generation. **If the model can be silent for long stretches while it reasons (no delta of any kind), stop and report to the owner before choosing how silence is measured.**
- **Silence, not total time.** Silence means no token: no content delta of any kind. A `ping` does not count. The clock starts when the request is sent, so a stall before the first token counts.
- **Hedge.** After `COACH_HEDGE_AFTER_MS = 10_000` of silence on the first attempt, send one second request with the same input and keep the first running.
  - Whichever attempt first completes with a parsed output wins, and the other is aborted.
  - An attempt that fails (an error, a refusal, `max_tokens`, unparseable) while the other is still running does not end the call; the call waits for the other.
  - At most one hedge per call.
- **Abandon.** An attempt silent for `COACH_ABANDON_AFTER_MS = 30_000` is aborted. When every attempt has failed or been abandoned, the call ends as a Coach not reached, so the Baseline is used at once (as for the route's deadline). It is not the engine's retry-with-reasons, because nothing was rejected.
- **The caller's signal** still aborts every attempt. The route's 75 s deadline, the device's 90 s, and the engine's rules are unchanged.
- **Telemetry.** A call's record keeps every attempt: its model, tokens, time to first token, longest silence, and outcome (won, lost and aborted, abandoned, failed).
  - An aborted attempt's tokens come from the last usage the stream reported. If the SDK gives no output count for a cut-off stream, estimate it, err high, and say so in a comment.
  - `callDollars`, `costTotals`, `telemetry.byModel` and the daily spend cap all count hedged and abandoned attempts.
  - The call's wall time stays one number, from request to winner.
  - The eval's Cost block prints how many Coach calls hedged and what the extra attempts cost.
  - Stored reports read unchanged.
- **The probe.** `scripts/latency-probe.ts` reports each call's attempts, time to first token, longest silence and whether it hedged. Its fetch log's "time to headers" means something different on a stream; say so.

The orchestrator re-runs the probe once after merge (about $1, approved) and records the effect in this ticket and in `docs/evals/preregistration-1.md`'s exploratory follow-up, clearly labelled. Nothing in Pre-registration 1's results changes.

**Blocked by:** 24 (the route's step changes there)

**Status:** needs-triage (written 2026-09-29, on hold until the owner's review of what the demo needs, decision 41)

- [ ] The request shape is tested off the wire through a stubbed `fetch` that serves an SSE stream, as `src/generation/anthropic.test.ts` does today: streamed, structured output, the fallback, effort `high`
- [ ] On fake timers: 10 s of silence sends exactly one hedge; the hedge wins and the first is aborted; the first resumes, wins, and the hedge is aborted; a `ping` does not reset the clock; a stall before the first token hedges; both silent for 30 s ends as a Coach not reached; the caller's abort aborts both
- [ ] A refusal or `max_tokens` on the winning attempt is rejected as before; a failed attempt waits for the other
- [ ] Telemetry records and prices every attempt; the spend cap counts them; stored reports read unchanged
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm eval --fake`, `pnpm build` and the Coach browser tests pass
- [ ] After merge: the probe re-run is recorded (the orchestrator)
