import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CSS_PATH = "src/app/globals.css";
/** The stylesheet with its comments taken out, so a selector is only ever a selector. */
const css = readFileSync(CSS_PATH, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * The one animation that stays: the Parent Gate's ring is how long the press
 * has left, not decoration, so turning it off would take the control's
 * answer away. Ollie's own loops are turned off in `src/ollie/ollie.css`,
 * which has its own reduced-motion rule over every part of the rig.
 */
const KEPT = ['.gate-button[data-holding="true"] .gate-ring'];

const reducedMotionBlock = (): string => {
  const start = css.indexOf("@media (prefers-reduced-motion: reduce)");
  expect(start).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("\n}", css.indexOf("{", start)));
};

/** Every selector in `text` that sets an animation, one per selector rather than per rule. */
function animatedSelectors(text: string): string[] {
  const selectors: string[] = [];
  for (const [, selector, body] of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/\banimation(-name)?\s*:/.test(body)) continue;
    for (const one of selector.split(",")) {
      const trimmed = one.trim().replace(/\s+/g, " ");
      if (trimmed.startsWith("@") || trimmed === "" || /^\d/.test(trimmed) || trimmed === "from" || trimmed === "to") continue;
      if (!selectors.includes(trimmed)) selectors.push(trimmed);
    }
  }
  return selectors;
}

describe("prefers-reduced-motion", () => {
  it("turns off every animation the screens play, the Powers' included", () => {
    const block = reducedMotionBlock();
    const listed = animatedSelectors(css.replace(block, ""));
    const missing = listed.filter((selector) => !KEPT.includes(selector) && !block.includes(selector));
    expect(missing).toEqual([]);
  });

  it("names the moves each Power makes, so a Power added without one fails here", () => {
    const block = reducedMotionBlock();
    for (const selector of [".hop-beat", ".detective-glass", ".ten-frame-magic .counter-arrive", ".story-page"]) {
      expect(block).toContain(selector);
    }
  });
});
