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
pnpm baseline     # run ten Baseline Sessions on one Profile and print Mastery and Unit transitions
pnpm coach        # run a Simulated Learner through the Diagnostic Session and five Coach-planned Sessions; print the Learner Notes and Session Plan after each
pnpm eval         # run the six Simulated Learners for 20 Sessions under the Coach and the Baseline; write a dated report and the chart
pnpm eval:chart   # regenerate docs/evals/convergence.svg from the latest report file
pnpm ollie:poses  # regenerate src/ollie/poses.generated.ts from public/ollie/*.svg after editing a pose
```

`pnpm diagnostic --seed puppies --script fhrfffhf` scripts the answers (one letter per Problem: `f` first-try, `h` Hint-assisted, `r` Revealed) and `--sessions 3` runs several Sessions on one Profile. `pnpm baseline` takes the same flags plus `--verbose` for the full Session Log of every Session; its first Session is the Diagnostic Session and every later one is the Baseline rule (6 Problems from the current Skill plus 2 Review Problems).

`pnpm eval` is the eval command: it runs the six Simulated Learners (`src/evals/learners.ts`, seeded, two held out of prompt tuning) for 20 Sessions each under the Coach and under the Baseline on identical seeds, writes a dated JSON report to `docs/evals/`, and regenerates `docs/evals/convergence.svg` from that file. The report scores convergence side by side (Sessions to Mastery per Skill, first-try rate, share of Problems in the target accuracy band) and the Coach's Hypotheses: detection of each planted weakness (a supported Hypothesis naming it, and the Session it first did), false positives (supported Hypotheses naming a weakness the Learner does not have), Evidence Integrity (over every Notes the Coach wrote, rejected attempts included: every cited Problem ID exists and its Assistance State agrees with the claim, checked deterministically), and where every Plan came from (the Coach, a retry, or the Baseline fallback). The held-out Learners are reported in their own section and are never used to tune the Coach prompt. By default the Coach is the Anthropic adapter on Opus 5 and needs `ANTHROPIC_API_KEY`; `--fake` runs the Generation fake with no network, which plans like a slightly smarter Baseline and never names a pattern, so a fake report shows the seams and not the Coach's judgement. Run it before any prompt or Plan Space change. `pnpm eval:chart --report docs/evals/<date>.json` redraws the chart from any earlier report.

`pnpm dev` then http://localhost:3000 plays a Session in the browser: the Diagnostic Session first, then Baseline Sessions until the Coach reaches the app (ticket 12). The Profile lives in the browser's localStorage under `ollie.profile`; clear it to start over. Nothing leaves the device.

`pnpm coach` runs one Simulated Learner through Coach-planned Sessions and prints the Learner Notes and the next Session Plan after each, with the source of every Plan (the Coach, the Coach after one retry, or the Baseline Plan with the rejection reasons). `--learner weak --sessions 3` picks the Learner and the number of Coach-planned Sessions, which always follow the Diagnostic Session; `--verbose` adds the full Session Log. By default the Coach is the Generation fake, deterministic and with no network; `--real` runs the Anthropic adapter on Opus 5 and reads `ANTHROPIC_API_KEY` from the environment or `.env.local`.

Copy `.env.example` to `.env.local` for local vendor keys. Secrets are read from environment variables only and are never committed. Generated audio is written to `AUDIO_DIR` (default `./data/audio`, gitignored).

## Deploy

A Docker container built by Coolify on a Hetzner host, behind Cloudflare, with a persistent volume for generated audio. Never Vercel. See [docs/deploy.md](docs/deploy.md), or run `scripts/deploy-wizard.sh` for a guided first setup.

## Where things are

- `CONTEXT.md`: the glossary. Its vocabulary is canonical in code, tests, and docs.
- `src/loop/`: the Loop. A pure function from a Session Plan, a Profile, a seed, and an answer policy to a Session Log and the next Profile; the Skill template families, Bayesian Knowledge Tracing, Mastery, Unit unlocking, the Plan Space and its validation, and the Baseline planner live behind it. No I/O.
- `src/generation/`: the Generation seam. One interface with four operations (write Story, run Coach, write Parent Summary, render speech), the fake every test and `pnpm coach` run on, and the Opus 5 Coach adapter with its prompt and output schema. The real adapters are imported by their own paths, so nothing that runs on the fake loads a network client.
- `src/coach/`: the engine's Coach step. It hands the Coach the Session's evidence (never a Problem or an answer), validates the returned Learner Notes against the Log and the Session Plan against the Plan Space, retries once with every reason, and falls back to the Baseline Plan so play never stops.
- `src/app/`: the screens. `/` is the home screen (Ollie, the Avatar, the Path, Play) and `/play` the Session screen and its celebration; both are thin client components that render Play state and forward taps.
- `src/play/`: a Session as the Learner plays it: the Play reducer over the Loop's step functions (asking, Hint, correct, Reveal, celebration), the ten-frame and number-line models per Skill and stage, the Path, and Ollie's fixed lines.
- `src/profile/`: the Profile in localStorage (progress, the Session in progress, the seed) and the hook the screens read it through.
- `src/ollie/`: Ollie's rig as an inline SVG component with CSS motion; `poses.generated.ts` is rendered from `public/ollie/` by `pnpm ollie:poses`.
- `src/ui/`: the paper components: speech bubble, big button, number pad, ten-frame, number line, progress dots, Path, Avatar.
- `src/evals/`: the Simulated Learners (answer policies fed into the Loop), the convergence runner, the dated report, and the chart renderer. `docs/evals/` holds every Eval Run's report and the chart regenerated from the latest one.
- `docs/adr/`: the three architectural decisions (engine owns the math; no accounts; the Coach plans inside a bounded space).
- `docs/research/k5-math-game/`: the research the design rests on.
- `.scratch/k5-math/`: the spec and implementation tickets.
- `THIRD_PARTY.md`: every dependency, API, model, asset source, and the generative-AI assistance used.
