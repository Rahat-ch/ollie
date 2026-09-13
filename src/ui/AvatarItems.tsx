import type { AvatarItemId } from "@/rewards/shop";

/**
 * The picture of each Avatar Item, drawn in the Avatar's own 80×80 frame so
 * the same shapes serve the Avatar wearing it and the Shop showing it: the
 * tile crops the frame to the Item with `viewBox`. Flat filled paths in the
 * token palette, a deep tone of the same hue for the paper shadow.
 *
 * Placeholder art for ticket 15's illustration pass: the shapes are right
 * in place and colour, not yet hand-tuned.
 */
export const AVATAR_ITEM_ART: Readonly<Record<AvatarItemId, { readonly art: React.ReactNode; readonly viewBox: string }>> = {
  "party-hat": {
    viewBox: "20 0 40 32",
    art: (
      <>
        <path d="M40 6 L57 28 L27 28 Z" className="fill-sun-deep" />
        <path d="M38 4 L53 28 L25 28 Z" className="fill-sun" />
        <circle cx="38" cy="5" r="4" className="fill-berry" />
      </>
    ),
  },
  "gold-crown": {
    viewBox: "18 2 44 30",
    art: (
      <>
        <path d="M22 26 L26 8 L33 18 L40 5 L47 18 L54 8 L58 26 Z" className="fill-sun" />
        <rect x="22" y="24" width="36" height="7" rx="3" className="fill-sun-deep" />
        <circle cx="40" cy="14" r="3" className="fill-berry" />
      </>
    ),
  },
  "stripy-scarf": {
    viewBox: "10 52 60 26",
    art: (
      <>
        <path d="M14 58 Q40 72 66 58 L66 67 Q40 81 14 67 Z" className="fill-berry" />
        <path d="M26 64 q4 2 4 9 h-5 q0-7-4-9 Z M50 73 q0-7 4-9 h5 q-4 2-4 9 Z" className="fill-berry-deep" />
      </>
    ),
  },
  "round-glasses": {
    viewBox: "16 30 48 24",
    art: (
      <>
        <circle cx="30" cy="42" r="9" className="fill-paper" />
        <circle cx="50" cy="42" r="9" className="fill-paper" />
        <path
          d="M30 33 a9 9 0 1 1 0 18 a9 9 0 1 1 0 -18 M50 33 a9 9 0 1 1 0 18 a9 9 0 1 1 0 -18 M39 42 h2"
          fill="none"
          className="stroke-teal-deep"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="30" cy="42" r="4" className="fill-ink" />
        <circle cx="50" cy="42" r="4" className="fill-ink" />
      </>
    ),
  },
  "pet-snail": {
    viewBox: "52 50 28 28",
    art: (
      <>
        <path d="M58 74 q-2 -8 8 -8 h10 q2 4 -2 8 Z" className="fill-leaf" />
        <circle cx="68" cy="64" r="8" className="fill-sun" />
        <circle cx="68" cy="64" r="3.5" className="fill-sun-deep" />
        <path d="M60 66 l-3 -5 M64 62 l-1 -6" className="stroke-leaf-deep" strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
  },
  "pet-bunny": {
    viewBox: "52 48 28 30",
    art: (
      <>
        <ellipse cx="64" cy="58" rx="3" ry="7" className="fill-berry-deep" transform="rotate(-12 64 58)" />
        <ellipse cx="71" cy="58" rx="3" ry="7" className="fill-berry-deep" transform="rotate(12 71 58)" />
        <ellipse cx="68" cy="69" rx="10" ry="8" className="fill-berry" />
        <circle cx="65" cy="68" r="1.8" className="fill-ink" />
        <circle cx="71" cy="68" r="1.8" className="fill-ink" />
      </>
    ),
  },
};

/** One Item on its own, cropped to itself: the Shop's picture of what the Coins buy. */
export function AvatarItemArt({ id, size = 72 }: { readonly id: AvatarItemId; readonly size?: number }) {
  const { art, viewBox } = AVATAR_ITEM_ART[id];
  return (
    <svg viewBox={viewBox} width={size} height={size} aria-hidden="true">
      {art}
    </svg>
  );
}
