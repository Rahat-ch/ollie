# 09: Ollie's new voice on Eleven v4 (owner)

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 1 › Voice; `.scratch/harness/decisions.md` #30, 31, 32, 33; README's voice section. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** This ticket is the owner's.
1. Run Voice Design again with the "cute cartoon voice for a friendly owl" brief, and choose a new voice.
2. Run the blind A/B: the old voice on `eleven_v3` against the new voice on `eleven_v4`.
3. If v4 wins:
   - re-render all 1,291 bundled lines (about 53k characters) on a plan whose credits cover it;
   - set the voice model and voice ID locally and in Coolify;
   - clear the server's cached Story audio, so no Learner hears two different Ollies.
4. If v4 loses, record that and keep v3.

The committed A/B tally is the answer to "why v4?".

**Blocked by:** 08

**Status:** ready-for-human (the Coolify variables and the server's Story audio are still the owner's)

- [x] The A/B tally is committed with the decision
- [ ] If switched: every bundled line's manifest entry names the new model and voice, the server's Story audio is cleared, and a live Session speaks in one voice throughout
- [ ] The voice brief amendment and the choice are recorded in the decisions file

## Comments

**2026-09-28, the voice pass (orchestrator with the owner).**
1. `pnpm voice:lines --adopt` recorded the old voice (`kUYZBW913unNWjulBbOg` on `eleven_v3`) on all 1,291 bundled lines. It rendered nothing.
2. `pnpm voice:design --model eleven_ttv_v3` made three previews from the unchanged owl brief. Voice Design has no v4 design model. The owner chose `RxxDqtqDp9ZV3RZpYuL0`.
3. `pnpm voice:ab --b-voice RxxDqtqDp9ZV3RZpYuL0` rendered 17 clips (957 characters) and copied 13 from `public/voice`.
4. The owner rated them blind on the listening page. **Side B, the new voice on `eleven_v4`, won 15 to 0**: Hints 4-0, cheers 4-0, Problems 5-0, Stories 2-0. The tally is committed at `docs/voice/ab-tally.json`.
5. With `ELEVENLABS_MODEL_ID=eleven_v4` and the new voice ID in `.env.local`, `pnpm voice:lines --range standard --kinds ollie,problem` re-rendered all 1,291 lines with 0 failures. A dry run afterwards reports 1,291 current and 0 stale. The manifest records `eleven_v4` and the new voice on every line, so the bundled URLs carry a new cache tag and devices fetch the new audio.

**Left for the owner, after this merges and deploys:**
- Set `ELEVENLABS_MODEL_ID=eleven_v4` and `ELEVENLABS_VOICE_ID=RxxDqtqDp9ZV3RZpYuL0` in Coolify.
- Clear the server's cached Story audio: the Story audio files and the Story entries under `AUDIO_DIR` on the volume. Otherwise a Story rendered before the switch keeps the old voice. The steps are in `docs/deploy.md`, under inspecting the volume.

Then tick the second box.

