import { describe, expect, it } from "vitest";
import { awardSession, buyItem, COINS_PER_SESSION, localDay, MAX_FREEZES, MILESTONES, newRewards, wearItem, type Rewards } from "./rewards";
import { SHOP_ITEMS } from "./shop";

/** A fixed local-time date, so the Streak's day boundaries are the same on every machine. */
const at = (year: number, month: number, day: number, hour = 9): Date => new Date(year, month - 1, day, hour);

describe("Coins", () => {
  it("pays ten Coins for a completed Session, whatever the answers were", () => {
    const award = awardSession(newRewards(), 1, at(2026, 9, 13));
    expect(award.coins).toBe(COINS_PER_SESSION);
    expect(award.rewards.coins).toBe(10);
  });

  it("pays a Session's Coins once, however often the celebration is asked for them", () => {
    const first = awardSession(newRewards(), 1, at(2026, 9, 13));
    const again = awardSession(first.rewards, 1, at(2026, 9, 13, 11));
    expect(again.coins).toBe(0);
    expect(again.rewards.coins).toBe(10);
  });

  it("pays the next Session too, so two Sessions in one day are twenty Coins", () => {
    const first = awardSession(newRewards(), 1, at(2026, 9, 13));
    const second = awardSession(first.rewards, 2, at(2026, 9, 13, 18));
    expect(second.coins).toBe(10);
    expect(second.rewards.coins).toBe(20);
  });
});

/** Play a Session on each of these days in turn, one Session a day, from a fresh Profile. */
function playOn(days: readonly Date[], from: Rewards = newRewards()): Rewards {
  return days.reduce((rewards, day, i) => awardSession(rewards, i + 1, day).rewards, from);
}

describe("the Streak", () => {
  it("counts the day of the first completed Session", () => {
    const award = awardSession(newRewards(), 1, at(2026, 9, 13, 23));
    expect(award.rewards.streak).toBe(1);
    expect(award.rewards.lastSessionDay).toBe("2026-09-13");
  });

  it("grows by one on each following day", () => {
    const rewards = playOn([at(2026, 9, 11), at(2026, 9, 12), at(2026, 9, 13)]);
    expect(rewards.streak).toBe(3);
  });

  it("does not count a second Session on the same day twice", () => {
    const rewards = playOn([at(2026, 9, 12, 8), at(2026, 9, 12, 19), at(2026, 9, 13, 7)]);
    expect(rewards.streak).toBe(2);
    expect(rewards.coins).toBe(30);
  });

  it("takes the day from the device's local time, so late-evening play is that day and not the next", () => {
    expect(localDay(at(2026, 12, 31, 23))).toBe("2026-12-31");
    expect(localDay(at(2027, 1, 1, 0))).toBe("2027-01-01");
  });
});

describe("a Freeze on a missed day", () => {
  it("is consumed to carry the Streak over one missed day", () => {
    const before = playOn([at(2026, 9, 10), at(2026, 9, 11), at(2026, 9, 12)]);
    expect(before.freezes).toBe(MAX_FREEZES);
    const award = awardSession(before, 4, at(2026, 9, 14));
    expect(award.freezesUsed).toBe(1);
    expect(award.rewards.freezes).toBe(MAX_FREEZES - 1);
    expect(award.rewards.streak).toBe(4);
  });

  it("is consumed one per missed day, so two missed days cost both Freezes", () => {
    const before = playOn([at(2026, 9, 1), at(2026, 9, 2), at(2026, 9, 3), at(2026, 9, 4)]);
    const award = awardSession(before, 5, at(2026, 9, 7));
    expect(award.freezesUsed).toBe(2);
    expect(award.rewards.freezes).toBe(0);
    expect(award.rewards.streak).toBe(5);
  });

  it("resets the Streak to today when none is held to cover the missed day", () => {
    const days = [at(2026, 9, 1), at(2026, 9, 2), at(2026, 9, 3), at(2026, 9, 4)];
    const carried = awardSession(playOn(days), 5, at(2026, 9, 7)).rewards;
    expect(carried.freezes).toBe(0);
    const award = awardSession(carried, 6, at(2026, 9, 9));
    expect(award.freezesUsed).toBe(0);
    expect(award.rewards.streak).toBe(1);
  });

  it("resets the Streak, and keeps the Freezes held, when more days are missed than they can cover", () => {
    const before = playOn([at(2026, 9, 11), at(2026, 9, 12)]);
    const award = awardSession(before, 3, at(2026, 9, 16));
    expect(award.freezesUsed).toBe(0);
    expect(award.rewards.freezes).toBe(MAX_FREEZES);
    expect(award.rewards.streak).toBe(1);
  });
});

describe("milestones", () => {
  const daysFrom = (start: number, count: number): Date[] =>
    Array.from({ length: count }, (_, i) => at(2026, 9, start + i));

  it("fires at three, seven, and fourteen days, and on no other day", () => {
    const fired = daysFrom(1, 16).reduce<{ rewards: Rewards; days: number[] }>(
      ({ rewards, days }, day, i) => {
        const award = awardSession(rewards, i + 1, day);
        return { rewards: award.rewards, days: award.milestone === null ? days : [...days, award.milestone] };
      },
      { rewards: newRewards(), days: [] },
    );
    expect(fired.days).toEqual(MILESTONES);
    expect(fired.rewards.streak).toBe(16);
  });

  it("fires each milestone once, so a Streak that resets and climbs again does not fire three twice", () => {
    const first = playOn(daysFrom(1, 3));
    expect(first.milestonesSeen).toEqual([3]);
    const afterGap = awardSession(first, 4, at(2026, 9, 10)).rewards;
    expect(afterGap.streak).toBe(1);
    const again = awardSession(awardSession(afterGap, 5, at(2026, 9, 11)).rewards, 6, at(2026, 9, 12));
    expect(again.rewards.streak).toBe(3);
    expect(again.milestone).toBeNull();
  });

  it("hands a Freeze back at a milestone, never more than the two the Learner can hold", () => {
    const spent = awardSession(playOn(daysFrom(1, 4)), 5, at(2026, 9, 6)).rewards;
    expect(spent.freezes).toBe(MAX_FREEZES - 1);
    expect(spent.streak).toBe(5);
    const milestone = awardSession(awardSession(spent, 6, at(2026, 9, 7)).rewards, 7, at(2026, 9, 8));
    expect(milestone.milestone).toBe(7);
    expect(milestone.rewards.freezes).toBe(MAX_FREEZES);
  });
});

describe("the Shop", () => {
  it("sells six Avatar Items at ten, thirty, and seventy Coins, across the hat, accessory, and pet slots", () => {
    expect(SHOP_ITEMS).toHaveLength(6);
    expect(SHOP_ITEMS.map((item) => item.price)).toEqual([10, 10, 30, 30, 70, 70]);
    expect([...new Set(SHOP_ITEMS.map((item) => item.slot))].sort()).toEqual(["accessory", "hat", "pet"]);
  });

  it("spends the Coins, keeps the Item, and wears it", () => {
    const earned = playOn([at(2026, 9, 12), at(2026, 9, 13)]);
    const bought = buyItem(earned, "party-hat");
    expect(bought.coins).toBe(10);
    expect(bought.owned).toEqual(["party-hat"]);
    expect(bought.worn.hat).toBe("party-hat");
  });

  it("leaves the Learner as she was when the Coins do not reach the price, or the Item is already hers", () => {
    const earned = playOn([at(2026, 9, 13)]);
    expect(buyItem(earned, "gold-crown")).toEqual(earned);
    const bought = buyItem(earned, "party-hat");
    expect(buyItem(bought, "party-hat")).toEqual(bought);
  });

  it("wears one Item per slot, so a second hat replaces the first and both stay bought", () => {
    const earned = playOn(Array.from({ length: 8 }, (_, i) => at(2026, 9, 1 + i)));
    expect(earned.coins).toBe(80);
    const both = buyItem(buyItem(earned, "party-hat"), "gold-crown");
    expect(both.coins).toBe(0);
    expect(both.owned).toEqual(["party-hat", "gold-crown"]);
    expect(both.worn.hat).toBe("gold-crown");
  });

  it("takes an Item off and puts it back on, and never wears one the Learner does not own", () => {
    const bought = buyItem(playOn([at(2026, 9, 13)]), "stripy-scarf");
    expect(bought.worn.accessory).toBe("stripy-scarf");
    const off = wearItem(bought, "stripy-scarf");
    expect(off.worn.accessory).toBeNull();
    expect(wearItem(off, "stripy-scarf").worn.accessory).toBe("stripy-scarf");
    expect(wearItem(off, "gold-crown")).toEqual(off);
  });
});
