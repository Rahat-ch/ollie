# How to verify the learning loop

Every claim the write-up makes about the loop has a test at the Loop seam, a command that shows it, or a live trace, and usually all three. This file is the map. Commands run from the repo root after `pnpm install`; the ones marked *live* need `ANTHROPIC_API_KEY` in `.env.local` and spend a few cents.

## The live trace

`coach-trace-2026-09-17.txt` in this folder is one run of `pnpm coach --real --sessions 3`: a Simulated Learner with a planted crossing-ten weakness plays the Diagnostic Session and then three Sessions planned by the real Opus 5 Coach through the pure Loop. Read it top to bottom and you see the loop work:

- After the Diagnostic Session the Coach proposes three Hypotheses, each citing the Problems it rests on by ID: h1, "counting on is shakier when the larger addend comes first" (the one Hint was on 9 + 3), h2 on teen numbers, h3 on partners to 10. It picks h3 to test in Session 2.
- Session 2 refutes h2 for a moment (a Reveal on a compose item) and raises h4, "decompose is stronger than compose", which it tests in Session 3 with six compose items. All six are first-try correct: h4 is marked refuted with every cited Problem listed, and h2 goes back to supported. Session 3 also Masters both Unit 1 Skills and unlocks Unit 2.
- Session 4 is the first with Unit 2 Problems, chosen to test h1. The evidence goes against h1, and the Coach refutes its own first guess. In its place it proposes h6: "counting-on assistance so far has come on items whose sum crosses ten (9 + 3, 9 + 2), while items that stay at or below ten are first-try correct". That is the planted weakness, named from the evidence, four Sessions in. It also proposes h7, "make-a-ten is not yet reliable", and plans Session 5 around it.
- Every Plan says `Source: Coach`: none was rejected, and none fell to the Baseline. When one is rejected the trace prints the reasons and the retry, and a second failure prints `Source: Baseline`.

Run it yourself with `pnpm coach --real --sessions 3` (*live*, about $1) or `pnpm coach --sessions 3` on the fake Generation, which plans like a Baseline and never names a pattern, so the difference between the two runs is the Coach.

## Claim by claim

| Claim in the write-up | Where it is enforced | The test that proves it | Command |
| --- | --- | --- | --- |
| Every Problem's answer is the engine's own arithmetic; no model ever produces or alters it | The Skill templates in the Loop; the Coach's output schema carries Notes and a Plan and nothing else | "the engine never emits a Problem whose answer differs from its own arithmetic" (property test over all seven Skills); "accepts only Notes and a Plan, and the Plan carries no answer" | `pnpm vitest run src/loop/skills.test.ts src/coach` |
| A Hypothesis may cite only Problems the Coach was shown | The evidence validator in the Loop's Notes module | "rejects a Hypothesis citing a Problem ID that is not in the Log or the prior Notes"; "rejects a Hypothesis citing a Problem not in the Log, retries once with the reason, and accepts the corrected output" | `pnpm vitest run src/loop/notes.test.ts src/coach` |
| A Plan must sit inside the Plan Space the curriculum defines | The Plan validator in the Loop | "rejects a skipped prerequisite: a Unit 2 Skill before Unit 1 is Mastered"; "rejects a range beyond the Skill's standard"; "rejects length 5 and length 11"; "rejects a structure the Skill does not have"; "lists every reason at once" | `pnpm vitest run src/loop/plan-space.test.ts` |
| A rejected output is retried once with the reasons, then the Baseline Plan is used and the Notebook says so | The Coach step in the engine | "falls back to the Baseline Plan and keeps the prior Notes after a failed retry, and records both rejections"; "treats a throwing adapter as a rejection so play never stops"; "records the Baseline fallback and why, so the Notebook can say so" | `pnpm vitest run src/coach` |
| Knowledge Estimates move on first attempts only; a Hint or a Reveal is a miss, response time never counts | Bayesian Knowledge Tracing in the Loop | "moves the same way for a Hint-assisted success as for a Reveal: only the miss counts"; "ignores response time entirely" | `pnpm vitest run src/loop/bkt.test.ts src/loop/loop.test.ts` |
| Mastered means an Estimate of at least 0.95 and 8 of the last 10 first attempts correct, and is never lost | The Mastery rule in the Loop | "needs both an Estimate of at least 0.95 and 8 of the last 10 first attempts correct"; "fails on 7 of 10 even with a high Estimate"; "stays Mastered: a later Session does not report it again or take it away" | `pnpm vitest run src/loop/mastery.test.ts src/loop/loop.test.ts` |
| A Unit unlocks only when every Skill before it is Mastered; a Power is awarded once and never lost | The Units and Powers modules in the Loop | the Units tests; "is empty for a fresh Profile: a Power is never held before the Skill is Mastered"; "holds the Power of every Mastered Skill"; the Simulated Learner runs in the Powers tests | `pnpm vitest run src/loop/units.test.ts src/loop/powers.test.ts` |
| The next Session is built from the stored Plan, and its Problems match the Plan's mix and ranges | The Play reducer over the Loop | "is the Coach's Plan, and its Problems match the Plan's mix and ranges"; "is the Baseline Plan when the Coach has not run on the Session just played, so a failed Coach never stops play"; and the browser test that reads the stored Plan and the Session it built | `pnpm vitest run src/play/play.test.ts` and `pnpm exec playwright test e2e/coach.spec.ts --project=desktop-chrome` |
| The Coach and the Summary never receive the Nickname, Avatar, or Theme | The route bodies are strict schemas | "refuses a body carrying the Nickname, the Avatar colour, or the Theme, so nothing personal reaches the Coach"; "hands the Coach exactly what the engine built, and nothing else" | `pnpm vitest run src/app/api/coach src/app/api/summary` |
| The Parent Summary quotes no number the Session Log did not carry and makes no claim about the child's thinking | The Summary validator, two attempts then the hand-written template | "rejects a number the Session Log does not support"; "rejects a number taken from the Learner Notes rather than the Session: a confidence or a Problem ID"; "rejects a claim about how the Learner was thinking" | `pnpm vitest run src/summary` |
| A Story never alters or omits the engine's numbers and stays in its Theme's words | The Story validator, three attempts then the template | eight good and eleven bad hand-written Stories; every Story in the bundled Pool is validated under its key | `pnpm vitest run src/story` |
| The whole loop is deterministic and fast | The Loop is a pure function | "produces an identical Log and Profile for the same seed and policy"; "runs hundreds of Sessions in well under a second" | `pnpm vitest run src/loop/loop.test.ts` |

`pnpm test` runs all of it: 576 tests. `pnpm test:e2e` runs the browser suites against the built app in Chromium and in WebKit at nine iPad sizes.

## The eval

`pnpm eval` plays six seeded Simulated Learners, each with a planted weakness and two held out of prompt tuning, for 20 Sessions under the Coach and under the Baseline (the same Loop with a fixed 8-of-10 gate and no Coach), and scores:

- **Evidence Integrity**: every Problem ID every Hypothesis ever cited exists in the Log the Coach was shown. This is the number that should be 1.00, and it is checked over every attempt including rejected ones. **Claim agreement** is reported beside it, over the citations that exist alone: the share whose Assistance State says what the claim says, where a contrastive claim ("first try when the smaller addend comes first, but a Hint when the larger does") agrees when its citations show an outcome of each kind. Fabricating a Problem and reading a hard call the other way are different failures, so they are two numbers.
- **Detection and false positives**: whether a supported Hypothesis names the planted weakness as a difficulty, and how many supported Hypotheses name a weakness the Learner has not got. Both sides pass the same gate: the claim has to say the pattern in its own words, never just the Skill's name, **and** be a claim about a difficulty or a contrast. A strength ("change-unknown holds when the change itself is large") names nothing, however many Skills it mentions.
- **Plans accepted, retries, and Baseline fallbacks**.
- **Sessions to Mastery** under each planner, drawn as `docs/evals/convergence.svg`.
- **Story validity and Parent Summary validity**, and a Judge whose scores are reported only when it agrees with a hand-labelled Calibration Set on at least 80 percent *and* scores a Cohen's kappa of at least 0.60 against its verdicts; a withheld report names the condition that failed.

Every rate carries its 95 percent Wilson interval beside it, in the JSON, on the same line in the text report, and as a bracket or a range line on the charts, so a small sample is never read as precise. The report is a dated JSON under `docs/evals/`, cited by path in the write-up with its headline numbers. A `--fake` run uses the deterministic fake Generation and measures the seams and the gates; a live run measures the Coach.

## What a sceptic can do in five minutes

1. `pnpm test`: 576 tests, including every validator above.
2. `pnpm coach --sessions 3`: the fake, which plans like a Baseline. Then `pnpm coach --real --sessions 3` (*live*): the Coach. Compare the Notes.
3. Open the deployed app, play one Session, hold "Grown-ups", and open Ollie's Notebook: every Hypothesis shows its evidence as the actual Problems, tappable, and the next Session's Plan is the one the Coach wrote.
4. Read `docs/adr/0001-engine-owns-math-model-owns-words.md` and `0003-coach-plans-within-bounded-space-engine-executes.md` for why it is built this way.
