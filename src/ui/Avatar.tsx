import type { AvatarColor } from "@/profile/identity";

/** Base and paper-shadow classes per colour: the deep tone of the same hue, paper-3 for cream. */
const FILLS: Readonly<Record<AvatarColor, { readonly base: string; readonly deep: string }>> = {
  cream: { base: "fill-cream", deep: "fill-paper-3" },
  sky: { base: "fill-sky", deep: "fill-sky-deep" },
  leaf: { base: "fill-leaf", deep: "fill-leaf-deep" },
  berry: { base: "fill-berry", deep: "fill-berry-deep" },
};

type AvatarProps = {
  readonly color: AvatarColor;
  readonly size?: number;
  readonly label?: string;
};

/** The Avatar: a round creature in its chosen colour. Items come with ticket 14. */
export function Avatar({ color, size = 72, label = "Your Avatar" }: AvatarProps) {
  const { base, deep } = FILLS[color];
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} role="img" aria-label={label} data-color={color}>
      <path d="M22 18 Q40 6 58 18" fill="none" className="stroke-paper-3" strokeWidth="3" strokeDasharray="5 5" strokeLinecap="round" />
      <ellipse cx="42" cy="49" rx="30" ry="27" className={deep} />
      <ellipse cx="40" cy="46" rx="30" ry="27" className={base} />
      <circle cx="30" cy="42" r="4" className="fill-ink" />
      <circle cx="50" cy="42" r="4" className="fill-ink" />
      <path d="M32 55 Q40 62 48 55" fill="none" className="stroke-ink" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
