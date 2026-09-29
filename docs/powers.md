# Ollie's Powers

Mastery changes the game, not the wallet. When the Learner Masters a strategy, Ollie learns a **Power** and visibly uses it from then on. Terms are used as [CONTEXT.md](../CONTEXT.md) defines them.

## The four Powers

There are four, and no more:

| Power | Earned by Mastering | What Ollie does on a matching Problem |
| --- | --- | --- |
| Count-On Flight | counting on | both wings beat and Ollie rises; the beats ride on the number line's hops |
| Make-Ten Magic | make-a-ten | the wing with the ten-frame chip lifts and the sparkles pulse; rings land on the counters that fill the ten and the ones left over |
| Missing Number Detective | unknown addend | the magnifying glass sweeps the gap between the two numbers the Problem shows |
| Story Solver | Unit 3 | the book opens on the Theme picture, and Unit 3 switches to the rich Story set |

## How a Power is earned

- The award sits behind the Loop seam. `src/loop/powers.ts` is the catalogue, `powersFor` reads a Profile's Mastery, and `finishSession` returns the Powers the Session earned.
- A Power is a pure function of Mastery. It is earned on exactly the Session that Masters its Skill or Unit.
- A Power is never bought, deducted or lost.
- The Profile keeps the list (`PROFILE_VERSION` 6). A Profile stored before Powers existed is carried forward with the Powers its own Mastery has already taught.

## How a Power is shown

- On a matching Problem, Ollie takes the Power's pose from the character sheet and its own animation plays.
- Nothing gives an answer away before it is asked for. Each Power draws on marks its stage already shows:
  - the magnifying glass searches the gap while the Problem is being asked, between numbers shown from the start;
  - the wing beats and the rings appear with the Hint and the Reveal, which is when the number line and counters appear;
  - the open book goes on the Theme picture.
- Every Power animation is bounded, and nothing loops. All of it is off under `prefers-reduced-motion`.

## The rich Story set

Story Solver switches Unit 3 to the rich Story set: the same Problem told as a scene in the Theme.

- It is written with `pnpm pool --rich` and keyed apart in the Content Pool, under `rich/`.
- Each structure has its own hand-written rich template sentence as the fallback.
- The same rules apply, so a Story is still two sentences under 25 words.

## Where a Power appears

- **The celebration.** The Session that earns a Power is celebrated with it. The headline is the Power, Ollie takes its pose and says "You taught me Count-On Flight!", and the Session's ten Coins and its Streak are paid and shown beside it as always.
- **The Path**, by name, at the Unit that taught it.
- **The Parent Area**, beside Mastery per Skill, with what Ollie does with each one.
- **The Parent Summary**, which is handed the Powers the Session earned along with the engine's tally, and names them.
- A Session still waiting for its Coach run keeps the Powers it earned, so a reload before the run names them all the same.

`e2e/powers.spec.ts` covers the Powers in the browser.
