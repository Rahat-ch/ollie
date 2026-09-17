# The Session screen on a real iPad: why the pad and the visual collide, and how the stage should be composed

Researched 2026-09-17, against `src/app/play/SessionScreen.tsx`, `src/ui/*`, `src/app/tokens.css`, `design/canvas/Session.dc.html`, the shipped screenshots in `docs/design/screens/`, Apple's HIG, WebKit's release notes, MDN, and the Playwright device registry installed in this repo.

## Summary

The Session stage is a **fixed two-column grid with no slack in either axis**: `grid-cols-[minmax(0,1fr)_352px]` inside a `max-w-content` (960px) box with 32px gutters, so the left column is **frozen at 512px on every viewport ≥ 960px** and shrinks 1:1 below it. The visuals inside that column are drawn at **fixed pixel widths that already exceed it** — the number line is 584px, the two-frame ten-frame 556px — and are `justify-center`-ed, so the overflow spills symmetrically into the 32px gutter between the columns. At the design frame (1024×768) the number-line card already ends **4px inside the number pad's column** — visible in the committed screenshot. Anything that makes the CSS viewport narrower than ~968px (portrait on every iPad except the 13-inch models, Split View, Stage Manager, or Safari's per-site page zoom) turns that 4px into a 30–110px crossover. Vertically the stage is equally unfinished: nothing is height-aware, everything hangs from the top of a `min-height:100dvh` box, and ~47% of the screen below the visual is empty except a 200px Ollie in the bottom-left corner whose speech-bubble tail points at nothing.

---

## 1. What in the current CSS most likely causes the overlap

**The grid** — `src/app/play/SessionScreen.tsx:153`:

```
mx-auto mt-4 grid max-w-content grid-cols-[minmax(0,1fr)_352px] gap-8 px-gutter
```

with `--content-max: 960px` and `--gutter: 32px` (`src/app/tokens.css:92-93`). For a viewport of width `V`, the grid box is `min(960, V)` wide, border-box, so:

- left column `L = min(960, V) − 64 − 32 − 352 = min(960, V) − 448`
- at any `V ≥ 960`: **`L = 512px`, forever** — a 1366px iPad Air 13 gets exactly the same 512px column as a 1024px iPad.

**The contents of that column are fixed-width and wider than it:**

| Element | Source | Natural width |
| --- | --- | --- |
| Number line card | `src/ui/NumberLine.tsx:3-4,43,47-48` — `PAD*2 + 20*STEP = 48 + 520 = 568` SVG + `px-2` | **584px** |
| Ten-frame, two frames (teen numbers) | `src/ui/TenFrame.tsx:11,16-17` — `2 × (5 × 50px) + gap-4 + p-5` | **556px** |
| Ten-frame, one frame + loose counters (make-a-ten) | same, `--cell: 60px` | 404px |
| Bubble row | `SessionScreen.tsx:155-159` — `max-w-110` (440) + `gap-4` + 64px Repeat | 520px |

The visual is centred in the column (`flex justify-center`, `SessionScreen.tsx:162`) and neither the flex child nor the SVG can shrink (the board is `shrink-0`; an `<svg>` with `width`/`height` attributes is a replaced element whose automatic minimum size is its intrinsic width — [CSS Grid §6.6](https://www.w3.org/TR/css-grid-1/#min-size-auto), [CSS Flexbox §4.5](https://www.w3.org/TR/css-flexbox-1/#min-size-auto)). `minmax(0,1fr)` lets the *column* shrink; it does nothing for content that refuses to. So a visual of width `C` reaches the pad column when `C > L + 64`:

- **`V ≥ 960`**: `L = 512` → the number line (584) **overlaps the pad column by 4px**. Confirmed by measurement on the committed `docs/design/screens/session-number-line.png` (1024×768 @2×): card right edge ≈ 612 CSS px, pad column left edge ≈ 608 CSS px. There is no margin of error anywhere in this layout.
- **`V < 960`**: `L = V − 448`, so overlap starts at `V < C + 384` — **number line below 968px, teen ten-frame below 940px, bubble/Repeat row below 936px**.

**Therefore**: every iPad in portrait except the 13-inch models (744, 820, 834 CSS px wide) overlaps hard; Split View, Stage Manager and Safari's per-site page zoom (Aa menu) narrow the layout viewport the same way. It is not a Safari *rendering* difference — Tailwind's preflight already sets `-webkit-text-size-adjust: 100%` (`node_modules/tailwindcss/preflight.css:31`), so text inflation is not the cause — it is that **the device presents a CSS viewport the test never uses**.

The vertical axis is correct in its units: `.learner-stage` uses `min-height: 100dvh` (`src/app/globals.css:22-30`), and `dvh`/`svh`/`lvh` shipped in Safari 15.4 (March 2022) ([WebKit](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/)). Plain `vh` would have been wrong — MDN states **`vh` is equivalent to `lvh`**, the *large* viewport, i.e. the height with Safari's toolbars retracted ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/length)). No `viewport-fit=cover` is set (`src/app/layout.tsx:42-46`) and no `env(safe-area-inset-*)` is used in `src/`, which is fine: without `viewport-fit=cover` the page is laid out inside the safe area automatically ([WebKit, "Designing Websites for iPhone X"](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)). iPads have no sensor housing, so landscape side insets are zero.

## 2. Real iPad CSS viewports vs. the Playwright descriptor

CSS points = native pixels ÷ 2 (Apple does not publish CSS-pixel tables; native resolutions from [apple.com/ipad/compare](https://www.apple.com/ipad/compare/), accessed 2026-09-17). The ÷2 derivation is validated by the iPad 10.2" row, where Playwright's measured descriptor (1080×810) matches exactly.

| Device | Native px | CSS px portrait | CSS px landscape | Overlaps? |
| --- | --- | --- | --- | --- |
| iPad Pro 13" (M5) | 2752×2064 | 1032×1376 | 1376×1032 | 4px only |
| iPad Air 13" (M4) | 2732×2048 | 1024×1366 | 1366×1024 | 4px only |
| iPad Pro 11" (M5) | 2420×1668 | 834×1210 | 1210×834 | **portrait: 75px** |
| iPad Air 11" (M4) | 2360×1640 | 820×1180 | 1180×820 | **portrait: 82px** |
| iPad (A16, 11") | 2360×1640 | 820×1180 | 1180×820 | **portrait: 82px** |
| iPad mini (A17 Pro) | 2266×1488 | 744×1133 | 1133×744 | **portrait: 120px** |
| iPad 10.2" (gen 7–9) | 2160×1620 | 810×1080 | 1080×810 | **portrait: 87px** |
| **Playwright `iPad (gen 7) landscape`** | — | — | **1080×810**, DSF 2, `isMobile: true`, `hasTouch: true`, `defaultBrowserType: "webkit"` | 4px only |
| **Playwright `iPad (gen 11) landscape`** | — | 656×944 @2.5 | **944×656** @2.5 | **overlaps — 12px** |

Other descriptors in the installed registry (playwright-core 1.63.0): `iPad (gen 5)/(gen 6)/Mini` = 768×1024 (landscape 1024×768, DSF 2), `iPad Pro 11` = 834×1194 (landscape 1194×834, DSF 2). All default to WebKit.

Two differences matter. **First, the descriptor is the *screen*, not the browser**: Playwright sets `viewport` to the full 1080×810 with no Safari chrome subtracted, whereas on device the status bar, tab bar and toolbar take height from the layout viewport (the exact figure is not published by Apple or WebKit — **UNVERIFIED**; measure with `window.innerHeight`). **Second, `iPad (gen 11) landscape` is 944×656** — Playwright's measurement of the current base iPad disagrees with the ÷2 derivation (944 = 2360/2.5). If the user's device is a current iPad, 944px landscape lands squarely in the overlap band. Flagged **UNVERIFIED** against Apple; one `window.innerWidth` check on device settles it.

**Why Chromium with the descriptor cannot reproduce it**: `playwright.config.ts:24` spreads the descriptor and then overrides `browserName: "chromium"`. A descriptor only carries `userAgent`, `viewport`, `deviceScaleFactor`, `isMobile`, `hasTouch` and `defaultBrowserType` ([Playwright emulation docs](https://playwright.dev/docs/emulation)); the engine remains Blink. Nothing Safari-specific is exercised, and the one geometry the test *does* fix — 1080px — happens to be the one width at which the number line merely grazes the pad. **WebKit is installable here**: `pnpm exec playwright install --dry-run webkit` reports WebKit 26.6 (build v2359, `webkit-mac-26-arm64.zip`); `~/Library/Caches/ms-playwright` currently holds only `chromium-1243`/`chromium-1208` and ffmpeg, so it must be downloaded once.

## 3. Composition

The design canvas (`design/canvas/Session.dc.html`, a 1024×768 artboard) places: dots at `top:28`; bubble at `left:48, top:68` with its tail; Repeat at `left:530, top:72`; equation at `left:48, top:180, width:546` (centred in the left half); ten-frame at `left:48, top:280` (~408px wide, one 60px frame plus five loose counters); Ollie 200px at `left:32, bottom:24`; pad 352px at `right:32, top:112`. The implementation diverges in three ways that produce the "unfinished" feel:

1. **The visual is centred, not left-aligned** (`justify-center`, line 162), and it is 556–584px where the canvas drew ~408px — so it drifts right into the gutter instead of sitting under the equation.
2. **Nothing is height-aware.** The left column's content ends at ≈410px on a 768px-tall stage (measured on `session-ten-frame.png`): dots 60 + bubble 89 + 24 + equation 67 + 24 + visual 140. The pad's natural height is 4×64 + 3×8 + 12 + 64 = **356px** in a column ~676px tall. Two independent pools of dead space, ~320px on the right and ~358px on the left, and the `theme-picture` Story card is only `size-56` (224px) — a small tile floating in a large void (`session-story.png`).
3. **Ollie is detached.** He is `absolute bottom-6 left-gutter` at 200px (line 195), ~400px below the bubble whose tail points down-left at him (`SpeechBubble.tsx:19-21`, and `direction.md`: "Ollie sits bottom-left on Learner screens and speaks in a paper bubble"). The tail now points at empty paper.

**Size budget, if the stage is made height-aware.** At 1024×768 with a 60px header row and a 32px bottom gutter the stage row is ~676px tall and the left column 512px wide (592px if the 960px cap is dropped and only the gutters kept). A fluid ten-frame with `--cell: clamp(32px, (100% - 56px)/10, 60px)` gives 45px cells at 1024 and 60px (the design value) from ~1120px up; the number line only needs `width:100%; height:auto` on the existing `viewBox`. Stacking bubble (89) + equation (67) + visual (~160) + gaps (72) = ~388px leaves **~288px for Ollie in the left column's bottom band at 1024×768 — so a 240–280px Ollie fits**, up from 200px, directly beneath his own bubble. At 1180×820 the left column is 700px (cap removed), enough for a 280px Ollie *beside* a 400px visual. The pad should fill its column by growing its row gap (`gap: clamp(12px, 3vh, 28px)`) rather than its keys: at 64px the keys are already well above Apple's floor — "a button needs a hit region of at least 44x44 pt" ([HIG, Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)), and the HIG accessibility table gives iOS/iPadOS a **default control size of 44×44 pt, minimum 28×28 pt** ([HIG, Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)). Growing keys past ~72px is counter-productive: 5×88 + 32 = 472px would starve the visual at 1024. Repeat belongs beside the bubble (as the canvas has it) and should follow the bubble into the single-column portrait layout; the dots belong in an explicit header row of the stage grid, not a floating `pt-7` div.

## 4. Recommended approach

- **Make the stage a height-aware grid**: `.learner-stage { display: grid; grid-template-rows: auto minmax(0,1fr); min-height: 100svh; }` — dots in row 1, the two columns in row 2, each column's content vertically centred (`align-content: center`). Prefer `svh` over `dvh` so the layout does not reflow as Safari's toolbar retracts (both ship since Safari 15.4).
- **Give the columns slack**: `grid-template-columns: minmax(0,1fr) auto` with `min-width: 0` on both children, and drop `max-w-content` (or raise it to ~1120px) on this screen so the left column grows on 1180–1376px iPads instead of freezing at 512px.
- **Make the visuals fluid, not fixed**: `width:100%; height:auto` on the number-line SVG (the `viewBox` is already right), and a clamped `--cell` on the ten-frame. Nothing then depends on a viewport width, and the 4px collision disappears at every size. A container query (`container-type: inline-size` + `cqi`) is an equally safe alternative — Safari 16.0 shipped size queries and `cq*` units in September 2022 ([WebKit](https://webkit.org/blog/13152/webkit-features-in-safari-16-0/)), i.e. iPadOS 16+.
- **Switch to one column in portrait** (`@media (orientation: portrait)`, or a container query at ~1000px): bubble + Ollie, then the visual, then the pad — never two columns below ~1000px, where they provably do not fit.
- **Fill the composition**: anchor Ollie (240–280px) at the bottom of the left column directly under his bubble so the tail points at him; centre the pad in its column with a fluid row gap and keep 64px keys (≥ 44pt HIG); keep Repeat beside the bubble and the dots in the header row.
- **Verify in WebKit**: `pnpm exec playwright install webkit`, then add real-device projects and screenshot each — see below.

```ts
// playwright.config.ts — WebKit projects at the real sizes from §2
const iPad = (name: string, width: number, height: number) => ({
  name, use: { ...devices["iPad (gen 7) landscape"], viewport: { width, height } },
});
projects: [
  { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
  // The descriptor's own defaultBrowserType is webkit: do NOT override browserName.
  iPad("ipad-102-landscape", 1080, 810),   iPad("ipad-102-portrait", 810, 1080),
  iPad("ipad-air11-landscape", 1180, 820), iPad("ipad-air11-portrait", 820, 1180),
  iPad("ipad-air13-landscape", 1366, 1024),iPad("ipad-air13-portrait", 1024, 1366),
  iPad("ipad-mini-landscape", 1133, 744),  iPad("ipad-mini-portrait", 744, 1133),
  iPad("ipad-gen11-landscape", 944, 656),
],
```

Run one spec in one project with `pnpm exec playwright test e2e/session.spec.ts --project=ipad-air11-portrait`, and drive the review page from a single spec that loops the sizes with `page.setViewportSize(...)` + `page.screenshot({ path: \`docs/design/screens/ipad-${w}x${h}.png\` })`, the way `scripts/design-review.mjs:308,361` already does at 1024×768.

---

## Sources

- Apple — [Human Interface Guidelines: Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) ("a button needs a hit region of at least 44x44 pt — in visionOS, 60x60 pt"), fetched via `developer.apple.com/tutorials/data/design/human-interface-guidelines/buttons.json`.
- Apple — [Human Interface Guidelines: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) (iOS/iPadOS default control size 44×44 pt, minimum 28×28 pt).
- Apple — [Human Interface Guidelines: Layout](https://developer.apple.com/design/human-interface-guidelines/layout). **The per-device screen-size specification tables are no longer present in the page's JSON payload** (only the changelog references them), so the point sizes in §2 are derived from native resolutions ÷ 2 — flagged in the table.
- Apple — [Compare iPad models](https://www.apple.com/ipad/compare/) (native resolutions and ppi for the current line-up, accessed 2026-09-17).
- WebKit — [New WebKit Features in Safari 15.4](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/) (`svh`/`lvh`/`dvh` shipped, 14 March 2022).
- WebKit — [WebKit Features in Safari 16.0](https://webkit.org/blog/13152/webkit-features-in-safari-16-0/) (container size queries and `cq*` units, 12 September 2022, iOS/iPadOS 16).
- WebKit — [Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) (`viewport-fit` defaults to `auto`; `env(safe-area-inset-*)`).
- WebKit — the blog post "The Large, Small, and Dynamic Viewports" is **404 at the URL given in the brief**; the Safari 15.4 post above was used instead.
- MDN — [`<length>`](https://developer.mozilla.org/en-US/docs/Web/CSS/length) ("`vh` is equivalent to `lvh`"; small/large/dynamic viewport definitions; the warning that `dvh` sizes are not stable).
- W3C — [CSS Grid §6.6 Automatic Minimum Size of Grid Items](https://www.w3.org/TR/css-grid-1/#min-size-auto) and [CSS Flexbox §4.5](https://www.w3.org/TR/css-flexbox-1/#min-size-auto) (why `minmax(0,1fr)` alone does not stop fixed-width content overflowing).
- Playwright — [Emulation](https://playwright.dev/docs/emulation); device data read from the installed `playwright-core@1.63.0` registry in this repo; `playwright install --dry-run webkit` output (WebKit 26.6, build v2359).
- In-repo primary sources: `src/app/play/SessionScreen.tsx`, `src/ui/{NumberPad,TenFrame,NumberLine,SpeechBubble,RepeatButton}.tsx`, `src/app/{tokens,globals}.css`, `src/app/layout.tsx`, `playwright.config.ts`, `design/canvas/Session.dc.html`, `docs/design/direction.md`, `docs/design/screens/session-{ten-frame,number-line,story}.png`.

**Unverified**: the exact height Safari's chrome takes from the layout viewport on iPadOS (measure `window.innerHeight` on device); whether the current base iPad really reports 944×656 CSS px in landscape (Playwright's `iPad (gen 11)` descriptor says so, Apple's resolution ÷ 2 says 1180×820); whether the user's session was in portrait, Split View, or with Safari page zoom set above 100% — any of the three reproduces the reported crossover, and `window.innerWidth` on the device distinguishes them.
