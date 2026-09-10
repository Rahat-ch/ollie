# 03: Loop core with Unit 1 and the Diagnostic Session

**What to build:** From a terminal, a developer runs a scripted Diagnostic Session through the pure Loop and sees a Session Log with Problem IDs and an Assistance State per Problem, updated Knowledge Estimates, and Mastery decisions. The Loop takes a Session Plan, a Profile state, a seed, and an answer policy, and returns the Log and the next state. Skills a (partners to 10) and b (teen numbers as 10 + n) exist as template families with hand-written Hints and engine-computed answers. Bayesian Knowledge Tracing per Skill updates from first attempts only. The Diagnostic Session is a fixed bundled Plan. No I/O anywhere in the Loop.

**Blocked by:** 01 Scaffold

**Status:** resolved

- [x] The Loop is a pure function with no network or storage access; the same seed and policy produce the same Log
- [x] Every Problem has a Profile-unique ID, a Skill, a structure, its numbers, and one Assistance State: first-try correct, Hint-assisted correct, Revealed, unresolved
- [x] The Knowledge Estimate changes only on first attempts; a Hint-assisted success leaves it unchanged
- [x] Mastered requires Estimate at or above 0.95 and 8 of the last 10 first attempts correct
- [x] Skills a and b never emit a Problem whose answer differs from the engine's own arithmetic (property test over many seeds)
- [x] Response time is stored in the Log and provably does not affect the Estimate
- [x] A CLI command runs the Diagnostic Session with a scripted policy and prints the Log and Estimates

## Comments

**2026-09-10, implementation.** The Loop lives in `src/loop/` and is exported from `src/loop/index.ts`. `runSession(plan, profile, seed, policy)` returns `{ log, profile, newlyMastered }`; it is built on step functions (`startSession`, `answerProblem`, `abandonSession`, `finishSession`) so the browser can drive a Session tap by tap in ticket 08 and an abandoned Session logs its presented Problem as unresolved. Problem IDs are `p<n>` from a counter on the Profile, so they are unique across the Profile's history. Skills a (`partners-to-10`, structures `missing-partner` and `take-from-ten`) and b (`teen-numbers`, structures `compose` and `decompose`) are template families in `src/loop/skills.ts` with hand-written Hints that contain no numbers, so each can be voiced once. Every Problem carries a filled-in Equation plus the answer; the property test in `skills.test.ts` checks the arithmetic independently over 2000 seeds per Skill. BKT parameters are hand-set per Skill (prior 0.3, learn 0.2, guess 0.15, slip 0.1 for both). Mastery is latched once reached. Answer policies receive the Problem, the attempt number, the position, and a seeded rng; `scripted("fhr")` drives tests and the CLI, and the Simulated Learners in ticket 05 are the same type. CLI: `pnpm diagnostic` (added `tsx` as a dev dependency, MIT, recorded in THIRD_PARTY.md). Verified with `pnpm typecheck`, `pnpm lint`, `pnpm test` (55 tests), `pnpm licenses:check`.

Carried forward to ticket 04: the Diagnostic Plan samples Skills a and b only until counting on (Skill c) exists; add it there. Plan validation against the Plan Space is not implemented here (a Plan's `numberRange` and `structures` are honoured but not checked), and `reviewShare` is carried on the Plan but not yet used.
