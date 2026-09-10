# 11: Ollie's voice and the speech fallback chain

**What to build:** Ollie speaks. A voice is designed in ElevenLabs Voice Design to the brief (warm, playful, gently energetic, a kind older kid, slow clear diction) and saved with a reusable voice ID. Every fixed line is rendered once at build time and bundled. Each Story is rendered with the Nickname at creation time and stored on the persistent volume. When audio is not ready the chain falls through: cached audio, bundled fixed line, platform speech synthesis, on-screen template. Ollie's mouth animates while audio plays. No Session ever blocks on ElevenLabs.

**Blocked by:** 10 Unit 3 Stories

**Status:** ready-for-agent

- [ ] All fixed Ollie lines are bundled as audio and play offline
- [ ] A Story's audio is rendered once and reused on repeat plays; the Repeat button never triggers a new render
- [ ] With ElevenLabs unreachable, a Session still completes with something audible or visible for every Problem
- [ ] Ollie's talking state is driven by audio playback, not a fixed clip length
- [ ] The voice ID and model are configured, not hard-coded, and the ElevenLabs tier's commercial licence is recorded in THIRD_PARTY
