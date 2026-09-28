# K–5 Gamified Math Experience — Research Index

**Researched:** 2026-09-09, with a licensing fact-check on 2026-09-10. Four background agents, each working from primary sources, each report self-contained and cited inline.
**Goal:** a gamified (streaks, badges, earned cosmetics) K–5 math learning experience with an animated, voiced character, built in nine days to 2026-09-18. First target user: a US 1st grader, age 6–7.

> **Scope change, 2026-09-09:** voice *input* is dropped. Three reasons stack. A voiceprint is a biometric under the 2025 COPPA amendments and a child's voice is personal information (report 03), so voice input would mean collecting biometric data from under-13s, which the project will not do, and testing with a six-year-old is testing with an under-13, which needs verifiable parental consent. Child speech recognition was the weakest link in report 03. And the nine-day window cannot absorb the speech experiment report 03 said was required. Voice *output* (a pre-rendered character voice, read-aloud of every instruction) stays: a pre-rendered voice costs under $25 and no child audio is collected (report 03, §2). Report 03 is now reference material for the character voice only; its ASR and realtime-agent sections are parked.

| # | Report | What it answers | Size |
|---|---|---|---|
| 01 | [Educator / school-used math games](./01-educator-math-games.md) | What Prodigy, DreamBox, Zearn, ST Math, Khan Kids, Reflex, IXL etc. actually do; what the learning science and the motivation research say; open-source code we can reuse; 12 mechanics worth stealing; reward-economy evidence | ~1,140 lines, 360+ citations |
| 02 | [Mobile feasibility](./02-mobile-feasibility.md) | Stack options (React Native, Flutter, Unity, Godot, web); Rive vs Lottie for the character; Apple Kids Category and Google Families rules; COPPA and child audio; distribution paths | ~340 lines |
| 03 | [Voice AI](./03-voice-ai.md) | LiveKit, ElevenLabs, OpenAI Realtime, Gemini Live, Pipecat, Vapi, Azure Voice Live; TTS for the character; child-speech ASR accuracy; vendor terms for under-13s; cost per architecture | ~560 lines |
| 04 | [Mobile market + K–5 content map](./04-mobile-market-and-content.md) | 24 live App Store / Play apps compared; ~1,300 reviews sampled; Duolingo's streak numbers; every Grade 1 standard with a voice-answerable example; the Common Core progression as a build order | ~630 lines |
| 06 | [ElevenLabs terms](./06-elevenlabs-terms.md) | A primary-source fact-check of ElevenLabs' licensing: the cheapest tier with commercial rights, Output ownership, Voice Design by API, model IDs and audio tags, caching, and the children's clauses | short |

## The conclusions that survive the scope change

1. **This is a nine-day build, and the working product and its write-up carry it.** A hosted demo anyone can open matters more than a native app. Permissive licences only, no copyleft code or assets, and no under-13 testing without verifiable parental consent.

2. **Put an AI layer and an adult in the same loop as the child.** The child plays; the AI adapts item selection and hints; and every session ends with a summary for a parent that names the *strategy* the child is using and what to do next (04, 01).

3. **No reading required, so the character must speak everything.** A 1st grader cannot read the UI (04). Pre-render the character's voice once for under $25; no child audio is collected, so none of the vendor or COPPA constraints in report 03 apply (03). Audio output is table stakes and its failure earns one-star reviews (04). ElevenLabs Voice Design is the only prompt-to-character tool; Amazon Polly has the clearest caching licence; Kokoro-82M is the free fallback (03).

4. **Input is tap, with large targets.** Every Grade 1 standard has a tap-friendly form: choose a number, pick bigger/smaller, true/false, place counters on a ten-frame, drag base-ten blocks (04, §B5). The four visual primitives are ten-frames, number lines, base-ten blocks, and a rekenrek (04).

5. **Stack: web-first, Next.js is the safe bet.** A hosted web demo is the easiest thing to share and to show on a tablet. Report 01's Phaser/Excalibur suggestion and report 02's React Native + Rive recommendation both remain valid if a richer game surface or a native app is wanted later; Rive (MIT runtimes, state-machine character) works on web too (02).

6. **Reward economy: currency buys cosmetics, mastery unlocks areas, never sell power.** Prodigy is the cautionary tale (04). Tangible rewards are *most* harmful for exactly this age group; gamification effects decay from strongly positive over days to negative over a school year; the single worst pattern is a visibly partial reward such as 1 of 3 stars (01). Avatar customisation is the one mechanic shown to raise autonomy (01). Plan the fade from day one (01).

7. **Streaks work, with forgiveness built in.** Duolingo's 10-K: 43M daily users on 7-day+ streaks; 7-day-streak learners 3.6× more likely to finish a course; milestone animations +1.7% day-7 retention; a second Streak Freeze +0.38% DAU (04). Ship two freezes and a small parent-set daily goal. No leaderboards, hearts/lives, timers, purchasable currency, or hard paywalls (01, 04).

8. **Content: Grade 1, sequenced by the Common Core Progression, with K fallback.** Grade 1 is 21 standards (04). Build order: subitizing → counting/cardinality → number bonds and partners to 10 → teen numbers as 10+n → counting on → make-a-ten → subtraction as unknown addend → tens and ones → 10 more/10 less (04). Strategy-named badges ("Make-Ten Master", "Counting-On Champion") map to the Progression's three levels and give the adult summary something to say (04). No money content, no speed gates above sums to 10 (01).

9. **Where the LLM earns its place.** Generating word problems in the child's chosen theme (word problems are the strongest Grade 1 content and reading is the barrier, so the character reads them aloud); producing the adult-facing session summary; choosing the strategy hint on a second wrong attempt; adapting item selection from the mastery model. Arithmetic scoring stays deterministic (04, 01).

10. **Set honest expectations and design the parent loop.** Independent studies of DreamBox, Zearn and ST Math land at +0.03 to +0.20 SD (01). The strongest first-grade result on record came from a parent and child doing one word problem together at bedtime (01). A summary that shows *which strategy* the child used is a differentiator no consumer app ships (04), and it is the feature the whole design turns on.

## Reusable building blocks identified

- **Scheduling:** `ts-fsrs` (MIT) for spaced retrieval; no product in the category publishes a spacing model (01).
- **Answer checking:** `perseus-score` and `kas` from Khan/perseus (MIT) (01).
- **Content:** Illustrative Mathematics 1st edition only (CC BY 4.0; later editions and EngageNY are non-commercial) (01).
- **Art and audio:** Kenney (CC0), CC0-filtered OpenGameArt and Freesound (01).
- **Activity structure:** copy GCompris's declarative per-activity manifest pattern, not its AGPL code (01).
- **First activity to build:** the linear number board game, effect size d = 1.62 after one hour in an independent RCT; then the subitizing "how many am I hiding?" game from the WWC practice guide (01).
- **No mature open-source K–5 math game exists to fork** (02).

## Open questions to settle before spec

1. **Pick the demo surface.** Web app hosted at a public URL is the default; confirm whether a tablet-sized layout is enough or a phone layout is also needed for the video.
2. **Choose the character voice vendor and confirm commercial terms in writing** before rendering (03). Polly is the safest licence; ElevenLabs Voice Design gives a designed cartoon voice but its commercial tier is unverified.
3. **Decide who the adult summary is for.** Parent, tutor, or both. A parent framing matches the evidence base (01, 04).
4. **Testing with your own child** counts as testing with an under-13; it needs verifiable parental consent, which as the parent you can give. Do not collect or store any of her data in the app or the repo.
5. **Parked from the voice-input phase**, for a later product: the child-speech ASR experiment (03), iOS PWA microphone behaviour (02), Kids Category one-way door (02, 04).
6. **Unverified items flagged in the reports:** funding figures for SplashLearn, Prodigy, Enuma, Boddle; Khan Academy's and Zearn's exact Grade 1 unit order; Reflex's Green Light threshold; ST Math's mastery threshold (01, 04).

## Where this goes next

Take these files into `/grill-with-docs` to sharpen the idea into a `CONTEXT.md` glossary and the first ADRs (demo surface and stack, reward economy, content scope, where the LLM sits), then `/to-spec` and `/to-tickets`. With nine days, keep the spec to what a short demo can show.
