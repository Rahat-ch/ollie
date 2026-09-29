# Ollie's voice

Ollie reads every Problem aloud, because the Learner cannot read. This file covers how the voice is made, how lines are rendered and bundled, how a new voice is tried, and the Speech Chain that makes sure no Session is ever silent. Commands run from the repo root; the ones that render need `ELEVENLABS_API_KEY` (see [docs/develop.md](develop.md#environment-and-keys)).

## The voice

- The voice is designed once in **ElevenLabs Voice Design** from the brief in `src/voice/design.ts`: warm, playful, gently energetic, a kind older child, gender-neutral leaning bright, slow clear diction. Not a baby voice, not a teacher voice.
- `pnpm voice:design` sends the brief and the preview text, and writes the three previews it gets back to `./data/voice-previews/` to listen to.
- `pnpm voice:design --save <preview id>` saves the chosen preview as a reusable voice and prints the `ELEVENLABS_VOICE_ID` to configure.
- `--model eleven_ttv_v3` picks the Voice Design model (the API's default is `eleven_multilingual_ttv_v2`; there is no v4 Voice Design model). `--brief` overrides the brief.
- The voice ID and the model (`ELEVENLABS_MODEL_ID`) come from the environment and are never in the code. A designed voice can be rendered on any text-to-speech model.
- **The current voice** was designed on `eleven_ttv_v3` from the unchanged brief and is rendered on `eleven_v4`. It won the blind A/B 15 to 0 against the old voice on `eleven_v3` ([tally](voice/ab-tally.json)), and every bundled line was re-rendered on it.

## Every line is known in advance

So every line is rendered once and bundled with the app.

- `src/voice/lines.ts` is the catalogue.
- **Ollie's fixed lines** are the hand-written ones: the Hints, the cheers, the Reveal line, one line per Power, the end of a Session, and the home greeting. 125 lines, 3,209 characters.
- **Problem lines** are the spoken line of every Problem the engine can draw, enumerated from the Skills' own generators by `src/voice/drafts.ts`. 671 lines in the default ranges and 1,166 in the standard ones.
- `public/voice/` holds all 1,291 lines in the catalogue: the 125 fixed lines and the 1,166 Problem lines in the standard ranges. The manifest is `src/voice/lines.generated.json`, and it records the model and voice behind every line (`src/voice/manifest.ts`).
- A line's audio is addressed by a hash of its exact text. Changing a line's wording retires its audio instead of playing the old one.
- Each file is named after what it says, so it is served with a year's `cache-control`. The URL also carries a short tag of the model and voice, so a device that cached old audio fetches the new.
- A Problem whose line has no audio falls through to the platform's own speech.

### `pnpm voice:lines`

Renders every line that has no audio yet into `public/voice/<audio key>.mp3` and rewrites the manifest.

- By default it renders the fixed lines. `--kinds ollie,problem` adds the Problem lines.
- `--range standard` covers every Problem the standards allow.
- `--limit` caps a run.
- `--dry-run` prints what is missing, what is stale and on what, and what it would cost in characters, before anything is sent.
- `--fake --out <dir>` is a dry run of the script itself.
- A line already rendered on the configured model and voice is skipped, so it resumes, and running it twice changes nothing.
- A line rendered on any other model or voice is **stale** and is rendered again. Changing `ELEVENLABS_MODEL_ID` or `ELEVENLABS_VOICE_ID` re-renders every line rather than keeping the old Ollie.
- Lines rendered before the manifest recorded the voice say `"voiceId": null` and count as stale. `--adopt` records the configured voice on them without rendering anything; use it only if you know it is the same voice.
- `ELEVENLABS_MODEL_ID` defaults to `eleven_v3` in `src/lib/env.ts`. The bundled lines are on `eleven_v4`, as the manifest records.

### Re-rendering

Use an ElevenLabs key on a **Starter or higher** subscription, the cheapest tier with a commercial licence (see [THIRD_PARTY.md](../THIRD_PARTY.md)).

1. `pnpm voice:design`, listen, then `pnpm voice:design --save <id>`.
2. Put the voice ID in `.env.local` and in Coolify.
3. `pnpm voice:lines --range standard --kinds ollie,problem`.
4. Commit `public/voice/` with the manifest.

## Trying a new voice: the blind A/B

A new voice or model is tried blind before it replaces the old one.

- `pnpm voice:ab` renders a fixed set of 15 lines (four Hints, four cheers, five Problems, two Stories; `src/voice/ab.ts`) on two model and voice pairs.
- Side A is the configured model and voice. Side B is `eleven_v4` on the voice given with `--b-voice`. `--a-model`, `--a-voice` and `--b-model` override the defaults.
- `--dry-run` says how many characters it would spend, with no key. A line A already has bundled on the same model and voice is copied, not paid for.
- `pnpm voice:ab --listen` serves a listening page on http://localhost:3200. It plays each pair in random order as clip 1 and clip 2. Which clip is which side stays on the server until the tally is saved.
- The tally is written to `docs/voice/ab-tally.json` (`--tally` to change it), to be committed with the decision. Each side renders into its own directory under `--out`.
- `--fake --out <dir>` is a dry run of the script itself.

## Lines with the Nickname

A line with the Nickname in it cannot be bundled, because the Nickname is chosen on the device. A Story is the only such line.

- The browser asks `POST /api/speech` as soon as a Session's Stories are known.
- The route settles whether Ollie has a voice at all, then checks the line: a Story is voiced only if the deterministic validator accepts it for the engine's numbers in that Theme.
- It renders the line once on ElevenLabs and adds it to the Content Pool under `AUDIO_DIR`, on the persistent volume. One line is one file, shared by every Profile that needs it.
- The browser holds the answer for the life of the page, and the Repeat button replays it. A Story is rendered once and never again.
- The file is named after a non-cryptographic hash of the whole line. That is an address, not a hiding place: the line has the Nickname in it and the audio says it aloud ([ADR 0002](adr/0002-no-accounts-no-child-data-leaves-device.md)).
- The home greeting is not such a line. Its bubble reads "Hi, <Nickname>! Ready to play?", but Ollie says the fixed line "Hi! Ready to play?", bundled like every other. The home screen renders nothing and sends no Nickname.

## The Speech Chain

Nothing waits on ElevenLabs. The Speech Chain is `src/voice/chain.ts`, in this order:

1. the line's audio from the Content Pool;
2. the bundled fixed line;
3. the platform's own speech synthesis;
4. the line on screen, which is always there.

- A step that is not ready is left out of the chain.
- A step that does not start speaking within two seconds is stopped and hands over to the next, so a late start can never speak over the step that replaced it.
- Walking the chain is `src/play/speak.ts`, pure and tested with stand-in players. The browser's own players are `src/play/play-steps.ts`.

## Ollie's beak

- Ollie's beak moves for as long as the step is actually speaking, driven by the playback's own events rather than a guessed clip length.
- The mouth runs on its own class rather than the pose, so it moves through a Hint and a cheer too.
- Only the last step, the line on screen with no audio at all, falls back to reading pace.

## How it is tested

`e2e/voice.spec.ts` plays a whole Session on the built app with no key on the server and no bundled audio. Every Problem is spoken or shown, Repeat costs no render, and the Session reaches the celebration.
