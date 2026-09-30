# Ollie demo: script

A video of about 10 minutes covering the app's basics and its evals. Each segment has **Screen** (what to show), **Say** (talking points, not word for word) and **Prep**.

## Before recording

- [ ] Wi-Fi off and Ethernet only (`networksetup -getairportpower en1` should say Off). See decision 43.
- [ ] Coolify: check that `ELEVENLABS_MODEL_ID=eleven_v4` is set. The code default is `eleven_v3`, and the bundled lines are on v4, so a live Story must use the same model or Ollie sounds different. Also check that `LANGSMITH_TRACING` is not set.
- [ ] On ollie.rahatcodes.com, in a fresh browser profile, play 3–4 Sessions a few minutes apart, so that Ollie's Notebook has real Hypotheses and Summaries. Nickname "Sam", Theme puppies or space. Miss a crossing-ten Problem or two on purpose (e.g. 8 + 5) so a Hypothesis shows up.
- [ ] Keep a second, clean browser profile for onboarding.
- [ ] Terminal in the repo, large font, main pulled.
- [ ] Tabs open: README on GitHub (the Results table), `docs/evals/preregistration-1.md` (the Correction at the end), `docs/evals/convergence.svg` and `evidence-integrity.svg`.

## 1. Hook (0:00–0:30)

**Screen:** the README header with the tagline.
**Say:**
- "AI tutors have one job they can't get wrong: the math. So here the AI isn't allowed to do the math."
- "The AI can personalise the learning path. It cannot make up the math."
- The thesis: the model declares what's checkable, deterministic code checks it, and the evals are allowed to say no. "I'll show you the app, then the evals, including where they said no."

## 2. The app (0:30–3:30)

**Screen: onboarding** (clean profile). Nickname, Avatar colour, Theme, and the note on what leaves the device.
**Say:** No accounts. The only personal word that leaves the device is the Nickname, and only so a Story can be spoken.

**Screen: a Session.** Ollie reads the Problem aloud. Answer one right. Get one wrong: a Hint appears with the ten-frame or number line. Get it wrong again: the Reveal.
**Say:** "Every Problem, answer and Hint is plain code. The model never writes one. A Grade 1 kid may not read yet, so Ollie reads everything aloud."

**Screen: the celebration.** Coins, the Streak, and a Power if one was earned.
**Say:** Rewards are for effort. Powers are what Ollie learns when a strategy is Mastered.

**Screen: the Parent Area** (the prepped profile). Hold "Grown-ups" for 3 s (the Parent Gate). Show the Parent Summary, Mastery per Skill, then **Ollie's Notebook**. Tap a Hypothesis to show the actual Problems it rests on.
**Say:** "This is the Coach's work. After every Session it reads the evidence, writes beliefs about how the child learns, and plans the next Session. Every belief shows the exact Problems behind it."

## 3. How it works (3:30–5:00)

**Screen:** `docs/architecture.svg`.
**Say:**
- The engine owns the math. The Coach (Claude Sonnet 5.5) gets the evidence and the Notes, never a Problem or an answer.
- The Coach can only choose from the Plan Space, the set of Plans the engine allows.
- The engine checks what comes back. A Hypothesis citing a Problem it never saw is rejected. So is a Plan outside the space.
- One retry carries every reason back. After a second failure the Baseline Plan is used, so play never stops, and the Notebook says so.

**Screen:** `src/coach/coach.test.ts:71`, the test "rejects a Hypothesis citing a Problem not in the Log, retries once with the reason…", and run it:
`pnpm vitest run src/coach/coach.test.ts`
**Say:** "That rule is a test, not a hope."

**Optional, 15 s:** it's a real public product, so there's server-side validation, an origin check, rate limits, and a $5/day spend cap. (The README's "hardening" list: 403 cross-origin, 429 on a burst.)

## 4. The evals (5:00–7:00)

**Screen:** terminal, `pnpm eval --fake` (no key, no cost), scrolling the report.
**Say:**
- Six Simulated Learners with planted weaknesses (e.g. struggles when a sum crosses ten) play 20 Sessions each, under the Coach and under a plain Baseline, on the same seeds.
- What's measured:
  - Does it make up evidence? (Evidence Integrity)
  - Do its claims match the evidence? (Claim Agreement)
  - Does it find the planted weakness, and invent ones that aren't there? (Detection and false positives)
  - Where did each Plan come from?
  - Mastery against the Baseline, cost, latency.
- A model Judge grades Stories and Summaries, but its score only counts if it agrees with my hand labels (at least 80%, kappa at least 0.6). "The Judge gets graded too."
- **Pre-registration:** thresholds committed in git before the run, with what counts as failing. Results are published pass or fail. "The commit history is the proof I didn't move the goalposts."

**Screen:** `evidence-integrity.svg`, then `convergence.svg`.

## 5. The evals said no (7:00–9:30), the centrepiece

**Screen:** the README Results table.
**Say:** The question: can Sonnet 5.5 replace Opus 5?
- **Passed:** 0 invented citations in 35,189. Detection 6 of 6 (Opus got 4 of 6). About a quarter of the cost per Session ($0.05 against $0.21).
- **Failed:** false positives, Mastery on one run, latency, Story readability. "Four red rows, published."

**Story 1, latency** (the best one). Show the Correction in `preregistration-1.md`.
- "Sonnet cut the Coach call from 71 s to 30 s. But the eval flagged a p95 of 92 s: 1 call in 10 took about 70 s longer."
- "My first probe said the API was slow. That was wrong: it only logged requests that succeeded."
- "So I logged every attempt, including failed ones, and read the kernel log. Every slow call matched a dead connection. My Mac was on the network over Ethernet and Wi-Fi at once, and IPv6 connections were silently dying. Node gives up on a dead connection after exactly 70 s, then the SDK retries."
- "Wi-Fi off: 40 calls, 0 stalls, p95 35 s. It still fails the 30 s line I committed to, because the Coach writes more as its notes grow. So it stays a FAIL."
- Point: "The eval caught a real problem. The first explanation was wrong, and the instrumentation found the real one."

**Story 2, the Judge.**
- "Story readability dropped. It looked like the new model writes worse Stories."
- "The calibration gate showed the new Judge failing Stories over `{{nickname}}`, the placeholder the app fills with the child's name."
- "I told the Judge about it and re-judged everything. Under the same Judge, the new model's Stories score *higher* than the old one's. The drop was a stricter Judge, not a worse writer. That's labelled exploratory, and the pre-registered FAIL stands."

**Story 3, false positives** (short). Sonnet supported half as many Hypotheses, with about the same number of false ones, so the rate went up. The fix is next: the Minimum-Evidence Rule.

## 6. Close (9:30–10:00)

**Say:**
- Limits, said plainly: six Simulated Learners who can't learn yet, so "faster to Mastery" isn't a fair test yet.
- Next: the engine will require minimum evidence before a belief is marked supported, then Pre-registration 2 re-tests it.
- The repo and the live link are in the description. It's open source, MIT.

## Numbers on screen: where each comes from

| Claim | Source |
|---|---|
| 0 invented IDs in 35,189; detection 6 of 6; cost $0.0499–0.0541 against $0.2083–0.2148 | README Results / `preregistration-1.md` Results |
| Mean Coach call 69.9–73.3 s (Opus 5) against 29.0–31.4 s (Sonnet 5.5) | the six reports, `telemetry.byOperation.coach` |
| p95 92.2–94.0 s; 30 dead connections for 30 slow calls | `preregistration-1.md`, the Correction |
| 40 calls, 0 stalls, p95 34.9 s | `latency-probe-v2-2026-09-30T03-41-22-564Z.json` |
| Placeholder in 0 of 99 re-judged fails; 0.500–0.567 against 0.276–0.414 | `rejudge-2026-09-29T21-50-24Z.txt` |
