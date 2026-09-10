# 03: Loop core with Unit 1 and the Diagnostic Session

**What to build:** From a terminal, a developer runs a scripted Diagnostic Session through the pure Loop and sees a Session Log with Problem IDs and an Assistance State per Problem, updated Knowledge Estimates, and Mastery decisions. The Loop takes a Session Plan, a Profile state, a seed, and an answer policy, and returns the Log and the next state. Skills a (partners to 10) and b (teen numbers as 10 + n) exist as template families with hand-written Hints and engine-computed answers. Bayesian Knowledge Tracing per Skill updates from first attempts only. The Diagnostic Session is a fixed bundled Plan. No I/O anywhere in the Loop.

**Blocked by:** 01 Scaffold

**Status:** ready-for-agent

- [ ] The Loop is a pure function with no network or storage access; the same seed and policy produce the same Log
- [ ] Every Problem has a Profile-unique ID, a Skill, a structure, its numbers, and one Assistance State: first-try correct, Hint-assisted correct, Revealed, unresolved
- [ ] The Knowledge Estimate changes only on first attempts; a Hint-assisted success leaves it unchanged
- [ ] Mastered requires Estimate at or above 0.95 and 8 of the last 10 first attempts correct
- [ ] Skills a and b never emit a Problem whose answer differs from the engine's own arithmetic (property test over many seeds)
- [ ] Response time is stored in the Log and provably does not affect the Estimate
- [ ] A CLI command runs the Diagnostic Session with a scripted policy and prints the Log and Estimates
