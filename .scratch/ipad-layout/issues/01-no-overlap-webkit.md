# 01: No overlap on any iPad, verified in WebKit

**What to build:** A Learner on any current iPad, in landscape or portrait, sees the ten-frame, the number line, or the Story card whole and apart from the number pad, and nothing scrolls sideways. The Session stage becomes a two-row grid (dots, then the body) whose two body columns have slack: the left takes the remaining width and may shrink, the right is the pad's own width, and this screen no longer carries the 960-pixel content cap. The ten-frame's cells, the number line, and the Story card size themselves to the column rather than to fixed pixels. Below about 1,000 pixels of width, or in portrait, the body is one column: bubble and Repeat, then Equation and visual, then the pad. Playwright gains WebKit projects at the nine real iPad viewports from the research (10.2-inch, 11-inch, 13-inch, mini, and the base iPad as Playwright reports it, each way up), using the descriptor's own browser rather than Chromium, and a layout spec that measures the boxes: the visual and the pad never intersect and keep at least a gutter between them, every pad key is at least 44 by 44 CSS pixels, the document's scroll width equals the viewport's, and in portrait the pad's top is below the visual's bottom. The spec is written first and its red run records which sizes fail today. Every existing browser suite passes in WebKit as well as Chromium.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The layout spec fails on the current layout at the portrait sizes and passes after the change at all nine sizes in WebKit
- [ ] The ten-frame in both its forms, the number line, and the Story card have no fixed pixel width and fit their column at 1024 by 768 with a gutter to spare
- [ ] In portrait the stage is one column with the pad below the visual and every key still at least 44 by 44
- [ ] Every existing e2e suite passes in the WebKit iPad projects and in the Chromium reference
- [ ] No reducer, Loop, Generation, route, or Profile code changes; data attributes and test ids keep their names
