# 06: Coach in the Loop

**What to build:** A developer runs a Simulated Learner through five Coach-planned Sessions from the CLI and reads the Learner Notes evolving: Hypotheses with claim, status, confidence, evidence as Problem IDs, and a next test, plus each Session Plan. The Generation seam exists as one interface with four operations (write Story, run Coach, write Summary, render speech) and a fake used by every test. The real Coach adapter calls Opus 5 with structured output. The engine rejects any Hypothesis citing a Problem ID not in the Log and any Plan outside the Plan Space, retries once with the reason, then falls back to a Baseline Plan so play never stops.

**Blocked by:** 05 Simulated Learners

**Status:** ready-for-agent

- [ ] The Generation interface has exactly four operations and a fake that returns deterministic, valid output
- [ ] The Coach adapter returns Learner Notes and a Session Plan validated against a schema; malformed output is rejected before the engine sees it
- [ ] A Hypothesis citing an unknown Problem ID is rejected with a reason; a Plan outside the Plan Space is rejected with a reason
- [ ] After one failed retry the engine uses a Baseline Plan and records that it did so
- [ ] The Coach never receives or produces a Problem, a number to ask, or an answer
- [ ] A CLI command runs a Simulated Learner for N Coach Sessions and prints the Notes after each; with the fake it needs no network
