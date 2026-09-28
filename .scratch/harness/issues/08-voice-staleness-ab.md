# 08: Voice lines know what rendered them, and there is an A/B tool

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 1 › Voice; `.scratch/harness/decisions.md` #30, 31, 32, 33; README's voice section; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** The voice manifest records the model and voice behind every rendered line. Rendering then treats a line as stale when either differs from the configured model and voice, instead of skipping any line that already has a file.

An A/B script renders a fixed set of about 15 lines on two model and voice pairs:
- Hints;
- cheers;
- a few Problems;
- a Story.

A small blind listening page plays the pairs in random order, records which one wins each pair, and saves the tally to a committed JSON file.

The adapter accepts `eleven_v4`. Before rendering, the ticket checks and notes:
- whether Voice Design has a v4 design model;
- what v4 costs in credits per character.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Changing the configured model or voice marks every line stale in a dry run; unchanged config skips them as today
- [x] The A/B script dry-runs without a key and reports the characters it would spend
- [x] The listening page hides which side is which until the tally is saved
- [x] The Voice Design and pricing facts are recorded with sources in the Comments

## Comments

**2026-09-28, implementation.** The manifest, `src/voice/lines.generated.json`, is now a list of renditions, `{ modelId, voiceId, keys }`, one group per model and voice, so every bundled line says what rendered it and the app still bundles one key per line. The rules are in `src/voice/manifest.ts` and are pure: `planRender` sorts the wanted lines into missing (no file), stale (a file rendered on another model or voice, or on nothing the manifest records) and current; `recordRendered` records the configured model and voice for what a run rendered, keeps every other record, and drops any whose file is gone; `isCurrent` requires the model to match, and the voice too whenever one is configured. `pnpm voice:lines` renders missing and stale lines, prints why the stale ones are stale ("1291 rendered on eleven_v3 on a voice never recorded"), and writes the manifest in a `finally`, so a run cut short still records what it rendered. With `--fake --out <dir>` it keeps a manifest of its own at `<dir>/manifest.json`, so the whole rule can be run without a key.

The 1,291 lines already committed were migrated to one group, `eleven_v3` with `"voiceId": null`, because no voice ID was ever written down anywhere in the repo. Such a line is stale against a configured voice (unknown is not the same), and `pnpm voice:lines --adopt` records the configured voice on every never-recorded line on the configured model, rendering nothing; it is for whoever knows the lines were rendered on that voice. With no voice configured, as in a dry run on a machine without one, the model alone is compared. Checked by hand in this worktree, no key: `pnpm voice:lines --dry-run --kinds ollie,problem --range standard` says 1,291 current; the same with `ELEVENLABS_MODEL_ID=eleven_v4` says 1,291 stale and 49,865 characters (the decisions file's "about 53k" was an estimate); with `ELEVENLABS_VOICE_ID=new-voice` the 125 fixed lines are stale. A fake run to a scratch directory rendered 125, a second run on the same config rendered nothing, and changing model and voice made them all stale.

A decision taken here: the bundled URL now carries a tag of the rendition (`/voice/<key>.mp3?r=<tag>`, `bundledLineUrl` in `src/voice/bundled.ts`). The files are served with a year's immutable `cache-control` and named after their text only, so without it a device that had heard a line would keep the old Ollie after ticket 09 re-renders it. The e2e route in `e2e/voice.spec.ts` matches `*.mp3*` and the greeting assertion ignores the query.

The A/B is `pnpm voice:ab` (`src/cli/voice-ab.ts`, pure parts in `src/voice/ab.ts` and `src/voice/ab-page.ts`). `abLines()` is 15 fixed lines: four Hints, four cheers, five Problems (one per Unit 1 and 2 Skill, from the middle of its default range) and two Stories from the bundled Content Pool voiced for "Mia", 776 characters a side. Side A defaults to the configured model and voice, side B to `eleven_v4` (`NEW_VOICE_MODEL_ID`) and `--b-voice`; each side renders into `data/voice-ab/<rendition tag>/`, so a changed voice never reuses old clips, and a line A already has bundled on exactly that model and voice (per the manifest) is copied rather than paid for. `--dry-run` needs no key and prints the clips and characters: 1,552 characters for both sides from nothing, 957 once the old voice is adopted and 13 of A's lines are copied. `pnpm voice:ab --listen` serves the page on localhost; `respondAb` answers `/pairs` with IDs, kinds and text only, serves `/clip/<id>/<1|2>` by looking the side up on the server, and returns the sides only in the tally it saves to `docs/voice/ab-tally.json`. Before the save nothing the page receives names a model, a voice or a side. Driven once in headless Chromium against fake clips: 15 pairs, save disabled until all are rated, no model or voice in the page before saving, the reveal after, no page errors, fine at 375 px.

The adapter already passed any model ID through; a test now renders on `eleven_v4`. Voice Design takes an optional design model (`pnpm voice:design --model eleven_ttv_v3`); without one the API uses its default.

**Facts checked for ticket 09, 2026-09-28:**
- **Voice Design has no v4 design model.** The API reference for `POST /v1/text-to-voice/design` lists `model_id` as `eleven_multilingual_ttv_v2` (the default) or `eleven_ttv_v3`, and the models page lists the same two design models beside `eleven_v4` and `eleven_v4_turbo` for text to speech. So the new voice is designed on a v3 or v2 design model and rendered on `eleven_v4`. Our adapter never sent `model_id`, so Ollie's current voice was designed on the default, `eleven_multilingual_ttv_v2`, unless it was designed some other way. Sources: https://elevenlabs.io/docs/api-reference/text-to-voice/design, https://elevenlabs.io/docs/overview/models.
- **Price.** The API pricing page lists Eleven v4 at $0.08 per 1,000 characters, the same list price as Eleven v3, shown at $0.022 (72 percent off) until 12 October; v4 Turbo at $0.04, shown at $0.011. The same page says API usage is billed in dollars, not credits. Source: https://elevenlabs.io/pricing/api.
- **Not verified: v4's cost in subscription credits per character.** The plans page says 1 credit per character for Multilingual v2 and 0.5 to 1 for Flash and Turbo, but names neither v3 nor v4 (https://elevenlabs.io/pricing), and the help centre's "What are credits?" article refused the fetch (403). v4 sharing v3's dollar price suggests 1 credit per character, as for v3, but that is an inference. Secondary sites say Creator plans and up get up to twice their monthly credits on v4 in the web and mobile apps for two weeks from launch without drawing on the balance; the announcement (https://elevenlabs.io/blog/eleven-v4, dated 28 September 2026) does not say so, and it would not cover API renders anyway. Check the credit counter after the A/B's 1,552 characters, before the roughly 50k of a full re-render.

Verified with `pnpm typecheck`, `pnpm lint`, `pnpm test` (651 in 70 files), `pnpm build`, and `pnpm test:e2e --project=desktop-chrome` (27 passed), run because the bundled URL changed. No audio was rendered and no key was used.
