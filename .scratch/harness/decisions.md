# Harness upgrade: decisions

Grilling session of 2026-09-28, run against `docs/research/langchain-harness.md`. Each decision is final unless a later one amends it.

1. **Target role.** The project pitches for AI product engineering, with evals as what sets it apart. LLM infra and platform work is not the pitch.
2. **Thesis.** "Make the model declare what's checkable, let deterministic code check it, and run evals that are allowed to say no." The product tagline stays: "The AI can personalise the learning path. It cannot make up the math." Any work that does not serve the thesis is cut.
3. **LangChain scope.**
   - A LangGraph graph runs the Coach step on the server.
   - LangSmith holds the experiments.
   - A parity test shows the graph follows the same rule as `coachSession`.
   - An ADR saying why the Coach is a graph is written before the code. It names what the graph gives (a server deadline, retries on transport errors, a trace) and what it never takes over (the engine's retry-with-reasons, and the validators).
4. **The live app is a real public product.** Rate limits, bot protection, server-side validation, and ADR 0002's privacy promise all apply for real.
5. **Pre-registration.** Before any live run, a committed file states each hypothesis, its metric, its threshold, and what counts as failing. Results are published whether they pass or fail.
6. **Budget.** About $300 of API spend in all. The Batch API is used for every run that is not measuring latency. The live CI smoke eval runs on manual trigger only. Every run's cost is logged against the budget in the pre-registration file.
7. **Sequencing.** All three phases, in order: harden; then LangGraph and LangSmith; then eval upgrades. Content is published after each phase.
8. **Headline claim.**
   - Diagnosis comes first. The primary metrics are detection, false positives, and Sessions to detection.
   - Mastery is secondary, and is a non-inferiority claim: with Simulated Learners that learn, the Coach is not worse than the drill by more than a pre-registered margin, under two or more simulator families.
9. **Timeout fix.**
   - First, a failing test with a slow fake that reproduces the double-paid call and the fallback.
   - Then:
     - a server-side deadline;
     - the SDK call is cancelled when the request aborts;
     - no retry on a timeout.
   - The chosen model's p95 latency must sit under the deadline.
10. **Trust line.** The server is authoritative: the LangGraph ladder runs in the route, and only validated output leaves it. The device keeps its own check and the Baseline fallback, so play works offline.
11. **Jev (TypeSafe) is used in the eval claim reader only.**
    - It replaces the regex claim reader in `src/evals/hypotheses.ts`.
    - It is calibrated against about 100 hand-labelled live claims, and regex against Jev is reported (agreement and kappa).
    - Runtime checks stay deterministic.
    - No new data recipient in the live app.
12. **Models.**
    - Every model call moves to Claude Sonnet 5.5 (`claude-sonnet-5-5`): the Coach, the Parent Summary, the Story writer, and the eval Judge. The Judge's calibration gate re-checks it on every run.
    - The Coach runs at effort `high`, which is the model's default. There is no effort sweep.
    - The three Opus 5 live reports of 2026-09-18 are the comparison arm, re-scored with `pnpm eval:rescore`. So the Sonnet runs happen before Phase 3 changes the Coach prompt.
13. **Declared Hypotheses.** Every Hypothesis declares a Skill, a Polarity (difficulty, strength or contrast), and optionally a Feature from the engine's list.
    - A proposed Hypothesis can be free prose.
    - A supported Hypothesis must name a Feature and pass the engine's Minimum-Evidence Rule.
    - The engine checks that the cited Problems' Assistance States agree with the declared Polarity. This moves Claim Agreement from measured to enforced.
    - Glossary terms added: Polarity, Feature, Minimum-Evidence Rule.
14. **Anti-gaming.**
    - The Feature list is every feature the generators know, not only the planted weaknesses, and it is fixed in the Pre-registration before any run.
    - False positives on the Features that were not planted are what show the Coach is not simply picking from a menu.
15. **Simulator Families.** There are two:
    - A BKT forward model, with parameters drawn from a different distribution than the engine's tracer.
    - A Performance Factors Analysis logistic model.
    - Every learning result is reported under both.
16. **Non-inferiority margin.** 0.5 Skills: the mean number of Skills Mastered by Session 20, Coach against the drill. The result is published whether it passes or fails.
17. **Glossary.**
    - Terms added: Claim Agreement, Simulator Family, Pre-registration, Arm.
    - Stale entries fixed:
      - Evidence Integrity now covers fabrication only.
      - The Judge is no longer named as Opus 5.
      - The title and intro no longer mention the sponsor or the contest.
18. **Refusal fallback.** Sonnet 5.5 calls send the server-side `fallbacks: "default"` parameter (beta `server-side-fallback-2026-07-01`, Claude API only), as Anthropic recommends for this model. That way a false-positive safety decline does not end in the Baseline.
19. **Minimum-Evidence Rule.** At least 4 first attempts on the Feature across the Learner's history. The Feature's 95% Wilson interval for first-try rate must also not overlap the interval for the rest of the Skill.
20. **Abuse guard.** No captcha. Four protections:
    - a same-origin check in Next 16 `proxy.ts`;
    - a per-IP token bucket in the same file;
    - a Cloudflare rate-limit rule at the edge;
    - a daily spend cap that falls back to the Baseline when it is hit.
21. **LangSmith.**
    - Tracing is on only in `pnpm eval`; production sends nothing.
    - The committed JSON reports stay the reproducible record.
    - LangSmith is the comparison view.
22. **Cleanup.**
    - Rewrite neutrally:
      - README, and the intro of CONTEXT.md;
      - THIRD_PARTY.md and `scripts/third-party.mjs`;
      - comments in the config files;
      - sponsor and contest mentions in the ADRs.
    - Delete `docs/submission/` and the research note on the contest's terms (`docs/research/k5-math-game/05-*.md`).
    - Edit sponsor mentions out of the remaining research.
23. **Coach memory.**
    - The engine computes a tally per Skill and Feature across every Session and adds it to the Coach's input. These are the same numbers the Minimum-Evidence Rule uses.
    - There is no tool-calling Arm.
24. **Calibration labelling.**
    - A second person labels the sets.
    - Human-human kappa is reported.
    - Half of each set is held back, never looked at while tuning the Judge or the claim reader.
25. **Evidence per phase.** Each phase ends with a ticket that produces its evidence in the README and `docs/evals/`:
    - Phase 1: a before/after table of cost, p95 latency and fallback share, plus curl output showing the 429 and the 403.
    - Phase 2: the rendered graph and a LangSmith comparison.
    - Phase 3: the pre-registered results against their thresholds.
26. **ADRs.**
    - ADR 0004: the Coach step is a graph on the server.
    - ADR 0005: a supported Hypothesis needs the engine's evidence.
    - ADR 0002 amended: tracing is eval-only.
    - ADR 0003 amended: the model is chosen by measured Arms, and it is now Sonnet 5.5.
    - All written 2026-09-28.
27. **Second labeller.**
    - The second person labels on a free labelling page, a small local or artifact page that saves the labels to a JSON file committed to the repo.
    - Your own labels can go through a LangSmith annotation queue.
    - Why: LangSmith's free Developer plan is one seat. It also includes 5,000 traces a month and keeps them for 14 days, which is why the JSON stays the record.
28. **The detection number we publish.**
    - From Phase 3: a supported Hypothesis that declares the planted Feature as a difficulty. This is deterministic.
    - Jev reads the prose and reports Declaration Fidelity, meaning how often the prose says what the declaration says.
    - Phase 1's comparison of Opus 5 and Sonnet 5.5 comes before declarations exist, so it uses the prose reader on both Arms.
29. **Spend cap.** $5 a day on the live model routes. Past it, every Session gets the Baseline Plan until midnight UTC.
30. **Voice model.** Move from `eleven_v3` to Eleven v4 (`eleven_v4`, released by ElevenLabs on 2026-09-28), but only if it wins a blind A/B.
    - The A/B uses about 15 lines: Hints, cheers, a few Problems and a Story.
    - They are rendered on today's voice and model, and on the new voice and model.
    - The lines are rated blind on a small listening page.
    - The result is recorded, and it is the answer to "why v4?".
    - `eleven_v4_turbo` is not used: every line except a Story is pre-rendered, and Stories are fetched ahead of time.
31. **Ollie's voice is redesigned.**
    - Voice Design runs again with the same "cute cartoon owl" brief (amendment 31 of `.scratch/k5-math/decisions.md`), and a new voice is picked.
    - The A/B compares the old voice on v3 with the new voice on v4.
    - Not yet verified:
      - whether Voice Design has a v4 design model (the models page lists only `eleven_ttv_v3` and `eleven_multilingual_ttv_v2`);
      - what v4 costs in credits per character. Check both before rendering.
32. **Re-render.**
    - The manifest records the model ID and voice ID for each line, so a change of model or voice marks lines stale. Today a file is named by a hash of the text only, so `pnpm voice:lines` skips existing files.
    - All 1,291 bundled lines are re-rendered, about 53k characters.
    - The server's cached Story audio is cleared, so no Learner hears two different Ollies.
33. **Where it sits.** The voice upgrade is a Phase 1 ticket.
34. **License.**
    - The code is MIT, © 2026 Rahat Chowdhury.
    - `LICENSE` is at the root and `package.json` has `"license": "MIT"`.
    - `"private": true` stays, so the package is never published to npm.
    - Ticket 01 adds a License line to the README.
35. **Pre-registration 1 thresholds tightened by the owner before sign-off (2026-09-28).**
    - Detection: at least 3 of 6, up from 2 of 6.
    - False positives: no worse than the worst Opus run. That is at most 0.222 on the tuning split, up from 0.32, and at most 0.100 held out, up from 0.20.
    - p95 Coach latency: under 30 s, down from under the 75 s route deadline.
36. **Order.**
    - Phase 2 does not wait for Phase 1's evidence.
    - Tickets 11 and 13 start now.
    - Ticket 12 starts now and adds the Opus-against-Sonnet comparison once ticket 07's reports exist.
    - Ticket 07's live runs may run at any time before Phase 3 changes the Coach prompt. Ticket 16 is blocked by 07.
    - The Phase 1 post waits for ticket 10.
37. **Ollie's voice.**
    - The new voice is `RxxDqtqDp9ZV3RZpYuL0`, designed on `eleven_ttv_v3` from the unchanged brief, rendered on `eleven_v4`.
    - It won the blind A/B 15 to 0 against the old voice on `eleven_v3` (2026-09-28).
    - All bundled lines are re-rendered.

