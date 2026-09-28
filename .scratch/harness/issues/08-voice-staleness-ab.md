# 08: Voice lines know what rendered them, and there is an A/B tool

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 1 › Voice; `.scratch/harness/decisions.md` #30, 31, 32, 33; README's voice section; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** The voice manifest records the model and voice behind every rendered line. Rendering then treats a line as stale when either differs from the configured model and voice, instead of skipping any line that already has a file.

An A/B script renders a fixed set of about 15 lines on two model and voice pairs:
- Hints;
- cheers;
- a few Problems;
- a Story.

A small blind listening page plays the pairs in random order, records which one wins each pair, and saves the tally to a committed JSON file.

The adapter accepts `eleven_v4`. Before rendering, the ticket checks and notes:
- whether Voice Design has a v4 design model;
- what v4 costs in credits per character.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Changing the configured model or voice marks every line stale in a dry run; unchanged config skips them as today
- [ ] The A/B script dry-runs without a key and reports the characters it would spend
- [ ] The listening page hides which side is which until the tally is saved
- [ ] The Voice Design and pricing facts are recorded with sources in the Comments
