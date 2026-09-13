# Nerdy K–5 Math

A Grade 1 math game that learns how the Learner learns, built for Prompt 01 of the Nerdy AI Hackathon. Ollie the owl reads every Problem aloud; a deterministic engine owns the math; a Coach forms evidence-backed Hypotheses after every Session and plans the next one inside a bounded space; the Parent reads why. Ollie learns how you learn.

## Language

**Learner**:
The child playing the game. Grade 1, age 6–7, assumed unable to read the interface.
_Avoid_: student, user, kid, player

**Parent**:
The adult who receives the Parent Summary and reads it after a Session.
_Avoid_: guardian, tutor, adult

**Session**:
One sitting of play: 6 to 10 Problems built from a Session Plan, ending with a celebration, a Coach run, and a Parent Summary. One completed Session per day counts toward the Streak.
_Avoid_: game, round, lesson, level

**Unit**:
A named slice of Grade 1 content that the Learner progresses through. The MVP has three: Partners to 10, Counting On and Make-a-Ten, and Word Problems.
_Avoid_: topic, module, world, chapter

**Problem**:
One question put to the Learner, with a single correct answer decided by the engine, never by the model.
_Avoid_: question, exercise, item, card

**Story**:
The themed words the model writes around an engine-chosen word problem, addressed to the Learner by Nickname. The numbers and answer come from the engine; the Story only dresses them.
_Avoid_: prompt, narrative, question text

**Nickname**:
What Ollie calls the Learner, chosen by the Parent at setup. The only personal word sent off the device, and only so that the lines Ollie reads aloud can be voiced with it; a Story is written with a placeholder in its place.
_Avoid_: name, first name, username

**Content Pool**:
The store of Story variants and audio keyed by Theme, Skill, structure, and number range, pre-generated at build time and grown at run time. Sessions are filled from it first; it never decides what a Session contains.
_Avoid_: cache, bank, pre-generated sessions

**Theme**:
One of six illustrated settings chosen for the Profile, such as puppies or space, that every Story is written in.
_Avoid_: world, skin, topic

**Hint**:
The hand-written, strategy-specific help shown after the first wrong answer, paired with the visual. Never written by the model.
_Avoid_: tip, clue, explanation

**Reveal**:
What happens after the second wrong answer: Ollie shows the answer and the strategy. The Problem counts as incorrect for Mastery and costs nothing else.
_Avoid_: fail, game over, solution

**Parent Summary**:
The note written for the Parent at the end of a Session. It names the strategies practiced and Powers earned, gives the evidence by Assistance State, what was Mastered, and one thing to do together. It never claims to know how the Learner was thinking.
_Avoid_: report, session summary, progress report, dashboard

**Path**:
The home-screen view of the three Units in order, showing which are unlocked and which Powers Ollie has learned.
_Avoid_: map, world map, progress bar, level select

**Profile**:
The single local identity for a Learner: a Nickname, an Avatar, and all progress. There are no accounts.
_Avoid_: account, user, login

**Parent Gate**:
The press-and-hold control that separates the Parent's area from the Learner's.
_Avoid_: parental lock, settings lock

### Progress

**Skill**:
The smallest thing the Learner can master, inside a Unit. Each Problem belongs to exactly one Skill.
_Avoid_: standard, objective, topic

**Mastered**:
The state of a Skill once the Knowledge Estimate reaches 0.95 and 8 of the Learner's last 10 first attempts were correct. A Unit unlocks when its Skills are Mastered; some Skills award a Power.
_Avoid_: completed, passed, learned

**Assistance State**:
The single outcome recorded for a Problem: first-try correct, Hint-assisted correct, Revealed, or unresolved. Only the first attempt feeds the Knowledge Estimate; the rest is evidence for the Coach.
_Avoid_: result, score, attempts

**Diagnostic Session**:
The fixed first Session, planned without a Coach, that samples Unit 1 and the start of Unit 2 so the Learner Notes begin with evidence. It looks like any other Session to the Learner.
_Avoid_: placement test, assessment, onboarding quiz

**Review Problem**:
A Problem drawn from a Mastered Skill and mixed into a later Session so the Skill stays warm.
_Avoid_: revision, spaced repetition item

### The loop

**Coach**:
The model-driven step that runs after every Session: it reads the Session Log and the Learner Notes, rewrites the Notes, and writes the next Session Plan. It never writes a Problem or an answer.
_Avoid_: tutor, agent, AI, Ollie (Ollie is the voice, the Coach is the loop)

**Session Log**:
The engine's record of one Session: for every Problem, its ID, Skill, structure, numbers, Assistance State, time to answer, and position. Time to answer is context only and never lowers Mastery.
_Avoid_: history, telemetry, analytics

**Learner Notes**:
The structured document of what the Coach currently believes about the Learner: Hypotheses with evidence, strengths, and what to test next. Shown to the Parent as Ollie's Notebook.
_Avoid_: profile, model, memory, learner model

**Hypothesis**:
One belief in the Learner Notes: a claim, a status (proposed, supported, refuted), a confidence, evidence given only as Problem IDs from the Session Log (this Session's, or already cited in the Notes), and a next test. The engine rejects any Hypothesis citing a Problem it was not shown.
_Avoid_: insight, finding, observation

**Session Plan**:
The Coach's instructions for the next Session, chosen only from the Plan Space: Skills, number ranges, structures, review share, length, and the Hypothesis under test.
_Avoid_: playlist, curriculum, config

**Plan Space**:
The bounded set of choices the engine lets the Coach make. Nothing outside it can be planned.
_Avoid_: parameters, settings, knobs

**Knowledge Estimate**:
The engine's per-Skill probability that the Learner knows the Skill, updated from each Problem's first attempt only. Feeds the Coach and decides Mastered together with the visible 8-of-10 rule.
_Avoid_: score, level, mastery percentage

**Ollie's Notebook**:
The Parent Area view of the Learner Notes in plain English: what Ollie believes, what changed, what is being tested next.
_Avoid_: dashboard, insights, AI report

**Simulated Learner**:
One of six hand-designed synthetic Learners with a seeded per-Skill ability, weakness tags, and a fatigue curve, used to evaluate the loop over 20 Sessions each. Never a real child's data.
_Avoid_: bot, test user, persona

### Evals

**Eval Run**:
One execution of the single eval command: the simulation, the deterministic checks, and the sampled Judge checks, producing a dated JSON report under `docs/evals/`.
_Avoid_: test run, benchmark, CI

**Baseline**:
The loop with the Coach replaced by the plain 8-of-10 gate and fixed session composition. Every convergence number is reported against it.
_Avoid_: control, v0, default

**Evidence Integrity**:
The deterministic eval that every Problem ID a Hypothesis cites exists in the Log and has an Assistance State consistent with the claim.
_Avoid_: hallucination check, grounding score

**Judge**:
Opus 5 reading against a written rubric, used only where a deterministic check cannot apply: Story readability and theme fit, Parent Summary faithfulness to the Session Log.
_Avoid_: grader, evaluator, LLM-as-judge

**Calibration Set**:
The hand-labelled 20 Stories and 10 Parent Summaries the Judge must agree with above a threshold before its scores count.
_Avoid_: golden set, ground truth, labels

### Rewards

**Streak**:
The count of consecutive days with at least one completed Session.
_Avoid_: chain, daily run

**Freeze**:
A token that preserves the Streak through one missed day. The Learner holds at most two.
_Avoid_: streak saver, shield

**Coin**:
Currency earned per Session for effort, regardless of accuracy, and spent only on Avatar Items.
_Avoid_: points, gems, bucks, currency

**Avatar**:
The Learner's own round creature, chosen by colour, with slots for a hat, an accessory, and a pet. Distinct from Ollie.
_Avoid_: profile picture, skin, character

**Avatar Item**:
A cosmetic bought with Coins and worn by the Avatar. Never affects play.
_Avoid_: reward, unlockable, power-up, gear

**Power**:
An ability Ollie learns when the Learner Masters a strategy, and then visibly uses on every matching Problem. Four exist: Count-On Flight, Make-Ten Magic, Missing Number Detective, Story Solver. Never lost, never bought.
_Avoid_: badge, achievement, trophy, unlock, ability

**Ollie**:
The Character: a voiced owl guide who reads every Problem aloud and reacts to answers. Not controlled by the Learner.
_Avoid_: character, mascot, tutor, avatar, companion, the owl

**Speech Chain**:
What Ollie says a line with, and what is tried next when that is not there: the line's audio from the Content Pool, the bundled fixed line, the platform's own speech synthesis, and the line on screen. Nothing waits on a step that is not ready, so no Session is ever silent and blank. Nothing to do with the Streak, which is a chain of days.
_Avoid_: fallback, TTS pipeline, audio cache

**Shop**:
Where Coins are exchanged for Avatar Items. Six items in three price tiers.
_Avoid_: store, marketplace, inventory

**Parent Area**:
The screens behind the Parent Gate: the last seven Parent Summaries, Powers, Mastery per Skill, and Ollie's Notebook.
_Avoid_: dashboard, settings, admin
