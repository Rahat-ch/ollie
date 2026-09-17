#!/usr/bin/env node
// The illustration review: screenshots of the real screens, and one static
// HTML page that puts every asset beside what the character sheet in
// docs/design/direction.md asks of it (ticket 15).
//
//   pnpm build && pnpm design:review       starts its own server and stops it
//   BASE=http://localhost:3100 pnpm design:review   drives a server you started
//
// The /design-review route answers 404 unless DESIGN_REVIEW=1, so the server
// this starts sets it; a server you point BASE at must set it too.
//
// Outputs:
//   docs/design/screens/*.png              the real screens, at 1024×768 ×2
//   docs/design/review-<date>.html         the page the user reviews
// and prints the cold first load of the Home screen (requests, encoded bytes).
//
// The page is a snapshot with no external resources: the app's own compiled
// CSS is inlined, the fonts and Ollie's SVG are referenced by relative path
// into the repo, and every other asset is the app's own markup, taken from
// the /design-review route so the review can never drift from the app.

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices, webkit } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DESIGN = path.join(ROOT, "docs", "design");
const SCREENS = path.join(DESIGN, "screens");
const PORT = Number(process.env.PORT ?? 3300);
const BASE = process.env.BASE ?? `http://localhost:${PORT}`;
const DATE = process.env.REVIEW_DATE ?? new Date().toISOString().slice(0, 10);
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
// The Session screen on a real iPad
// ---------------------------------------------------------------------------

/**
 * The nine CSS viewports of the current iPads, from docs/research/ipad-layout.md
 * §2: the 10.2-inch, the 11-inch, the 13-inch and the mini each way up, and
 * the current base iPad as Playwright's own registry measures it. The last
 * two figures in the research are unverified against Apple, so the shorter
 * reading of each is in the list and the layout is held to it.
 */
const IPADS = [
  [1080, 810],
  [810, 1080],
  [1180, 820],
  [820, 1180],
  [1366, 1024],
  [1024, 1366],
  [1133, 744],
  [744, 1133],
  [944, 656],
];

/** The three visuals a Problem is put on, and the Profile each one comes from. */
const VISUALS = [
  ["ten-frame", FIRST_SESSION],
  ["number-line", FIRST_SESSION],
  ["theme-picture", UNIT_3],
];

const IPAD_SHOTS = [];

/**
 * The Session screen in each visual at each iPad size, in Safari's own engine
 * rather than Chromium, because the device the game is played on is an iPad
 * and WebKit is what draws it there.
 */
async function ipadScreens() {
  const browser = await webkit.launch();
  try {
    for (const [width, height] of IPADS) {
      const context = await browser.newContext({
        ...devices["iPad (gen 7) landscape"],
        viewport: { width, height },
        deviceScaleFactor: 2,
        reducedMotion: "reduce",
      });
      // The machine must not read the Problems out loud through its own voice.
      await context.addInitScript(() => {
        const synth = window.speechSynthesis;
        if (synth) synth.speak = (utterance) => setTimeout(() => utterance.dispatchEvent(new Event("error")), 0);
      });
      const page = await context.newPage();
      for (const [visual, profile] of VISUALS) {
        await writeProfile(page, profile);
        await page.goto(`${BASE}/play`, { waitUntil: "networkidle" });
        // Play first-try correct until the Problem on screen is drawn on the wanted visual.
        for (let i = 0; i < 9; i++) {
          await page.locator('main[data-phase="asking"]').waitFor({ timeout: 20_000 });
          if (await page.getByTestId(visual).count()) break;
          await page.getByRole("button", { name: String(solve(await page.getByTestId("equation").innerText())), exact: true }).click();
          await page.waitForTimeout(1600);
        }
        await page.waitForTimeout(600);
        const name = `ipad-${width}x${height}-${visual === "theme-picture" ? "story" : visual}`;
        await page.screenshot({ path: path.join(SCREENS, `${name}.png`), animations: "disabled", caret: "hide" });
        IPAD_SHOTS.push([name, width, height]);
        console.log(`docs/design/screens/${name}.png`);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
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
.review-ipads { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; align-items: start; }
.review-ipads img { display: block; width: 100%;
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

  const ipads = IPAD_SHOTS.map(
    ([name, width, height]) => `      <figure class="m-0">
        <img src="screens/${name}.png" alt="${name}" width="${width}" />
        <figcaption class="pt-2 font-text text-caption text-ink-soft">${width}×${height} ${height > width ? "portrait" : "landscape"} — ${name.split("-").slice(2).join(" ")}</figcaption>
      </figure>`,
  ).join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ollie — illustration review</title>
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
  <section class="mb-12 rounded-card bg-paper-2 p-8 shadow-card">
    <h2 class="font-display text-display-m font-semibold text-ink">The Session screen on every current iPad</h2>
    <p class="mt-2 mb-6 max-w-200 font-text text-body text-ink-soft">
      The three visuals — the ten-frame, the number line, and a Unit 3 Story's Theme picture — at the nine
      CSS viewports of the current iPads, each way up, taken in WebKit, which is Safari's own engine and
      what draws the game on the device. The composition to approve against
      <code>design/canvas/Session.dc.html</code>: the dots in the header row, the bubble with Repeat beside it,
      the Equation under it, the visual filling its column, Ollie 240 to 280 under his own bubble, and the
      number pad opening up to take its column. Nothing overlaps and nothing scrolls sideways at any of them;
      <code>e2e/layout.spec.ts</code> measures it at every size on every run.
    </p>
    <div class="review-ipads">
${ipads}
    </div>
  </section>
  <p class="max-w-200 font-text text-body text-ink-soft">
    Generated by <code>pnpm design:review</code> from the running app. Awaiting the user's approval;
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
// The first load
// ---------------------------------------------------------------------------

/**
 * What a tablet fetches to show the Home screen on a cold cache: the count
 * of requests and the bytes on the wire (encoded, so compression is counted
 * as it is sent, headers included). The Profile is seeded into the context
 * rather than written by a first visit, so nothing is cached before the
 * measured load and the screen measured is Home and not onboarding.
 */
async function firstLoad(browser) {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    reducedMotion: "reduce",
    storageState: { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: KEY, value: JSON.stringify(FIRST_SESSION) }] }] },
  });
  const page = await context.newPage();
  const sizes = [];
  page.on("requestfinished", async (request) => {
    try {
      sizes.push(await request.sizes());
    } catch {
      // A request that never finished has no sizes; it is not part of the load.
    }
  });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Play" }).waitFor();
  await page.waitForTimeout(1500);
  const bytes = sizes.reduce((total, s) => total + s.responseBodySize + s.responseHeadersSize, 0);
  console.log(`Home first load: ${sizes.length} requests, ${bytes} bytes encoded`);
  await context.close();
}

// ---------------------------------------------------------------------------

/** The app on its own port with the review route switched on; stopped at the end. */
function startServer() {
  const server = spawn("node", [path.join(ROOT, "node_modules", "next", "dist", "bin", "next"), "start", "--port", String(PORT)], {
    cwd: ROOT,
    env: { ...process.env, DESIGN_REVIEW: "1", PORT: String(PORT) },
    stdio: "ignore",
  });
  return server;
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(`${BASE}/`);
      if (response.ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`no server at ${BASE}; run \`pnpm build\` first`);
}

async function main() {
  mkdirSync(SCREENS, { recursive: true });
  const server = process.env.BASE ? null : startServer();
  const browser = await chromium.launch();
  try {
    await waitForServer();
    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      deviceScaleFactor: 2,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await screens(page);
    await ipadScreens();
    await reviewPage(page);
    await context.close();
    await firstLoad(browser);
  } finally {
    await browser.close();
    server?.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
