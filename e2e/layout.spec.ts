/**
 * The Session stage, measured on the device. Every assertion here is a box
 * the Learner could point at — where the visual is, where the pad is, how
 * big a key is — never a class name or a CSS value, so the layout may be
 * rewritten as long as the screen still holds together. The WebKit projects
 * in playwright.config.ts run this at the nine real iPad viewports from
 * docs/research/ipad-layout.md §2; the Chromium projects run it too.
 */
import { COUNTING_ON_PROFILE, DIAGNOSTIC_PROFILE, UNIT_3_PROFILE, asked, key, openParentArea, playSession, seedRewards, writeProfile } from "./play";
import { expect, test, type Page } from "./test";

/** The page gutter, `--gutter` in src/app/tokens.css: the least space allowed between two things. */
const GUTTER = 32;

/** Apple's floor for a hit region, HIG Buttons: 44×44 pt. */
const TOUCH_FLOOR = 44;

/** What the design asks of a pad key: the Learner's touch target, opened up on a tall screen but never past this. */
const KEY = { min: 64, max: 72 };

/** Ollie's own ground under his bubble, from the size budget in docs/research/ipad-layout.md §3. */
const OLLIE = { min: 240, max: 280 };

type Box = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

async function boxOf(page: Page, selector: string): Promise<Box> {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  const box = await element.boundingBox();
  if (!box) throw new Error(`no box for ${selector}`);
  return box;
}

/**
 * How far apart two boxes are: the widest clear channel between them on
 * either axis. Negative means they overlap on both axes, which is the
 * crossover the Learner saw — counters drawn under the keys she taps.
 */
function clearance(a: Box, b: Box): number {
  const horizontal = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width));
  const vertical = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height));
  return Math.max(horizontal, vertical);
}

const viewport = (page: Page) => page.viewportSize()!;

/** Nothing the Learner is meant to see may sit outside the screen. */
function expectOnScreen(box: Box, size: { width: number; height: number }, what: string) {
  expect(box.x, `${what} starts off the left edge`).toBeGreaterThanOrEqual(-0.5);
  expect(box.x + box.width, `${what} runs past the right edge`).toBeLessThanOrEqual(size.width + 0.5);
  expect(box.y, `${what} starts above the top edge`).toBeGreaterThanOrEqual(-0.5);
  expect(box.y + box.height, `${what} runs past the bottom edge`).toBeLessThanOrEqual(size.height + 0.5);
}

/** Every assertion the Session stage owes the Learner, at whatever size the project is running. */
async function expectStageHolds(page: Page): Promise<void> {
  const size = viewport(page);
  const portrait = size.height > size.width;

  // The visual as it is drawn, not the slot it is drawn in: a ten-frame wider
  // than its column overflows the slot, and it is the board the Learner sees.
  const visual = await boxOf(page, "[data-stage-visual] > *");
  const pad = await boxOf(page, "[data-stage-pad]");
  const bubble = await boxOf(page, "[data-stage-bubble]");
  // The slot Ollie stands in rather than the rig itself: he breathes, and a
  // scale of a few per cent is not a layout.
  const ollie = await boxOf(page, "[data-stage-ollie]");

  expect(clearance(visual, pad), "the visual and the number pad").toBeGreaterThanOrEqual(GUTTER);
  expectOnScreen(visual, size, "the visual");
  expectOnScreen(pad, size, "the number pad");
  expectOnScreen(bubble, size, "the speech bubble");
  expectOnScreen(ollie, size, "Ollie");

  if (portrait) {
    expect(pad.y, "in portrait the pad is below the visual").toBeGreaterThanOrEqual(visual.y + visual.height);
    // Ollie steps up beside his bubble where the column is one.
    expect(ollie.x + ollie.width, "in portrait Ollie stands beside his bubble").toBeLessThanOrEqual(bubble.x + 0.5);
  } else {
    // Ollie stands under his own bubble, left-aligned with it, so its tail points at him.
    expect(ollie.y, "Ollie stands under his bubble").toBeGreaterThanOrEqual(bubble.y + bubble.height);
    expect(Math.abs(ollie.x - bubble.x), "Ollie is in the bubble's column").toBeLessThanOrEqual(1);
    expect(ollie.height, "Ollie is too small to read from across a table").toBeGreaterThanOrEqual(OLLIE.min);
    expect(ollie.height, "Ollie has outgrown his column").toBeLessThanOrEqual(OLLIE.max);
  }

  // Every key on the pad is at least a finger wide, and never grown so far that it starves the visual.
  const keys = page.getByTestId("number-pad").getByRole("button");
  await expect(keys).toHaveCount(21);
  const boxes = await keys.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => ({ width: r.width, height: r.height })));
  for (const [i, box] of boxes.entries()) {
    expect(box.width, `key ${i} is too narrow`).toBeGreaterThanOrEqual(TOUCH_FLOOR);
    expect(box.height, `key ${i} is too short`).toBeGreaterThanOrEqual(TOUCH_FLOOR);
    expect(box.width, `key ${i} is under the design's key`).toBeGreaterThanOrEqual(KEY.min);
    expect(box.width, `key ${i} has grown past the design's key`).toBeLessThanOrEqual(KEY.max);
  }

  // Nothing is hidden off the side.
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth, "the page scrolls sideways").toBe(size.width);
}

/** Play the Diagnostic Session, first-try correct, until the wanted visual is the one on screen. */
async function untilVisual(page: Page, selector: string): Promise<void> {
  for (let i = 0; i < 9; i++) {
    const { answer } = await asked(page);
    if ((await page.locator(selector).count()) > 0) return;
    await key(page, answer).click();
  }
  throw new Error(`no Problem drawn on ${selector} in the Diagnostic Session`);
}

/** One ten-frame: partners to 10, the widest cells the stage ever draws. */
test("the ten-frame and the number pad stay apart", async ({ page }) => {
  await writeProfile(page, DIAGNOSTIC_PROFILE);
  await page.goto("/play");
  await untilVisual(page, '[data-testid="ten-frame"][data-frames="1"]');
  await expectStageHolds(page);
});

/** Two ten-frames: a teen number, twice the cells in the same column. */
test("the two-frame ten-frame and the number pad stay apart", async ({ page }) => {
  await writeProfile(page, DIAGNOSTIC_PROFILE);
  await page.goto("/play");
  await untilVisual(page, '[data-testid="ten-frame"][data-frames="2"]');
  await expectStageHolds(page);
});

test("the number line and the number pad stay apart", async ({ page }) => {
  await writeProfile(page, DIAGNOSTIC_PROFILE);
  await page.goto("/play");
  await untilVisual(page, '[data-testid="number-line"]');
  await expectStageHolds(page);
});

test("the Story card and the number pad stay apart", async ({ page }) => {
  await writeProfile(page, UNIT_3_PROFILE);
  await page.goto("/play");
  await asked(page);
  await expect(page.getByTestId("theme-picture")).toBeVisible();
  await expectStageHolds(page);
});

/**
 * The rest of the app at the same sizes. Nothing here is a composition pass;
 * it is the two faults the Session screen had, asked of every other screen:
 * a thing drawn over the thing the Learner has to touch, and a screen wider
 * than the device.
 */
async function expectScreenHolds(page: Page, what: readonly string[]): Promise<void> {
  const size = viewport(page);
  for (const selector of what) {
    // These screens may run down the page — the Parent Area is text-first and
    // meant to be scrolled — so only the sideways edges are held to.
    const boxes = await page.locator(selector).evaluateAll((els) =>
      els.map((el) => {
        const b = el.getBoundingClientRect();
        const middle = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        const seen = middle.y >= 0 && middle.y <= window.innerHeight;
        const on = seen ? document.elementFromPoint(middle.x, middle.y) : null;
        return { x: b.x, width: b.width, covered: seen && !(on !== null && (el.contains(on) || on.contains(el))) };
      }),
    );
    expect(boxes.length, `${selector} is not on the screen at all`).toBeGreaterThan(0);
    for (const [i, box] of boxes.entries()) {
      expect(box.x, `${selector} #${i} starts off the left edge`).toBeGreaterThanOrEqual(-0.5);
      expect(box.x + box.width, `${selector} #${i} runs past the right edge`).toBeLessThanOrEqual(size.width + 0.5);
      expect(box.covered, `${selector} #${i} is covered by something drawn over it`).toBe(false);
    }
  }
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth, "the page scrolls sideways").toBe(size.width);
}

test("Home holds together", async ({ page }) => {
  await writeProfile(page, DIAGNOSTIC_PROFILE);
  await page.goto("/");
  await expectScreenHolds(page, ['a[href="/play"]', 'a[href="/parent"]', '[data-testid="path-stop"]', "svg.ollie"]);
});

test("the Shop holds together", async ({ page }) => {
  await writeProfile(page, DIAGNOSTIC_PROFILE);
  await seedRewards(page, { coins: 85, owned: ["party-hat"], worn: { hat: "party-hat", accessory: null, pet: null } });
  await page.goto("/shop");
  await expectScreenHolds(page, ['[data-testid="shop"]', '[data-testid="shop-item"]', '[data-testid="shop-theme"]', 'a[href="/"]']);
});

test("the Parent Area holds together", async ({ page }) => {
  await writeProfile(page, DIAGNOSTIC_PROFILE);
  await openParentArea(page);
  await expectScreenHolds(page, ['[data-testid="parent-area"]', '[data-testid="mastery-row"]', 'a[href="/"]']);
});

test("the celebration holds together", async ({ page }) => {
  await writeProfile(page, COUNTING_ON_PROFILE);
  await page.goto("/play");
  await playSession(page);
  await expectScreenHolds(page, ['[data-testid="celebration"]', '[data-testid="coins-earned"]', '[data-testid="streak-earned"]', 'button:has-text("Done")']);
});
