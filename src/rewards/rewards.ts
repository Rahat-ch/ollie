/**
 * The effort rewards, as plain data and pure functions: Coins for finishing
 * a Session, the Streak of days with one, and the Freezes that carry it over
 * a missed day. Everything here lives in the Profile on the device (ADR
 * 0002); nothing about it is sent anywhere and nothing about it touches the
 * math, which is the Loop's (ADR 0001).
 */
import { shopItem, type AvatarItemId, type AvatarSlot } from "./shop";

/** Ten Coins for every completed Session, for effort, whatever the answers were. */
export const COINS_PER_SESSION = 10;

/** A day by the device's local time, as `2026-09-13`; the Streak counts these. */
export type Day = string;

export type Rewards = {
  readonly coins: number;
  /** The number of the last completed Session that paid its Coins, so none pays twice. */
  readonly sessionsAwarded: number;
  /** Days in a row with a completed Session, counting today. */
  readonly streak: number;
  /** The day of the last completed Session, or null before the first. */
  readonly lastSessionDay: Day | null;
  /** Freezes in hand, at most MAX_FREEZES; one covers one missed day. */
  readonly freezes: number;
  /** The milestones whose animation has been seen, so each one is an event only once. */
  readonly milestonesSeen: readonly number[];
  /** The Avatar Items bought, in the order they were bought. Buying is the only way Coins go down. */
  readonly owned: readonly AvatarItemId[];
  /** The Item worn in each slot, or null for an empty slot. */
  readonly worn: Readonly<Record<AvatarSlot, AvatarItemId | null>>;
};

/** The Learner holds at most two Freezes, and starts with both. */
export const MAX_FREEZES = 2;

/** The Streak lengths that are an event, each celebrated once. */
export const MILESTONES: readonly number[] = [3, 7, 14];

export function newRewards(): Rewards {
  return {
    coins: 0,
    sessionsAwarded: 0,
    streak: 0,
    lastSessionDay: null,
    freezes: MAX_FREEZES,
    milestonesSeen: [],
    owned: [],
    worn: { hat: null, accessory: null, pet: null },
  };
}

const pad = (n: number): string => String(n).padStart(2, "0");

/** The day a moment falls on by the device's local time, never UTC: play at 23:00 belongs to that day. */
export function localDay(at: Date): Day {
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

const MS_PER_DAY = 86_400_000;

/** Whole days from one local day to a later one; 1 means the very next day. */
function daysBetween(from: Day, to: Day): number {
  const utc = (day: Day): number => Date.parse(`${day}T00:00:00Z`);
  return Math.round((utc(to) - utc(from)) / MS_PER_DAY);
}

/** What one completed Session earned, for the celebration to show. */
export type Award = {
  readonly rewards: Rewards;
  /** The Coins this Session paid. */
  readonly coins: number;
  /** Freezes spent to carry the Streak over the days missed since the last Session. */
  readonly freezesUsed: number;
  /** The milestone this Session reached for the first time, for its animation, or null. */
  readonly milestone: number | null;
};

/**
 * The Streak after a Session on `day`, given the day of the last one. A
 * missed day is covered by a Freeze, one Freeze per day missed; when the
 * Freezes in hand cannot cover them all the Streak starts again at today,
 * and the Freezes are kept, since a Freeze that saved nothing is not spent.
 */
function extendStreak(rewards: Rewards, day: Day): { streak: number; freezes: number; freezesUsed: number } {
  const { streak, freezes, lastSessionDay } = rewards;
  if (lastSessionDay === null) return { streak: 1, freezes, freezesUsed: 0 };
  const missed = daysBetween(lastSessionDay, day) - 1;
  if (missed < 0) return { streak, freezes, freezesUsed: 0 };
  if (missed === 0) return { streak: streak + 1, freezes, freezesUsed: 0 };
  if (missed > freezes) return { streak: 1, freezes, freezesUsed: 0 };
  return { streak: streak + 1, freezes: freezes - missed, freezesUsed: missed };
}

/**
 * The rewards after a completed Session, by the device's local time. Coins
 * are paid once per Session and never taken away; the only way they go down
 * is buying an Avatar Item in the Shop.
 */
export function awardSession(rewards: Rewards, sessionNumber: number, at: Date): Award {
  if (sessionNumber <= rewards.sessionsAwarded) return { rewards, coins: 0, freezesUsed: 0, milestone: null };
  const day = localDay(at);
  const { streak, freezes, freezesUsed } = extendStreak(rewards, day);
  const milestone = MILESTONES.includes(streak) && !rewards.milestonesSeen.includes(streak) ? streak : null;
  return {
    rewards: {
      ...rewards,
      coins: rewards.coins + COINS_PER_SESSION,
      sessionsAwarded: sessionNumber,
      streak,
      lastSessionDay: day,
      // A milestone hands a Freeze back, so a Streak kept up earns its own protection.
      freezes: milestone === null ? freezes : Math.min(MAX_FREEZES, freezes + 1),
      milestonesSeen: milestone === null ? rewards.milestonesSeen : [...rewards.milestonesSeen, milestone],
    },
    coins: COINS_PER_SESSION,
    freezesUsed,
    milestone,
  };
}

/**
 * Buy an Avatar Item and wear it. Spending in the Shop is the only thing
 * that takes Coins away: nothing in play, and no wrong answer, ever costs
 * one. Coins short of the price, or an Item already owned, changes nothing.
 */
export function buyItem(rewards: Rewards, id: AvatarItemId): Rewards {
  const item = shopItem(id);
  if (rewards.owned.includes(id) || rewards.coins < item.price) return rewards;
  return {
    ...rewards,
    coins: rewards.coins - item.price,
    owned: [...rewards.owned, id],
    worn: { ...rewards.worn, [item.slot]: id },
  };
}

/** Wear an Item the Learner owns, or take it off again; one Item to a slot. */
export function wearItem(rewards: Rewards, id: AvatarItemId): Rewards {
  const item = shopItem(id);
  if (!rewards.owned.includes(id)) return rewards;
  const worn = rewards.worn[item.slot] === id ? null : id;
  return { ...rewards, worn: { ...rewards.worn, [item.slot]: worn } };
}
