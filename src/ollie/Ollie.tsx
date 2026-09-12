import { POSES, type OlliePose } from "./poses.generated";

export type { OlliePose };

type OllieProps = {
  readonly pose: OlliePose;
  /** Rendered width and height in px; the rig is square. */
  readonly size: number;
  readonly className?: string;
};

/**
 * Ollie, inline so CSS can move the parts of the rig (src/ollie/ollie.css:
 * idle breathing and blinking, the celebrate bounce, the encourage wave).
 * The markup is the project's own SVG from public/ollie/, generated into
 * poses.generated.ts by `pnpm ollie:poses`.
 */
export function Ollie({ pose, size, className = "" }: OllieProps) {
  return (
    <svg
      className={`ollie ollie-${pose} ${className}`.trim()}
      viewBox="0 0 240 240"
      width={size}
      height={size}
      role="img"
      aria-label={`Ollie the owl, ${pose.replace(/-/g, " ")}`}
      data-pose={pose}
      dangerouslySetInnerHTML={{ __html: POSES[pose] }}
    />
  );
}
