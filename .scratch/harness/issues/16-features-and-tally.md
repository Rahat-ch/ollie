# 16: The engine knows every Feature, and hands the Coach a tally

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 3 › Features and the tally; `.scratch/harness/decisions.md` #13, 14, 23; ADR 0005; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** The engine publishes the Feature list: every property its generators know. Examples:
- a sum or difference that crosses ten;
- the larger addend first;
- doubles;
- a teen whole;
- the change unknown;
- the review position.

From the Profile's history, the engine computes the first attempts and the first-try rate per Skill and Feature across every Session.

The tally is added to the Coach's input, in the prompt's evidence format, and it is what the Minimum-Evidence Rule will read. The Coach still never receives a Problem to ask or an answer.

**Blocked by:** 07, 15. Ticket 07's live Sonnet runs must be done before the Coach prompt changes here, or the Arms stop being comparable.

**Status:** ready-for-agent

- [ ] Every Problem any generator can draw gets its Features from the engine, tested across every Skill and structure
- [ ] The tally for a scripted history is exact (unit tests), including across Sessions
- [ ] The Coach's input carries the tally; the fake eval runs
- [ ] The Feature list is written to a committed file that Pre-registration 2 will cite
