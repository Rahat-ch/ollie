#!/usr/bin/env node
// The illustration review: screenshots of the real screens, and one static
// HTML page that puts every asset beside what the character sheet in
// docs/design/direction.md asks of it (ticket 15).
//
//   pnpm build && PORT=3300 pnpm start
//   pnpm design:review                     against http://localhost:3300
//   BASE=http://localhost:3100 pnpm design:review
//
// Outputs:
//   docs/design/screens/*.png              the real screens, at 1024×768 ×2
//   docs/design/review-<date>.html         the page the user reviews
//
// The page is a snapshot with no external resources: the app's own compiled
// CSS is inlined, the fonts and Ollie's SVG are referenced by relative path
// into the repo, and every other asset is the app's own markup, taken from
// the /design-review route so the review can never drift from the app.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DESIGN = path.join(ROOT, "docs", "design");
const SCREENS = path.join(DESIGN, "screens");
const BASE = process.env.BASE ?? "http://localhost:3300";
const DATE = process.env.REVIEW_DATE ?? "2026-09-13";
const KEY = "ollie.profile";

// ---------------------------------------------------------------------------
// Profiles to screenshot from. Written straight to the device, as the browser
// tests do; version 2 is migrated forward by the app itself.
// ---------------------------------------------------------------------------

const mastered = { estimate: 0.99, recentFirstAttempts: Array(10).fill(true), mastered: true };
const fresh = (estimate) => ({ estimate, recentFirstAttempts: [], mastered: false });

const FIRST_SESSION = {
  version: 2,
  seed: "design-review",
  identity: { nickname: "Mia", avatarColor: "sky", theme: "space" },
  progress: {
    nextProblemNumber: 1,
    sessionsCompleted: 0,
    skills: {
      "partners-to-10": fresh(0.3),
      "teen-numbers": fresh(0.3),
      "counting-on": fresh(0.3),
      "make-a-ten": fresh(0.2),
      "unknown-addend": fresh(0.2),
    },
  },
  session: null,
};

const UNIT_3 = {
  version: 2,
  seed: "design-review-3",
  identity: { nickname: "Mia", avatarColor: "berry", theme: "puppies" },
  progress: {
    nextProblemNumber: 50,
    sessionsCompleted: 4,
    skills: {
      "partners-to-10": mastered,
      "teen-numbers": mastered,
      "counting-on": mastered,
      "make-a-ten": mastered,
      "unknown-addend": mastered,
      "result-unknown": fresh(0.2),
      "change-unknown": fresh(0.15),
    },
  },
  session: null,
};

/** The engine's arithmetic, done independently of the equation on screen. */
function solve(equation) {
  const match = equation.replace(/\s+/g, " ").match(/^(\d+|\?) ([+−]) (\d+|\?) = (\d+|\?)$/);
  if (!match) throw new Error(`not an equation: "${equation}"`);
  const [, left, op, right, result] = match;
  const n = Number;
  if (result === "?") return op === "+" ? n(left) + n(right) : n(left) - n(right);
  if (right === "?") return op === "+" ? n(result) - n(left) : n(left) - n(result);
  return op === "+" ? n(result) - n(right) : n(result) + n(right);
}

// ---------------------------------------------------------------------------
// The screens
// ---------------------------------------------------------------------------

const SHOTS = [];

async function shot(page, name) {
  await page.screenshot({ path: path.join(SCREENS, `${name}.png`), animations: "disabled", caret: "hide" });
  SHOTS.push(name);
  console.log(`docs/design/screens/${name}.png`);
}

const writeProfile = async (page, profile) => {
  await page.goto(`${BASE}/`);
  await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [KEY, profile]);
};

const patchProfile = async (page, patch) => {
  await page.evaluate(([k, p]) => {
    localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k)), ...p }));
  }, [KEY, patch]);
};

async function screens(page) {
  // Onboarding, on a device with no Profile.
  await page.goto(`${BASE}/`);
  await page.evaluate((k) => localStorage.removeItem(k), KEY);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: "Nickname" }).waitFor();
  await shot(page, "onboarding");
  await page.getByRole("textbox", { name: "Nickname" }).fill("Mia");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Sky" }).waitFor();
  await shot(page, "onboarding-avatar");
  await page.getByRole("button", { name: "Sky" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Puppies" }).waitFor();
  await shot(page, "onboarding-theme");

  // Home with the Path.
  await writeProfile(page, FIRST_SESSION);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Play" }).waitFor();
  await page.waitForTimeout(500);
  await shot(page, "home");

  // A Session played to its celebration: the two visuals, a Hint, the end.
  await page.goto(`${BASE}/play`, { waitUntil: "networkidle" });
  const done = new Set();
  for (let i = 0; i < 14; i++) {
    const stage = page.locator('main[data-phase="asking"]');
    await stage.waitFor({ timeout: 15_000 }).catch(() => {});
    if ((await stage.count()) === 0) break;
    await page.waitForTimeout(500);
    const kind = (await page.getByTestId("ten-frame").count()) ? "ten-frame" : (await page.getByTestId("number-line").count()) ? "number-line" : null;
    if (kind && !done.has(kind)) {
      done.add(kind);
      await shot(page, `session-${kind}`);
    }
    const answer = solve(await page.getByTestId("equation").innerText());
    if (!done.has("hint")) {
      done.add("hint");
      await page.getByRole("button", { name: String(answer === 0 ? 1 : 0), exact: true }).click();
      await page.waitForTimeout(700);
      await shot(page, "session-hint");
    }
    await page.getByRole("button", { name: String(answer), exact: true }).click();
    await page.waitForTimeout(900);
    if (await page.getByTestId("celebration").count()) break;
  }
  await page.getByTestId("celebration").waitFor({ timeout: 30_000 });
  await page.waitForTimeout(900);
  await shot(page, "celebration");

  // The Parent Area, with a Summary from that Session and a Power on the wall.
  await patchProfile(page, { powers: ["count-on-flight"] });
  await page.goto(`${BASE}/parent`, { waitUntil: "networkidle" });
  const gate = page.getByRole("button", { name: "Hold to open the Parent Area" });
  await gate.hover();
  await page.mouse.down();
  await page.waitForTimeout(3600);
  await page.mouse.up();
  await page.getByTestId("parent-area").waitFor({ timeout: 15_000 });
  await page.waitForTimeout(500);
  await shot(page, "parent-area");

  // A Unit 3 Session: the Story in Ollie's bubble beside the Theme's picture.
  await writeProfile(page, UNIT_3);
  await page.goto(`${BASE}/play`, { waitUntil: "networkidle" });
  await page.locator('main[data-phase="asking"]').waitFor({ timeout: 20_000 });
  await page.waitForTimeout(1200);
  await shot(page, "session-story");

  // The Shop, with Coins to spend, two Items worn, and the Theme picker.
  await patchProfile(page, {
    rewards: {
      coins: 85,
      lastSessionPaid: 4,
      streak: 6,
      lastSessionDay: null,
      freezes: 2,
      owned: ["party-hat", "stripy-scarf", "pet-snail"],
      worn: { hat: "party-hat", accessory: null, pet: "pet-snail" },
    },
  });
  await page.goto(`${BASE}/shop`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot(page, "shop");
}

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

const SCREEN_CAPTIONS = {
  onboarding: "Onboarding, step 1: the Nickname the Parent chooses.",
  "onboarding-avatar": "Onboarding, step 2: the four Avatar colour bases.",
  "onboarding-theme": "Onboarding, step 3: the six Theme pictures at picker size.",
  home: "Home: Ollie, the Avatar, the Coin and Streak chips, and the Path with three Units.",
  "session-ten-frame": "A Session on the ten-frame.",
  "session-number-line": "A Session on the number line.",
  "session-hint": "The Hint after a first wrong answer, Ollie encouraging.",
  "session-story": "A Unit 3 Session: the Story, with the Theme's picture in place of the visual.",
  celebration: "The celebration: Ollie celebrating, paper confetti, the Coins and the Streak.",
  "parent-area": "The Parent Area: a Parent Summary, Mastery per Skill, and a Power's mark.",
  shop: "The Shop: the six Avatar Items, the Avatar wearing two, and the Theme picker.",
};

/** The app's own stylesheets, inlined, with the font files pointed at the repo. */
async function appCss(page) {
  const hrefs = await page.$$eval('link[rel="stylesheet"]', (links) => links.map((l) => l.href));
  const sheets = [];
  for (const href of hrefs) {
    const response = await page.request.get(href);
    sheets.push(await response.text());
  }
  // next/font hashes the woff2 under /_next/static/media; the review page is
  // opened from the repo, so point the faces at the files themselves instead.
  return sheets.join("\n").replace(/@font-face\s*\{[^}]*\}/g, "");
}

const FONT_FACES = `
@font-face { font-family: "Fredoka"; font-weight: 300 700; font-display: swap;
  src: url("../../src/app/fonts/fredoka-latin-wght.woff2") format("woff2"); }
@font-face { font-family: "Andika"; font-weight: 400; font-display: swap;
  src: url("../../src/app/fonts/andika-latin-400.woff2") format("woff2"); }
@font-face { font-family: "Andika"; font-weight: 700; font-display: swap;
  src: url("../../src/app/fonts/andika-latin-700.woff2") format("woff2"); }
:root { --font-display: "Fredoka"; --font-text: "Andika"; }
body { margin: 0; background: var(--paper); color: var(--ink);
  font-family: var(--font-text), system-ui, sans-serif; }
.review-screens { display: flex; flex-direction: column; gap: 32px; }
.review-screens img { display: block; width: 100%; max-width: 1024px;
  border-radius: var(--radius-card); box-shadow: var(--shadow-card); }
`;

async function reviewPage(page) {
  await page.goto(`${BASE}/design-review`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const css = await appCss(page);
  const body = await page.$eval("main", (el) => el.outerHTML);
  const screens = SHOTS.map(
    (name) => `      <figure class="m-0">
        <img src="screens/${name}.png" alt="${SCREEN_CAPTIONS[name] ?? name}" width="1024" />
        <figcaption class="pt-2 font-text text-caption text-ink-soft">${SCREEN_CAPTIONS[name] ?? name}</figcaption>
      </figure>`,
  ).join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ollie — illustration review, ${DATE}</title>
<style>${css}</style>
<style>${FONT_FACES}</style>
</head>
<body>
${body.replace('src="/ollie/', 'src="../../public/ollie/')}
<main class="px-gutter pb-16">
  <section class="mb-12 rounded-card bg-paper-2 p-8 shadow-card">
    <h2 class="font-display text-display-m font-semibold text-ink">The screens, as they ship</h2>
    <p class="mt-2 mb-6 max-w-200 font-text text-body text-ink-soft">
      Playwright screenshots of the real app at 1024×768, the tablet frame the design is drawn to.
    </p>
    <div class="review-screens">
${screens}
    </div>
  </section>
  <p class="max-w-200 font-text text-body text-ink-soft">
    Generated by <code>pnpm design:review</code> from the running app on ${DATE}. Awaiting the user's approval;
    the approval box in <code>.scratch/k5-math/issues/15-illustration-pass.md</code> is theirs to tick.
  </p>
</main>
</body>
</html>
`;
  const file = path.join(DESIGN, `review-${DATE}.html`);
  writeFileSync(file, html);
  console.log(`docs/design/review-${DATE}.html  ${html.length} bytes`);
}

// ---------------------------------------------------------------------------

async function main() {
  mkdirSync(SCREENS, { recursive: true });
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      deviceScaleFactor: 2,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await screens(page);
    await reviewPage(page);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
