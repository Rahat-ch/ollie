# The video: shot list, script, and the seeding recipe

One storyline, screen-recorded, the entrant as the Learner, 2 to 3 minutes. The plan is the spec's (`.scratch/k5-math/spec.md`, Further Notes); the timings, the Problems, and the taps below are what the build actually produces, checked against the engine.

## Before you record

1. **Set `ANTHROPIC_API_KEY` in Coolify** (Environment Variables, runtime) and redeploy. Without it `POST /api/coach` answers 503, the next Session falls back to the Baseline Plan, and Ollie's Notebook says "Ollie could not reach the Coach after the last Session" — which is honest, but it is not the shot at 1:20. The Notebook money shot needs one live Coach run. Do not fake it with a seeded record: what is on screen has to be what the app did.
2. Optional but better: `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` (Starter tier or above) after `pnpm voice:design` and `pnpm voice:lines`, so Ollie speaks in his own voice rather than the platform's. Record with the sound on either way.
3. Optional: `pnpm pool` with the Anthropic key, so Unit 3 Stories come from the Pool. The video does not enter Unit 3, so this is not a blocker.
4. Browser at **1024 × 768** (tablet landscape, the design frame) or 1280 × 720, one tab, no bookmarks bar, no other windows. Screen recording only — no webcam, no other person, no other voice.
5. Seed the Profile with the recipe below, then reload once and leave the app on the home screen.

## The seeding recipe

Open <https://ollie.rahatcodes.com>, open the browser console **on that origin**, paste this, then press Enter and reload. It writes one `ollie.profile` — a device that has played four Sessions, Mastered Unit 1 and counting on (so Ollie already has Count-On Flight), and is on make-a-ten next, with a four-day Streak that finishing today carries to five.

```js
(() => {
  const y = new Date(); y.setDate(y.getDate() - 1);
  const day = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
  const mastered = { estimate: 0.99, recentFirstAttempts: Array(10).fill(true), mastered: true };
  const fresh = (estimate) => ({ estimate, recentFirstAttempts: [], mastered: false });
  localStorage.setItem("ollie.profile", JSON.stringify({
    version: 6,
    seed: "kite",
    identity: { nickname: "Rahat", avatarColor: "sky", theme: "space" },
    progress: {
      nextProblemNumber: 32,
      sessionsCompleted: 4,
      skills: {
        "partners-to-10": mastered,
        "teen-numbers": mastered,
        "counting-on": mastered,
        "make-a-ten": fresh(0.35),
        "unknown-addend": fresh(0.2),
        "result-unknown": fresh(0.2),
        "change-unknown": fresh(0.15),
      },
    },
    rewards: { coins: 40, lastSessionPaid: 4, streak: 4, lastSessionDay: day, freezes: 2, owned: [], worn: { hat: null, accessory: null, pet: null } },
    powers: ["count-on-flight"],
    coach: { notes: { hypotheses: [], strengths: [] }, plan: null, source: null, reasons: [], unavailable: false, lastSessionCoached: 0, cited: [], changed: [], summaries: [], awaiting: null },
    session: null,
  }));
  location.reload();
})();
```

The Nickname is the entrant's own on purpose: the terms forbid depicting an identifiable person other than the entrant, and a child's name on screen invites the wrong reading. `seed: "kite"` is what fixes the Problems below; change it and the Session changes.

**The Session this produces**, in order (verified by running the Loop on this exact Profile — `beginPlay` takes the Baseline Plan of 6 make-a-ten Problems plus 2 Review Problems):

| # | ID | Skill | On screen | Answer |
| --- | --- | --- | --- | --- |
| 1 | p32 | partners to 10 (Review) | 8 + ? = 10, ten-frame | **2** |
| 2 | p33 | make-a-ten | 7 + 8 = ?, ten-frame | **15** |
| 3 | p34 | make-a-ten | 3 + 9 = ? | **12** |
| 4 | p35 | counting on (Review) | 15 + 3 = ?, number line, Count-On Flight | **18** |
| 5 | p36 | make-a-ten | 9 + 5 = ? | **14** |
| 6 | p37 | make-a-ten | 7 + 6 = ? | **13** |
| 7 | p38 | make-a-ten | 8 + 7 = ? | **15** |
| 8 | p39 | make-a-ten | 7 + 4 = ? | **11** |

Every make-a-ten Problem crosses ten by construction (`src/loop/skills.ts`: "the larger addend; the sum always crosses ten"), so Problems 2 and 7 are the crossing-ten misses the storyline needs, and Problem 1 is the easy non-crossing sum.

## Shot list

| Time | On screen | What you say |
| --- | --- | --- |
| 0:00–0:15 | Home screen: Ollie, the Avatar, the Path with Units 1 and 2 and Count-On Flight on it, the Coin and Streak chips. | "Most math apps adapt difficulty. Ollie adapts to how the learner is learning. This is Ollie — a Grade 1 math game for a six-year-old who cannot read the screen yet." |
| 0:15–0:25 | Tap **Play**. Problem 1 (8 + ? = 10) on the ten-frame; let Ollie finish reading; tap **2**; Ollie celebrates. | "Ollie reads every Problem out loud. The Learner answers by tapping — there's no typing anywhere." |
| 0:25–0:45 | Problem 2 (7 + 8). Tap a wrong key — **13** — on purpose. The Hint appears with the ten-frame filling to ten. Wait for it. Tap **15**. | "I'll miss one that crosses ten. No red X, no penalty — Ollie shows the strategy on the ten-frame: fill the ten first, then add what's left. Right on the retry, and the engine records that as Hint-assisted, not as knowing it." |
| 0:45–1:05 | Problems 3 to 6 quickly (12, 18, 14, 13). On Problem 4 pause half a second: Ollie is in the Count-On Flight pose on the number line. | "This Profile has already taught Ollie one Power — Mastering counting on gave Ollie Count-On Flight, and Ollie uses it on every counting-on Problem from then on. Mastery changes the game, not the wallet." |
| 1:05–1:20 | Problem 7 (8 + 7): miss once — tap **14** — see the Hint, then tap **15**. Problem 8: tap **11**. The celebration: Coins, the Streak at 5. Tap **Done**. | "One more crossing-ten miss. Then the Session ends — ten Coins for finishing it, not for getting it right." |
| 1:20–2:00 | **Grown-ups** → hold the Parent Gate three seconds → Parent Area. Scroll to the Parent Summary, then to **Ollie's Notebook**. Tap the belief's button, which reads **"Show the 2 Problems this rests on"** (the count is however many the Coach cited), and the rows open: `p33`, `7 + 8 = ?`, **"correct after a Hint · Session 5"**, and `p38`, `8 + 7 = ?`, the same. Point at **Testing next**. | "Behind a press-and-hold gate, the Parent sees what actually happened. After every Session the Coach reads the Session Log and writes down what it now believes — [read the claim that is actually on screen]. Every belief carries its evidence: tap it and you get the actual Problems it rests on, each one saying whether it was first-try correct, correct after a Hint, or Revealed — and what Ollie will test next Session. The Parent can check it." |
| 2:00–2:25 | Full-screen `docs/submission/architecture.svg`. | "The math is never the model's. The engine owns every number and every answer; the Coach only reads the evidence and chooses where to look next, inside a space the engine bounds. Anything it writes that cites a Problem it wasn't shown is thrown out. **The AI can personalise the learning path. It cannot make up the math.**" |
| 2:25–2:50 | Full-screen `docs/evals/convergence.svg`, then `docs/evals/evidence-integrity.svg` and `docs/evals/plan-sources.svg` on the two sentences that name their numbers. | "Six Simulated Learners, twenty Sessions each, against a fixed-gate Baseline. Every citation the Coach made checked out — 1.00 Evidence Integrity over 2,331 of them — and every Session Plan it wrote was inside the Plan Space. This chart is from the deterministic stand-in, not the live model; the report and the numbers are in the repo and say so." |
| 2:50–2:58 | Back to the home screen, Ollie idle. | "Ollie learns how you learn." |

**If the Coach writes something other than crossing ten.** It is a live model on one Session of evidence: two Hint-assisted make-a-ten Problems (p33, p38) out of six, and it may land on the Skill rather than the pattern. Read out whatever is on screen — the point of the shot is that the belief is legible and its evidence is checkable, not that it says one particular sentence. If the run is weak, clear `ollie.profile`, re-seed, and play the Session again; the Problems are the same every time.

## Rules for the cut

- [ ] Under three minutes (aim 2:50).
- [ ] Screen recording only; no webcam.
- [ ] No identifiable person other than the entrant — no other voice, no name on screen but the entrant's, no browser account picture, signed-in name, or tab title belonging to anyone else.
- [ ] The entrant is the one tapping, as the Learner.
- [ ] Both taglines said: "Most math apps adapt difficulty. Ollie adapts to how the learner is learning." at the start, "Ollie learns how you learn." at the end.
- [ ] The architecture line said over the graphic: "The AI can personalise the learning path. It cannot make up the math."
- [ ] The eval shot says out loud that the chart is from the fake Generation.
- [ ] Nothing is claimed that the app did not just do on screen.

## One wording note for the user

The spec calls the line over the architecture graphic "the nine-word line", but the only line it names for that graphic, in its own Taglines section, is thirteen words: "The AI can personalise the learning path. It cannot make up the math." The graphic and the script carry that line verbatim. If a nine-word line was meant — "The AI personalises the path, not the math", say — it has never been written down anywhere in the repo, and choosing one is the entrant's call.
