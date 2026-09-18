# The video script

Slides are `docs/submission/slides.html` (open in a browser, press `f` for full screen, arrow keys or click to advance). The demo is the live app at ollie.rahatcodes.com, seeded with the recipe in `video-plan.md`. Say the lines as written or in your own words; the numbers are the ones in the three live reports, so keep those exact. Target 2:55.

## Slide 1, title (0:00 to 0:12)

Open on the app's home screen first, sound up, and let Ollie say his line: "Hi! Ready to play?". Then cut to slide 1.

> That's Ollie. Most math apps adapt difficulty. Ollie adapts to how the learner is learning.

## Slide 2, what it is (0:12 to 0:35)

> It's a Grade 1 math game for a six-year-old who can't read the screen yet. Ollie reads every problem out loud and the child answers by tapping. The content is the Common Core strategies for adding and subtracting within twenty: counting on, make-a-ten, unknown addend, then word problems in the child's own theme. A miss gets a Hint with the strategy, never a penalty. And when a child masters a strategy, Ollie learns a Power he uses on screen from then on. Mastery changes the game, not the wallet.

## Slide 3, demo cue (0:35), then the live app (0:35 to 1:35)

> Let me play a Session.

Switch to the app. Tap Play.

**Problem 1, 8 + ? = 10.** Let Ollie read it. Tap 2.

> Ten-frame for the strategy, a number pad for the answer. No typing anywhere.

**Problem 2, 7 + 8.** Tap 13 on purpose. Wait for the Hint to fill the ten-frame. Tap 15.

> I'll miss one that crosses ten. No red X. Ollie shows the strategy: fill the ten, then add what's left. Right on the retry, and the engine records that as correct after a Hint, which is not the same as knowing it.

**Problems 3 and 4.** Tap 12. On 15 + 3, pause on the number line: Ollie in the Count-On Flight pose, wing beats on the hops. Tap 18.

> This child already mastered counting on, so Ollie has Count-On Flight, and he uses it on every counting-on problem.

**Problems 5 to 8.** Tap 14, 13, then miss 8 + 7 with 14, Hint, 15, then 11. Celebration.

> One more crossing-ten miss and the Session's done. Ten Coins for finishing, not for being right. Now the interesting part happens off screen: an AI Coach reads the Session Log.

Tap Done. Wait about twenty seconds on Home. Then Grown-ups, hold three seconds, Parent Area, scroll to Ollie's Notebook. Tap "Show the 2 Problems this rests on".

> Behind a press-and-hold gate, the parent sees what the Coach now believes. [Read the belief on screen.] Every belief carries its evidence. Tap it and you get the actual problems it rests on, each marked first-try, after a Hint, or revealed, and what Ollie will test next Session. A parent can check it.

## Slide 4, architecture (1:35 to 1:55)

> How it's built. A pure engine owns the math: every problem, every answer, the Hint, mastery, the rewards. Deterministic, tested, no model anywhere near it. On the other side, four generative jobs: word problems in the child's theme, the Coach's beliefs and next plan, the parent summary, and Ollie's voice. The AI can personalise the learning path. It cannot make up the math.

## Slide 5, two seams (1:55 to 2:10)

> Everything a model writes passes a deterministic check before a child or a parent sees it. A story that changes a number is rejected. A plan that leaves the curriculum is rejected. A belief that cites a problem the Coach was never shown is rejected, and the fixed plan takes over, so play never stops. Built in nine days with Claude Code, and every line of that is disclosed.

## Slide 6, the eval (2:10 to 2:22)

> How do we know the Coach works? We built six simulated children, each with a known ability, and for two of them we hid a specific trouble spot. Each played twenty Sessions with the Coach and twenty with a plain drill, three times over. Here is what held across all three.

## Slide 7, finding 1 (2:22 to 2:32)

> Every belief in the Notebook points at the problems it rests on. Out of ninety-five thousand nine hundred and twenty-two, the Coach pointed at a problem the child never saw exactly once, and the engine threw that note out before anyone read it.

## Slide 8, finding 2 (2:32 to 2:42)

> It found the hidden trouble spots in four of six chances, from the evidence alone, around Session six for sums that cross ten. And every one of its three hundred and sixty Session plans stayed inside the curriculum.

## Slide 9, finding 3 (2:42 to 2:52)

> Two things we're honest about. Sometimes the Coach sees a pattern that isn't there, because eight problems a day is a small sample. And a plain drill reaches "mastered" a little sooner, because our simulated children can't learn from practice. Real children do. Both are fixable, and both are next.

## Slide 10, after the hackathon (2:52 to 3:02)

> Next: the engine takes over the statistics, so the Coach can only call a belief supported when the counts back it. Children who learn, so the speed comparison means something. Then a mobile app: a Session costs about twenty cents on Opus today and five on Sonnet, so a seven-dollar subscription works.

## Slide 11, close (3:02)

> Ollie learns how you learn.

## If you are over three minutes

Cut in this order: the last sentence of slide 2 ("Mastery changes the game..."), the Count-On Flight line in the demo, the "Built in nine days" sentence on slide 5. Never cut the two taglines, the architecture line, or the two weaknesses on slide 9.
