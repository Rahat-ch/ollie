# The video: shot list, script, and the seeding recipe

One storyline, screen-recorded, the entrant as the Learner, 2 to 3 minutes, aimed at 2:55. Ollie opens it, you introduce it, a quick demo, how it was built, what the eval revealed, and what comes after the hackathon. Every number spoken is in the three live reports under `docs/evals/`; every tap below is what the seeded Profile produces, checked against the engine.

## Before you record

1. Production is live with every key set: the Coach, the Summary, the Story writer, and Ollie's voice all run on ollie.rahatcodes.com, the Content Pool is filled, and every fixed line and question is bundled. Nothing needs to be faked. The Notebook shot at 1:15 needs one live Coach run, which happens on its own after the Session; give it about 30 seconds after the celebration before you open the Parent Area.
2. Browser at **1024 × 768** (tablet landscape, the design frame) or 1280 × 720, one tab, no bookmarks bar, no other windows, sound on. Screen recording only: no webcam, no other person, no other voice.
3. Seed the Profile with the recipe below, reload once, and leave the app on the home screen with the sound on. Ollie's first line is the cold open.
4. Have three files ready to show full-screen at 1:40 and 2:05: `docs/submission/architecture.svg`, `docs/evals/evidence-integrity.svg`, `docs/evals/detection.svg`, and `docs/evals/convergence.svg`.

## The seeding recipe

Open <https://ollie.rahatcodes.com>, open the browser console **on that origin**, paste this, then press Enter. It writes one `ollie.profile`: a device that has played four Sessions, Mastered Unit 1 and counting on (so Ollie already has Count-On Flight), is four first-try answers into make-a-ten so that this Session Masters it and earns **Make-Ten Magic** even with one or two misses, holds 250 Coins, and has a four-day Streak that finishing today carries to five.

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
        "make-a-ten": { estimate: 0.9, recentFirstAttempts: [true, true, true, true], mastered: false },
        "unknown-addend": fresh(0.2),
        "result-unknown": fresh(0.2),
        "change-unknown": fresh(0.15),
      },
    },
    rewards: { coins: 250, lastSessionPaid: 4, streak: 4, lastSessionDay: day, freezes: 2, owned: [], worn: { hat: null, accessory: null, pet: null } },
    powers: ["count-on-flight"],
    coach: { notes: { hypotheses: [], strengths: [] }, plan: null, source: null, reasons: [], unavailable: false, lastSessionCoached: 0, cited: [], changed: [], summaries: [], awaiting: null },
    session: null,
  }));
  location.reload();
})();
```

The Nickname is the entrant's own on purpose: the terms forbid depicting an identifiable person other than the entrant, and a child's name on screen invites the wrong reading. `seed: "kite"` is what fixes the Problems below; change it and the Session changes.

**The Session this produces**, in order (verified by running the Loop on this exact Profile: `beginPlay` takes the Baseline Plan of 6 make-a-ten Problems plus 2 Review Problems):

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

Every make-a-ten Problem crosses ten by construction, so Problems 2 and 7 are the crossing-ten misses the storyline needs, and Problem 1 is the easy non-crossing sum. Verified against the engine: with one miss, two misses, or a Reveal among the six make-a-ten Problems, make-a-ten ends Mastered (8 or more of the last 10 first attempts, Estimate above 0.99) and the Session earns Make-Ten Magic, so the celebration is the Power celebration.

## Shot list

| Time | On screen | What you say |
| --- | --- | --- |
| 0:00–0:06 | Home screen, sound up. Ollie speaks his own line, "Hi! Ready to play?", while the bubble shows "Hi, Rahat! Ready to play?". Let him finish. Say nothing. | |
| 0:06–0:28 | Stay on Home: Ollie, the Path with Units 1 and 2 and Count-On Flight on it, the Coin and Streak chips. | "That's Ollie. Most math apps adapt difficulty. Ollie adapts to how the learner is learning. It's a Grade 1 math game for a six-year-old who is still learning to read: Ollie reads every problem aloud, the child answers by tapping, and the content is the Common Core strategies for adding and subtracting within twenty, counting on, make-a-ten, unknown addend, then word problems in the child's own theme." |
| 0:28–0:38 | Tap **Play**. Problem 1 (8 + ? = 10). Let Ollie finish reading. Tap **2**. Ollie cheers. | "No typing anywhere. Ten-frame for the strategy, a number pad for the answer." |
| 0:38–0:58 | Problem 2 (7 + 8). Tap **13** on purpose. The Hint: the ten-frame fills to ten. Wait for it. Tap **15**. | "I'll miss one that crosses ten. No red X, no penalty. Ollie shows the strategy: fill the ten, then add what's left. Right on the retry, and the engine writes that down as correct after a Hint, which is not the same as knowing it." |
| 0:58–1:10 | Problems 3 and 4 (12, then 18). On Problem 4 pause: Ollie in the Count-On Flight pose, wing beats on the number line. | "Mastering counting on taught Ollie a Power. Count-On Flight shows up on every counting-on problem from now on. Mastery changes the game, not the wallet." |
| 1:10–1:22 | Problems 5 to 8 quickly (14, 13, then miss Problem 7 with **14**, Hint, **15**, then 11). The celebration is the Power celebration: Ollie learning **Make-Ten Magic** as the headline, then Coins and the Streak at 5. Tap **Done**. Wait on Home about 20 seconds while the Coach runs. | "One more crossing-ten miss, and the Session's done. And that was enough: make-a-ten is Mastered, and Ollie just learned Make-Ten Magic, the Power he'll use on every make-a-ten problem from now on. Ten Coins for finishing, not for being right. Now the interesting part happens off screen: an AI Coach reads the Session Log." |
| 1:22–1:42 | **Grown-ups**, hold the Parent Gate three seconds, Parent Area. Scroll to **Ollie's Notebook**. Tap the belief's button, which reads **"Show the 2 Problems this rests on"** (the count is whatever the Coach cited), and the rows open: `p33`, `7 + 8 = ?`, **"correct after a Hint · Session 5"**, and `p38`, `8 + 7 = ?`. Point at **Testing next**. | "Behind a press-and-hold gate, the parent sees what the Coach now believes: [read the claim on screen]. Every belief carries its evidence. Tap it and you get the actual problems it rests on, each marked first-try, after a Hint, or revealed, and what Ollie will test next Session. A parent can check it." |
| 1:42–2:05 | Full-screen `architecture.svg`. | "How it's built. Two seams. A pure engine owns the math: every problem, every answer, the hint, mastery, the rewards. Deterministic, tested, no model anywhere near it. On the other side, four generative jobs behind one interface: word problems in the child's theme, the Coach's hypotheses and next plan, the parent summary, Ollie's voice. Everything a model writes passes a deterministic check before a child or parent sees it: a story is rejected if it changes a number, a plan is rejected if it leaves the curriculum, a hypothesis is rejected if it cites a problem the Coach was never shown. **The AI can personalise the learning path. It cannot make up the math.** Built in nine days with Claude Code, and every line of that is disclosed." |
| 2:05–2:40 | `evidence-integrity.svg`, then `detection.svg`, then `convergence.svg`, each while its sentence is spoken. | "We evaluated it before we believed it. Six simulated learners with planted weaknesses, twenty sessions each, against a fixed-gate baseline, run live three times. Ninety-five thousand nine hundred and twenty-one of ninety-five thousand nine hundred and twenty-two citations the Coach made were real problems it had seen. The one that wasn't was rejected at the door. It found the planted weaknesses in four of six chances, around session six for crossing ten, and it never had to fall back to the fixed plan. It also sees ghosts sometimes, one supported belief in six on some learners, because eight problems a day is a small sample. And it is not faster to mastery than the drill, because our simulated learners can't learn from practice. We say all of that in the write-up, with the ranges." |
| 2:40–2:55 | Back to Home, Ollie idle. | "After the hackathon: the engine takes over the statistics, so the Coach can only call a belief supported when the counts back it; learners that learn, so the speed comparison means something; a second judge from another model family. Then a mobile app. A session costs about twenty cents on Opus today and about five on Sonnet, so a seven-dollar subscription pays for a child who plays every day. **Ollie learns how you learn.**" |

**If the Coach writes something other than crossing ten at 1:22.** It is a live model on one Session of evidence, two Hint-assisted make-a-ten Problems out of six, and it may name the Skill rather than the pattern. Read out whatever is on screen: the point of the shot is that the belief is legible and its evidence is checkable, not that it says one particular sentence. If the run is weak, clear `ollie.profile`, re-seed, and play the Session again; the Problems are the same every time.

## Rules for the cut

- [ ] Under three minutes (aim 2:55). If long, trim the demo narration at 1:10, never the eval or the architecture line.
- [ ] Screen recording only; no webcam.
- [ ] No identifiable person other than the entrant: no other voice, no name on screen but the entrant's, no browser account picture, signed-in name, or tab title belonging to anyone else.
- [ ] The entrant is the one tapping, as the Learner.
- [ ] Both taglines said: "Most math apps adapt difficulty. Ollie adapts to how the learner is learning." near the start, "Ollie learns how you learn." at the end.
- [ ] The architecture line said over the graphic: "The AI can personalise the learning path. It cannot make up the math."
- [ ] The eval numbers spoken are the three live runs' (`docs/evals/2026-09-18T18-12-41Z.json`, `T18-41-44Z`, `T19-09-56Z`), and the weaknesses are said out loud: false positives, and not faster to mastery.
- [ ] Nothing is claimed that the app did not just do on screen.

## One wording note for the user

The spec calls the line over the architecture graphic "the nine-word line", but the only line it names for that graphic, in its own Taglines section, is thirteen words: "The AI can personalise the learning path. It cannot make up the math." The graphic and the script carry that line verbatim.
