import { avatarColor, type AvatarColor } from "@/profile/identity";
import type { Rewards } from "@/rewards/rewards";
import { AVATAR_SLOTS, type AvatarItemId } from "@/rewards/shop";
import { AVATAR_ITEM_ART } from "./AvatarItems";
import { Eye } from "./art";
import { INK_STROKE } from "./icons";

/** What the Avatar wears: one Avatar Item to a slot, bought in the Shop. */
type Worn = Rewards["worn"];

type AvatarProps = {
  readonly color: AvatarColor;
  readonly worn?: Worn;
  readonly size?: number;
  readonly label?: string;
};

const NOTHING_WORN: Worn = { hat: null, accessory: null, pet: null };

/** The Avatar: a round creature in its chosen colour, wearing what the Shop sold it. */
export function Avatar({ color, worn = NOTHING_WORN, size = 72, label = "Your Avatar" }: AvatarProps) {
  const { fill, deepFill } = avatarColor(color);
  // AVATAR_SLOTS is in drawing order: the pet beside, then what goes on top.
  const items = AVATAR_SLOTS.map((slot) => worn[slot]).filter((id): id is AvatarItemId => id !== null);
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
      {/*
       * Cut from paper like everything else: the deep tone of its own colour
       * laid behind as the shadow, two round ears, big simple eyes, a sun
       * beak, and two feet peeking out below. Round and eared where Ollie is
       * tall and tufted, so the two are never taken for one another. The
       * landmarks the Items are drawn to are the crown of the head at y 20,
       * the eyes at y 41, the neck at y 58, and the ground to the right.
       */}
      <ellipse cx="23" cy="25" rx="8" ry="9.5" className={deepFill} />
      <ellipse cx="57" cy="25" rx="8" ry="9.5" className={deepFill} />
      <path d="M31 70C31 76 33 79 36.5 79C40 79 42 76 42 70Z" className="fill-sun-deep" />
      <path d="M45 70C45 76 47 79 50.5 79C54 79 56 76 56 70Z" className="fill-sun-deep" />
      <path d="M31 68C31 74 33 77 36.5 77C40 77 42 74 42 68Z" className="fill-sun" />
      <path d="M45 68C45 74 47 77 50.5 77C54 77 56 74 56 68Z" className="fill-sun" />
      <ellipse cx="41.5" cy="50" rx="29" ry="27" className={deepFill} />
      <ellipse cx="40" cy="47" rx="29" ry="27" className={fill} />
      <Eye cx={30} cy={41} r={7.5} />
      <Eye cx={50} cy={41} r={7.5} />
      <path d="M35.5 51C37 49.5 43 49.5 44.5 51C43 55.5 41.5 58 40 59.5C38.5 58 37 55.5 35.5 51Z" className="fill-sun" />
      <path d="M32 63C35 66 45 66 48 63" {...INK_STROKE} />
      {items.map((id) => (
        <g key={id} data-item={id}>
          {AVATAR_ITEM_ART[id].art}
        </g>
      ))}
    </svg>
  );
}
