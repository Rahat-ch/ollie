# Spec: The Session screen on an iPad

Status: ready-for-agent
Created: 2026-09-17
Deadline: before the submission video; the entry closes 2026-09-18 11:59 PM CDT
Inputs: `docs/research/ipad-layout.md`, `docs/design/direction.md`, `design/canvas/Session.dc.html`, `docs/design/screens/session-*.png`, `CONTEXT.md`

Vocabulary in this spec is the glossary in `CONTEXT.md`. Capitalised terms are defined there. This spec is styling and layout only: no reducer, Loop, Generation, route, or Profile behaviour changes.

## Problem Statement

On a real iPad in Safari the Session screen falls apart. The ten-frame and the number line cross into the number pad, so the Learner sees counters under the keys she is meant to tap. Below the visual there is a wide empty band, and Ollie stands small in the bottom-left corner far from the bubble that is supposed to be his. The screen reads as unfinished on the one device the game was built for. In Playwright and in desktop Chrome it looked fine, because the test viewport (1080 by 810 in Chromium) is the one width where the fixed-size visuals barely fit and nothing Safari-specific is exercised.

The research names the cause: the stage is a fixed two-column grid capped at 960 pixels with a 352-pixel pad column, so the left column is 512 pixels at every size at or above 960 and shrinks one-for-one below it; the number line is drawn at 584 pixels and the two-frame ten-frame at 556, both centred and unable to shrink, so they spill into the pad column at the design size by 4 pixels and by 75 to 120 pixels on every iPad in portrait and on the current base iPad in landscape. Nothing in the stage is height-aware, which is the empty band.

## Solution

The Session stage becomes a height-aware, fluid two-column composition that fits every current iPad in landscape, collapses to one column in portrait, and keeps every piece in relation: the progress dots in a header row; the speech bubble with the Repeat button beside it; the Equation under the bubble; the visual (ten-frame, number line, or the Theme picture with its Story) sized to its column rather than to fixed pixels; Ollie larger and directly under his bubble so the tail points at him; and the number pad filling the height of its own column with keys at least the size Apple's guidelines ask for. Nothing overlaps at any listed size, nothing scrolls sideways, and the result is verified in Playwright running WebKit at the real iPad viewports, with screenshots for the design review.

## User Stories

1. As a Learner on an iPad in landscape, I want the ten-frame and the number pad to sit apart, so that I never tap a key that is drawn over a counter.
2. As a Learner on an iPad in portrait, I want the visual above the number pad in one column, so that both are whole and reachable.
3. As a Learner, I want every number pad key big enough for my finger, so that I tap the number I meant.
4. As a Learner, I want the keys spaced so that a tap on one never lands on its neighbour.
5. As a Learner, I want Ollie right under his speech bubble, so that I know the words are his.
6. As a Learner, I want Ollie big enough to see his beak move and his wings beat, so that he feels like he is with me.
7. As a Learner, I want the ten-frame to fill the space it has, so that I can count the counters from across the table.
8. As a Learner, I want the number line to fill the space it has, so that the hops are easy to see.
9. As a Learner, I want the Theme picture and its Story to fill the space the ten-frame would, so that a word problem feels as big as any other Problem.
10. As a Learner, I want the Equation directly above the visual, so that the numbers I hear are the numbers I see.
11. As a Learner, I want the Repeat button next to Ollie's bubble, so that hearing a line again is one tap where the words are.
12. As a Learner, I want the progress dots at the top and out of the way, so that I know how far I am without them crowding the Problem.
13. As a Learner, I want the screen never to scroll sideways, so that nothing is hidden off the edge.
14. As a Learner, I want the layout to stay still while Safari's toolbar shows or hides, so that a key does not move under my finger.
15. As a Learner, I want the Hint's visual to stay where the Problem's visual was, so that the picture I am told to look at does not jump.
16. As a Learner, I want the Reveal and the cheer to keep the same layout as the asking phase, so that the screen feels calm.
17. As a Learner on a 13-inch iPad, I want the stage to use the width, so that the visual and Ollie are not small in a wide empty frame.
18. As a Learner on an iPad mini, I want everything to fit without anything shrinking below what I can tap or read.
19. As a Learner with a Power, I want the wing beats, the ten-frame rings, and the magnifier drawn inside the fluid visual, so that the Power still reads at every size.
20. As a Learner with reduced motion on, I want the same layout with the same stillness, so that nothing changes but the animation.
21. As a Parent handing over the tablet, I want the Session screen to look finished and deliberate, so that I trust the app with my child.
22. As a Parent, I want the celebration, Home, the Shop, and the Parent Area to have nothing overlapping at the same iPad sizes, so that the whole app reads as one piece on the device.
23. As the entrant, I want the layout verified in Safari's engine at the real iPad sizes, so that a screenshot in the review page is what the judges will see.
24. As the entrant, I want a screenshot of the Session screen in each visual at each iPad size in the design review, so that I can approve the composition side by side.
25. As the entrant, I want the existing browser tests to keep passing in WebKit as well as Chromium, so that the change proves it broke nothing.
26. As the entrant, I want the fix to be CSS and layout only, so that the Play reducer, the Loop, and every eval stay exactly as they are the day before the deadline.
27. As a developer, I want the stage's sizes to come from tokens and a few clamps rather than fixed pixels, so that a new visual fits without a new breakpoint.
28. As a developer, I want the two-column and one-column layouts to be one grid with one rule, so that there is one place a layout bug can be.

## Implementation Decisions

- **The stage is a grid with a header row and a body row.** The Learner stage on the Session screen is a grid of two rows: the progress dots in the first, the two columns in the second. The stage's minimum height is the small viewport height (`svh`), not the dynamic one, so the layout does not reflow as Safari's toolbar retracts. Each column's content is vertically centred within the body row.
- **The columns have slack.** The body row is two columns, the left sized by the remaining space and the right by the pad's own width, with both children allowed to shrink below their content (a minimum width of zero). The Session screen drops the 960-pixel content cap (or raises it to about 1,120) so the left column grows on 11- and 13-inch iPads instead of freezing at 512 pixels. The other screens keep their cap.
- **One column in portrait.** Below about 1,000 CSS pixels of width, or in portrait orientation, the body row becomes one column in this order: the bubble with the Repeat button and Ollie beside it, then the Equation and the visual, then the number pad. Two columns are never attempted below that width, where the research shows they cannot fit.
- **The visuals are fluid.** The number line SVG keeps its viewBox and takes the column's width with automatic height. The ten-frame's cell size is a clamp between 32 and 60 pixels derived from the column width, so two frames fit at 1,024 pixels and reach the design size from about 1,120. The Theme picture and its Story card take the same box the ten-frame takes, so a word problem is as large as any other Problem. No visual carries a fixed pixel width. Container queries are an acceptable alternative to clamps (iPadOS 16 and later), and the implementer picks one and uses it consistently.
- **Ollie sits under his bubble.** Ollie's rig is anchored at the bottom of the left column, directly beneath the speech bubble, at a size between 240 and 280 pixels chosen by the column's height, so the bubble's tail points at him. He is no longer absolutely positioned against the stage's corner. His poses, the mouth animation, and the Power animations are unchanged.
- **The pad fills its column with gap, not with bigger keys.** Keys stay 64 pixels (Apple's floor is 44 by 44 points and the default control size is 44); the row gap is a clamp that grows with the viewport height so the pad's height matches the column. Keys never grow past about 72 pixels, which would starve the visual at 1,024.
- **Repeat beside the bubble; dots in the header row.** The Repeat button stays next to the speech bubble and follows it into the portrait order. The dots move out of a floating top margin into the stage's header row.
- **Same layout in every phase.** The asking, hint, correct, and reveal phases share the grid; only the bubble's text, the visual's marks, and Ollie's pose change. The celebration keeps its own screen but is checked for overlap at the same sizes.
- **Tokens, not magic numbers.** New sizes (the pad key, the pad gap clamp, the ten-frame cell clamp, Ollie's stage size) are named tokens next to the existing ones in the tokens file, in the design language's scale.
- **Verification runs WebKit.** The Playwright configuration gains WebKit projects at the real iPad viewports from the research (10.2-inch 1080 by 810 and 810 by 1080; 11-inch 1180 by 820 and 820 by 1180; 13-inch 1366 by 1024 and 1024 by 1366; mini 1133 by 744 and 744 by 1133; the current base iPad as Playwright reports it, 944 by 656), using the descriptor's own default browser rather than overriding it to Chromium. WebKit is installed once with Playwright's installer. The existing iPad project stays as the Chromium reference.
- **The design review page gains the iPad set.** The review script screenshots the Session screen in each visual at each of the nine sizes into the screens folder and the review page shows them in a grid, so the user can approve the composition against the canvas.
- **Behaviour is untouched.** No change to the Play reducer, the Loop, the Generation seam, the routes, the Profile, the speech chain, or any eval. Data attributes and test ids the browser tests rely on keep their names.

## Testing Decisions

- A good test drives the built app in a browser at a real device size and asserts on what the Learner would see: bounding boxes, visibility, and scroll extent, never on class names or CSS values.
- **The layout spec** (one Playwright spec, run in the WebKit iPad projects and in the Chromium reference) seeds a Profile that puts each visual on screen (a ten-frame Problem, a number-line Problem, and a Unit 3 Story, using the existing seed helpers), and at each viewport asserts: the visual's box and the pad's box do not intersect and have a gap of at least the gutter; every pad key's box is at least 44 by 44 CSS pixels; the bubble's box and Ollie's box are in the same column with Ollie below the bubble; the document's scroll width equals the viewport width; and in portrait the pad's top is below the visual's bottom. It takes the screenshots the review page shows.
- **The existing suites** (`session`, `unit3`, `powers`, `voice`, `shop`, `coach`, `home`, `onboarding`, `health`) run unchanged in the new WebKit projects as well as Chromium; any assertion that fails only in WebKit is a finding, not a test to weaken.
- **Prior art**: `e2e/session.spec.ts` and `e2e/play.ts` for seeding and playing; `scripts/design-review.mjs` for screenshots at a size; `src/app/globals.test.ts` for a check that reads a stylesheet, which is the pattern if a token test is wanted.
- No unit tests are added for CSS. A unit test that reads a class name would test the implementation, not the behaviour.

## Out of Scope

- Any change to what a Session does: the reducer, the Loop, the Coach, the Speech Chain, the Stories, the Profile.
- Phones. The app is tablet-first; a phone layout is not designed here, though the one-column portrait rule must not break on a phone-sized viewport.
- Redrawing any art. Ollie's rig, the Avatar, the Theme pictures, and the Power marks are the ones ticket 15 shipped; they are resized, not redrawn.
- The Home, Shop, Parent Area, and celebration compositions beyond an overlap check. Their layout is a later pass if the user wants one.
- Safari-specific audio or autoplay behaviour, which is ticket 11's domain.

## Further Notes

- Two figures in the research are unverified and should be checked on the user's iPad with `window.innerWidth` and `window.innerHeight` in Safari's console before the sizes are finalised: whether the current base iPad reports 944 by 656 in landscape (Playwright's descriptor) or 1180 by 820 (Apple's resolution halved), and how much height Safari's toolbars take. The implementer records the measured values in the ticket.
- The research is the design brief for sizes: `docs/research/ipad-layout.md`, section 3 for the size budget and section 4 for the approach with a configuration fragment.
- The design canvas artboard is the composition reference: `design/canvas/Session.dc.html` draws the visual left-aligned under the Equation at about 408 pixels, Ollie bottom-left at 200 (to grow), the pad at 352 on the right.
- The user's words on the iPad were "the numbers and the ten box get crossed over each other", "not a huge fan of the empty space between the game area and Ollie", and "too much is just unfinished and unpolished". The acceptance bar is that the Session screen on the iPad reads as deliberate.
