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

**Status:** ready-for-human

- [ ] The A/B tally is committed with the decision
- [ ] If switched: every bundled line's manifest entry names the new model and voice, the server's Story audio is cleared, and a live Session speaks in one voice throughout
- [ ] The voice brief amendment and the choice are recorded in the decisions file
