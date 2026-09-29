/**
 * The daily spend cap on the live model routes (decisions.md #29): $5 a day,
 * summed from the telemetry's per-call cost, reset at midnight UTC. Past it,
 * every model route answers as a model it could not reach (503), so the
 * device plays on with the Baseline Plan, the template Summary and the
 * template Story, and speaks with the bundled lines and platform speech.
 *
 * Ollie's voice spends ElevenLabs characters, not Anthropic dollars, and the
 * telemetry has no price for a character (it depends on the plan the owner
 * is on), so the speech route has its own daily allowance, counted in
 * characters sent to be rendered. A line already on the volume costs
 * nothing and is always served. Renders also stop when the dollar cap is
 * reached, so past $5 the live app spends on no vendor at all until
 * midnight UTC.
 *
 * One container serves the app, so memory is enough: a restart forgets the
 * day's spend, which is at most one more day's cap. The check is made
 * before a call and the cost is added after it, so calls already in flight
 * when the cap is reached can take the day a few cents past it.
 */
import { callDollars, callTokens, MODEL_PRICES, type ModelCall, type Telemetry } from "@/generation/telemetry";

/** Dollars a day on the Anthropic-backed routes: the Coach, the Summary and the Story writer. */
export const DAILY_SPEND_CAP_DOLLARS = 5;

/**
 * Characters a day sent to ElevenLabs to be rendered. A Story is under 400
 * characters and usually about 90, so this is some hundred new Story lines a
 * day: well above a normal day's play, well below a plan's monthly quota.
 */
export const DAILY_SPEECH_CHARACTERS = 20_000;

/** An amount a day may spend, counted within one UTC day and forgotten at the next midnight UTC. */
export type DailyAllowance = {
  readonly spend: (amount: number) => void;
  /** What today (UTC) has spent so far. */
  readonly spent: () => number;
  /** True once today's spend has reached the limit. */
  readonly exhausted: () => boolean;
};

export type DailyAllowanceOptions = {
  readonly limit: number;
  /** The clock; tests pass their own. */
  readonly now?: () => Date;
};

/** The UTC calendar day an instant falls in. */
const utcDay = (at: Date): string => at.toISOString().slice(0, 10);

export function dailyAllowance({ limit, now = () => new Date() }: DailyAllowanceOptions): DailyAllowance {
  let day = utcDay(now());
  let total = 0;
  /** Today's total, started again from nothing when the UTC day has turned. */
  const today = (): number => {
    const current = utcDay(now());
    if (current !== day) {
      day = current;
      total = 0;
    }
    return total;
  };
  return {
    spend: (amount) => {
      total = today() + amount;
    },
    spent: today,
    exhausted: () => today() >= limit,
  };
}

/** The dearest per-million rate in the table: what an unpriced token is counted at. */
const DEAREST_RATE = Math.max(...Object.values(MODEL_PRICES).flatMap((price) => [price.input, price.output]));

/**
 * What a call counts against the cap: the telemetry's estimate, or, for a
 * model with no published rate, every token it moved at the dearest rate
 * in the table. The cap errs high, never low.
 */
export function cappedDollars(call: ModelCall): number {
  const estimate = callDollars(call);
  if (estimate !== null) return estimate;
  return (callTokens(call) * DEAREST_RATE) / 1_000_000;
}

/** A recorder that adds what each call cost to the allowance, handed to the adapter the routes build. */
export const spendTelemetry = (allowance: DailyAllowance): Telemetry => ({
  record: (call) => allowance.spend(cappedDollars(call)),
});

// Kept on globalThis, not in module scope, so every route shares the one
// count however the server's bundles load this module.
const SHARED = Symbol.for("ollie.spend-cap");

type Shared = { readonly dollars: DailyAllowance; readonly speechCharacters: DailyAllowance };

function shared(): Shared {
  const store = globalThis as typeof globalThis & { [SHARED]?: Shared };
  store[SHARED] ??= {
    dollars: dailyAllowance({ limit: DAILY_SPEND_CAP_DOLLARS }),
    speechCharacters: dailyAllowance({ limit: DAILY_SPEECH_CHARACTERS }),
  };
  return store[SHARED];
}

/** Today's Anthropic spend on this server. */
export const modelSpend = (): DailyAllowance => shared().dollars;

/** Today's ElevenLabs characters on this server. */
export const speechCharacters = (): DailyAllowance => shared().speechCharacters;

/** What a route past the cap answers with, as a 503: the device's "could not reach it". */
export const CAP_REACHED = "Ollie's daily model budget is spent; the live models are back at midnight UTC";
