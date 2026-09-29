# Developing Ollie

Everything a developer needs that the [README](../README.md) leaves out: the commands and their flags, playing locally, what leaves the device, keys, the curriculum, and where things are. Terms are used as [CONTEXT.md](../CONTEXT.md) defines them.

## Setup

- Node 24 and pnpm 10. The `packageManager` field pins the version; `corepack enable` picks it up.
- `pnpm install`, then `pnpm dev` and open http://localhost:3000.
- Copy `.env.example` to `.env.local` for local keys (see [Environment and keys](#environment-and-keys)). Nothing needs a key to run.

## Commands

```bash
pnpm dev             # the app on http://localhost:3000
pnpm build           # production build; pnpm start serves it
pnpm typecheck       # tsc --noEmit
pnpm lint            # eslint
pnpm test            # unit tests (vitest); pnpm test:watch to watch
pnpm test:e2e        # browser tests (playwright; builds and starts the app on :3100)
pnpm licenses:check  # fail on any copyleft or unrecognised licence

pnpm diagnostic      # run the Diagnostic Session through the Loop; print the Log and Estimates
pnpm baseline        # ten Baseline Sessions on one Profile; print Mastery and Unit transitions
pnpm coach           # a Simulated Learner through the Diagnostic Session and five Coach-planned Sessions
pnpm eval            # the Eval Run: six Simulated Learners, 20 Sessions, Coach and Baseline; writes a report
pnpm eval:chart      # redraw the charts in docs/evals/ from the latest report
pnpm eval:rescore    # re-score a stored report's detection and false positives with the current scorer
pnpm label           # the local labelling page for the Calibration Sets and claims

pnpm pool            # fill the bundled Content Pool with Stories on Sonnet 5.5
pnpm voice:design    # design Ollie's voice in ElevenLabs Voice Design
pnpm voice:lines     # render Ollie's lines into public/voice/ and rewrite the manifest
pnpm voice:ab        # the blind A/B of two voice and model pairs

pnpm ollie:poses     # regenerate src/ollie/poses.generated.ts from public/ollie/*.svg
pnpm brand:images    # regenerate the favicon set and Open Graph image from the Ollie SVGs
pnpm design:review   # after pnpm build: screenshot the real screens into docs/design/
```

CI runs `typecheck`, `lint`, `test`, `eval --fake` and `build`, then builds the Docker image. A live smoke eval (`pnpm coach --real --sessions 2 --assert`) runs on manual trigger only.

## Flags

### `pnpm diagnostic` and `pnpm baseline`

- `--seed puppies` sets the seed.
- `--script fhrfffhf` scripts the answers, one letter per Problem: `f` first-try, `h` Hint-assisted, `r` Revealed.
- `--sessions 3` runs several Sessions on one Profile.
- `pnpm baseline` also takes `--verbose` for the full Session Log of every Session.
- The Baseline's first Session is the Diagnostic Session. Every later one is the Baseline rule: 6 Problems from the current Skill plus 2 Review Problems.

### `pnpm coach`

Prints the Learner Notes and the next Session Plan after each Session, with where each Plan came from: the Coach, the Coach after one retry, or the Baseline Plan with the rejection reasons. It ends with the Cost block the eval prints: calls, tokens, p50 and p95 latency, estimated dollars.

- `--learner weak` picks the Simulated Learner (default `crossing-ten-weakness`). There is no `--seed`: the Learner's own seed is used.
- `--sessions 3` sets the number of Coach-planned Sessions (default 5). They always follow the Diagnostic Session.
- `--verbose` adds the full Session Log.
- `--real` uses the Anthropic adapter on Sonnet 5.5 instead of the fake. It reads `ANTHROPIC_API_KEY` from the environment or `.env.local`.
- `--assert` is the live smoke check: exit 1 unless Evidence Integrity is 1.00 and no Plan came from the Baseline.

The fake is deterministic and needs no network. It plans like a slightly smarter Baseline and never names a pattern.

### `pnpm eval`

The Eval Run. It plays the six Simulated Learners (`src/evals/learners.ts`, seeded, two held out of prompt tuning) for 20 Sessions under the Coach and under the Baseline on the same seeds. It also writes one Story per Theme and Unit 3 structure (30) and one Parent Summary per Learner (6), and scores them. It writes a dated JSON report to `docs/evals/` and redraws the charts from it.

- By default every model call is Claude Sonnet 5.5 and needs `ANTHROPIC_API_KEY`.
- `--fake` runs the Generation fake and the fake Judge, with no network. The fake Judge is the validator's opinion and fails calibration by design, so a fake report shows the seams and the gates, not a model's judgement.
- `--sessions 10` changes the number of Sessions.
- Run it before any prompt or Plan Space change.

What the report holds and how each number is made is in [docs/evals/README.md](evals/README.md).

### `pnpm eval:chart`, `pnpm eval:rescore`, `pnpm label`

- `pnpm eval:chart --report docs/evals/<date>.json` redraws the charts from any earlier report.
- `pnpm eval:rescore --report docs/evals/<date>.json` prints stored and re-scored detection and false positives side by side. It never rewrites the file.
- `pnpm label --labeller <name>` serves the labelling page on http://localhost:3300. `--port` changes the port and `--dir` writes somewhere other than `docs/evals/labels/`. See [Labelling](evals/README.md).

### `pnpm pool`

Fills the bundled Content Pool, `src/story/pool.generated.json`, which ships with the app so a Unit 3 Session needs no call. For each Theme, Unit 3 Skill and structure, and equation in the Skill's default range (465 keys per Theme, 2,790 in all), it writes a Story with the Nickname placeholder and keeps it only if the validator accepts it.

- Keys that already have a variant are skipped, so it resumes.
- `--themes puppies,space` limits the Themes.
- `--variants 2` sets the variants per key.
- `--limit 50` caps a run.
- `--range standard` covers every equation in the Skills' standard ranges (840 keys per Theme), for Plans the Coach narrows outside the defaults.
- `--rich` writes the rich Story set that the Story Solver Power opens, keyed apart under `rich/`.
- `--fake --out <file>` is a dry run on the fake.

The committed Pool has 2,790 keys and 5,520 Stories, two variants for 2,730 keys. A test checks that every Story in it passes the validator.

### Voice commands

`pnpm voice:design`, `pnpm voice:lines` and `pnpm voice:ab` and their flags are in [docs/voice.md](voice.md).

### Scripts outside `package.json`

- `node scripts/preregistration-1-results.mjs` re-derives Pre-registration 1's Results table from the six reports. No model call, nothing written.
- `pnpm exec tsx scripts/latency-probe.ts [learner-id]` runs one Learner for 20 Sessions on the real Coach, one call at a time, and logs every HTTP attempt. About $1.
- `scripts/deploy-wizard.sh` walks through a first deploy. See [docs/deploy.md](deploy.md).

## Playing locally

- A fresh browser opens onboarding: the Parent's four screens (Nickname, Avatar colour, Theme, and the note on what leaves the device).
- The first Session is the Diagnostic Session. Every later one is whatever the Coach planned after the Session before.
- Completing a Session runs the Coach once (`POST /api/coach`) and writes the Parent Summary once (`POST /api/summary`), both on Sonnet 5.5.
- The Learner Notes, the next Session Plan and the last seven Parent Summaries are kept with the Profile. The next tap on Play builds the Coach's Plan.
- If either call fails (no key on the server, say), the next Session is the Baseline's and Ollie's Notebook says so, and the Parent reads the hand-written template Summary.
- The Grown-ups control on the home screen leads to the Parent Gate (press and hold for three seconds) and the Parent Area: the last seven Parent Summaries with their evidence by Assistance State, Mastery per Skill, the Powers, and Ollie's Notebook, where each Hypothesis shows the Problems it rests on.
- The Profile lives in localStorage under `ollie.profile`. Clear it to start over.

## What leaves the device

[ADR 0002](adr/0002-no-accounts-no-child-data-leaves-device.md) is the rule. There are no accounts and no microphone. Four routes send anything, and this is all of it:

- **`POST /api/story`:** the engine's numbers, the Skill and structure, and the Theme, for a Unit 3 Story the bundled Content Pool lacks. No Nickname: the Story is written with a placeholder, and the Nickname is filled in on the device. The server answers from its own Pool, or writes the Story live on Sonnet 5.5 and adds it to `POOL_FILE`, or answers with the template sentence when there is no key.
- **`POST /api/speech`:** the Nickname, inside a Story's own words, so that Ollie can speak that Story. This is the only reason the Nickname leaves the device, and onboarding says so. See [docs/voice.md](voice.md#lines-with-the-nickname).
- **`POST /api/coach`:** the Session's evidence and the Learner Notes, for the Coach. No Nickname, Avatar or Theme.
- **`POST /api/summary`:** the same Session Log tallied by Skill and Assistance State, for the Parent Summary. No Nickname, Avatar or Theme.

Nothing is traced, in the app or in the eval. The model routes sit behind an abuse guard and a $5 daily spend cap; see [docs/deploy.md](deploy.md#abuse-guard-on-the-model-routes).

## Environment and keys

Secrets are read from environment variables only and are never committed. Locally they go in `.env.local`; in production they are Coolify variables ([docs/deploy.md](deploy.md#environment-variables-coolify-only)).

| Variable | Used for | Without it |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | the Coach, the Parent Summary, Stories written live, the eval's real run | the Baseline Plan, the template Summary, the template Story |
| `ELEVENLABS_API_KEY` | rendering Ollie's lines | the speech route answers 503 and the Speech Chain falls through |
| `ELEVENLABS_VOICE_ID` | Ollie's designed voice | as above; the voice is never named in the code |
| `ELEVENLABS_MODEL_ID` | the text-to-speech model | defaults to `eleven_v3` in `src/lib/env.ts` |
| `AUDIO_DIR` | where audio rendered for a Nickname is written | `./data/audio` locally (gitignored), `/data/audio` in the image |
| `POOL_FILE` | where the Content Pool grows at run time | `<AUDIO_DIR>/stories.json`, on the persistent volume |

The fixed lines are bundled in `public/voice/` and need no key.

## Curriculum

A focused Grade 1 arithmetic progression aligned to key CCSS 1.OA and 1.NBT concepts. It is not the whole of Grade 1.

| Unit | Skill | Standard |
| --- | --- | --- |
| 1. Partners to 10 | Partners to 10 on a ten-frame | K.OA.4 (prerequisite), 1.OA.6 |
| 1. Partners to 10 | Teen numbers | 1.NBT.2b |
| 2. Counting on and make-a-ten | Counting on from the larger number | 1.OA.5 |
| 2. Counting on and make-a-ten | Make-a-ten within 20 | 1.OA.6 |
| 2. Counting on and make-a-ten | Subtraction as unknown addend | 1.OA.4 |
| 3. Word problems | Result or total unknown | 1.OA.1 |
| 3. Word problems | Change unknown | 1.OA.1 |

The research the pedagogy rests on is in [docs/research/k5-math-game/](research/k5-math-game/).

## Where things are

Two seams carry the app:

- **The Loop** is a pure function. Given a Session Plan, the Profile, a seed and an answer policy, it returns the Session Log, the updated Knowledge Estimates, the Powers earned and the next Profile. The same function runs the browser, the CLIs, the Baseline and the eval.
- **Generation** is one interface with four operations: write Story, run Coach, write Parent Summary, render speech. A fake implements it for every test. The real adapters are imported by their own paths, so nothing that runs on the fake loads a network client.

The folders:

- `src/loop/`: the Loop. The Skill template families, Bayesian Knowledge Tracing, Mastery, Unit unlocking, the four Powers, the Plan Space and its validation, and the Baseline planner. No I/O.
- `src/generation/`: the Generation seam, its fake, the Anthropic adapter (every call on Claude Sonnet 5.5, `claude-sonnet-5-5`, the Coach at effort high, each with the server-side refusal fallback), the ElevenLabs adapter, and the telemetry recorder.
- `src/coach/`: the engine's Coach step. It hands the Coach the evidence, checks the Notes against the Log and the Plan against the Plan Space, retries once with every reason, and falls back to the Baseline Plan. `server.ts` runs it behind `POST /api/coach` and answers only a checked output or the Baseline Plan. The device checks the answer again and keeps its own fallback, so play works offline. Also here: the record the device keeps (Notes, next Plan and its source, cited Problems, what changed, the Session waiting for a run, the last seven Summaries).
- `src/summary/`: the Parent Summary. The engine's tally, the prompt, the validator (every number is one the engine gave; nothing about how the Learner was thinking), the template with a bedtime activity per Skill, and the bounded writer.
- `src/story/`: Stories. The six Theme vocabularies, the validator (Nickname placeholder present, two sentences ending in a question, under 25 words, exactly the engine's numbers as digits, only the Theme's words), the template sentences, the prompt, the bounded writer (three attempts, then the template), and the Content Pool with `pool.generated.json`.
- `src/voice/`: Ollie's voice, all pure. The line catalogue, the audio keys, the manifest, the Speech Chain and the Voice Design brief. See [docs/voice.md](voice.md).
- `src/evals/`: the Simulated Learners, the convergence runner, the Hypothesis evals, the Story and Summary evals with the Judge, its rubrics, its fake and the Calibration Set, the labels, the report and the charts.
- `src/cli/`: the command-line entry points behind the `pnpm` scripts above.
- `src/lib/`: server-side plumbing: environment, the abuse guard, the spend cap, the Story and speech services, the audio and Pool files.
- `src/proxy.ts`: every `/api/*` request passes the abuse guard here first.
- `src/app/`: the screens and routes. `/` is the home screen, or onboarding until the Profile is set up; `/play` a Session and its celebration; `/shop` the Shop; `/parent` the Parent Gate and the Parent Area; `/design-review` the illustration review, which answers 404 unless `DESIGN_REVIEW=1`. `api/` holds the `coach`, `summary`, `story`, `speech` and `health` routes. All screens are thin client components.
- `src/play/`: a Session as the Learner plays it: the Play reducer over the Loop's steps, the ten-frame and number-line models, the Path, Ollie's fixed lines, and the players that walk the Speech Chain.
- `src/profile/`: the Profile in localStorage and the hook the screens read it through.
- `src/rewards/`: Coins, the Streak and its Freezes and milestones, and the Shop's six Avatar Items. Pure.
- `src/parent/`: the Parent Gate's hold logic, Mastery per Skill, the Powers, and Ollie's Notebook. Pure.
- `src/ollie/`: Ollie's rig as an inline SVG component with CSS motion.
- `src/ui/`: the paper components: speech bubble, big button, number pad, ten-frame, number line, progress dots, Path, Avatar, chips, Power marks, Theme pictures.
- `src/design/`: the design tokens.
- `e2e/`: the Playwright browser tests.
- `docs/`: the ADRs, the evals and their reports, the deploy guide, the design direction and reviews, and the research.
- `.scratch/`: the specs, decisions and tickets, one folder per feature.
- `THIRD_PARTY.md`: every dependency, API, model, asset source and the generative-AI assistance used.
