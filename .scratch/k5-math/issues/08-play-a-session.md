# 08: Play a Session in the browser

**What to build:** A Learner opens the app on a tablet, taps Play, and plays a full Session: Ollie (an SVG in the design's style with idle, talking, celebrate, encourage) presents each Problem, the ten-frame or number line shows the visual, the Learner taps a number on a 0 to 20 pad, a first miss shows the Hint with the visual animated, a second miss shows the Reveal, and the Session ends with a celebration. A Repeat button is on every Problem. The Profile and its progress persist locally. The home screen shows Ollie, the Avatar placeholder, the Path with three Units, and one big Play button. Built to the design canvas. One browser smoke test runs the whole flow through the fake Generation.

**Blocked by:** 02 Design direction, 04 Plan Space and Baseline

**Status:** ready-for-agent

- [ ] Every screen matches the approved design canvas tokens and layouts at tablet landscape and still works at laptop width
- [ ] A Session can be completed with taps only; no text input exists anywhere in the Learner's flow
- [ ] Ten-frame and number line render the correct state for Skills a to e and animate on Hint
- [ ] First miss shows the Hint, second miss shows the Reveal, and the Assistance State recorded matches
- [ ] Reloading the page resumes the Profile with its Estimates and Path state intact
- [ ] The browser smoke test creates a Profile, plays a Session to the celebration, and passes with no network
