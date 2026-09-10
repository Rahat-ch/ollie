#!/usr/bin/env node
// Brand images: favicon set and Open Graph image, rendered from the Ollie SVGs.
// Zero dependencies beyond Playwright's bundled Chromium; Node ESM.
//
//   pnpm brand:images                 regenerate every image under src/app/
//   pnpm brand:images --preview DIR   also write 4x pixel-upscaled icon renders to DIR
//
// Sources: public/ollie/ollie-head.svg, public/ollie/ollie-idle.svg, and the
// self-hosted fonts in src/app/fonts/. Rerun whenever Ollie or the tokens
// change. `sharp` is banned (LGPL libvips), so each image is an HTML page
// rasterised by Chromium; the ICO container is written by hand below.
//
// Outputs (Next.js file conventions, see node_modules/next/dist/docs/01-app/
// 03-api-reference/03-file-conventions/01-metadata/):
//   src/app/icon.svg                the head SVG, verbatim
//   src/app/favicon.ico             16x16 and 32x32 PNG entries
//   src/app/apple-icon.png          180x180
//   src/app/opengraph-image.png     1200x630
//   src/app/opengraph-image.alt.txt

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OLLIE_DIR = path.join(ROOT, "public", "ollie");
const FONT_DIR = path.join(ROOT, "src", "app", "fonts");
const APP_DIR = path.join(ROOT, "src", "app");

// Mirrors src/app/tokens.css (src/design/tokens.test.ts guards the CSS <->
// TypeScript pair; this script reads the CSS directly so it cannot drift).
const colors = readTokens();

const OG_ALT =
  "Ollie the owl next to the words: Ollie learns how you learn. A Grade 1 math game.";

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

function readTokens() {
  const css = readFileSync(path.join(APP_DIR, "tokens.css"), "utf8");
  const out = {};
  for (const [, name, hex] of css.matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6});/g)) {
    out[name] = hex;
  }
  const required = [
    "paper",
    "paper-3",
    "ink",
    "ink-soft",
    "rust-deep",
    "sun",
    "sun-deep",
    "leaf",
    "sky",
    "berry",
    "plum",
  ];
  for (const name of required) {
    if (!out[name]) throw new Error(`tokens.css is missing --${name}`);
  }
  return out;
}

function readSvg(name) {
  return readFileSync(path.join(OLLIE_DIR, name), "utf8").trim();
}

function fontDataUri(file) {
  const data = readFileSync(path.join(FONT_DIR, file)).toString("base64");
  return `url("data:font/woff2;base64,${data}") format("woff2")`;
}

const FONT_FACES = `
  @font-face {
    font-family: "Fredoka";
    font-weight: 300 700;
    font-style: normal;
    src: ${fontDataUri("fredoka-latin-wght.woff2")};
  }
  @font-face {
    font-family: "Andika";
    font-weight: 400;
    font-style: normal;
    src: ${fontDataUri("andika-latin-400.woff2")};
  }
  @font-face {
    font-family: "Andika";
    font-weight: 700;
    font-style: normal;
    src: ${fontDataUri("andika-latin-700.woff2")};
  }
`;

/** Inline an SVG at a fixed pixel size (the files carry only a viewBox). */
function inlineSvg(svg, size, extraAttrs = "") {
  return svg.replace(/^<svg /, `<svg width="${size}" height="${size}" ${extraAttrs} `);
}

function document(width, height, body, css = "") {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  ${FONT_FACES}
  html, body { margin: 0; padding: 0; }
  body {
    width: ${width}px; height: ${height}px; overflow: hidden; position: relative;
    background: ${colors.paper};
    -webkit-font-smoothing: antialiased;
  }
  svg { display: block; }
  ${css}
</style></head><body>${body}</body></html>`;
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

/**
 * Favicon tile: the head on a paper rounded square with a little padding, so
 * the eyes and beak still read at 16px. Radius and padding scale with size.
 */
function iconPage(size) {
  const pad = Math.round(size / 16);
  const radius = Math.round(size / 4.5);
  const head = inlineSvg(readSvg("ollie-head.svg"), size - pad * 2);
  return document(
    size,
    size,
    `<div class="tile">${head}</div>`,
    `
    body { background: transparent; }
    .tile {
      width: ${size}px; height: ${size}px; box-sizing: border-box; padding: ${pad}px;
      border-radius: ${radius}px; background: ${colors.paper};
    }`,
  );
}

/** Apple touch icon: square paper with ~12% padding. iOS rounds the corners. */
function appleIconPage(size) {
  const pad = Math.round(size * 0.12);
  const head = inlineSvg(readSvg("ollie-head.svg"), size - pad * 2);
  return document(
    size,
    size,
    `<div class="tile">${head}</div>`,
    `.tile { padding: ${pad}px; }`,
  );
}

/**
 * Open Graph card. Paper, flat shapes, no gradients or blur. Ollie idle on
 * the left on a flat paper-3 ground; name, tagline, and one-sentence pitch on
 * the right; the URL as a sun pill with the flat button shadow.
 */
function opengraphPage() {
  const W = 1200;
  const H = 630;
  const MARGIN = 64;

  // The idle SVG's 240-unit viewBox has empty margin around the owl: the body
  // spans x 43-198 and y 24 (tuft tips) to 217 (feet), per public/ollie/
  // README.md. Place the visible body, not the box, so the margin is honest
  // and the copy can start right after the wing.
  const OLLIE = 480;
  const unit = OLLIE / 240;
  const body = { left: 43 * unit, right: 198 * unit, top: 24 * unit, bottom: 217 * unit };
  const ollieLeft = MARGIN - body.left;
  const ollieTop = Math.round(H / 2 - (body.top + body.bottom) / 2);
  const bodyRight = ollieLeft + body.right;
  const feetY = ollieTop + 212 * unit;
  const ollie = inlineSvg(readSvg("ollie-idle.svg"), OLLIE);

  const copyLeft = Math.round(bodyRight + 52);
  const copyWidth = W - MARGIN - copyLeft;

  // Sparse paper confetti along the top edges: a few circles and rounded
  // bars, slightly rotated so they look placed by hand.
  const confetti = [
    { kind: "dot", x: 96, y: 52, size: 18, color: colors.leaf },
    { kind: "bar", x: 214, y: 76, size: 30, color: colors.sun, rotate: -22 },
    { kind: "dot", x: 372, y: 60, size: 12, color: colors.berry },
    { kind: "bar", x: 468, y: 46, size: 26, color: colors.sky, rotate: 34 },
    { kind: "dot", x: 590, y: 86, size: 10, color: colors.plum },
    { kind: "bar", x: 828, y: 40, size: 28, color: colors.berry, rotate: 12 },
    { kind: "dot", x: 960, y: 68, size: 16, color: colors.sky },
    { kind: "bar", x: 1058, y: 96, size: 30, color: colors.leaf, rotate: -40 },
    { kind: "dot", x: 1130, y: 50, size: 12, color: colors.sun },
    { kind: "bar", x: 1092, y: 138, size: 24, color: colors.plum, rotate: 60 },
  ]
    .map((c) => {
      const w = c.size;
      const h = c.kind === "dot" ? c.size : Math.round(c.size * 0.42);
      const r = c.kind === "dot" ? "50%" : `${h}px`;
      const rotate = c.rotate ? `transform: rotate(${c.rotate}deg);` : "";
      return `<i style="left:${c.x}px;top:${c.y}px;width:${w}px;height:${h}px;border-radius:${r};background:${c.color};${rotate}"></i>`;
    })
    .join("");

  return document(
    W,
    H,
    `
    <div class="confetti">${confetti}</div>
    <div class="ground"></div>
    <div class="ollie">${ollie}</div>
    <div class="copy">
      <h1>Ollie</h1>
      <p class="tagline">Ollie learns how you learn.</p>
      <p class="pitch">A Grade 1 math game. Ollie reads every Problem aloud, and a Coach tells the Parent what it is learning.</p>
    </div>
    <div class="pill">ollie.rahatcodes.com</div>
    `,
    `
    .confetti i { position: absolute; display: block; }
    /* A paper-cut rug under the feet: an ellipse with uneven radii so it is
       not a perfect oval, a little wider than the owl on the right. */
    .ground {
      position: absolute; left: ${MARGIN}px; top: ${Math.round(feetY - 30)}px;
      width: ${Math.round(body.right - body.left + 40)}px; height: 62px;
      border-radius: 48% 52% 50% 50% / 58% 62% 38% 42%;
      background: ${colors["paper-3"]};
    }
    .ollie { position: absolute; left: ${ollieLeft}px; top: ${ollieTop}px; }
    .copy {
      position: absolute; left: ${copyLeft}px; top: 150px; width: ${copyWidth}px;
    }
    .copy h1 {
      margin: 0; font: 600 140px/1 "Fredoka", ui-rounded, sans-serif;
      color: ${colors.ink}; letter-spacing: -0.01em;
      text-shadow: 0 5px 0 ${colors["paper-3"]};
    }
    .copy .tagline {
      margin: 10px 0 0; font: 500 52px/1.15 "Fredoka", ui-rounded, sans-serif;
      color: ${colors["rust-deep"]};
    }
    .copy .pitch {
      margin: 22px 0 0; font: 400 28px/1.4 "Andika", sans-serif;
      color: ${colors["ink-soft"]};
    }
    .pill {
      position: absolute; right: ${MARGIN}px; bottom: ${MARGIN}px;
      padding: 12px 26px; border-radius: 999px;
      font: 700 24px/1.2 "Andika", sans-serif; color: ${colors.ink};
      background: ${colors.sun}; box-shadow: 0 4px 0 ${colors["sun-deep"]};
      transform: rotate(-2deg);
    }`,
  );
}

/** A pixel-exact upscale of a PNG, for checking the small icons by eye. */
function upscalePage(png, size, factor) {
  const out = size * factor;
  return document(
    out,
    out,
    `<img src="data:image/png;base64,${png.toString("base64")}">`,
    `body { background: #8a8a8a; }
     img { display:block; width:${out}px; height:${out}px; image-rendering: pixelated; }`,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

async function renderPng(browser, { width, height, html, transparent = false }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width, height },
    omitBackground: transparent,
    animations: "disabled",
    caret: "hide",
    scale: "css",
  });
  await context.close();
  return png;
}

/**
 * ICO container with PNG entries (supported by every current browser).
 * Header: reserved u16 0, type u16 1, count u16. Then one 16-byte directory
 * entry per image (width u8, height u8, palette u8 0, reserved u8 0,
 * planes u16 1, bit depth u16 32, byte length u32, byte offset u32), then the
 * PNG payloads back to back.
 */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const directory = Buffer.alloc(16 * entries.length);
  let offset = header.length + directory.length;
  entries.forEach(({ size, png }, i) => {
    const at = i * 16;
    directory.writeUInt8(size >= 256 ? 0 : size, at);
    directory.writeUInt8(size >= 256 ? 0 : size, at + 1);
    directory.writeUInt8(0, at + 2);
    directory.writeUInt8(0, at + 3);
    directory.writeUInt16LE(1, at + 4);
    directory.writeUInt16LE(32, at + 6);
    directory.writeUInt32LE(png.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += png.length;
  });

  return Buffer.concat([header, directory, ...entries.map((e) => e.png)]);
}

function write(file, data) {
  writeFileSync(file, data);
  console.log(`${path.relative(ROOT, file)}  ${data.length} bytes`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const previewIndex = args.indexOf("--preview");
  const previewDir = previewIndex === -1 ? null : args[previewIndex + 1];
  if (previewIndex !== -1 && !previewDir) {
    throw new Error("--preview needs a directory");
  }

  const browser = await chromium.launch();
  try {
    // icon.svg: the head, byte for byte.
    write(path.join(APP_DIR, "icon.svg"), readSvg("ollie-head.svg") + "\n");

    // favicon.ico: 16 and 32 PNG entries. The old file is the Next.js default;
    // remove it before writing so a failed render cannot leave it in place.
    const icoSizes = [16, 32];
    const icoEntries = [];
    for (const size of icoSizes) {
      const png = await renderPng(browser, {
        width: size,
        height: size,
        html: iconPage(size),
        transparent: true,
      });
      icoEntries.push({ size, png });
    }
    const icoPath = path.join(APP_DIR, "favicon.ico");
    rmSync(icoPath, { force: true });
    write(icoPath, buildIco(icoEntries));

    // apple-icon.png
    write(
      path.join(APP_DIR, "apple-icon.png"),
      await renderPng(browser, { width: 180, height: 180, html: appleIconPage(180) }),
    );

    // opengraph-image.png and its alt text
    write(
      path.join(APP_DIR, "opengraph-image.png"),
      await renderPng(browser, { width: 1200, height: 630, html: opengraphPage() }),
    );
    // No trailing newline: Next.js copies the file into og:image:alt verbatim.
    write(path.join(APP_DIR, "opengraph-image.alt.txt"), OG_ALT);

    if (previewDir) {
      mkdirSync(previewDir, { recursive: true });
      for (const { size, png } of icoEntries) {
        const factor = 4;
        write(
          path.join(previewDir, `icon-${size}@${factor}x.png`),
          await renderPng(browser, {
            width: size * factor,
            height: size * factor,
            html: upscalePage(png, size, factor),
          }),
        );
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
