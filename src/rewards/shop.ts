/**
 * The Shop's six Avatar Items, in three price tiers, one row each. An Item
 * is cosmetic and never touches play (CONTEXT.md, Avatar Item); its picture
 * lives beside it in src/ui/AvatarItems.tsx.
 */

/**
 * The Avatar's three slots, in the order the Avatar draws them (the pet
 * beside it, then what goes on it); one Item is worn in each. The one list:
 * the Profile checks it, the Avatar draws it, fresh rewards start it empty.
 */
export const AVATAR_SLOTS = ["pet", "accessory", "hat"] as const;

export type AvatarSlot = (typeof AVATAR_SLOTS)[number];

export type AvatarItemId =
  | "party-hat"
  | "stripy-scarf"
  | "round-glasses"
  | "pet-snail"
  | "gold-crown"
  | "pet-bunny";

export type AvatarItem = {
  readonly id: AvatarItemId;
  /** What the Shop calls it, and what Ollie would call it. */
  readonly name: string;
  readonly slot: AvatarSlot;
  /** 10, 30, or 70 Coins. */
  readonly price: number;
};

/** In price order, the cheapest tier first, so the Shop reads left to right. */
export const SHOP_ITEMS: readonly AvatarItem[] = [
  { id: "party-hat", name: "Party Hat", slot: "hat", price: 10 },
  { id: "stripy-scarf", name: "Stripy Scarf", slot: "accessory", price: 10 },
  { id: "round-glasses", name: "Round Glasses", slot: "accessory", price: 30 },
  { id: "pet-snail", name: "Pet Snail", slot: "pet", price: 30 },
  { id: "gold-crown", name: "Gold Crown", slot: "hat", price: 70 },
  { id: "pet-bunny", name: "Pet Bunny", slot: "pet", price: 70 },
];

export function shopItem(id: AvatarItemId): AvatarItem {
  const item = SHOP_ITEMS.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`No such Avatar Item: ${id}`);
  return item;
}
