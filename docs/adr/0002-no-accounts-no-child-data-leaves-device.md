---
status: accepted
date: 2026-09-10
---

# No accounts, no child data leaves the device

There is one local Profile per browser, no login, and no microphone. Progress, Streak, Coins, and Parent Summaries are stored client-side. The only data sent to a server is what the engine needs to render a Story or a Parent Summary: problem numbers, a Theme, a first name, and per-session skill results. No audio is ever recorded.

We chose this because the Learner is under 13. COPPA treats a child's voice as personal information and, since the 2025 amendments, a voiceprint as a biometric. The Nerdy hackathon terms ban testing with under-13s without verifiable parental consent and ban biometric collection outright. Voice input was researched in depth (see `docs/research/k5-math-game/03-voice-ai.md`) and dropped for these reasons plus the poor accuracy of speech recognition on child speech.

## Consequences

- The Parent reads the Parent Summary in-app behind the Parent Gate. There is no email.
- The Character speaks, the Learner taps. Do not add voice input without re-reading the research and the contest terms.
- Multiple devices do not share a Profile. Acceptable for the hackathon.
