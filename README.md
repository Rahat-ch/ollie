# Ollie

A Grade 1 math game that learns how you learn. Built for Prompt 01 of the Nerdy AI Hackathon.

Ollie the owl reads every Problem aloud; a deterministic engine owns the math; a Coach forms evidence-backed Hypotheses after every Session and plans the next one inside a bounded space; the Parent reads why.

**The AI can personalise the learning path. It cannot make up the math.**

Live at [ollie.rahatcodes.com](https://ollie.rahatcodes.com).

## Curriculum

A focused Grade 1 arithmetic progression aligned to key CCSS 1.OA and 1.NBT concepts. It is not the whole of Grade 1.

| Unit | Skill | Standard |
| --- | --- | --- |
| 1. Partners to 10 | Partners to 10 on a ten-frame | K.OA.4 (prerequisite), 1.OA.6 |
| 1. Partners to 10 | Teen numbers as 10 + n | 1.NBT.2b |
| 2. Counting on and make-a-ten | Counting on from the larger number | 1.OA.5 |
| 2. Counting on and make-a-ten | Make-a-ten within 20 | 1.OA.6 |
| 2. Counting on and make-a-ten | Subtraction as unknown addend | 1.OA.4 |
| 3. Word problems | Result or total unknown | 1.OA.1 |
| 3. Word problems | Change unknown | 1.OA.1 |

## Develop

Node 24 and pnpm 10 (the `packageManager` field pins the version; `corepack enable` picks it up).

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # unit tests (vitest)
pnpm test:e2e     # browser tests (playwright; builds and starts the app on :3100)
pnpm licenses:check  # fail on any copyleft or unrecognised licence
pnpm diagnostic   # run the Diagnostic Session through the Loop and print the Log and Estimates
```

`pnpm diagnostic --seed puppies --script fhrfffhf` scripts the answers (one letter per Problem: `f` first-try, `h` Hint-assisted, `r` Revealed) and `--sessions 3` runs several Sessions on one Profile.

Copy `.env.example` to `.env.local` for local vendor keys. Secrets are read from environment variables only and are never committed. Generated audio is written to `AUDIO_DIR` (default `./data/audio`, gitignored).

## Deploy

A Docker container built by Coolify on a Hetzner host, behind Cloudflare, with a persistent volume for generated audio. Never Vercel. See [docs/deploy.md](docs/deploy.md), or run `scripts/deploy-wizard.sh` for a guided first setup.

## Where things are

- `CONTEXT.md`: the glossary. Its vocabulary is canonical in code, tests, and docs.
- `src/loop/`: the Loop. A pure function from a Session Plan, a Profile, a seed, and an answer policy to a Session Log and the next Profile; the Skill template families, Bayesian Knowledge Tracing, and Mastery live behind it. No I/O.
- `docs/adr/`: the three architectural decisions (engine owns the math; no accounts; the Coach plans inside a bounded space).
- `docs/research/k5-math-game/`: the research the design rests on.
- `.scratch/k5-math/`: the spec and implementation tickets.
- `THIRD_PARTY.md`: every dependency, API, model, asset source, and the generative-AI assistance used.
