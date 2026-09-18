/**
 * What every eval chart is drawn with: the paper surface and ink of the
 * design tokens, the four mark colours, and the frame (title, subtitle,
 * footer) each chart sits in. No dependency: an SVG is a string.
 *
 * The mark colours are validated together on the paper surface for
 * colour-vision separation, and every mark is also labelled, so identity is
 * never colour alone. `ok` (leaf) sits under 3:1 against paper, which is why
 * its bars always carry a direct label and its text uses `okInk` (leaf-deep).
 */
import { colors } from "@/design/tokens";

export const SURFACE = colors.paper;
export const INK = colors.ink;
export const INK_SOFT = colors.inkSoft;
export const GRID = colors.paper3;
/** The unfilled part of a bar or a timeline. */
export const TRACK = colors.paper2;

/** The two planners, as the convergence chart draws them, plus the Coach's retry. */
export const SERIES = { coach: "#2a78d6", retry: colors.berryDeep, baseline: "#eb6834" } as const;

/** What a mark says about a count: it held, or it is the thing to worry about. */
export const STATUS = { ok: colors.leaf, okInk: colors.leafDeep, bad: colors.berryDeep } as const;

export const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export const escape = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** `2331` as `2,331`, fixed to en-US so a report redrawn anywhere gives the same file. */
export const count = (value: number): string => value.toLocaleString("en-US");

/** The left edge every title, label, and bar column starts from. */
export const GUTTER = 50;
/** The right edge nothing is drawn past. */
export const rightEdge = (width: number): number => width - 24;

export type Frame = {
  readonly width: number;
  readonly height: number;
  readonly title: string;
  /** The line under the title: what the chart counts, then the Coach that ran and the report's date. */
  readonly subtitle: string;
  /** What a screen reader is told the chart shows. */
  readonly label: string;
  /** The report file the chart was drawn from. */
  readonly reportName: string;
  /** The sentence after the report file; the Learner charts say whose data it is. */
  readonly note?: string;
};

const DEFAULT_NOTE = "Simulated Learners only; never a real child's data.";

/** How many characters of the subtitle fit on one line at 11.5px across the paper. */
const SUBTITLE_LINE = 112;

/** The subtitle over at most two lines, broken between words. */
export function wrap(body: string, limit = SUBTITLE_LINE): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of body.split(" ")) {
    if (line.length > 0 && line.length + 1 + word.length > limit) {
      lines.push(line);
      line = word;
    } else {
      line = line.length > 0 ? `${line} ${word}` : word;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}

/** A chart: the paper, the title block, the body, and the line saying where the numbers came from. */
export function paper(frame: Frame, body: readonly string[]): string {
  const { width, height } = frame;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${FONT}" role="img" aria-label="${escape(frame.label)}">`,
    `<rect width="${width}" height="${height}" fill="${SURFACE}"/>`,
    `<text x="${GUTTER}" y="28" font-size="17" font-weight="600" fill="${INK}">${escape(frame.title)}</text>`,
    ...wrap(frame.subtitle).map((line, index) => `<text x="${GUTTER}" y="${46 + index * 15}" font-size="11.5" fill="${INK_SOFT}">${escape(line)}</text>`),
    ...body,
    `<text x="${GUTTER}" y="${height - 14}" font-size="10.5" fill="${INK_SOFT}">Regenerated from ${escape(frame.reportName)} with pnpm eval:chart. ${escape(frame.note ?? DEFAULT_NOTE)}</text>`,
    `</svg>`,
    "",
  ].join("\n");
}

export const text = (
  x: number,
  y: number,
  body: string,
  options: { size?: number; weight?: number; fill?: string; anchor?: "start" | "middle" | "end" } = {},
): string =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${options.size ?? 11.5}"` +
  (options.weight ? ` font-weight="${options.weight}"` : "") +
  (options.anchor ? ` text-anchor="${options.anchor}"` : "") +
  ` fill="${options.fill ?? INK}">${escape(body)}</text>`;

/** A bar, its ends rounded, drawn from `x` for `width`; nothing at all when the count is zero. */
export const bar = (x: number, y: number, width: number, height: number, fill: string): string =>
  width <= 0 ? "" : `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${width.toFixed(1)}" height="${height}" rx="4" fill="${fill}"/>`;

/** The full width of a bar in track paper, so a zero count still reads as a row. */
export const track = (x: number, y: number, width: number, height: number): string =>
  `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${width.toFixed(1)}" height="${height}" rx="4" fill="${TRACK}"/>`;

/**
 * A rate's 95 percent interval, drawn over the bar it qualifies: a thin line
 * from the lower bound to the upper with a tick at each end, so the bar is
 * read against what its sample supports. `x0` and `x1` are the bounds on the
 * bar's own scale, `y` the middle of the bar.
 */
export function bracket(x0: number, x1: number, y: number, colour: string = INK): string {
  const rule = (a: number, b: number, c: number, d: number) =>
    `<line x1="${a.toFixed(1)}" x2="${b.toFixed(1)}" y1="${c.toFixed(1)}" y2="${d.toFixed(1)}" stroke="${colour}" stroke-width="1.5"/>`;
  return (
    `<g data-mark="interval">` +
    rule(x0, x1, y, y) +
    rule(x0, x0, y - 5, y + 5) +
    rule(x1, x1, y - 5, y + 5) +
    `</g>`
  );
}

/** The same interval where there is no bar to draw it on: a 0-to-1 rule with the interval marked on it. */
export function rangeLine(x: number, y: number, width: number, lower: number, upper: number, colour: string): string {
  const at = (bound: number) => x + bound * width;
  return (
    `<line x1="${x.toFixed(1)}" x2="${(x + width).toFixed(1)}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${TRACK}" stroke-width="4" stroke-linecap="round"/>` +
    `<line x1="${at(lower).toFixed(1)}" x2="${Math.max(at(upper), at(lower) + 2).toFixed(1)}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${colour}" stroke-width="4" stroke-linecap="round"/>` +
    bracket(at(lower), at(upper), y, colour)
  );
}

/** A small filled square beside a label, so a legend row is read by its label and its colour. */
export const swatch = (x: number, y: number, fill: string): string =>
  `<rect x="${x.toFixed(1)}" y="${(y - 9).toFixed(1)}" width="10" height="10" rx="3" fill="${fill}"/>`;

/** `tuning` or `held out`, said the way the report splits the Learners. */
export const splitTag = (heldOut: boolean): string => (heldOut ? "held out" : "tuning");
