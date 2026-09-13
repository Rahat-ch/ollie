# Ollie — a Grade 1 math game that learns how you learn

**Most math apps adapt difficulty. Ollie adapts to how the learner is learning.**

Live at [ollie.rahatcodes.com](https://ollie.rahatcodes.com) · source at [github.com/Rahat-ch/ollie](https://github.com/Rahat-ch/ollie)

## What it does

Ollie is a tablet web game for a six-year-old who cannot yet read the screen. Ollie the owl reads every Problem aloud and the Learner answers by tapping a number; there is no typing anywhere in her flow. A Session is 6 to 10 Problems with a ten-frame or a number line beside them, a Repeat button on every one, a hand-written Hint after the first miss, and a Reveal with no penalty after the second. No timers, no lives, no leaderboards.

After every Session an AI Coach reads the Session Log, writes what it now believes about the Learner as Hypotheses — each carrying its evidence as the actual Problem IDs it rests on — and plans the next Session inside a space the engine bounds. The Parent holds a button for three seconds to reach the Parent Area and read all of it: a Parent Summary per Session with its evidence separated into first-try correct, Hint-assisted, and Revealed; Mastery per Skill; and Ollie's Notebook, where every belief opens to show the Problems behind it. Mastery changes the game rather than the wallet: Mastering a strategy teaches Ollie a **Power** — Count-On Flight, Make-Ten Magic, Missing Number Detective, Story Solver — which Ollie then visibly uses on every matching Problem. Coins, a six-item Shop, and a Streak with two Freezes reward turning up, never accuracy.

The content is **a focused Grade 1 arithmetic progression aligned to key CCSS 1.OA and 1.NBT concepts**. It is not the whole of Grade 1, and the README's table maps each of the seven Skills to its standard. The pedagogy, the choice of strategies, and the decision to drop voice input rest on the reading in [`docs/research/k5-math-game/`](../research/k5-math-game/).

## What is generative and what is not

Generative: the **Stories** (the two-sentence word problems written in the Learner's Theme around the engine's numbers, with a placeholder the device fills with her Nickname), the **Coach's Hypotheses and Session Plans**, the **words of the Parent Summary**, and **Ollie's voice audio**.

Deterministic: the **arithmetic**, the **answers**, the **Hints**, **Plan validation**, the **evidence checks**, **Mastery**, **Powers**, **Coins**, and the **Streak**.

Nothing in the second list is ever produced or altered by a model, and every item in the first list passes a deterministic check before a child or a parent sees it.

## How it was built

![Session, engine, evidence, Coach, validator, next Session: the AI can personalise the learning path, it cannot make up the math](./architecture.svg)

**The AI can personalise the learning path. It cannot make up the math.** Two seams carry the whole app.

**The Loop** is a pure function: given a Session Plan, the Profile, a seed, and an answer policy it returns the Session Log, the updated Knowledge Estimates, the Powers earned, and the next Profile. The seven Skills are template families that compute their own answers; Bayesian Knowledge Tracing updates from the **first attempt only** (a hinted success is evidence for the Coach, never a second mastery observation); Mastered is an Estimate of 0.95 with 8 of the last 10 first attempts correct; response time is context that can never lower Mastery. Having no I/O, the same function runs the browser, the CLIs, the Baseline, and the simulation.

**Generation** is one interface with four operations — write Story, run Coach, write Parent Summary, render speech — and a fake that every test runs on. The real adapters are Claude Opus 5 (Coach, Parent Summary, eval Judge) and Sonnet 5 (Stories) through the Anthropic SDK with structured output, and ElevenLabs for the voice.

Between them sits the part I care most about. The Coach is handed the Session's evidence, the Learner Notes, the Estimates, and the **Plan Space** — Skills, per-Skill number ranges inside the standard, structures, review share, length 6 to 10, and the Hypothesis under test. Nothing outside it can be planned, so the Coach cannot skip a prerequisite or leave the grade. The engine then checks what comes back: a Hypothesis citing a Problem the Coach was never shown is rejected, and so is any Plan outside the space. One retry carries every reason back; a second failure falls through to the Baseline Plan, and Ollie's Notebook tells the Parent that it did. Neither the Coach nor the Parent Summary is ever given the Nickname.

Stories are written with a placeholder where the Nickname goes, which the device fills in, and validated deterministically — exactly the engine's digits, two sentences, under 25 words, only that Theme's closed word list — then kept in a **Content Pool** keyed by Theme, Skill, structure, and numbers, so most Sessions need no call; a miss is written live and added, and a template sentence stands in if that fails. The **Speech Chain** tries the line's audio, the bundled fixed line, the platform's speech synthesis, then the line on screen, so no Session is ever silent and blank. The Profile lives in localStorage: no accounts, no database, no child data. The Nickname is the one personal word that leaves the device, and it leaves only so that a line addressed to the Learner can be spoken aloud — the speech route and nothing else, which is what onboarding tells the Parent before play begins (ADR 0002).

The loop is evaluated against a **Baseline** — the same Loop with the Coach replaced by a fixed 8-of-10 gate and a fixed 6+2 composition — over six seeded **Simulated Learners** with planted weaknesses, two held out of prompt tuning. `pnpm eval` runs 240 Sessions, scores detection, false positives, Evidence Integrity, Story and Summary validity, and a calibrated Judge, and writes a dated JSON report and the chart.

## What the evals say

The latest committed report is [`docs/evals/2026-09-13T17-38-41Z.json`](../evals/2026-09-13T17-38-41Z.json), drawn as [`docs/evals/convergence.svg`](../evals/convergence.svg). **It is from `pnpm eval --fake`**: with no Anthropic key, the Coach in that run is the deterministic fake, which plans like a slightly smarter Baseline and never names a pattern in words. The numbers measure the seams and the gates, not Claude's judgement.

- Evidence Integrity **1.00 over 2,331 citations** (1,502 tuning, 829 held out): every Problem ID cited by every Notes written, rejected attempts included, exists and agrees with its claim.
- Detection **0 of 2** planted weaknesses, exactly as the fake is built to score; false positives 3 of 18 supported Hypotheses in the tuning split, 0 of 8 held out.
- **120 of 120** Plans accepted from the Coach on the first attempt — no retries, no Baseline fallbacks.
- Mean Skills Mastered by Session 20: tuning split **6.5 Coach against 6.0 Baseline**, held-out split **5.0 against 6.0**; 36 against 36 across all six Learners. The fake does not beat the Baseline, and I am not claiming it does.
- Story validity **30 of 30** accepted on the first attempt, Summary validity **6 of 6**, no template fallbacks.
- The Judge's scores were **withheld**: it agreed with the hand-labelled Calibration Set on 12 of 20 Stories and 6 of 10 Summaries, under the 0.8 threshold, which is the gate working. The Judge and the writers are both Claude models; that same-family limitation stands.

## What has not run live

No Anthropic or ElevenLabs key ever reached the machine this was built on. The real Coach, Story writer, Parent Summary, and Judge have never been called; the Content Pool file is committed empty; no voice has been designed, and `public/voice/`, the directory `pnpm voice:lines` renders into, does not exist yet. Everything that needs them is built, tested against the fake, and resumable behind one command each.

## Next steps

Run the commands that need keys and replace the report, the chart, and the numbers above with a live run. Then: a practice effect in the Simulated Learners, so Sessions to Mastery measures learning and not only confirmation; the rest of Grade 1 (compare problems, three addends, place value); a judge outside the Claude family; and a Coach that reads across Sessions rather than one at a time.

**Ollie learns how you learn.**
