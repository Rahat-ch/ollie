/**
 * The CSS viewports of the current iPads, from docs/research/ipad-layout.md §2:
 * the 10.2-inch, the 11-inch, the 13-inch and the mini each way up, and the
 * current base iPad as Playwright's own registry measures it (944×656 at a
 * scale factor of 2.5, where Apple's native resolution halved says 1180×820 —
 * the research flags the disagreement as unverified, so the layout is held to
 * both readings).
 *
 * One list, so the browser projects in playwright.config.ts and the review
 * screenshots in scripts/design-review.mjs can never drift apart. Plain
 * JavaScript because the review script is run by node and the configuration
 * by TypeScript, and both must be able to import it.
 *
 * @type {ReadonlyArray<{ name: string, width: number, height: number }>}
 */
export const IPADS = [
  { name: "ipad-102-landscape", width: 1080, height: 810 },
  { name: "ipad-102-portrait", width: 810, height: 1080 },
  { name: "ipad-11-landscape", width: 1180, height: 820 },
  { name: "ipad-11-portrait", width: 820, height: 1180 },
  { name: "ipad-13-landscape", width: 1366, height: 1024 },
  { name: "ipad-13-portrait", width: 1024, height: 1366 },
  { name: "ipad-mini-landscape", width: 1133, height: 744 },
  { name: "ipad-mini-portrait", width: 744, height: 1133 },
  { name: "ipad-base-landscape", width: 944, height: 656 },
];
