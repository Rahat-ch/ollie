"use client";

import { POWERS } from "@/loop";
import { Ollie } from "@/ollie/Ollie";
import type { OlliePose } from "@/ollie/poses.generated";
import { Milestone, PowerCard } from "@/app/play/Celebration";
import { AVATAR_COLORS, THEMES } from "@/profile/identity";
import { SHOP_ITEMS } from "@/rewards/shop";
import { Avatar } from "@/ui/Avatar";
import { AvatarItemArt } from "@/ui/AvatarItems";
import { PowerMark } from "@/ui/PowerMark";
import { CoinIcon, StreakIcon } from "@/ui/RewardChips";
import { ThemeIcon } from "@/ui/ThemeIcon";

/**
 * The side-by-side review harness. Not a route that ships: it exists so the
 * illustration pass can be looked at whole, and is serialised into
 * docs/design/review-2026-09-13.html.
 */

const POSES: readonly { pose: OlliePose; says: string }[] = [
  { pose: "idle", says: "Rest. Wings down, eyes centred, beak closed; breathing and blinking on a loop." },
  { pose: "talking", says: "One wing out a little, brows up, beak open: Ollie is reading the Problem aloud." },
  { pose: "celebrate", says: "Both wings straight up, happy lower lids, beak wide open." },
  { pose: "encourage", says: "Kind, never sad: soft upper lids, a small open beak, one wing raised to wave." },
  { pose: "count-on-flight", says: "Both wings up and out over three sky wing-beat arcs; looking up." },
  { pose: "make-ten-magic", says: "The left wing lifts a filled ten-frame chip; plum sparkles; looking up-left." },
  { pose: "missing-number-detective", says: "The right wing holds the glass; the left eye squints; looking up-right." },
  { pose: "story-solver", says: "Both wings inward around an open book; looking down, soft lids." },
];

const THEME_SAYS: Record<string, string> = {
  puppies: "A puppy, front on: long soft ears, a cream muzzle, a bone at its paw.",
  dinosaurs: "A round dinosaur with three back plates, looking up over its shoulder.",
  space: "A rocket climbing on a sun flame, with three paper stars.",
  ocean: "A fish with two fins and stripes, two bubbles, and an ink wave under it.",
  fairies: "A fairy with two berry wings, a cream dress, sun hair, and a wand.",
  trucks: "A tipper truck, side on, with a rust cab and ink wheels.",
};

function Panel({ title, note, children }: { readonly title: string; readonly note: string; readonly children: React.ReactNode }) {
  return (
    <section className="mb-12 rounded-card bg-paper-2 p-8 shadow-card">
      <h2 className="font-display text-display-m font-semibold text-ink">{title}</h2>
      <p className="mt-2 mb-6 max-w-200 font-text text-body text-ink-soft">{note}</p>
      {children}
    </section>
  );
}

function Tile({ caption, children }: { readonly caption: string; readonly children: React.ReactNode }) {
  return (
    <figure className="m-0 flex w-56 flex-col items-center gap-2">
      <div className="flex h-56 w-56 items-center justify-center rounded-card bg-paper">{children}</div>
      <figcaption className="text-center font-text text-caption text-ink-soft">{caption}</figcaption>
    </figure>
  );
}

export default function DesignReview() {
  const worn = (id: string, slot: string) => ({ hat: null, accessory: null, pet: null, [slot]: id });
  return (
    <main className="min-h-dvh bg-paper px-gutter py-12" data-testid="design-review">
      <h1 className="mb-2 font-display text-display-l font-semibold text-ink">Illustration pass, 2026-09-13</h1>
      <p className="mb-10 max-w-200 font-text text-body-l text-ink-soft">
        Every asset beside what the character sheet in docs/design/direction.md asks of it.
      </p>

      <Panel
        title="Ollie: four base states and four Power poses"
        note="An owl, front-facing, about as wide as tall. Body rust, belly cream, wings deep rust, beak and feet amber, eye ring white, iris deep teal, pupil ink. Same proportions and parts in every pose; only wing position, eye shape, brows, beak, and prop change."
      >
        <div className="flex flex-wrap gap-4">
          {POSES.map(({ pose, says }) => (
            <figure key={pose} className="m-0 w-56">
              <div className="flex h-56 w-56 items-center justify-center rounded-card bg-paper">
                <Ollie pose={pose} size={200} />
              </div>
              <figcaption className="pt-2 font-text text-caption text-ink-soft">
                <b className="text-ink">{pose}</b>
                <br />
                {says}
              </figcaption>
            </figure>
          ))}
          <figure className="m-0 w-56">
            <div className="flex h-56 w-56 items-center justify-center rounded-card bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element -- the project's own SVG */}
              <img src="/ollie/ollie-head.svg" alt="" width="180" height="180" />
            </div>
            <figcaption className="pt-2 font-text text-caption text-ink-soft">
              <b className="text-ink">head</b>
              <br />
              The head alone, for the favicon and the Path&apos;s current stop. Scaled from the pose geometry, so the beak and brows sit where they do on the body.
            </figcaption>
          </figure>
        </div>
      </Panel>

      <Panel
        title="The six Themes"
        note="One illustrated setting per Theme, in the Story card at 176px and in the Theme picker at 44px. The same drawing serves both sizes."
      >
        <div className="flex flex-wrap gap-4">
          {THEMES.map((theme) => (
            <figure key={theme.id} className="m-0 w-56">
              <div className="flex h-56 w-56 items-end justify-center gap-3 rounded-card bg-paper p-4">
                <ThemeIcon theme={theme.id} size={176} />
                <ThemeIcon theme={theme.id} size={44} />
              </div>
              <figcaption className="pt-2 font-text text-caption text-ink-soft">
                <b className="text-ink">{theme.name}</b>
                <br />
                {THEME_SAYS[theme.id]}
              </figcaption>
            </figure>
          ))}
        </div>
      </Panel>

      <Panel
        title="The Avatar: four colour bases"
        note="The Learner's own round creature, chosen by colour, with slots for a hat, an accessory, and a pet. Distinct from Ollie: round and eared where Ollie is tall and tufted."
      >
        <div className="flex flex-wrap gap-4">
          {AVATAR_COLORS.map((color) => (
            <Tile key={color.id} caption={color.name}>
              <Avatar color={color.id} size={180} label={`${color.name} Avatar`} />
            </Tile>
          ))}
        </div>
      </Panel>

      <Panel
        title="The six Avatar Items, on every base"
        note="A cosmetic bought with Coins and worn by the Avatar; never affects play. Each Item is drawn in the Avatar's own frame, so one drawing sits correctly on all four bases."
      >
        {SHOP_ITEMS.map((item) => (
          <div key={item.id} className="mb-6 flex flex-wrap items-center gap-4">
            <figure className="m-0 w-40">
              <div className="flex h-40 w-40 items-center justify-center rounded-card bg-paper">
                <AvatarItemArt id={item.id} size={120} />
              </div>
              <figcaption className="pt-2 font-text text-caption text-ink-soft">
                <b className="text-ink">{item.name}</b>
                <br />
                {item.slot} · {item.price} Coins
              </figcaption>
            </figure>
            {AVATAR_COLORS.map((color) => (
              <div key={color.id} className="flex size-40 items-center justify-center rounded-card bg-paper">
                <Avatar color={color.id} worn={worn(item.id, item.slot) as never} size={130} label={`${color.name} Avatar wearing ${item.name}`} />
              </div>
            ))}
          </div>
        ))}
      </Panel>

      <Panel
        title="The Power marks"
        note="One flat plum disc per Power, cut from the same parts as Ollie's pose for it: the wing beat, the ten-frame chip, the magnifying glass, the open book."
      >
        <div className="flex flex-wrap gap-4">
          {POWERS.map((power) => (
            <Tile key={power.id} caption={power.name}>
              <PowerMark power={power.id} size={150} />
            </Tile>
          ))}
        </div>
      </Panel>

      <Panel title="Coins and the Streak" note="A Coin is a flat sun disc; the Streak's mark is a paper flame cut out of the leaf the Streak is coloured with.">
        <div className="flex flex-wrap gap-4">
          <Tile caption="Coin">
            <CoinIcon size={150} />
          </Tile>
          <Tile caption="Streak">
            <span className="flex size-45 items-center justify-center rounded-card bg-leaf">
              <StreakIcon size={130} />
            </span>
          </Tile>
        </div>
      </Panel>

      <Panel
        title="The celebration and the milestone cards"
        note="A Power earned is the headline card of the Session that earned it. A Streak milestone fires once each at 3, 7, and 14 days. Both overshoot in once and are then still; both are in the reduced-motion block."
      >
        <div className="flex flex-col items-start gap-6">
          {POWERS.map((power) => (
            <PowerCard key={power.id} power={power} />
          ))}
          {[3, 7, 14].map((days) => (
            <Milestone key={days} days={days} />
          ))}
        </div>
      </Panel>
    </main>
  );
}
