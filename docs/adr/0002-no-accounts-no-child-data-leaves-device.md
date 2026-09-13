---
status: accepted
date: 2026-09-10
---

# No accounts, no child data leaves the device

There is one local Profile per browser, no login, and no microphone. Progress, Streak, Coins, and Parent Summaries are stored client-side. The only data sent to a server is what the engine needs to write a Story or a Parent Summary, or to voice a line: problem numbers, a Theme, the Nickname, and per-session skill results. No audio is ever recorded.

Two routes send anything at all, and this list is the whole of it:

- `POST /api/story` — the engine's numbers, the Skill and structure, and the Theme, for a Unit 3 Story the bundled Content Pool lacks. **No Nickname**: a Story is written with a placeholder where the Nickname goes and the Nickname is filled in on the device.
- `POST /api/speech` — **the Nickname**, and the Story's own words with the Nickname already in them, so that ElevenLabs can voice the line. The rendered audio is kept on the server's volume in a file named after a non-cryptographic hash of the line; that is an address and not a hiding place, since the line contains the Nickname and the audio says it aloud. Nothing on the volume ties a line to a Profile.

The Nickname is the one personal word that leaves the device, it leaves only to be spoken, and onboarding says so in the Parent's own words before play begins.

We chose this because the Learner is under 13. COPPA treats a child's voice as personal information and, since the 2025 amendments, a voiceprint as a biometric. The Nerdy hackathon terms ban testing with under-13s without verifiable parental consent and ban biometric collection outright. Voice input was researched in depth (see `docs/research/k5-math-game/03-voice-ai.md`) and dropped for these reasons plus the poor accuracy of speech recognition on child speech.

## Consequences

- The Parent reads the Parent Summary in-app behind the Parent Gate. There is no email.
- The Character speaks, the Learner taps. Do not add voice input without re-reading the research and the contest terms.
- Multiple devices do not share a Profile. Acceptable for the hackathon.
