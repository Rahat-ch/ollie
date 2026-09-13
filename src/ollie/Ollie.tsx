import { POSES, type OlliePose } from "./poses.generated";

export type { OlliePose };

type OllieProps = {
  readonly pose: OlliePose;
  /** Rendered width and height in px; the rig is square. */
  readonly size: number;
  /**
   * True while a line is being said. The beak moves on its own class, not on
   * the pose, so the mouth also moves through a Hint, a cheer, and a Reveal,
   * where Ollie is encouraging or celebrating rather than idle.
   */
  readonly speaking?: boolean;
  readonly className?: string;
};

/**
 * Ollie, inline so CSS can move the parts of the rig (src/ollie/ollie.css:
 * idle breathing and blinking, the celebrate bounce, the encourage wave).
 * The markup is the project's own SVG from public/ollie/, generated into
 * poses.generated.ts by `pnpm ollie:poses`.
 */
export function Ollie({ pose, size, speaking = false, className = "" }: OllieProps) {
  return (
    <svg
      className={`ollie ollie-${pose}${speaking ? " ollie-speaking" : ""} ${className}`.trim()}
      viewBox="0 0 240 240"
      width={size}
      height={size}
      role="img"
      aria-label={`Ollie, ${pose.replace(/-/g, " ")}`}
      data-pose={pose}
      data-speaking={speaking ? "" : undefined}
      dangerouslySetInnerHTML={{ __html: POSES[pose] }}
    />
  );
}
