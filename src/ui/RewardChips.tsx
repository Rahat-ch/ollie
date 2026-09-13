import { streakLine } from "@/play/lines";
import { MAX_FREEZES } from "@/rewards/rewards";

/**
 * A Coin: a flat sun disc with the deep tone behind it, never a gradient.
 * The rim and the stamp are cut from the same deep tone, so the Coin still
 * reads where it sits on a sun chip as well as on paper.
 */
export function CoinIcon({ size = 28 }: { readonly size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <circle cx="17" cy="17" r="13" className="fill-sun-deep" />
      <circle cx="16" cy="15" r="13" className="fill-sun-deep" />
      <circle cx="16" cy="15" r="10.5" className="fill-sun" />
      <circle cx="16" cy="15" r="4.5" className="fill-sun-deep" />
    </svg>
  );
}

/**
 * The Streak's mark: a paper flame cut out of the leaf the Streak is
 * coloured with — a leaning tip, one lick up the near side, a sun heart.
 */
export function StreakIcon({ size = 28 }: { readonly size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M18 2C18 8 22 10 24 15C26 20 23 28 16 28C9 28 6 22 8 16C9 13 11 12 12 9C13 13 15 14 16 16C17 13 18 8 18 2Z" className="fill-paper" />
      <path d="M17 14C17 17 19 18 20 21C21 24 19 26.5 16 26.5C13 26.5 12 24 13 21.5C14 19.5 16 18 17 14Z" className="fill-sun" />
    </svg>
  );
}

const chip = "flex h-touch-parent items-center gap-2 rounded-pill px-4 font-display text-body-l font-semibold text-ink";

/** The Coins in hand, on every screen the Learner can spend them from. */
export function CoinChip({ coins }: { readonly coins: number }) {
  return (
    <div className={`${chip} bg-sun shadow-[0_3px_0_var(--sun-deep)]`} aria-label={`${coins} Coins`}>
      <CoinIcon />
      <span data-testid="coin-count">{coins}</span>
    </div>
  );
}

/** The Streak, with the Freezes in hand shown as the days they can cover. */
export function StreakChip({ streak, freezes }: { readonly streak: number; readonly freezes: number }) {
  return (
    <div
      className={`${chip} bg-leaf shadow-[0_3px_0_var(--leaf-deep)]`}
      aria-label={`${streakLine(streak)} in a row, ${freezes} ${freezes === 1 ? "Freeze" : "Freezes"} in hand`}
    >
      <StreakIcon />
      <span data-testid="streak-count">{streak}</span>
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: MAX_FREEZES }, (_, i) => (
          <span key={i} className={`size-2.5 rounded-pill ${i < freezes ? "bg-paper" : "bg-leaf-deep"}`} data-testid="freeze" />
        ))}
      </span>
    </div>
  );
}
