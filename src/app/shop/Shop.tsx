"use client";

import Link from "next/link";
import { THEMES, type Identity, type ThemeId } from "@/profile/identity";
import type { Profile } from "@/profile/profile";
import { profileStore } from "@/profile/store";
import { buyItem, itemState, streakToday, wearItem, type ItemState } from "@/rewards/rewards";
import { SHOP_ITEMS, type AvatarItem, type AvatarItemId } from "@/rewards/shop";
import { Avatar } from "@/ui/Avatar";
import { AvatarItemArt } from "@/ui/AvatarItems";
import { bigButtonClasses } from "@/ui/BigButton";
import { CoinChip, CoinIcon, StreakChip } from "@/ui/RewardChips";
import { ThemeIcon } from "@/ui/ThemeIcon";

/** What the card offers for each state an Item can be in. */
const LABEL: Readonly<Record<ItemState, string>> = {
  worn: "Take off",
  owned: "Put on",
  affordable: "Buy",
  "saving-up": "Keep playing",
};

const buy = (id: AvatarItemId) => profileStore.update((profile) => ({ ...profile, rewards: buyItem(profile.rewards, id) }));
const wear = (id: AvatarItemId) => profileStore.update((profile) => ({ ...profile, rewards: wearItem(profile.rewards, id) }));

/**
 * A choice made by tapping: the picked one carries the teal ring from the
 * canvas. On a paper button the ring is an outline, not a second shadow,
 * because .paper-button owns the box-shadow the press animates.
 */
const picked = (on: boolean) => (on ? "outline-4 outline-offset-4 outline-teal" : "");

function ShopCard({ item, state }: { readonly item: AvatarItem; readonly state: ItemState }) {
  const owned = state === "worn" || state === "owned";
  return (
    <button
      type="button"
      disabled={state === "saving-up"}
      onClick={() => (owned ? wear(item.id) : buy(item.id))}
      aria-label={`${item.name}, ${item.price} Coins. ${LABEL[state]}`}
      className={`paper-button flex flex-col items-center gap-1 rounded-card bg-paper-2 px-4 pt-3 pb-4 [--button-shadow-color:var(--paper-3)] ${picked(state === "worn")}`}
      data-testid="shop-item"
      data-item={item.id}
      data-price={item.price}
      data-state={state}
    >
      <AvatarItemArt id={item.id} size={80} />
      <span className="font-display text-body-l font-semibold text-ink">{item.name}</span>
      <span className="flex items-center gap-1 font-display text-body font-medium text-ink-soft">
        {owned ? LABEL[state] : <><CoinIcon size={22} />{item.price}</>}
      </span>
    </button>
  );
}

/**
 * The Shop: six Avatar Items in three price tiers, bought with the Coins
 * Sessions earn, and the Theme every Story is set in. Nothing here touches
 * play; an Item is cosmetic and a Theme only dresses the Problems.
 */
export function Shop({ profile, identity }: { readonly profile: Profile; readonly identity: Identity }) {
  const { rewards } = profile;
  // The Streak as it stands today, not as it stood on the last Session's day.
  const streak = streakToday(rewards, new Date());
  const setTheme = (theme: ThemeId) =>
    profileStore.update((current) => ({ ...current, identity: current.identity && { ...current.identity, theme } }));

  return (
    <main className="learner-stage flex flex-col gap-6 px-gutter pt-8 pb-10" data-testid="shop">
      <header className="mx-auto flex w-full max-w-content items-center justify-between gap-6">
        <h1 className="font-display text-display-l font-semibold text-ink">Shop</h1>
        <div className="flex items-center gap-4">
          <StreakChip streak={streak} freezes={rewards.freezes} />
          <CoinChip coins={rewards.coins} />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-content grid-cols-[240px_minmax(0,1fr)] gap-8">
        <section className="flex flex-col items-center gap-3">
          <Avatar color={identity.avatarColor} worn={rewards.worn} size={200} />
          <p className="text-center font-text text-caption text-ink-soft">A hat, something to wear, and a pet.</p>
        </section>

        <section className="grid grid-cols-3 gap-4" aria-label="Avatar Items">
          {SHOP_ITEMS.map((item) => (
            <ShopCard key={item.id} item={item} state={itemState(rewards, item)} />
          ))}
        </section>
      </div>

      <section className="mx-auto flex w-full max-w-content flex-col gap-3" aria-label="Theme">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-display-s font-semibold text-ink">Stories</h2>
          <p className="font-text text-caption text-ink-soft">Pick where your Stories happen. The next Session is set there.</p>
        </div>
        <div className="flex gap-3" role="group" aria-label="Theme">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setTheme(theme.id)}
              aria-pressed={identity.theme === theme.id}
              className={`flex flex-1 flex-col items-center gap-1 rounded-chip bg-paper-2 px-1 pt-2 pb-1 font-display text-caption font-medium text-ink ${picked(identity.theme === theme.id)}`}
              data-testid="shop-theme"
              data-theme={theme.id}
            >
              <ThemeIcon theme={theme.id} size={44} />
              {theme.name}
            </button>
          ))}
        </div>
      </section>

      <Link href="/" className={`${bigButtonClasses("l", "paper")} mx-auto`}>
        Back to Ollie
      </Link>
    </main>
  );
}
