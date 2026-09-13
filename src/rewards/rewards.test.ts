import { describe, expect, it } from "vitest";
import {
  awardSession,
  buyItem,
  COINS_PER_SESSION,
  itemState,
  localDay,
  MAX_FREEZES,
  MILESTONES,
  newRewards,
  streakToday,
  wearItem,
  type Rewards,
} from "./rewards";
import { SHOP_ITEMS, shopItem } from "./shop";

/** A fixed local-time date, so the Streak's day boundaries are the same on every machine. */
const at = (year: number, month: number, day: number, hour = 9): Date => new Date(year, month - 1, day, hour);

/** The nth Session, played to its end. */
const completed = (sessionNumber: number) => ({ sessionNumber, status: "complete" as const });

describe("what the Learner starts with", () => {
  it("has no Coins, no Streak, both Freezes, and nothing bought or worn", () => {
    expect(newRewards()).toEqual({
      coins: 0,
      lastSessionPaid: 0,
      streak: 0,
      lastSessionDay: null,
      freezes: 2,
      owned: [],
      worn: { hat: null, accessory: null, pet: null },
    });
    expect(COINS_PER_SESSION).toBe(10);
    expect(MAX_FREEZES).toBe(2);
    expect(MILESTONES).toEqual([3, 7, 14]);
  });
});

describe("Coins", () => {
  it("pays ten Coins for a completed Session, whatever the answers were", () => {
    const award = awardSession(newRewards(), completed(1), at(2026, 9, 13));
    expect(award.coins).toBe(10);
    expect(award.rewards.coins).toBe(10);
  });

  it("pays a Session's Coins once, however often the celebration is asked for them", () => {
    const first = awardSession(newRewards(), completed(1), at(2026, 9, 13));
    const again = awardSession(first.rewards, completed(1), at(2026, 9, 13, 11));
    expect(again.coins).toBe(0);
    expect(again.rewards.coins).toBe(10);
  });

  it("pays the next Session too, so two Sessions in one day are twenty Coins", () => {
    const first = awardSession(newRewards(), completed(1), at(2026, 9, 13));
    const second = awardSession(first.rewards, completed(2), at(2026, 9, 13, 18));
    expect(second.coins).toBe(10);
    expect(second.rewards.coins).toBe(20);
  });

  it("pays nothing for a Session that was not played to its end", () => {
    const abandoned = awardSession(newRewards(), { sessionNumber: 1, status: "abandoned" }, at(2026, 9, 13));
    expect(abandoned.coins).toBe(0);
    expect(abandoned.rewards).toEqual(newRewards());
    const unfinished = awardSession(newRewards(), { sessionNumber: 1, status: "in-progress" }, at(2026, 9, 13));
    expect(unfinished.rewards.streak).toBe(0);
  });
});

/** Play a Session on each of these days in turn, one Session a day, from a fresh Profile. */
function playOn(days: readonly Date[], from: Rewards = newRewards()): Rewards {
  return days.reduce((rewards, day, i) => awardSession(rewards, completed(i + 1), day).rewards, from);
}

describe("the Streak", () => {
  it("counts the day of the first completed Session", () => {
    const award = awardSession(newRewards(), completed(1), at(2026, 9, 13, 23));
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

  it("keeps the later day when the device clock goes back, so replaying the first day cannot count twice", () => {
    const twoDays = playOn([at(2026, 9, 12), at(2026, 9, 13)]);
    const backwards = awardSession(twoDays, completed(3), at(2026, 9, 12, 20));
    expect(backwards.coins).toBe(10);
    expect(backwards.rewards.streak).toBe(2);
    expect(backwards.rewards.lastSessionDay).toBe("2026-09-13");
    // The real next day still counts once, as the day after the later one.
    expect(awardSession(backwards.rewards, completed(4), at(2026, 9, 14)).rewards.streak).toBe(3);
  });
});

describe("the Streak as it stands today", () => {
  const rewards = playOn([at(2026, 9, 11), at(2026, 9, 12), at(2026, 9, 13)]);

  it("is what was counted while the days it missed can still be covered", () => {
    expect(streakToday(rewards, at(2026, 9, 13, 20))).toBe(3);
    expect(streakToday(rewards, at(2026, 9, 14))).toBe(3);
    expect(streakToday(rewards, at(2026, 9, 16))).toBe(3);
  });

  it("is nothing once more days are missed than the Freezes in hand can cover", () => {
    expect(streakToday(rewards, at(2026, 9, 17))).toBe(0);
    expect(streakToday({ ...rewards, freezes: 0 }, at(2026, 9, 15))).toBe(0);
    expect(streakToday(newRewards(), at(2026, 9, 13))).toBe(0);
  });

  it("does not change the rewards it reads", () => {
    const before = JSON.stringify(rewards);
    streakToday(rewards, at(2026, 9, 20));
    expect(JSON.stringify(rewards)).toBe(before);
  });
});

describe("a Freeze on a missed day", () => {
  it("is consumed to carry the Streak over one missed day", () => {
    const before = playOn([at(2026, 9, 10), at(2026, 9, 11), at(2026, 9, 12)]);
    expect(before.freezes).toBe(2);
    const award = awardSession(before, completed(4), at(2026, 9, 14));
    expect(award.freezesUsed).toBe(1);
    expect(award.rewards.freezes).toBe(1);
    expect(award.rewards.streak).toBe(4);
  });

  it("is consumed one per missed day, so two missed days cost both Freezes", () => {
    const before = playOn([at(2026, 9, 1), at(2026, 9, 2), at(2026, 9, 3), at(2026, 9, 4)]);
    const award = awardSession(before, completed(5), at(2026, 9, 7));
    expect(award.freezesUsed).toBe(2);
    expect(award.rewards.freezes).toBe(0);
    expect(award.rewards.streak).toBe(5);
  });

  it("resets the Streak to today when none is held to cover the missed day", () => {
    const days = [at(2026, 9, 1), at(2026, 9, 2), at(2026, 9, 3), at(2026, 9, 4)];
    const carried = awardSession(playOn(days), completed(5), at(2026, 9, 7)).rewards;
    expect(carried.freezes).toBe(0);
    const award = awardSession(carried, completed(6), at(2026, 9, 9));
    expect(award.freezesUsed).toBe(0);
    expect(award.rewards.streak).toBe(1);
  });

  it("resets the Streak, and keeps the Freezes held, when more days are missed than they can cover", () => {
    const before = playOn([at(2026, 9, 11), at(2026, 9, 12)]);
    const award = awardSession(before, completed(3), at(2026, 9, 16));
    expect(award.freezesUsed).toBe(0);
    expect(award.rewards.freezes).toBe(2);
    expect(award.rewards.streak).toBe(1);
  });
});

describe("milestones", () => {
  const daysFrom = (start: number, count: number): Date[] =>
    Array.from({ length: count }, (_, i) => at(2026, 9, start + i));

  it("fires on the day the Streak reaches three, seven, and fourteen, and on no other day", () => {
    const fired = daysFrom(1, 16).reduce<{ rewards: Rewards; days: number[] }>(
      ({ rewards, days }, day, i) => {
        const award = awardSession(rewards, completed(i + 1), day);
        return { rewards: award.rewards, days: award.milestone === null ? days : [...days, award.milestone] };
      },
      { rewards: newRewards(), days: [] },
    );
    expect(fired.days).toEqual([3, 7, 14]);
    expect(fired.rewards.streak).toBe(16);
  });

  it("fires once for the day it is reached, so a second Session that evening does not fire it again", () => {
    const third = awardSession(playOn(daysFrom(1, 2)), completed(3), at(2026, 9, 3, 9));
    expect(third.milestone).toBe(3);
    const evening = awardSession(third.rewards, completed(4), at(2026, 9, 3, 19));
    expect(evening.rewards.streak).toBe(3);
    expect(evening.milestone).toBeNull();
  });

  it("fires again when a Streak that was lost is built back up to three", () => {
    const lost = awardSession(playOn(daysFrom(1, 3)), completed(4), at(2026, 9, 10)).rewards;
    expect(lost.streak).toBe(1);
    const rebuilt = awardSession(awardSession(lost, completed(5), at(2026, 9, 11)).rewards, completed(6), at(2026, 9, 12));
    expect(rebuilt.rewards.streak).toBe(3);
    expect(rebuilt.milestone).toBe(3);
  });

  it("hands a Freeze back at a milestone, never more than the two the Learner can hold", () => {
    const spent = awardSession(playOn(daysFrom(1, 4)), completed(5), at(2026, 9, 6)).rewards;
    expect(spent.freezes).toBe(1);
    expect(spent.streak).toBe(5);
    const milestone = awardSession(awardSession(spent, completed(6), at(2026, 9, 7)).rewards, completed(7), at(2026, 9, 8));
    expect(milestone.milestone).toBe(7);
    expect(milestone.rewards.freezes).toBe(2);
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

  it("says of each Item whether it is worn, owned, affordable, or still being saved up for", () => {
    const earned = playOn([at(2026, 9, 12), at(2026, 9, 13)]);
    expect(itemState(earned, shopItem("party-hat"))).toBe("affordable");
    expect(itemState(earned, shopItem("gold-crown"))).toBe("saving-up");
    const bought = buyItem(earned, "party-hat");
    expect(itemState(bought, shopItem("party-hat"))).toBe("worn");
    expect(itemState(wearItem(bought, "party-hat"), shopItem("party-hat"))).toBe("owned");
    expect(itemState(bought, shopItem("stripy-scarf"))).toBe("affordable");
    expect(itemState(bought, shopItem("round-glasses"))).toBe("saving-up");
  });
});
