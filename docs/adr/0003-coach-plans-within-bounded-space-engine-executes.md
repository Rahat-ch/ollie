---
status: accepted
date: 2026-09-10
---

# The Coach plans within a bounded Plan Space; the engine executes

After every Session a model-driven Coach reads the Session Log and the Learner Notes, rewrites the Notes as Hypotheses with evidence, and emits the next Session Plan. The Plan is drawn only from the Plan Space the engine exposes: Skill mix, number ranges inside each Skill's standard, problem structures, review share, session length from 6 to 10, and the Hypothesis under test. The engine validates the Plan, rejects anything outside the space, and builds the Session deterministically. A Bayesian Knowledge Tracing estimate per Skill feeds the Coach and, with the visible 8-of-10 rule, decides Mastered. The estimate updates from each Problem's first attempt only; Hint-assisted and Revealed outcomes are recorded as an Assistance State and given to the Coach as evidence, never as a second mastery observation. Every Hypothesis cites its evidence as Problem IDs, and the engine rejects any Hypothesis citing a Problem that is not in the Log.

We chose this because adaptivity is the entry's novelty and it has to be both safe for a six-year-old and legible to a parent. Letting the model plan freely would let it skip prerequisites, lengthen sessions, or drift off grade; hiding the adaptivity inside a black-box scheduler would make it indistinguishable from every other app. A bounded space keeps the pedagogy in code and the reasoning in plain English, which is what the Parent reads as Ollie's Notebook.

## Considered options

- Fixed mastery gate and fixed session composition: rejected as not novel and blind to individual weaknesses such as crossing ten.
- Coach with unbounded control, including generating Problems: rejected; conflicts with ADR 0001 and makes safety and evaluation impossible.
- Pure knowledge tracing with no Coach: rejected; the numbers alone cannot form or test a Hypothesis, and there is nothing readable for the Parent.

## Consequences

- Every new lever must be added to the Plan Space with its bounds before the Coach can use it.
- The loop is evaluated with Simulated Learners, never real child data, and the first Session is a fixed, fully bundled Diagnostic Session because no Log exists yet. No later Session is ever pre-planned; a Content Pool of Story variants serves Coach-planned Sessions without deciding their contents.
- The model cannot invent an observation: evidence integrity is checked deterministically and is itself an eval. The Log the Coach may cite is this Session's plus every Problem already cited in the Notes (each was in an earlier Log), so a Hypothesis can carry its evidence across Sessions; nothing else is citable.
- The Coach runs once per Session on Opus 5; stories stay on Sonnet 5.
