# Grilling decisions — 2026-09-10

Every decision from the `/grill-with-docs` session, in the order settled. Vocabulary is canonical in `CONTEXT.md`; rationale for the three hard-to-reverse ones is in `docs/adr/`. This file feeds `/to-spec`.

**Deadline:** Nerdy AI Hackathon Prompt 01, submissions close 2026-09-18 11:59 PM CDT. Judged on pedagogical rigor, AI product engineering, demo quality. Individual entry, no copyleft, IP assigns to Nerdy, no under-13 testing without parental consent, no biometrics. Full detail: `docs/research/k5-math-game/05-nerdy-hackathon-alignment.md`.

## Surface and stack

- Next.js web app, tablet-first, landscape. **Deployed via Coolify on Hetzner at ollie.rahatcodes.com behind Cloudflare. Never Vercel** (user rule, 2026-09-10).
- Progress, Streak, Coins, Parent Summaries in `localStorage`. No database, no accounts (ADR 0002).
- Next.js API routes call Claude and ElevenLabs. Generated audio stored on a persistent volume on the Coolify host (Cloudflare R2 if ever needed).
- Git initialised 2026-09-10; GitHub repo to be created when the user says. Public/private undecided.

## Learner and parent

- One local Profile: first name (typed by the parent), Avatar colour, Theme. Parent does onboarding: name, avatar base, theme, then play.
- Parent Gate: press-and-hold, Todo Math style.
- Parent Area: last 7 Parent Summaries, Badges, Mastery per Skill, Ollie's Notebook.
- Parent Summary: strategies practiced with evidence (correct, Hints, Reveals, speed), what was Mastered, one bedtime activity for the weakest Skill. Never claims to know how the child was thinking. In-app only, no email.

## Content

Units and Skills, in progression order (7 Skills):

1. **Unit 1 — Partners and teens**: (a) partners to 10 on a ten-frame; (b) teen numbers as 10 + n.
2. **Unit 2 — Counting on and make-a-ten**: (c) counting on from the larger number; (d) make-a-ten within 20; (e) subtraction as unknown addend.
3. **Unit 3 — Word problems**: (f) add-to / take-from result unknown and put-together total unknown; (g) change unknown. Compare problems deferred.

- Visuals: ten-frame (a, b, d) and number line (c, e). Unit 3: theme picture plus number pad.
- Input: number pad 0–20 as big buttons. A Repeat button on every Problem.
- Wrong answer: first miss shows the hand-written Hint with the visual; second miss is a Reveal. Counts as incorrect for Mastery; never costs Coins or Streak.
- Hints are hand-written per Skill, keyed to the strategy. Never model-written (ADR 0001).
- No timers, no money content, no speed gates. English only.

## Generation

- Engine owns problem type, numbers, and answer (ADR 0001).
- Stories: Sonnet 5. Rules: two sentences, under 25 words, Learner's first name included, theme vocabulary only. Schema-validated; regenerated if numbers or answer are missing or altered.
- Six illustrated Themes chosen at Profile creation, changeable in the Shop: puppies, dinosaurs, space, ocean, fairies, trucks.
- Demo safety: pre-generate the first three Sessions per Theme (stories plus audio) at build time. Live generation from Session four.

## Voice and character

- Ollie, an owl. Voice designed with ElevenLabs Voice Design on the Starter tier ($6/mo, commercial rights; see research note 06). Brief: warm, playful, gently energetic, sounds like a kind older kid, gender-neutral leaning bright, slow clear diction. Not a baby voice, not a teacher voice.
- Fixed lines pre-rendered once. Each generated Story rendered in the same voice at creation time and cached with it. Model: eleven_v3 for expressive tags.
- Animation: layered SVG with CSS, four states: idle, talking (mouth while audio plays), celebrate, encourage.
- Art: AI-generated images in one consistent style, disclosed in the submission, plus Kenney CC0 icons.

## Rewards

- Streak: one completed Session per day, device local time. Two Freezes held at most. Milestone animations at 3, 7, 14 days.
- Coins: 10 per completed Session, for effort, regardless of accuracy. Cosmetic only, never purchasable.
- Shop: 12 Avatar Items in three tiers at 10 / 30 / 70 Coins. Six visible from day one.
- Avatar: a round creature, four colour bases, slots for hat, accessory, pet.
- Badges: Counting-On Champion (Skill c Mastered), Make-Ten Master (Skill d), Word Problem Wizard (Unit 3 Mastered).
- No leaderboards, no hearts or lives, no XP.
- Navigation: home screen with Ollie, Avatar, one big Play button, Shop. Play always builds the next Session from the Session Plan. A three-stop Path shows Units and Badges.

## The loop (ADR 0003)

- Session: 6–10 Problems from a Session Plan. Ends with celebration, Coach run, Parent Summary.
- Session Log per Problem: Skill, structure, numbers, correct/incorrect, Hint shown, Reveal, time to answer, position.
- Knowledge Estimate: Bayesian Knowledge Tracing per Skill, four hand-set parameters per Skill. Mastered at estimate ≥ 0.95 and 8 of last 10 correct. Unit unlocks when its Skills are Mastered.
- Coach: Opus 5, once per Session. Reads Session Log and Learner Notes; rewrites Notes as Hypotheses (claim, evidence, status: proposed / supported / refuted); emits the next Session Plan.
- Plan Space (the only levers): Skill mix, number ranges inside each Skill's standard, problem structures, review share (may be zero), length 6–10, Hypothesis under test. Prerequisite order cannot be skipped. Engine validates and rejects anything outside.
- Cold start: a fixed Diagnostic Session sampling Skills a, b, c. Feels like play.
- Ollie's Notebook: Parent-facing plain-English view of the Notes: current beliefs, what changed, what's being tested. The child sees only Ollie.

## Evals

- Six hand-designed Simulated Learners, seeded, 20 Sessions each: strong, average, weak, crossing-ten weakness, change-unknown weakness, fast-fatigue. Probabilistic answers from true per-Skill ability, weakness tags, fatigue curve. No LLM plays the child.
- **Decided 2026-09-11 (ticket 05):** two Simulated Learners are held out of prompt tuning and scored separately: change-unknown weakness and fast fatigue. Tuning keeps the ability spread (strong, average, weak) and the crossing-ten weakness the video is built on.
- Targets: (1) Coach Hypotheses vs planted weaknesses: hit rate, sessions to detection, false positives. (2) Loop convergence vs Baseline (fixed 8-of-10 gate, fixed 6+2 composition): sessions to Mastery, share of Problems in target accuracy band. (3) Story validity: deterministic checks plus Judge rubric for Grade 1 readability and theme fit on a sample. (4) Parent Summary faithfulness: Judge checks every claim against the Session Log; fails on unsupported claims or claims about the child's thinking.
- Judge: Opus 5 with a written rubric. Calibration Set: 20 Stories and 10 Summaries hand-labelled; Judge must agree above a threshold before its scores count.
- Cadence: one command, run before any prompt or Plan Space change. Dated JSON reports under `docs/evals/`. Chart regenerates from them.

## Scope and risk

- Full scope, no cuts, chosen explicitly on 2026-09-10 with eight days left. Cuts offered and declined: shop to 8 items, change-unknown as stretch, two pre-generated sessions instead of three.
- Video (2–3 min): daughter plays a Session with Ollie (~90s), parent reads the Summary and Notebook (~30s), one slide on engine/model split, the loop, and the convergence chart (~30s). Parental consent is the user's own.

## Open

- GitHub repo: https://github.com/Rahat-ch/ollie (remote added 2026-09-10; visibility as set by the user).
- Which ElevenLabs tier for 192 kbps MP3 if wanted (Creator+); Starter is fine for the demo.

---

# Amendments — 2026-09-10, after external review

The user shared a review of the spec from another model and accepted the following. Each replaces the earlier decision where they conflict. Contest clause confirmed from the terms page: "the Entry does not mention or depict any identifiable person other than you."

1. **Ollie's Powers are the signature mastery mechanic.** Four Powers tied to Mastery: Count-On Flight (counting on), Make-Ten Magic (make-a-ten), Missing Number Detective (unknown addend), Story Solver (Unit 3). Each visibly changes how Ollie solves on every matching Problem. Powers replace Badges. Shop shrinks from 12 to 6 items. Taglines: "Ollie learns how you learn" and "The AI can personalise the learning path. It cannot make up the math."
2. **Content Pool replaces pre-generated Sessions.** Only the Diagnostic Session is fully bundled. Sessions 2+ are always Coach-planned. Build time generates Story variants and audio per Theme × Skill × structure × number range; run time fills Plans from the Pool, generates misses live and adds them, and falls back to a template sentence. The earlier "first three Sessions per Theme" was contradictory with the loop and with a Nickname that does not exist at build time.
3. **BKT learns from the first attempt only.** Each Problem records one Assistance State: first-try correct, Hint-assisted correct, Revealed, unresolved. Hint and Reveal outcomes are Coach evidence, never a second mastery observation. Mastery's 8-of-10 counts first attempts. Response time is logged as context and never lowers Mastery.
4. **Hypothesis evidence is machine-addressable.** Each Hypothesis: claim, status, confidence, evidence as Problem IDs, next test. The engine rejects unknown IDs. New eval: Evidence Integrity (deterministic).
5. **Precise curriculum claim.** "A focused Grade 1 arithmetic progression aligned to key CCSS 1.OA and 1.NBT concepts." README maps each Skill to its standard. Never "the Common Core Grade 1 progression".
6. **Nickname, not first name.** Onboarding asks "What should Ollie call you?" The Nickname is sent to Story generation and TTS; onboarding says so plainly. Nothing else leaves the device.
7. **No child in the video.** Screen-recorded, the entrant taps as the Learner. Real sessions with the user's daughter may inform the build under the user's own parental consent, but never appear in the Entry.
8. **THIRD_PARTY.md at repo root** listing APIs, models, fonts, images, audio, OSS with licences, and generative-AI assistance; pasted into the submission form.
9. **No Session ever blocks on TTS.** Fallback chain: cached audio, bundled fixed line, platform speech synthesis, on-screen template.
10. **Judge stays Opus 5**, gated by the human-labelled Calibration Set; the same-family limitation is stated in the write-up. A second judge model was declined.
11. **Cut order reordered.** If days run short: Shop depth (6→4), Freeze and streak edge cases, Themes (6→3), cosmetic polish, extra Story variants. Protected: Ollie's voice and child UI, ten-frame and number line, the Coach loop with evidence IDs, the bounded planner, the Notebook, simulation vs Baseline, the convergence chart, Powers.
12. **One-story video plan** built around a crossing-ten weakness: problem, play, Notebook money shot, one architecture graphic, convergence chart, tagline. Detail in spec.md Further Notes.
13. **No Vercel, ever.** Deploy as a Docker container via Coolify on Hetzner at ollie.rahatcodes.com behind Cloudflare. Audio on a persistent volume. Replaces every earlier mention of Vercel and Vercel Blob.
14. **Design direction before UI.** A ticket settles palette, type, Ollie's character sheet, illustration style, and core screens before the Session screen is built. The look must be pleasant and not read as AI-generated: SVG-first, hand-tuned, one consistent style; image models for reference only; anything generated that ships is disclosed.

---

# Amendments — 2026-09-11, after ticket 05

Confirmed by the user on 2026-09-11.

15. **Target accuracy band is 0.7 to 0.9.** A Problem is at the right difficulty when the Simulated Learner's true chance of a first-try correct answer is between 0.7 and 0.9. The convergence eval reports the share of Problems in the band per Learner and per split (`TARGET_ACCURACY_BAND` in `src/evals/convergence.ts`).
16. **Held-out split** as recorded under Evals above: change-unknown weakness and fast fatigue.
17. **Simulated Learner ability is static.** A Simulated Learner does not improve with practice, so Sessions to Mastery measures how fast a planner confirms a fixed ability and the band share measures how well it picks difficulty. The band share is coarse under this model (true probability depends on Skill, tag, and position, not the Problem's numbers), so it is not a headline number in the video. A practice effect may be added to the profile later without changing the seams.

---

# Amendments — 2026-09-13, after ticket 14

The spec says only "Two Freezes maximum, consumed automatically" and "Streak, Coins, Powers, and Mastery all live behind [the Loop]", so these three readings were settled while building the Streak, the Coins, and the Shop, and are recorded here as the decisions they are.

18. **Freezes are granted at a milestone.** The Learner starts with both Freezes and a Streak milestone (3, 7, 14) hands one back, capped at two. The spec names no grant rule; tying the grant to the milestones it does name beats inventing a cadence, and it says something plain to the Learner ("A Freeze for the day you miss") on the card that celebrates the milestone.
19. **A reset keeps the Freezes it could not spend.** One Freeze covers one missed day. When more days are missed than the Freezes in hand can cover, the Streak starts again at today and the Freezes are kept, because a Freeze that saved nothing was not spent. The Streak a screen shows is `streakToday`, a read: nothing is rewritten until the next completed Session.
20. **The rewards live in `src/rewards`, beside the Loop rather than inside it.** The module is pure, data in and data out, with no I/O, and the Play reducer composes it with the Loop's `finishSession`; the Loop, its `ProfileState`, the Simulated Learners, and the eval command are untouched by Coins and the Streak, and stay about the math. This is a placement, not a weakening of the spec's seam: the Coins and the Streak are still a pure function of the Session and the day it was completed on.
