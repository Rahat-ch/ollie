import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { colors, cssVarName } from "@/design/tokens";

const tokensCssPath = fileURLToPath(
  new URL("../app/tokens.css", import.meta.url),
);

function readTokensCss(): string {
  return readFileSync(tokensCssPath, "utf8");
}

/** The `:root { ... }` block that declares the raw tokens. */
function rootBlock(css: string): string {
  const match = css.match(/:root\s*\{([^}]*)\}/);
  if (!match) throw new Error("tokens.css has no :root block");
  return match[1];
}

function declaredValue(block: string, name: string): string | undefined {
  const match = block.match(
    new RegExp(`(?:^|[\\s;])${name}\\s*:\\s*([^;]+);`, "m"),
  );
  return match?.[1].trim();
}

const requiredNonColorTokens = [
  // Type scale (px) and matching line-heights from the direction doc.
  "--text-display-xl",
  "--text-display-l",
  "--text-display-m",
  "--text-display-s",
  "--text-body-l",
  "--text-body",
  "--text-caption",
  "--text-numeral",
  "--leading-display-xl",
  "--leading-display-l",
  "--leading-display-m",
  "--leading-display-s",
  "--leading-body-l",
  "--leading-body",
  "--leading-caption",
  "--leading-numeral",
  // Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
  "--space-1",
  "--space-2",
  "--space-3",
  "--space-4",
  "--space-6",
  "--space-8",
  "--space-12",
  "--space-16",
  "--space-24",
  // Radii: 12 chips/inputs, 20 cards/keys, 28 big buttons, 999 pills.
  "--radius-chip",
  "--radius-card",
  "--radius-button",
  "--radius-pill",
  // Flat paper shadows, never blur.
  "--shadow-button",
  "--shadow-button-pressed",
  "--shadow-card",
  "--press-offset",
  // Motion.
  "--duration-state",
  "--duration-celebrate",
  "--duration-breathe",
  "--ease-state",
  "--ease-celebrate",
  // Touch targets and layout.
  "--touch-learner",
  "--touch-parent",
  "--gutter",
  "--content-max",
];

describe("cssVarName", () => {
  it("turns a camelCase token key into its kebab-case custom property", () => {
    expect(cssVarName("paper")).toBe("--paper");
    expect(cssVarName("paper2")).toBe("--paper-2");
    expect(cssVarName("inkSoft")).toBe("--ink-soft");
    expect(cssVarName("counterYellow")).toBe("--counter-yellow");
  });
});

describe("tokens.css", () => {
  it("declares every colour from tokens.ts with the same hex", () => {
    const root = rootBlock(readTokensCss());
    for (const [key, hex] of Object.entries(colors)) {
      const name = cssVarName(key as keyof typeof colors);
      expect(declaredValue(root, name), `${name} in :root`).toBe(hex);
    }
  });

  it("declares the type, spacing, radius, shadow, motion, and layout tokens", () => {
    const root = rootBlock(readTokensCss());
    const missing = requiredNonColorTokens.filter(
      (name) => declaredValue(root, name) === undefined,
    );
    expect(missing).toEqual([]);
  });

  it("uses flat offset shadows with no blur", () => {
    const root = rootBlock(readTokensCss());
    for (const name of ["--shadow-button", "--shadow-card"]) {
      const value = declaredValue(root, name);
      // "0 <y>px 0 <colour>": x-offset, y-offset, zero blur, then a colour.
      expect(value, name).toMatch(/^0 \d+px 0 /);
    }
  });

  it("maps the tokens into the Tailwind theme", () => {
    const css = readTokensCss();
    expect(css).toMatch(/@theme inline\s*\{/);
    for (const themeKey of [
      "--color-paper",
      "--color-ink",
      "--color-sun",
      "--radius-card",
      "--font-display",
      "--font-text",
    ]) {
      expect(css, themeKey).toContain(`${themeKey}:`);
    }
  });

  it("never uses pure white or pure black", () => {
    const css = readTokensCss();
    expect(css).not.toMatch(/#(?:fff|ffffff|000|000000)\b/i);
  });
});
