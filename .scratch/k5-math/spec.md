# Spec: Ollie — a Grade 1 math game that learns how you learn

Status: ready-for-agent
Created: 2026-09-10 · Revised: 2026-09-10 after external review (see decisions.md, Amendments)
Deadline: Nerdy AI Hackathon Prompt 01, submissions close 2026-09-18 11:59 PM CDT
Inputs: `.scratch/k5-math/decisions.md`, `CONTEXT.md`, `docs/adr/0001–0003`, `docs/research/k5-math-game/`

Vocabulary in this spec is the glossary in `CONTEXT.md`. Capitalised terms are defined there.

**Taglines.** "Ollie learns how you learn." And for the architecture: "The AI can personalise the learning path. It cannot make up the math."

## Problem Statement

A six-year-old who cannot yet read the screen needs to practice Grade 1 arithmetic in short, fun sittings, and her Parent needs to know what she actually practiced and what to do next. Existing apps adapt difficulty at best; none builds a legible model of how the child is learning, and most bury the math under a reward store. Nerdy has tutoring and AI tools for older students but nothing for this age that progresses, adapts to the individual, and explains itself to a parent.

## Solution

Ollie is a tablet web game in which a voiced owl reads every Problem aloud and the Learner answers by tapping. Content is a focused Grade 1 arithmetic progression built around Common Core strategies for number sense and addition and subtraction within 20. Mastering a strategy teaches Ollie a Power that visibly changes how Ollie solves on screen, so mastery changes the game rather than the wallet. After every Session an AI Coach forms evidence-backed Hypotheses about the Learner, every piece of evidence pointing at concrete Problems, chooses what to test next inside a curriculum-defined Plan Space, and explains its decision to the Parent as Ollie's Notebook. The math stays deterministic; the AI decides where to look next. A small effort reward (Streak, Coins, a six-item Shop) keeps her coming back. The loop is proven with Simulated Learners against a fixed-gate Baseline, and every model output is evaluated.

## User Stories

### Learner: playing

1. As a Learner, I want Ollie to read every Problem aloud, so that I can play without reading.
2. As a Learner, I want a Repeat button on every Problem, so that I can hear it again if I missed it.
3. As a Learner, I want to answer by tapping a big number, so that I never have to type.
4. As a Learner, I want Ollie to celebrate when I am right, so that I feel good about trying.
5. As a Learner, I want a Hint with the picture after my first miss, so that I can try the strategy again.
6. As a Learner, I want Ollie to show me the answer after my second miss without any penalty, so that I learn the strategy and move on.
7. As a Learner, I want a Session to last only a few minutes, so that I finish it before I get tired.
8. As a Learner, I want a celebration at the end of every Session, so that finishing feels like an event.
9. As a Learner, I want one big Play button, so that I never have to choose what to do.
10. As a Learner, I want to see my three Units on a Path, so that I know where I am.
11. As a Learner, I want to see a ten-frame when working with partners and teens, so that I can see the numbers.
12. As a Learner, I want to see a number line when counting on, so that I can see the jumps.
13. As a Learner, I want word problems set in the Theme I picked with my Nickname in them, so that they feel like mine.
14. As a Learner, I want each Story short enough to hold in my head after hearing it once, so that I can solve it.
15. As a Learner, I want the first Session to feel like play and not a test, so that I am not scared off.
16. As a Learner, I want something to always speak even if the internet is slow, so that a Session never freezes or goes silent.

### Learner: Powers and rewards

17. As a Learner, I want to teach Ollie a Power when I master a strategy, so that my learning visibly changes what Ollie can do.
18. As a Learner, I want Count-On Flight to turn number-line jumps into Ollie's wing beats once I master counting on, so that I see my strategy in action.
19. As a Learner, I want Make-Ten Magic to have Ollie fill a ten-frame and break a number apart once I master make-a-ten, so that the strategy becomes Ollie's trick.
20. As a Learner, I want Missing Number Detective to turn unknown-addend Problems into finding what is missing once I master that Skill, so that the Skill has its own feel.
21. As a Learner, I want Story Solver to unlock richer themed Stories once I master word problems, so that mastery opens new adventures.
22. As a Learner, I want to see Ollie use a Power on the next matching Problem, so that the reward is immediate and visible.
23. As a Learner, I want Powers shown on the Path, so that I can see which ones Ollie has learned.
24. As a Learner, I want to earn Coins for finishing a Session even when I got some wrong, so that effort counts.
25. As a Learner, I want to spend Coins in the Shop on hats, accessories, and pets for my Avatar, so that I can make it mine.
26. As a Learner, I want a Streak that grows each day I play, so that I want to come back tomorrow.
27. As a Learner, I want a special animation at 3, 7, and 14 days, so that milestones feel big.
28. As a Learner, I want a Freeze to protect my Streak when I miss a day, so that one missed day does not wipe it out.
29. As a Learner, I want no timers, lives, or leaderboards, so that I am never rushed or ranked.
30. As a Learner, I want to change my Theme in the Shop, so that I can switch to dinosaurs later.

### Parent

31. As a Parent, I want to set up the Profile with a Nickname, an Avatar colour, and a Theme in under a minute, so that she can start playing right away.
32. As a Parent, I want onboarding to tell me plainly that the Nickname is sent to generate Stories and audio and that nothing else leaves the device, so that I know exactly what is shared.
33. As a Parent, I want a press-and-hold Parent Gate, so that she cannot wander into my area.
34. As a Parent, I want a Parent Summary after every Session, so that I know what she practiced.
35. As a Parent, I want the Summary to name the strategies practiced with evidence (first-try correct, Hint-assisted, Revealed), so that I trust it.
36. As a Parent, I want the Summary to never claim to know how she was thinking, so that it does not overreach.
37. As a Parent, I want one suggested bedtime activity for her weakest Skill, so that I can help in five minutes.
38. As a Parent, I want to see the last seven Summaries, so that I can see a week at a glance.
39. As a Parent, I want to see Mastery per Skill and which Powers Ollie has learned, so that I know what is solid.
40. As a Parent, I want Ollie's Notebook to show what the Coach believes, what changed, and what it is testing next, so that the adaptivity is legible.
41. As a Parent, I want each Hypothesis to show its evidence as the actual Problems it rests on, so that I can check it myself.
42. As a Parent, I want to know that no audio is recorded and no account exists, so that I am comfortable with her using it.

### The Coach and the engine

43. As a Coach, I want the full Session Log with per-Problem Skill, structure, numbers, Assistance State, time, and position, so that I can form Hypotheses from evidence.
44. As a Coach, I want the current Learner Notes and Knowledge Estimates, so that I build on what I already believe.
45. As a Coach, I want to cite evidence only by Problem ID, so that I can never invent an observation.
46. As a Coach, I want to write the next Session Plan only from the Plan Space, so that I can never skip prerequisites or exceed the grade.
47. As a Coach, I want to mark each Hypothesis proposed, supported, or refuted with a confidence, so that the Notes improve over time.
48. As a Coach, I want to set the Hypothesis under test and the next test for the next Session, so that the plan gathers the evidence I need.
49. As a Coach, I want to distinguish first-try misses from Hint-assisted successes, so that I can hypothesise whether a strategy is becoming independent.
50. As the engine, I want to validate every Session Plan and reject anything outside the Plan Space, so that the Coach cannot harm the Learner.
51. As the engine, I want to reject any Hypothesis whose cited Problem IDs do not exist in the Log, so that evidence is always real.
52. As the engine, I want to own every Problem's type, numbers, and answer, so that arithmetic is always correct.
53. As the engine, I want to update the Knowledge Estimate from the first attempt only, so that a hinted retry never counts as independent mastery.
54. As the engine, I want response time recorded as contextual evidence that never lowers Mastery, so that a slow, thoughtful answer is not punished.
55. As the engine, I want to build a fixed Diagnostic Session when no Session Log exists, so that the first Session yields evidence.
56. As the engine, I want to reject any Story whose numbers or answer are missing or altered, so that the model never changes the math.
57. As the engine, I want a Content Pool of pre-generated Stories and audio keyed by Theme, Skill, structure, and number range, so that most Plans are served without a live call.
58. As the engine, I want a fallback chain for speech, so that something always speaks.

### Evaluation

59. As the developer, I want six seeded Simulated Learners with known weaknesses, so that the Coach can be scored against ground truth.
60. As the developer, I want to run the loop under the Coach and under the Baseline on the same Simulated Learners, so that I can show the loop's effect.
61. As the developer, I want to score whether the Coach's Hypotheses name the planted weakness, how many Sessions it took, and false positives, so that I can quantify the Coach.
62. As the developer, I want to verify that every cited evidence ID exists and supports the claim, so that the Coach's honesty has a number.
63. As the developer, I want deterministic Story checks, so that invalid Stories never reach a child.
64. As the developer, I want a calibrated Judge for Story readability and Summary faithfulness, so that prose quality has a number.
65. As the developer, I want a Calibration Set the Judge must agree with, so that I only trust a Judge I have checked.
66. As the developer, I want one command that runs every eval and writes a dated JSON report, so that I can cite numbers and catch regressions.
67. As the developer, I want a convergence chart generated from the reports, so that the video has evidence.
68. As the developer, I want two Simulated Learners held out of prompt tuning, so that the chart is evidence and not tuning.

### Submission

69. As the entrant, I want ollie.rahatcodes.com to work on a tablet and a laptop, so that judges can click it.
69a. As a Learner and a Parent, I want the app to look warm, calm, and hand-made rather than generic or machine-generated, so that it feels like something made for a child.
70. As the entrant, I want a THIRD_PARTY file listing every API, model, font, image, audio source, open-source component with licence, and the generative-AI assistance used, so that the disclosure requirement is met.
71. As the entrant, I want only permissive licences in the repo, so that the copyleft prohibition is met.
72. As the entrant, I want a 2–3 minute screen-recorded video with me as the Learner and no other identifiable person, so that the entry meets the terms.
73. As the entrant, I want every Skill mapped to its CCSS standard in the README, so that the pedagogy claim is precise.

## Implementation Decisions

### Architecture

- Next.js web app, tablet-first landscape, built as a Docker container and deployed via Coolify on the user's Hetzner server at ollie.rahatcodes.com, behind Cloudflare. Never Vercel. One local Profile in browser storage, no accounts, no database (ADR 0002). API routes exist solely to call the model and voice vendors and to store generated audio on a persistent volume (Cloudflare R2 if a second host ever needs it).
- Two seams, confirmed with the user:
  - **The Loop.** A pure function: given a Session Plan, the Profile state, a seed, and an answer policy, it returns the Session Log, updated Knowledge Estimates, rewards, Powers earned, and the next Profile state. The problem engine, Bayesian Knowledge Tracing, Plan validation, evidence validation, the Diagnostic Session, Streak, Coins, Powers, and Mastery all live behind it. The Simulation harness and the Baseline are answer policies and Coach substitutes fed into the same function. No I/O.
  - **Generation.** One interface with four operations: write Story, run Coach, write Summary, render speech. A fake implementation is used in every Loop test and the UI smoke. Real adapters call Claude (Sonnet 5 for Stories; Opus 5 for Coach, Summary, and Judge) via the official Anthropic TypeScript SDK with structured output, and ElevenLabs (Voice Design voice, eleven_v3 model). Secrets are Coolify environment variables.
- The UI is thin: it renders Loop state, plays audio, and forwards taps.

### Content

- A focused Grade 1 arithmetic progression aligned to key CCSS 1.OA and 1.NBT concepts. Seven Skills in three Units, in progression order, each mapped to its standard in the README: partners to 10 (K.OA.4 prerequisite, 1.OA.6); teen numbers as 10 + n (1.NBT.2b); counting on from the larger number (1.OA.5); make-a-ten within 20 (1.OA.6); subtraction as unknown addend (1.OA.4); word problems with result or total unknown (1.OA.1); word problems with change unknown (1.OA.1). Prerequisite order is enforced by the engine. It is not the whole of Grade 1; say so.
- Each Skill is a template family plus a hand-written Hint keyed to its strategy. Every Problem has one answer computed by the engine (ADR 0001). Every Problem in a Session has an ID unique across the Profile's history.
- Visuals: ten-frame (partners, teens, make-a-ten) and number line (counting on, unknown addend). Word problems show a Theme picture. Input is a 0–20 number pad. Every Problem has a Repeat button.
- Wrong-answer flow: first miss shows the Hint with the visual animated; second miss is a Reveal. Nothing is deducted.
- Six Themes with a fixed vocabulary each. Chosen at Profile creation, changeable in the Shop. If days run short, three polished Themes beat six.

### Ollie's Powers

- Four Powers, each tied to Mastery of one Skill or Unit: Count-On Flight (counting on), Make-Ten Magic (make-a-ten), Missing Number Detective (unknown addend), Story Solver (Unit 3).
- Earning a Power is the Session's headline celebration. From then on, on every Problem of that Skill, Ollie demonstrates the strategy with the Power's animation: wing beats along the number line, filling and splitting on the ten-frame, a magnifying-glass search for the missing part, richer Story variants.
- Powers replace Badges. They appear on the Path, in the Parent Area, and in the Parent Summary by name.
- Powers are never lost and never bought.

### Generation and the Content Pool

- Story input: problem type, the numbers, the answer, the Theme vocabulary, the Learner's Nickname. Output: two sentences, under 25 words, Nickname present, Theme vocabulary only. Validated deterministically; regenerated on failure; after a bounded number of failures a template sentence is used so a Session never blocks.
- The Content Pool: at build time, for each Theme × Skill × structure × number range, a set of Story variants with a placeholder for the Nickname and pre-rendered audio for the fixed parts. At run time the engine fills a Plan from the Pool first; a missing variant is generated live and added to the Pool; if generation fails, the template fallback applies. Session 1, the Diagnostic Session, is fully bundled. Sessions 2 onward are always planned by the Coach and never pre-planned.
- Nickname audio: Stories containing the Nickname are rendered at creation time with the Nickname and cached per Profile on the persistent volume. The fallback chain if audio is not ready: cached audio, bundled fixed line, platform speech synthesis, on-screen template. No Session ever blocks on ElevenLabs.
- The Coach runs once per Session on Opus 5. Input: the Session Log, the Learner Notes, the Knowledge Estimates, the Plan Space with its bounds. Output: rewritten Learner Notes and a Session Plan. Each Hypothesis carries a claim, a status (proposed, supported, refuted), a confidence, an array of evidence Problem IDs, and a next test. The engine rejects any Hypothesis citing an ID absent from the Log, and any Plan outside the Plan Space, with a reason; it retries once, then falls back to a Baseline plan so play continues.
- The Parent Summary is written by Opus 5 from the Session Log and the Notes. It restates only what the Log supports, names strategies and Powers by name, distinguishes first-try correct from Hint-assisted from Revealed, treats response time as context only, and ends with one activity for the weakest Skill. It never asserts how the Learner was thinking.

### The loop

- Session Plan fields: Skill mix, per-Skill number range within the Skill's standard, allowed structures, review share (0 to 1), length 6 to 10, Hypothesis under test. Anything else is rejected.
- Each Problem yields one Assistance State: first-try correct, Hint-assisted correct, Revealed, or unresolved. Bayesian Knowledge Tracing per Skill (prior, learn, guess, slip, hand-set) updates from the first attempt only. Hint-assisted and Revealed outcomes go to the Log and the Coach as evidence, never as a second mastery observation. Response time is logged and never affects the Estimate.
- Mastered = Estimate at or above 0.95 and 8 of the last 10 first attempts correct. Mastery of a Skill awards its Power, if any. A Unit unlocks when its Skills are Mastered.
- Diagnostic Session: a fixed, fully bundled Plan sampling the first three Skills, used when no Session Log exists.
- Baseline: the same Loop with the Coach replaced by a fixed rule, 6 Problems from the current Skill plus 2 Review Problems, current Skill advancing on the 8-of-10 rule.

### Rewards

- Streak counts days with at least one completed Session by device local time. Two Freezes maximum, consumed automatically. Milestone animations at 3, 7, and 14.
- Ten Coins per completed Session regardless of accuracy. Shop of six Avatar Items across hat, accessory, and pet slots at 10, 30, and 70 Coins. Avatar has four colour bases.
- No leaderboards, hearts, lives, timers, XP, or purchasable currency.

### Parent Area and onboarding

- Behind a press-and-hold Parent Gate. Shows the last seven Parent Summaries, Mastery per Skill, Powers, and Ollie's Notebook: current Hypotheses rendered as prose with their evidence as tappable Problems, what changed after the last Session, and what is being tested next.
- Onboarding by the Parent: "What should Ollie call you?" (Nickname), Avatar colour, Theme, a one-screen note that the Nickname is sent to generate Stories and audio and nothing else leaves the device, then play.

### Character and assets

- Ollie is an owl. Voice designed in ElevenLabs Voice Design on the Starter tier: warm, playful, gently energetic, a kind older kid, gender-neutral leaning bright, slow clear diction. Fixed lines rendered once at build time.
- Animation is layered SVG with CSS in four base states (idle, talking, celebrate, encourage) plus one animation per Power.
- Design comes first: a design direction (palette, type, spacing, Ollie's character sheet, an illustration style that is flat, warm, and hand-tuned, and the core screens) is settled before the Session screen is built, and every screen is built to it. The look must be pleasant and must not read as AI-generated: SVG-first illustrations tuned by hand in one consistent style; image-model output is used for reference and ideation only, and any generated pixels that ship are disclosed. Kenney CC0 for small icons only. No copyleft code or assets. A THIRD_PARTY file at the repo root lists every dependency, asset source, model, API, and the generative-AI assistance used; its contents are pasted into the submission form.

### Evals

- Six hand-designed Simulated Learners with seeded per-Skill ability, weakness tags, and a fatigue curve. Answers sampled probabilistically; no model plays the child. Two profiles held out of prompt tuning and scored only at the end.
- Five targets: Coach Hypotheses against planted weaknesses (hit rate, Sessions to detection, false positives); evidence integrity (every cited ID exists and its Assistance State supports the claim; deterministic); convergence against the Baseline (Sessions to Mastery, share of Problems in the target accuracy band); Story validity (deterministic checks plus a Judge rubric for Grade 1 readability and Theme fit on a sample); Parent Summary faithfulness (Judge checks each claim against the Log; fails unsupported claims and claims about thinking).
- Judge is Opus 5 with a written rubric, gated by a Calibration Set of 20 hand-labelled Stories and 10 Summaries. Human labels are the ground truth; the write-up notes the same-family limitation.
- One command runs everything and writes a dated JSON report under the evals directory. The convergence chart regenerates from the reports.

## Testing Decisions

- A good test drives a seam from the outside and asserts on what comes back. Loop tests call the Loop with a Plan, a state, a seed, and an answer policy and assert on the Log, Assistance States, Estimates, Powers, rewards, and next state.
- Loop tests, seeded and deterministic: Plan validation rejects every out-of-space Plan; evidence validation rejects unknown IDs; the engine never emits a Problem whose answer differs from its own arithmetic; BKT moves only on first attempts; Mastery, Powers, Coins, Streak, and Freeze transitions follow the rules; the Diagnostic Session is produced when no Log exists; hundreds of Sessions run in under a second.
- The Story validator is tested against hand-written good and bad Stories. The Content Pool lookup is tested for hit, miss-then-generate, and miss-then-fallback.
- The Generation fake is tested for shape only. Real adapters run only under the eval command.
- One Playwright smoke through a fake Generation: set up a Profile, play one Session to the celebration, open the Parent Gate, see a Summary with evidence.
- No prior art; the first Loop test sets the style.

## Out of Scope

- Voice input of any kind (ADR 0002 and the contest terms).
- Accounts, email, multi-device sync, multiple Profiles per device.
- Compare-type word problems, Kindergarten fallback content, Grade 2 content, place value beyond teens, measurement, geometry, equality and three-addend problems.
- Model-written Hints or Ollie banter; the Coach choosing Hints or Theme emphasis.
- Badges, leaderboards, lives, timers, XP, purchasable currency, a native app, App Store listing.
- Fine-tuning any model. A second judge model.
- CI-gated evals.
- Any footage or mention of an identifiable person other than the entrant.

## Further Notes

- **Cut order if days run short**, agreed after review: Shop depth (six to four items); Freeze and streak edge cases; Themes (six to three); cosmetic polish; extra Story variants. **Protected at all costs:** Ollie's voice and the child UI; ten-frame and number line; the Coach Hypothesis loop with evidence IDs; the bounded planner; Ollie's Notebook; simulation versus Baseline; the convergence chart; Ollie's Powers.
- **Build order:** the Loop with a fake Generation and the simulation harness first, then the real Coach and Story adapters plus evals, then the design direction, then the UI, Ollie, and the first Power, then audio, Content Pool, and fallbacks, then the Parent Area and Notebook, then the Shop. A working convergence chart by day four is the checkpoint.
- **The video tells one story**, screen-recorded with the entrant as the Learner. 0:00 problem: "Most math apps adapt difficulty. Ollie adapts to how the learner is learning." 0:15 play: an easy non-crossing sum correct, a crossing-ten sum wrong, the ten-frame Hint, correct on retry, one more miss, celebration. 1:20 the Notebook: a new Hypothesis, "may struggle when addition crosses ten", with its evidence as the actual Problems, and the next test. 2:00 one graphic of Session → engine → evidence → Coach → validator → next Session, with the nine-word line. 2:25 the convergence chart and the headline numbers from the eval report. 2:50 "Ollie learns how you learn."
- The write-up says precisely what is generative (Stories in Theme and Nickname; the Coach's Hypotheses and Plans) and what is not (the arithmetic), maps every Skill to its standard, and cites the research folder.
- Open items: GitHub repo name and visibility; ElevenLabs Creator tier only if higher-bitrate audio is wanted.
