# 02: The composition

**What to build:** The Session screen on an iPad reads as deliberate. Ollie stands 240 to 280 pixels tall at the bottom of the left column, directly under his speech bubble so the tail points at him, no longer pinned to the stage's corner; the number pad fills the height of its column through a row gap that grows with the viewport, with keys that stay 64 pixels and never pass about 72; the progress dots live in the stage's header row; the Repeat button stays beside the bubble and follows it into the portrait order; the asking, hint, correct, and reveal phases share one grid and only the bubble's words, the visual's marks, and Ollie's pose change; the new sizes are named tokens beside the existing ones. The design review page gains a grid of the Session screen in each visual (ten-frame, number line, Story) at each of the nine iPad sizes, taken by the review script, so the user can approve the composition against the canvas. Home, the Shop, the Parent Area, and the celebration are checked for overlap and sideways scroll at the same sizes, with any finding fixed if it is a one-line layout fix and otherwise recorded.

**Blocked by:** 01 No overlap on any iPad

**Status:** ready-for-agent

- [ ] Ollie's box is below the bubble's box in the same column at every landscape size, at 240 pixels or more, and his mouth, poses, and Power animations are unchanged
- [ ] The pad's height matches its column within a gutter at every landscape size, with keys between 64 and 72 pixels
- [ ] The dots are in the header row and the Repeat button is beside the bubble in both orientations
- [ ] The review page shows the Session screen in three visuals at nine sizes, and the screenshots are committed
- [ ] Home, Shop, Parent Area, and celebration show no intersecting boxes and no sideways scroll at the nine sizes
- [ ] The Session screen's sizes come from tokens; no new fixed pixel widths in the stage
