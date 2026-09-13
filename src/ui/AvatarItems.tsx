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
        <path d="M20.5 36.6L13 32.6L11.6 35.2L19.1 39.2ZM59.5 36.6L67 32.6L68.4 35.2L60.9 39.2Z" className="fill-teal-deep" />
        <path d="M37.5 40.5H42.5V43.5H37.5Z" className="fill-teal-deep" />
        <path
          d="M30 30a11 11 0 1 0 0 22a11 11 0 1 0 0-22M30 33a8 8 0 1 1 0 16a8 8 0 1 1 0-16M50 30a11 11 0 1 0 0 22a11 11 0 1 0 0-22M50 33a8 8 0 1 1 0 16a8 8 0 1 1 0-16"
          className="fill-teal-deep"
        />
        <circle cx="30" cy="41" r="8" className="fill-paper" />
        <circle cx="50" cy="41" r="8" className="fill-paper" />
        <circle cx="30" cy="41" r="3.4" className="fill-ink" />
        <circle cx="50" cy="41" r="3.4" className="fill-ink" />
        <circle cx="28.5" cy="39.5" r="1.3" className="fill-paper" />
        <circle cx="48.5" cy="39.5" r="1.3" className="fill-paper" />
      </>
    ),
  },

  "pet-snail": {
    viewBox: "51 54 31 26",
    art: (
      <>
        <path d="M54 79C52 74 59 71 66 71H78C80 74 78 78 74 79Z" className="fill-leaf-deep" />
        <path d="M54 77C52 72 59 69 66 69H78C80 72 78 76 74 77Z" className="fill-leaf" />
        <path d="M56.8 71.5L59.8 70.8L58.6 62.6L56.4 62.9Z" className="fill-leaf-deep" />
        <path d="M61.8 69.8L64.8 69.2L63.6 61.4L61.4 61.7Z" className="fill-leaf-deep" />
        <circle cx="57.4" cy="61.6" r="2.2" className="fill-ink" />
        <circle cx="62.4" cy="60.4" r="2.2" className="fill-ink" />
        <circle cx="69" cy="68" r="9" className="fill-sun-deep" />
        <circle cx="69" cy="66" r="9" className="fill-sun" />
        <circle cx="69" cy="66" r="6" className="fill-sun-deep" />
        <circle cx="69" cy="66" r="3.4" className="fill-sun" />
        <circle cx="69" cy="66" r="1.2" className="fill-sun-deep" />
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
