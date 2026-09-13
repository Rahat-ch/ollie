/**
 * The effort rewards, as plain data and pure functions: Coins for finishing
 * a Session, the Streak of days with one, and the Freezes that carry it over
 * a missed day. Everything here lives in the Profile on the device (ADR
 * 0002); nothing about it is sent anywhere and nothing about it touches the
 * math, which is the Loop's (ADR 0001).
 */
import { AVATAR_SLOTS, shopItem, type AvatarItem, type AvatarItemId, type AvatarSlot } from "./shop";

/** Ten Coins for every completed Session, for effort, whatever the answers were. */
export const COINS_PER_SESSION = 10;

/** A day by the device's local time, as `2026-09-13`; the Streak counts these. */
export type Day = string;

export type Rewards = {
  readonly coins: number;
  /** The number of the last Session that paid its Coins, so none pays twice. */
  readonly lastSessionPaid: number;
  /** Days in a row with a completed Session, as counted on `lastSessionDay`. */
  readonly streak: number;
  /** The day of the last completed Session, or null before the first. */
  readonly lastSessionDay: Day | null;
  /** Freezes in hand, at most MAX_FREEZES; one covers one missed day. */
  readonly freezes: number;
  /** The Avatar Items bought, in the order they were bought. Buying is the only way Coins go down. */
  readonly owned: readonly AvatarItemId[];
  /** The Item worn in each slot, or null for an empty slot. */
  readonly worn: Readonly<Record<AvatarSlot, AvatarItemId | null>>;
};

/** The Learner holds at most two Freezes, and starts with both. */
export const MAX_FREEZES = 2;

/** The Streak lengths that are an event: each is celebrated on the day it is reached. */
export const MILESTONES: readonly number[] = [3, 7, 14];

const emptySlots = (): Rewards["worn"] =>
  Object.fromEntries(AVATAR_SLOTS.map((slot) => [slot, null])) as Rewards["worn"];

export function newRewards(): Rewards {
  return {
    coins: 0,
    lastSessionPaid: 0,
    streak: 0,
    lastSessionDay: null,
    freezes: MAX_FREEZES,
    owned: [],
    worn: emptySlots(),
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

/** Days with no Session between the last one and `day`; negative when `day` is not after it. */
const daysMissed = (lastSessionDay: Day, day: Day): number => daysBetween(lastSessionDay, day) - 1;

/**
 * The Streak as it stands on `at`: what was counted while the days missed
 * since can still be covered by the Freezes in hand, and nothing once they
 * cannot, which is what a screen shows. A read, never a change: the Streak
 * is only rewritten by a completed Session.
 */
export function streakToday(rewards: Rewards, at: Date): number {
  const { lastSessionDay, streak, freezes } = rewards;
  if (lastSessionDay === null) return 0;
  return daysMissed(lastSessionDay, localDay(at)) > freezes ? 0 : streak;
}

/** The Session a Learner has just played, as the rewards need it. */
export type PlayedSession = {
  /** 1-based count of Sessions including this one; a Session pays once. */
  readonly sessionNumber: number;
  readonly status: "in-progress" | "complete" | "abandoned";
};

/** What one completed Session earned, for the celebration to show. */
export type Award = {
  readonly rewards: Rewards;
  /** The Coins this Session paid. */
  readonly coins: number;
  /** Freezes spent to carry the Streak over the days missed since the last Session. */
  readonly freezesUsed: number;
  /** The milestone the Streak reached on this day, for its animation, or null. */
  readonly milestone: number | null;
};

/**
 * The Streak after a Session on `day`, given the day of the last one. A
 * missed day is covered by a Freeze, one Freeze per day missed; when the
 * Freezes in hand cannot cover them all the Streak starts again at today,
 * and the Freezes are kept, since a Freeze that saved nothing is not spent.
 * A day that is not after the last one (the same day, or a clock put back)
 * leaves the Streak where it is.
 */
function extendStreak(rewards: Rewards, day: Day): { streak: number; freezes: number; freezesUsed: number } {
  const { streak, freezes, lastSessionDay } = rewards;
  if (lastSessionDay === null) return { streak: 1, freezes, freezesUsed: 0 };
  const missed = daysMissed(lastSessionDay, day);
  if (missed < 0) return { streak, freezes, freezesUsed: 0 };
  if (missed === 0) return { streak: streak + 1, freezes, freezesUsed: 0 };
  if (missed > freezes) return { streak: 1, freezes, freezesUsed: 0 };
  return { streak: streak + 1, freezes: freezes - missed, freezesUsed: missed };
}

const nothingEarned = (rewards: Rewards): Award => ({ rewards, coins: 0, freezesUsed: 0, milestone: null });

/**
 * The rewards after a Session played to its end, by the device's local time
 * on the day it was completed. Coins are paid once per Session and never
 * taken away; the only way they go down is buying an Avatar Item in the
 * Shop. A Session still in progress or abandoned earns nothing.
 */
export function awardSession(rewards: Rewards, session: PlayedSession, at: Date): Award {
  if (session.status !== "complete" || session.sessionNumber <= rewards.lastSessionPaid) return nothingEarned(rewards);
  const day = localDay(at);
  const { streak, freezes, freezesUsed } = extendStreak(rewards, day);
  // The milestone belongs to the day the Streak reaches it: a second Session
  // that evening leaves the Streak where it is and fires nothing.
  const milestone = streak !== rewards.streak && MILESTONES.includes(streak) ? streak : null;
  return {
    rewards: {
      ...rewards,
      coins: rewards.coins + COINS_PER_SESSION,
      lastSessionPaid: session.sessionNumber,
      streak,
      // A clock put back keeps the later day, so replaying it cannot count twice.
      lastSessionDay: rewards.lastSessionDay !== null && day < rewards.lastSessionDay ? rewards.lastSessionDay : day,
      // A milestone hands a Freeze back, so a Streak kept up earns its own protection.
      freezes: milestone === null ? freezes : Math.min(MAX_FREEZES, freezes + 1),
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

/** Where an Item stands with this Learner, which is what the Shop's card offers her. */
export type ItemState = "worn" | "owned" | "affordable" | "saving-up";

export function itemState(rewards: Rewards, item: AvatarItem): ItemState {
  if (rewards.worn[item.slot] === item.id) return "worn";
  if (rewards.owned.includes(item.id)) return "owned";
  return rewards.coins >= item.price ? "affordable" : "saving-up";
}
