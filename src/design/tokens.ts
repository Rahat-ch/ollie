/**
 * Design tokens as TypeScript, for SVG generation and tests.
 *
 * `src/app/tokens.css` is the CSS source of truth; the hexes here must match
 * it exactly. `src/design/tokens.test.ts` reads the CSS from disk and fails if
 * they drift. The key is the camelCase form of the CSS custom property
 * (`paper2` is `--paper-2`, `inkSoft` is `--ink-soft`).
 *
 * The full meaning of each token is in `docs/design/direction.md`.
 */
export const colors = {
  paper: "#FFF7EC",
  paper2: "#F8E8CF",
  paper3: "#EED7B5",
  ink: "#3B2E2A",
  inkSoft: "#7A6660",
  rust: "#C9713F",
  rustDeep: "#A8532C",
  cream: "#F8DFB8",
  sun: "#F2B134",
  sunDeep: "#D0901E",
  leaf: "#4CAF7A",
  leafDeep: "#2F8A5B",
  sky: "#6FB7D6",
  skyDeep: "#3F8FB4",
  berry: "#D95F76",
  berryDeep: "#B23F56",
  plum: "#6B4E9C",
  plumDeep: "#4E3676",
  teal: "#2E5E6B",
  tealDeep: "#1F434D",
  counterRed: "#E0553F",
  counterYellow: "#F5C542",
} as const;

export type ColorToken = keyof typeof colors;

/** `paper2` -> `--paper-2`, `inkSoft` -> `--ink-soft`. */
export function cssVarName(token: ColorToken): `--${string}` {
  return `--${token.replace(/([a-z])([A-Z0-9])/g, "$1-$2").toLowerCase()}`;
}
