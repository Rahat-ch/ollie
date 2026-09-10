# Design direction

Status: draft for review on the design canvas (ticket 02). Once the user marks the canvas approved, this file is the written source of truth and every screen is built to it. Tokens live in `src/app/tokens.css`; this document explains them.

## Feel

Ollie is a picture book, not an app store. Warm cream paper, chunky flat shapes, a small palette, and a lot of air. Calm by default, bright only where the Learner should look (the Play button, the answer pad, Ollie). Nothing glows, nothing has a gradient, nothing is glassy. It should look like something a person cut out of paper and arranged by hand.

## Illustration style (the paragraph later assets must match)

Flat, warm, hand-tuned vector. Every shape is a filled path with no outline stroke; depth comes from one flat darker tone of the same hue laid as an offset shape (a paper shadow), never from blur, gradient, or highlight. Forms are rounded and slightly asymmetric on purpose, as if cut from paper with scissors, with corners eased rather than geometrically perfect. The palette is the token palette only: paper, ink, and the six named hues below, each used at its base tone plus its one deep tone. Eyes are large, simple, and expressive (a white, a teal iris, a black pupil, one flat catchlight); mouths and brows carry the expression. Line weight, where a line is unavoidable (a number line, a ten-frame), is 3px ink at 60% opacity. No texture, no grain, no outlines, no photographic reference, no drop shadows with blur. SVG-first; image-model output is reference only and never ships.

## Ollie

An owl, front-facing, about as wide as tall, short and round with a big head. Body rust, belly cream, wings deep rust, beak and feet amber, eye ring white, iris deep teal, pupil ink. Four base states (idle, talking, celebrate, encourage) and one pose per Power (Count-On Flight, Make-Ten Magic, Missing Number Detective, Story Solver). Same proportions and parts in every pose; only wing position, eye shape, brows, and beak change. Encourage is kind, never sad: soft brows, a small open beak, one wing raised in a "try again" gesture.

## Palette

Warm-toned. Whites and blacks are tinted toward amber. Accents share lightness and chroma and differ in hue.

| Token | Hex | Use |
| --- | --- | --- |
| `--paper` | `#FFF7EC` | page background |
| `--paper-2` | `#F8E8CF` | panels, cards, the ten-frame board |
| `--paper-3` | `#EED7B5` | pressed state, dividers, paper shadow on cards |
| `--ink` | `#3B2E2A` | text, pupils, number-line ticks |
| `--ink-soft` | `#7A6660` | secondary text, captions |
| `--rust` / `--rust-deep` | `#C9713F` / `#A8532C` | Ollie's body and wings |
| `--cream` | `#F8DFB8` | Ollie's belly, avatar base |
| `--sun` / `--sun-deep` | `#F2B134` / `#D0901E` | Play button, beak, feet, coins, primary action |
| `--leaf` / `--leaf-deep` | `#4CAF7A` / `#2F8A5B` | correct, mastered, Streak |
| `--sky` / `--sky-deep` | `#6FB7D6` / `#3F8FB4` | Path, secondary action, Parent Area |
| `--berry` / `--berry-deep` | `#D95F76` / `#B23F56` | encourage, hint, not "wrong": soft not alarming |
| `--plum` / `--plum-deep` | `#6B4E9C` / `#4E3676` | Powers, magic, the Notebook's Hypotheses |
| `--teal` / `--teal-deep` | `#2E5E6B` / `#1F434D` | Ollie's iris, Parent Area headings |
| `--counter-red` | `#E0553F` | two-colour counter, side A |
| `--counter-yellow` | `#F5C542` | two-colour counter, side B |

Text on `--sun`, `--leaf`, `--sky`, `--cream` is `--ink`. Text on `--plum`, `--teal`, `--berry-deep`, `--rust-deep` is `--paper`.

## Type

- Display: **Fredoka** (500, 600) for headings, buttons, the number pad, Ollie's speech. Rounded, friendly, clear numerals with an open 4 and a distinct 6/9.
- Text: **Andika** (400, 700) for body, captions, and the Parent Area. Designed by SIL for early readers: single-storey a and g, unambiguous I/l/1.
- Both under the SIL Open Font License 1.1, self-hosted with `next/font/local` from `src/app/fonts/` (latin subset, woff2). Fredoka ships as one variable-weight file (`wght` 300–700) declared for 500–600; Andika is two static files. Any other weight is a token change, not a new download.

Scale on tablet (px / line-height): display-xl 64/1.05, display-l 44/1.1, display-m 32/1.15, display-s 24/1.2, body-l 20/1.5, body 18/1.5, caption 15/1.4. Number pad numerals 40/1. Minimum touch target 64px in the Learner UI, 44px in the Parent Area.

## Spacing, radii, elevation, motion

- Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Radii: 12 (chips, inputs), 20 (cards, keys), 28 (big buttons), 999 (pills, counters, avatar).
- Elevation is a flat paper shadow, never blur: buttons `0 4px 0 <deep tone>`; cards `0 3px 0 var(--paper-3)`. Pressed buttons drop to `0 1px 0` and translate down 3px.
- Motion: 180ms ease-out for state; 420ms spring-like overshoot for celebrate; nothing loops except Ollie's idle breathing (3s) and blink.

## Layout

Tablet landscape first: 1024×768 design frame, 32px page gutter, content max 960. Learner screens have one primary action, big and centred low on the screen where a thumb rests. Ollie sits bottom-left on Learner screens and speaks in a paper bubble. The Parent Area is denser, text-first, still on paper.

## What we never do

No gradients, glow, glassmorphism, or blur shadows. No emoji as UI. No red X for wrong answers. No timers, lives, or leaderboards. No pure white or pure black.
