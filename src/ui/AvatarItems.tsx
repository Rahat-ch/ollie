import type { AvatarItemId } from "@/rewards/shop";

/**
 * The picture of each Avatar Item, drawn in the Avatar's own 80×80 frame so
 * the same shapes serve the Avatar wearing it and the Shop showing it: the
 * tile crops the frame to the Item with `viewBox`.
 *
 * Hand-cut in the illustration style of `docs/design/direction.md`: filled
 * paths only, a deep tone of the same hue laid behind as the paper shadow,
 * no outline and no gradient. Each Item is placed against the Avatar's own
 * landmarks (the crown of the head at y 20, the eyes at y 41, the neck at
 * y 58, and the ground to its right), so one drawing sits correctly on all
 * four colour bases.
 */
export const AVATAR_ITEM_ART: Readonly<Record<AvatarItemId, { readonly art: React.ReactNode; readonly viewBox: string }>> = {
  "party-hat": {
    viewBox: "20 0 40 38",
    art: (
      <>
        <path d="M41 8L55 33H29Z" className="fill-sun-deep" />
        <path d="M39 5L52 31H26Z" className="fill-sun" />
        <path d="M35.5 13H42.5L44.5 18H33.5Z" className="fill-paper-3" />
        <path d="M31.5 22H46.5L49 28H29Z" className="fill-paper-3" />
        <path d="M25 28H53C54 28 55 29 55 30V32C55 33 54 34 53 34H25C24 34 23 33 23 32V30C23 29 24 28 25 28Z" className="fill-sun-deep" />
        <circle cx="39" cy="5" r="4.5" className="fill-berry" />
      </>
    ),
  },

  "gold-crown": {
    viewBox: "20 4 40 34",
    art: (
      <>
        <path d="M27 33L25 18L33 24L41 12L49 24L57 18L55 33Z" className="fill-sun-deep" />
        <path d="M26 30L24 14L32 21L40 8L48 21L56 14L54 30Z" className="fill-sun" />
        <path d="M25 27H55C56 27 57 28 57 29V33C57 34.5 56 35 54 35H26C24 35 23 34.5 23 33V29C23 28 24 27 25 27Z" className="fill-sun-deep" />
        <circle cx="40" cy="9" r="3" className="fill-berry" />
        <circle cx="24" cy="15" r="2.4" className="fill-plum" />
        <circle cx="56" cy="15" r="2.4" className="fill-plum" />
        <circle cx="40" cy="31" r="3.2" className="fill-berry" />
      </>
    ),
  },

  "stripy-scarf": {
    viewBox: "12 52 56 30",
    art: (
      <>
        <path d="M12 59C22 69 58 69 68 59L70 70C58 81 22 81 10 70Z" className="fill-berry-deep" />
        <path d="M12 57C22 67 58 67 68 57L69 67C58 78 22 78 11 67Z" className="fill-berry" />
        <path d="M23 63.5L28 64.8L29.5 74L24.5 72.8Z" className="fill-berry-deep" />
        <path d="M37.5 67.5H42.5L43 77.2H38Z" className="fill-berry-deep" />
        <path d="M52 64.8L57 63.4L56 72.8L51 74Z" className="fill-berry-deep" />
        <path d="M62 66C68 64 72 67 72 71L74 79C74 81 71 82 69 80L63 73Z" className="fill-berry" />
        <path d="M64 74C68 72 71 73 72 76L74 79C74 81 71 82 69 80Z" className="fill-berry-deep" />
      </>
    ),
  },

  "round-glasses": {
    viewBox: "10 27 60 28",
    art: (
      <>
        <circle cx="30" cy="41" r="9.5" className="fill-paper" />
        <circle cx="50" cy="41" r="9.5" className="fill-paper" />
        <circle cx="30" cy="41" r="3.6" className="fill-ink" />
        <circle cx="50" cy="41" r="3.6" className="fill-ink" />
        <circle cx="28.4" cy="39.4" r="1.4" className="fill-paper" />
        <circle cx="48.4" cy="39.4" r="1.4" className="fill-paper" />
        <path
          d="M30 31.5a9.5 9.5 0 1 1 0 19a9.5 9.5 0 1 1 0-19M50 31.5a9.5 9.5 0 1 1 0 19a9.5 9.5 0 1 1 0-19M39.5 40.5C39.8 39.5 40.2 39.5 40.5 40.5M20.5 38L13 34M59.5 38L67 34"
          stroke="var(--teal-deep)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
  },

  "pet-snail": {
    viewBox: "46 44 36 36",
    art: (
      <>
        <path d="M52 78C50 70 58 65 67 65H78C80 69 78 76 73 78Z" className="fill-leaf-deep" />
        <path d="M52 75C50 67 58 62 67 62H78C80 66 78 73 73 75Z" className="fill-leaf" />
        <path d="M56 64L53 54M62 62L61 51" stroke="var(--leaf-deep)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="53" cy="52.5" r="2.4" className="fill-ink" />
        <circle cx="61" cy="49.5" r="2.4" className="fill-ink" />
        <circle cx="69" cy="60" r="12" className="fill-sun-deep" />
        <circle cx="69" cy="58" r="12" className="fill-sun" />
        <path
          d="M69 46C75.6 46 81 51.4 81 58C81 63.5 76.5 68 71 68C66.6 68 63 64.4 63 60C63 56.7 65.7 54 69 54C71.2 54 73 55.8 73 58"
          stroke="var(--sun-deep)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
  },

  "pet-bunny": {
    viewBox: "46 40 36 40",
    art: (
      <>
        <ellipse cx="62" cy="55" rx="4" ry="10" className="fill-berry-deep" transform="rotate(-14 62 55)" />
        <ellipse cx="73" cy="54" rx="4" ry="10" className="fill-berry-deep" transform="rotate(14 73 54)" />
        <ellipse cx="62" cy="55" rx="2" ry="6.5" className="fill-cream" transform="rotate(-14 62 55)" />
        <ellipse cx="73" cy="54" rx="2" ry="6.5" className="fill-cream" transform="rotate(14 73 54)" />
        <circle cx="55" cy="73" r="5" className="fill-paper" />
        <ellipse cx="68" cy="73" rx="12" ry="9" className="fill-berry-deep" />
        <ellipse cx="67" cy="70" rx="12" ry="9" className="fill-berry" />
        <circle cx="62.5" cy="68" r="2.2" className="fill-ink" />
        <circle cx="71.5" cy="68" r="2.2" className="fill-ink" />
        <path d="M64.5 72.5C66 74 68 74 69.5 72.5L67 75.5Z" className="fill-berry-deep" />
      </>
    ),
  },
};

/** One Item on its own, cropped to itself: the Shop's picture of what the Coins buy. */
export function AvatarItemArt({ id, size = 72 }: { readonly id: AvatarItemId; readonly size?: number }) {
  const { art, viewBox } = AVATAR_ITEM_ART[id];
  return (
    <svg viewBox={viewBox} width={size} height={size} aria-hidden="true" data-item={id}>
      {art}
    </svg>
  );
}
