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

---

# Amendments — 2026-09-13, after ticket 11

Confirmed by the user on 2026-09-13, on reviewing Ollie's voice.

21. **The spec's "fixed lines" are Ollie's own hand-written lines.** The 120 lines in `ollieLines()`: the Hints, the cheers, the Reveal lines, and the end of a Session (3,066 characters). They are what `pnpm voice:lines` renders by default, and what "every fixed line is rendered once at build time and bundled" means. A Problem's spoken line varies with the engine's numbers, so the whole of it is 671 lines in the Skills' default ranges and 1,166 in their standard ones (about 30,000 and 50,000 characters). Those are in the same catalogue and are rendered as the voice budget allows, with `--kinds problem`; a Problem whose line is not rendered falls through the Speech Chain to the platform's own voice. The catalogue enumerates them from the Skills' own generators, so nothing is written down twice. _(Noted 2026-09-13, ticket 16: ticket 13 gave each of the four Powers its own line, so `ollieLines()` now holds 124 lines and 3,191 characters; that is the figure the README and ticket 16's closing checklist use.)_
22. **A Story's audio is rendered whole, per Nickname, on first play.** The spec said the Content Pool holds "pre-rendered audio for the fixed parts" of a Story, and that a Story with the Nickname in it is "rendered at creation time". Neither happens: a Story is written at build time with a placeholder where the Nickname goes (amendment 6 as ticket 10 built it), so at build time there is no line to render, and a Story is voiced as one whole line the first time a device asks for it. The Learner's first hearing of a new Story can therefore fall through to the platform's voice while the render is in flight; every hearing after that, on any device, is Ollie. Stitching a Story out of pre-rendered fixed parts and a rendered Nickname was rejected: the seams would be audible and the parts are a sentence apiece.
23. **Ollie's audio store is keyed by the line, not by the Profile.** The spec said Story audio is "cached per Profile". It is not: a rendered line is one file on the volume named after a hash of the whole line, so two Profiles with the same Nickname, Theme, and Problem share one file and the store grows per distinct line rather than per child. The hash is not a hiding place — the line has the Nickname in it and the audio says it out loud — it is only an address. Nothing on the volume ties a line to a Profile, which is less about the Learner than "per Profile" would have been.
24. **`/api/speech` is a second thing that leaves the device.** ADR 0002 lists it beside the Story route: the Nickname and the Story's words go to the server so the line can be voiced. The onboarding disclosure was reworded to say exactly that; the spec's user story 32 still says "sent to generate Stories and audio", which awaits the user's sign-off.

---

# Amendments — 2026-09-13, after ticket 12

The spec says the Parent Summary is "written by Opus 5 from the Session Log and the Notes" and that it "restates only what the Log supports". These three readings were settled while putting the Coach and the Summary in the app, and are recorded here as the decisions they are.

25. **The Summary's numbers are the engine's; the model writes the words.** The Summary writer is handed the Session Log already tallied by Skill and Assistance State, never the Log itself, and what it returns is two pieces of prose: the strategies practiced with their evidence, and one activity. The Parent Area renders the engine's counts under those words. This is ADR 0001 applied to the Summary the way the Story validator applies it to a Story: the model dresses numbers it cannot change. A deterministic validator then rejects any number in the prose that the input did not carry and any claim about how the Learner was thinking (a closed list of phrases), with two bounded attempts and then a hand-written template Summary, so a Parent always gets a note. The Judge, in the eval command, grades what the validator cannot see.
26. **The Summary speaks of "your child".** The spec's onboarding note and user story 32 send the Nickname to generate Stories and audio and say that nothing else leaves the device, so neither the Coach route nor the Summary route carries it, and both bodies are validated against shapes that have no place for it; ADR 0002 now lists all four routes and says the same. The glossary has no Parent-facing word for the Learner; the spec's own user stories say "she", which a note to a parent cannot, so the prompt fixes "your child" and the Notebook keeps using the Nickname, which never leaves the browser.
27. **One Coach run per Session means one run of the engine's rule, retry included.** The browser calls `/api/coach`, and the Coach step's own retry (ticket 06) may call it a second time with the reasons; that is one run. A 503, the server saying it has no key, is not retried: there is nothing to fix and nothing to reach, so the Baseline Plan stands at once and Ollie's Notebook says the Coach could not be reached. A completed Session waits on the record until a run writes it, so a reload mid-run starts the run again — still one run of the rule per Session, and a Session already coached never waits again. The rule itself is not repeated in the browser: `coachSession` and `writeValidSummary` are the same functions the CLI and the evals use, with a Generation whose two operations are the routes.

---

# Amendments — 2026-09-13, after ticket 13

The spec names the four Powers, what each one does on screen, and that they are never lost and never bought, but not what "richer Story variants" is, nor when in a Problem Ollie uses a Power. These three readings were settled while building Ollie's Powers, after ticket 12's had taken 25 to 27.

28. **"Richer Story variants" is the rich Story set.** Story Solver switches Unit 3 to a second set of Stories for the same Problems: the same numbers told as a scene — where in the Theme it happens and what the things are doing — instead of a bare count. The set is keyed apart in the Content Pool under a `rich/` prefix (so the plain keys are untouched and `pnpm pool --rich` fills it), the Story writer is given one more line of brief, and each Unit 3 structure has a second hand-written template sentence as the fallback, which is what a device with no key ever sees. The rules do not change: two sentences, fewer than 25 words, the engine's numbers exactly, the Theme's words only — a Story still has to be holdable in the head after one hearing (user story 14), so "richer" is more Theme and not more text. Every Theme gained one `where` phrase ("at the park", "on the moon") built from words it already allows.
29. **A Power is worn from the moment a Problem is asked; what it draws follows the marks the stage already shows.** Ollie takes the Power's pose as soon as a matching Problem is put, so the reward is immediate (user story 22), and the rig's animation plays there. What each Power draws on the visual follows what that stage already shows: Missing Number Detective's magnifying glass sweeps between the two numbers an unknown-addend Problem shows from the start, so it searches the gap while the Problem is being asked and gives nothing away; Count-On Flight's wing beats ride on the number line's hops and Make-Ten Magic's rings on the counters that move, both of which appear with the Hint and the Reveal, because drawing the hops while the Problem is being asked would hand the Learner the answer. The one Power that changes what is asked rather than how it is drawn is Story Solver, whose Story is richer from the first hearing.

30. **The Profile keeps the Powers; the Loop decides them.** The award is a pure function of Mastery in `src/loop/powers.ts` and `finishSession` returns the Powers a Session earned, but the list of Powers held is stored on the Profile beside the progress rather than derived on every read. Stored, "never lost" is a property of the data and not of the Mastery rule, so a later change to what Mastery means cannot take a Power back; a Profile stored before Powers existed is migrated by deriving them from its Mastery, which is what the Loop would have awarded.
