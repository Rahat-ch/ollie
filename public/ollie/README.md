# Ollie rig

Flat hand-tuned SVG per `docs/design/direction.md` (filled paths, no outlines, one deep-tone offset as paper shadow, palette hexes only). Every pose file shares the same body geometry and group structure so parts can be animated with CSS.

## Files

- Base states: `ollie-idle.svg`, `ollie-talking.svg`, `ollie-celebrate.svg`, `ollie-encourage.svg`
- Power poses: `ollie-count-on-flight.svg`, `ollie-make-ten-magic.svg`, `ollie-missing-number-detective.svg`, `ollie-story-solver.svg`
- `ollie-head.svg`: head only, `viewBox="0 0 120 120"`, for the favicon and OG image. Groups: `shadow`, `body`, `face` > `ear-tufts`, `eyes`, `brows`, `beak`.

## In the app

`src/ollie/Ollie.tsx` renders a pose inline (so CSS can move the parts) from `src/ollie/poses.generated.ts`, which `pnpm ollie:poses` writes from these files with each `id` turned into `data-part`. `src/ollie/ollie.css` holds the motion: idle breathing and blinks, the celebrate bounce, the encourage wave, the talking chatter. `src/ollie/poses.test.ts` fails when the module and the SVGs drift.

## Coordinate space

All pose files use `viewBox="0 0 240 240"`. Body spans roughly x 43–198, y 36–208 (shadow to 214). Eyes are centred at (90, 92) and (150, 92), white r 26, iris r 15, pupil r 9, catchlight r 4.5 at (−5, −5) from the iris centre. The beak hangs from (120, 112) and reaches y 141 closed, y 150/157/165 for the three open widths. Feet sit at y 199–214. `ollie-head.svg` is the same face scaled by 112/155 about the eyes, so the beak and brows sit where they do on the body poses.

## Groups (identical order in every pose)

```
#shadow      body + tufts in rust-deep, offset (0, 6)
#body        rust
#belly       cream heart/oval
#wing-left   one rust-deep path
#wing-right  one rust-deep path
#feet        sun-deep offset (0, 3) then sun, both feet
#face
  #ear-tufts
  #eyes  > #eye-left, #eye-right  (white, iris, pupil, catchlight, then optional rust lid paths)
  #brows
  #beak  (closed: shadow + beak; open: mouth, lower beak, upper beak)
#prop        empty in base states
```

## Hinge points

- `#wing-left` hinges at **(56, 122)**, `#wing-right` at **(184, 122)**. The rest wing hangs down from the shoulder and ends in three cut feather tips, so a raised wing still reads as a wing and not a paddle. Posed wings carry `transform="rotate(deg cx cy)"` on the inner `<path>`, leaving the group free for CSS. Animate with `transform-origin: 56px 122px` / `184px 122px` (or `transform-box: view-box`).
- Rotation sign: for the left wing positive degrees raise it outward/up (celebrate is `160`, flight `150`), negative swing it inward across the belly (story is `-55`). The right wing mirrors this (celebrate `-160`, flight `-150`, story `55`, talking `-30`, encourage `-155`, detective `-150`).
- Eyes: move `#eye-left`/`#eye-right` iris + pupil + catchlight together for a look; never move the white. Blink by scaling the eye group at its centre (90, 92) / (150, 92) on the y axis.
- Brows are one shape translated per pose (idle 70, talking 66, celebrate 61, flight 63, magic 62/67, encourage 68/65, detective 77/62, story 68 on the y of its lower edge); an asymmetric pair is two different offsets. Beak variants are separate path sets in `#beak`: closed is shadow + beak, open is mouth, lower mandible, upper mandible, at three depths (small, mid, wide).
- Idle breathing: scale `#body`, `#belly`, `#face` about (120, 208) (the feet).
- `#prop` is empty in the base states; where a Power pose has one, its animation turns about the prop's own middle: the ten-frame chip at **(30, 47)** (make-ten-magic), the magnifying glass at **(208, 34)** (missing-number-detective), and the book's spine at **(120, 167)** (story-solver). Count-On Flight's wing-beat arcs are not moved on their own: the wings carry them. Every prop is drawn inside the 240 box so nothing is clipped at any render size.

## How poses differ

Only wing position, eye shape (pupil offset and rust lid paths), brow offset, beak variant, and `#prop` change. Everything else is byte-identical across the eight files.

| Pose | Wings | Eyes | Beak | Prop |
| --- | --- | --- | --- | --- |
| idle | rest | centred | closed | — |
| talking | right out a little | centred, brows up | mid open | — |
| celebrate | both up, clear of the tufts | happy lower lids, looking up | wide open | — |
| encourage | right raised (wave) | soft upper lids | small open | — |
| count-on-flight | both up and out | looking up | mid open | three sky wing-beat arcs sweeping under each raised wing |
| make-ten-magic | left raised | looking up-left | small open | a ten-frame chip filled to ten in the wing tip, three plum sparkles |
| missing-number-detective | right raised | left eye squinted, looking up-right | closed | magnifying glass (sky rim, plum handle, 3px ink 60% rim line) |
| story-solver | both inward | looking down, soft lids | small open | open plum book with paper pages, 3px ink 60% page lines |

Strokes appear only on the magnifying glass rim and the book page lines, as the style paragraph allows. No `<style>`, `class`, `filter`, gradients, or external references. No coordinate carries more than one decimal place.

## Editing

The files are the source of truth: edit a path here, then run `pnpm ollie:poses` (`src/ollie/poses.test.ts` fails if you forget) and `pnpm brand:images` if the head or idle changed. `pnpm design:review` puts every pose beside the character sheet in `docs/design/review-<date>.html`.
