/**
 * The two shapes the illustration style repeats, so every drawing cuts them
 * the same way (`docs/design/direction.md`).
 *
 * Both take the radius they are drawn at and scale their parts from it, in
 * the proportions Ollie's own face uses (`public/ollie/README.md`: white 26,
 * iris 15, pupil 9, catchlight 4.5 offset 5). Flat fills only.
 */

type EyeProps = {
  readonly cx: number;
  readonly cy: number;
  /** Radius of the white; everything else is a fraction of it. */
  readonly r: number;
};

/** A white, a teal iris, an ink pupil, and one flat catchlight up and to the left. */
export function Eye({ cx, cy, r }: EyeProps) {
  const round = (n: number) => Math.round(n * 10) / 10;
  return (
    <>
      <circle cx={cx} cy={cy} r={r} className="fill-paper" />
      <circle cx={cx} cy={cy} r={round(r * 0.577)} className="fill-teal" />
      <circle cx={cx} cy={cy} r={round(r * 0.346)} className="fill-ink" />
      <circle cx={round(cx - r * 0.192)} cy={round(cy - r * 0.192)} r={round(r * 0.173)} className="fill-paper" />
    </>
  );
}

/**
 * A four-pointed paper star: four straight cuts from the points in to a
 * waist a fifth of the way out, so it reads as cut rather than drawn.
 */
export function Star({ cx, cy, r, className }: { readonly cx: number; readonly cy: number; readonly r: number; readonly className: string }) {
  const w = Math.round(r * 0.2 * 10) / 10;
  const d = [
    `M${cx} ${cy - r}`,
    `L${cx + w} ${cy - w}L${cx + r} ${cy}L${cx + w} ${cy + w}`,
    `L${cx} ${cy + r}L${cx - w} ${cy + w}L${cx - r} ${cy}L${cx - w} ${cy - w}Z`,
  ].join("");
  return <path d={d} className={className} />;
}
