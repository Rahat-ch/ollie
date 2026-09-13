import { avatarColor, type AvatarColor } from "@/profile/identity";
import type { AvatarItemId, AvatarSlot } from "@/rewards/shop";
import { AVATAR_ITEM_ART } from "./AvatarItems";

/** What the Avatar wears: one Avatar Item to a slot, bought in the Shop. */
type Worn = Readonly<Record<AvatarSlot, AvatarItemId | null>>;

type AvatarProps = {
  readonly color: AvatarColor;
  readonly worn?: Worn;
  readonly size?: number;
  readonly label?: string;
};

const NOTHING_WORN: Worn = { hat: null, accessory: null, pet: null };

/** Behind the Avatar, then on it: the pet sits beside, the accessory and the hat go on top. */
const SLOT_ORDER: readonly AvatarSlot[] = ["pet", "accessory", "hat"];

/** The Avatar: a round creature in its chosen colour, wearing what the Shop sold it. */
export function Avatar({ color, worn = NOTHING_WORN, size = 72, label = "Your Avatar" }: AvatarProps) {
  const { fill, deepFill } = avatarColor(color);
  const items = SLOT_ORDER.map((slot) => worn[slot]).filter((id): id is AvatarItemId => id !== null);
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      data-color={color}
      data-worn={items.join(" ")}
    >
      <path d="M22 18 Q40 6 58 18" fill="none" className="stroke-paper-3" strokeWidth="3" strokeDasharray="5 5" strokeLinecap="round" />
      <ellipse cx="42" cy="49" rx="30" ry="27" className={deepFill} />
      <ellipse cx="40" cy="46" rx="30" ry="27" className={fill} />
      <circle cx="30" cy="42" r="4" className="fill-ink" />
      <circle cx="50" cy="42" r="4" className="fill-ink" />
      <path d="M32 55 Q40 62 48 55" fill="none" className="stroke-ink" strokeWidth="3" strokeLinecap="round" />
      {items.map((id) => (
        <g key={id} data-item={id}>
          {AVATAR_ITEM_ART[id].art}
        </g>
      ))}
    </svg>
  );
}
