# Ollie rig

Flat hand-tuned SVG per `docs/design/direction.md` (filled paths, no outlines, one deep-tone offset as paper shadow, palette hexes only). Every pose file shares the same body geometry and group structure so parts can be animated with CSS.

## Files

- Base states: `ollie-idle.svg`, `ollie-talking.svg`, `ollie-celebrate.svg`, `ollie-encourage.svg`
- Power poses: `ollie-count-on-flight.svg`, `ollie-make-ten-magic.svg`, `ollie-missing-number-detective.svg`, `ollie-story-solver.svg`
- `ollie-head.svg`: head only, `viewBox="0 0 120 120"`, for the favicon and OG image. Groups: `shadow`, `body`, `face` > `ear-tufts`, `eyes`, `brows`, `beak`.

## Coordinate space

All pose files use `viewBox="0 0 240 240"`. Body spans roughly x 43–198, y 36–208 (shadow to 214). Eyes are centred at (90, 92) and (150, 92), white r 26, iris r 15, pupil r 9, catchlight r 4.5 at (−5, −5) from the iris centre. Beak sits at (120, 116–141). Feet sit at y 199–214.

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

- `#wing-left` hinges at **(56, 122)**, `#wing-right` at **(184, 122)**. The rest wing hangs down from the shoulder; posed wings carry `transform="rotate(deg cx cy)"` on the inner `<path>`, leaving the group free for CSS. Animate with `transform-origin: 56px 122px` / `184px 122px` (or `transform-box: view-box`).
- Rotation sign: for the left wing positive degrees raise it outward/up (celebrate is `168`, flight `150`), negative swing it inward across the belly (story is `-55`). The right wing mirrors this (celebrate `-168`, flight `-150`, story `55`, talking `-30`, encourage `-155`, detective `-150`).
- Eyes: move `#eye-left`/`#eye-right` iris + pupil + catchlight together for a look; never move the white. Blink by scaling the eye group at its centre (90, 92) / (150, 92) on the y axis.
- Brows are translated 2–9 px per pose; beak variants are separate path sets in `#beak`.
- Idle breathing: scale `#body`, `#belly`, `#face` about (120, 208) (the feet).

## How poses differ

Only wing position, eye shape (pupil offset and rust lid paths), brow offset, beak variant, and `#prop` change. Everything else is byte-identical across the eight files.

| Pose | Wings | Eyes | Beak | Prop |
| --- | --- | --- | --- | --- |
| idle | rest | centred | closed | — |
| talking | right out a little | centred, brows up | open | — |
| celebrate | both straight up | happy lower lids, looking up | wide open | — |
| encourage | right raised (wave) | soft upper lids | small open | — |
| count-on-flight | both up and out | looking up | open | three sky wing-beat arcs each side |
| make-ten-magic | left raised | looking up-left | small open | ten-frame chip in the wing tip, plum sparkles |
| missing-number-detective | right raised | left eye squinted, looking up-right | closed | magnifying glass (sky rim, plum handle, 3px ink 60% rim line) |
| story-solver | both inward | looking down, soft lids | small open | open plum book with paper pages, 3px ink 60% page lines |

Strokes appear only on the magnifying glass rim and the book page lines, as the style paragraph allows. No `<style>`, `class`, `filter`, gradients, or external references.
