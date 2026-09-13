import { streakLine } from "@/play/lines";
import { MAX_FREEZES } from "@/rewards/rewards";

/** A Coin: a flat sun disc with the deep tone behind it, never a gradient. */
export function CoinIcon({ size = 28 }: { readonly size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <circle cx="17" cy="17" r="13" className="fill-sun-deep" />
      <circle cx="16" cy="15" r="13" className="fill-sun" />
      <circle cx="16" cy="15" r="7" className="fill-sun-deep" />
    </svg>
  );
}

/** The Streak's mark: a paper flame, cut out of the leaf the Streak is coloured with. */
export function StreakIcon({ size = 28 }: { readonly size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M16 3 C20 10 27 12 24 20 A9 9 0 0 1 8 20 C6 13 12 11 16 3 Z" className="fill-paper" />
      <path d="M16 14 C18 17 21 18 19 22 A4.5 4.5 0 0 1 12 22 C11 18 14 17 16 14 Z" className="fill-sun" />
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
