# Ollie demo: beat sheet

About 10 minutes. Written to `script-guidelines.md`.

**How to use this:**
- **Screen** is what's on camera.
- **Say** is a set of lines to riff from, in your words. Go off script whenever it feels better.
- **Must say** lines carry a fact. Say those numbers as written.
- The "say" lines total about 1,330 words, or about 1,240 without the optional beat 8. That's about 7 minutes of talking at your pace, and the rest is screen time and riffing.

## Before recording

- [ ] **Network.** Wi-Fi off, Ethernet only (`networksetup -getairportpower en1` should say Off).
- [ ] **Coolify.** `ELEVENLABS_MODEL_ID=eleven_v4` is set, so live Stories sound like the rest of Ollie. `LANGSMITH_TRACING` is not set.
- [ ] **Prepped profile.** On ollie.rahatcodes.com, in one browser profile, play 3–4 Sessions a few minutes apart. Nickname "Sam". Miss a couple of crossing-ten Problems on purpose (8 + 5, 9 + 4), so the Notebook has a crossing-ten belief with its Problems. Note what the Notebook actually says before you film.
- [ ] **Clean profile.** A second, clean browser profile for onboarding.
- [ ] **Terminal.** In the repo, with a big font.
- [ ] **Tabs open:** the README Results table; `docs/evals/preregistration-1.md`, scrolled to "Correction, 2026-09-30"; and `docs/evals/latency-probe-v2-2026-09-30T03-41-22-564Z.json`.
- [ ] **Kernel-log screenshot.** Open `docs/evals/latency-kernel-log-2026-09-29.txt` (see the bottom of this file).

## 0. Cold open (0:00–0:20)

**Screen:**
1. Ollie reads "What is 8 plus 5?" aloud.
2. Tap 12. The Hint and the ten-frame appear.
3. Cut to Ollie's Notebook on the prepped profile: the crossing-ten belief, then tap it to show the actual Problems.

**Say:** nothing, or just one line over the Notebook:
- "…and it picked up that Sam struggles when a sum crosses ten."

## 1. Intro and open loop (0:20–1:10)

**Say:**
- "Hey y'all, this is Rahat, and I've been building a math game for first graders called Ollie."
- "So, that was Ollie reading a problem out loud, cuz a lot of first graders can't really read yet."
- "And then that notebook at the end? That's the AI part. After every session, it actually looks at how the kid did, writes down what it thinks is going on, and plans the next session."
- "Today we're actually going to look at the app, and then at the part I care most about, which is the evals. Basically, how do I know the AI is actually right?"

**Must say** (the hard number):
- "I switched the AI from Opus to Sonnet, and it got about four times cheaper per session."
- "But before I ran anything, I wrote down what counts as a pass and what counts as a fail. And some of those failed."

**Must say** (the open loop):
- "And one of them sent me down a whole rabbit hole. At the end I'll show you what it was, and honestly, the problem turned out to be me."

## 2. The rule (1:10–1:40)

**Say:**
- "So AI is really great at a lot of things, but the one thing a math app actually can't mess up is the math, right? Like, is eight plus five thirteen?"
- "So in Ollie, the AI isn't even allowed to do the math. Every problem, every answer, every hint is just plain code."
- "The AI can personalise the learning path. It just can't make up the math."

## 3. The app (1:40–3:30)

**Screen: onboarding** (clean profile): Nickname, Avatar, Theme, the privacy screen.
**Say:**
- "So, setup is super quick. A nickname, a little avatar, a theme."
- "And there's no account. The only personal thing that ever leaves the device is the nickname, and only so Ollie can say it out loud."

**Screen: a Session.** Answer one right. Get one wrong (Hint, ten-frame). Get it wrong again (Reveal).
**Say:**
- "First wrong answer, you get a hint, with the ten-frame here."
- "Second wrong answer, Ollie just shows you the answer and how to get there. No punishment, it just counts as a miss."

**Screen: the celebration.** Coins, Streak, a Power if there is one.
**Say:**
- "Coins are for effort, not for being right. And when you master a strategy, Ollie actually learns a power and starts using it on screen."

**Screen: the Parent Area** (prepped profile). Hold "Grown-ups" for 3 s. Show the Summary, Mastery, then the Notebook. Tap a belief to show its Problems.
**Say:**
- "And this is the parent side. You hold this button so a kid can't just wander in."
- "So, what is this notebook? This is what the AI, I call it the Coach, currently believes about Sam."
- "And the key thing is, every belief shows the actual problems it's based on. So it can't just say 'struggles with crossing ten' without showing you the proof."

## 4. How it works (3:30–4:45)

**Screen:** `docs/architecture.svg`.
**Say:**
- "So, how does this actually work?"
- "After a session, the Coach gets the evidence: every problem, and whether Sam got it first try, needed a hint, or got shown the answer."
- "It never gets a problem to write or an answer to give. What it gives back is its notes and a plan for the next session."
- "Now, before any of that reaches the kid, my code checks it. Did it cite a problem it was never shown? Rejected. Is the plan outside what the curriculum allows? Rejected."
- "It gets one retry with every reason. And if it fails again, the app just uses a plain fallback plan, so the kid can always keep playing."
- "The key thing is that the AI only suggests, and the code actually decides."

**Screen:** terminal, `pnpm vitest run src/coach/coach.test.ts`. Show the test at `src/coach/coach.test.ts:71` ("rejects a Hypothesis citing a Problem not in the Log…").
**Say:**
- "And that rule is actually a test, so let's just run it, right?"

## 5. The evals (4:45–6:15)

**Screen:** terminal, `pnpm eval --fake`, scrolling the report.
**Say:**
- "So, how do I know any of this works? I can't exactly test it on a hundred first graders."
- "So I made six fake kids. Each one has a weakness hidden in it, like they struggle when a sum crosses ten. And each plays twenty sessions with the AI, and twenty with a plain, boring plan, same seeds."
- "Then I check a few things. Does the AI make up evidence? Does it find the hidden weakness? Does it invent weaknesses that aren't there? Where did each plan come from? And what does it cost, and how slow is it?"
- "And for the stories and the parent summaries, another model grades them. But that grader has to agree with my own hand labels first, or its score doesn't count. So the grader gets graded too."

**Must say:**
- "And before I ran anything, I wrote down the pass and fail line for every one of these and committed it to git. So if you look at the commit history, the lines were there first. I couldn't move the goalposts after."

## 6. The results: credit first, then the misses (6:15–7:15)

**Screen:** the README Results table.
**Say:**
- "So, I ran it three times on Opus, and three times on Sonnet."

**Must say** (credit first):
- "Sonnet made up zero evidence. Zero invented problems out of about 35,000 citations."
- "It found the hidden weakness 6 out of 6 times. Opus got 4."
- "And it's about a quarter of the cost per session."

**Must say** (then the misses):
- "And then you've got these red rows here. Four of them."
- "It claims weaknesses that aren't there more often than Opus did. One run mastered a bit slower. The stories scored lower. And latency."
- "And honestly, I published all of those too, cuz that's kind of the whole point, right?"

## 7. The investigation, paying off the open loop (7:15–9:00)

**Screen:** the latency row, then the Correction in `preregistration-1.md`.

**Must say** (the symptom against the line):
- "So, latency. Sonnet is actually way faster than Opus. The average call went from about 71 seconds down to about 30."
- "But I'd set a line of 30 seconds for the slow end, and the slow end came in at about 92."

**Say** (the obvious suspect):
- "So obviously my first thought was, okay, the model's just slow sometimes, right?"
- "And my first probe actually agreed with me. It said no retries, nothing weird, just slow generation on the API side. And I wrote that down."

**Must say** (the detail that didn't fit):
- "But something was off. About one call in ten was taking about 70 seconds longer. Not 60, not 80. Always about 70."

**Screen:** one slow call's timeline: the gap before the request that worked.
**Say:**
- "So I built a second probe that logs every single attempt, even the ones that fail."
- "And look at this one. The call starts, and the request that actually worked doesn't even go out until 70 seconds later. The API answered it in a totally normal 35 seconds."
- "So the model wasn't slow. The time was going somewhere before the request even left my computer."

**Screen:** the kernel-log screenshot.
**Must say** (the root cause, said once):
- "So I checked my Mac's kernel log, and every slow call lined up with a dropped connection. Thirty slow calls, thirty dropped connections."
- "My Mac was on the same network twice, Ethernet and Wi-Fi. And my connections were just silently dying every few minutes. Node gives up on a dead connection after exactly 70 seconds, then it retries, and the retry is fast."
- "So the slow AI was actually my Wi-Fi."

**Screen:** the v2 probe summary.
**Must say** (the re-run and the honest part):
- "I turned off the Wi-Fi and ran it again. Forty calls, zero stalls. The slow end went from 92 seconds down to about 35."
- "Which still fails my 30 second line, cuz the AI's notes get longer every session. So it stays a fail. I fixed what was actually broken, and I didn't touch the line."
- "And no, I didn't just re-run it until it passed. The original fail and the correction are both published."

**Say** (generalise):
- "And that's honestly the whole reason I run evals. They don't just test the model. Sometimes they catch the person running them."

## 8. One more miss, quick (9:00–9:30) (optional, cut if long)

**Say:**
- "And there was one more like that. The story scores dropped, and it looked like the new model writes worse stories."
- "But the grader was actually marking the kid's name placeholder as a mistake. So I told it about that and re-graded everything, and under the same grader, the new model's stories actually score higher."
- "That one's labelled as after the fact, and the original fail stays."

## 9. Close (9:30–10:00)

**Say:**
- "So, that's it. The engine does the math. The AI reads the evidence and plans the next session. And the evals check both of them, and they're allowed to say no."
- "And none of this is just tied to a math game. If you're shipping anything with AI in it, write down what pass means before you run it, and publish what fails."
- "Next, I'm making the AI prove it has enough evidence before it's allowed to call something a weakness, and then I'll run the whole thing again."
- "The code's open source, link's below. Thanks for watching, and stay tuned for more."

## Sources for every number you'll say

| Line | Source |
|---|---|
| About four times cheaper ($0.2083–0.2148 to $0.0499–0.0541 per session) | README Results, row 7; `preregistration-1.md` |
| Zero invented problems in about 35,000 citations (35,189) | `preregistration-1.md` Results, row 1 |
| Found it 6 out of 6; Opus 4 | Row 4a |
| Four failed rows (false positives, mastery on one run, latency, story readability) | Rows 4b/4c, 5, 6, 9c |
| Average call about 71 s to about 30 s | Six reports, `telemetry.byOperation.coach` (69.9–73.3 s to 29.0–31.4 s) |
| Slow end about 92 s against a 30 s line | Row 6 (p95 92.2–94.0 s) |
| About 1 call in 10, about 70 s longer | Correction; 29 of 365 eval calls plus 1 probe call |
| Request went out 70 s later; API answered in 35 s | Correction (probe v1, call 14: 70.5 s gap, 35.8 s answer) |
| Thirty slow calls, thirty dropped connections | Correction (kernel log) |
| Forty calls, zero stalls, slow end about 35 s | `latency-probe-v2-2026-09-30T03-41-22-564Z.json` (p95 34.9 s) |
| New model's stories score higher under the same grader | `rejudge-2026-09-29T21-50-24Z.txt` (0.500–0.567 against 0.276–0.414) |

**The kernel-log screenshot.** `docs/evals/latency-kernel-log-2026-09-29.txt` is the saved extract; macOS has already rolled the live log over. Show three lines:
- **14:41:14:** the probe's `node:80745` opens a connection.
- **14:46:33.727:** that connection is dropped, `tcp_drop`, `Duration: 319.468 sec`, `so_error: 60`.
- **14:46:34.233:** a new connection opens, 0.5 s later. That's the retry.
