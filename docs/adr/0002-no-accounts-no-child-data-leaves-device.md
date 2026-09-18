---
status: accepted
date: 2026-09-10
---

# No accounts, no child data leaves the device

There is one local Profile per browser, no login, and no microphone. Progress, Streak, Coins, and Parent Summaries are stored client-side. The only data sent to a server is what the engine needs to write a Story or a Parent Summary, to plan the next Session, or to voice a Story: problem numbers, a Theme, per-session skill results, and — to voice a Story alone — the Nickname. No audio is ever recorded.

Four routes send anything at all, and this list is the whole of it:

- `POST /api/story` — the engine's numbers, the Skill and structure, and the Theme, for a Unit 3 Story the bundled Content Pool lacks. **No Nickname**: a Story is written with a placeholder where the Nickname goes and the Nickname is filled in on the device.
- `POST /api/speech` — **the Nickname**, and the Story's own words with the Nickname already in them, so that ElevenLabs can voice that Story. A Story is the only line this route takes: every other line Ollie says is the same for every Learner and is bundled with the app, the home screen's greeting included — its bubble names the Learner, but what Ollie says is the fixed line "Hi! Ready to play?", so the greeting sends nothing and renders nothing (decisions.md, amendment 32). The rendered audio is kept on the server's volume in a file named after a non-cryptographic hash of the line; that is an address and not a hiding place, since the line contains the Nickname and the audio says it aloud. Nothing on the volume ties a line to a Profile.
- `POST /api/coach` — the Session's evidence (Problem IDs, Skills, structures, the equations with their unknown blanked, Assistance States, response times), the Learner Notes, the Knowledge Estimates, and the Plan Space, so the Coach can rewrite the Notes and plan the next Session. **No Nickname, Avatar, or Theme**: the route's schema has no place for one.
- `POST /api/summary` — the same Session Log tallied by Skill and Assistance State, with what was Mastered and the Learner Notes, so the Parent Summary can be written. **No Nickname**: the Summary says "your child", and the Notebook, which does use the Nickname, is rendered on the device.

The Nickname is the one personal word that leaves the device, it leaves only so that a Story can be spoken in Ollie's voice and for nothing else, and onboarding says so in the Parent's own words before play begins.

We chose this because the Learner is under 13. COPPA treats a child's voice as personal information and, since the 2025 amendments, a voiceprint as a biometric. The Nerdy hackathon terms ban testing with under-13s without verifiable parental consent and ban biometric collection outright. Voice input was researched in depth (see `docs/research/k5-math-game/03-voice-ai.md`) and dropped for these reasons plus the poor accuracy of speech recognition on child speech.

## Consequences

- The Parent reads the Parent Summary in-app behind the Parent Gate. There is no email.
- The Parent Summary and the Coach are written from a Session's own evidence and never from a name: the Summary calls the Learner "your child", and no first name is sent for either.
- The Character speaks, the Learner taps. Do not add voice input without re-reading the research and the contest terms.
- Multiple devices do not share a Profile. Acceptable for the hackathon.
