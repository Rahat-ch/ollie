import { SKILLS } from "@/loop";
import type { LearnerConvergence } from "./convergence";
import type { EvalReport } from "./report";

/**
 * The convergence chart: Skills Mastered by Session, one small facet per
 * Simulated Learner, rendered as a self-contained SVG string from a report
 * file and never from a live run. Colours are the app's paper and ink tokens
 * for the surface and text; the series colour is a validated categorical
 * slot (see the dataviz palette) with direct end labels as relief.
 */
const SURFACE = "#FFF7EC";
const INK = "#3B2E2A";
const INK_SOFT = "#7A6660";
const GRID = "#EED7B5";
const SERIES = "#2a78d6";

const COLUMNS = 3;
const FACET = { width: 260, height: 190 } as const;
const PLOT = { left: 34, top: 44, right: 28, bottom: 30 } as const;
const MARGIN = { top: 64, bottom: 36, sides: 16 } as const;
const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const escape = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const pct = (share: number): string => `${Math.round(share * 100)}%`;

function facet(learner: LearnerConvergence, index: number, sessions: number): string {
  const x0 = MARGIN.sides + (index % COLUMNS) * FACET.width;
  const y0 = MARGIN.top + Math.floor(index / COLUMNS) * FACET.height;
  const plotWidth = FACET.width - PLOT.left - PLOT.right;
  const plotHeight = FACET.height - PLOT.top - PLOT.bottom;
  const maxSkills = SKILLS.length;
  const px = (session: number) => x0 + PLOT.left + ((session - 1) / (sessions - 1)) * plotWidth;
  const py = (mastered: number) => y0 + PLOT.top + plotHeight - (mastered / maxSkills) * plotHeight;

  const points = learner.perSession.map((p) => `${px(p.session).toFixed(1)},${py(p.mastered).toFixed(1)}`);
  const last = learner.perSession[learner.perSession.length - 1];
  const gridlines = Array.from({ length: maxSkills + 1 }, (_, m) =>
    `<line x1="${px(1)}" x2="${px(sessions)}" y1="${py(m)}" y2="${py(m)}" stroke="${GRID}" stroke-width="1"/>` +
    `<text x="${px(1) - 6}" y="${py(m) + 3.5}" text-anchor="end" font-size="10" fill="${INK_SOFT}">${m}</text>`,
  ).join("");
  const xTicks = [1, 5, 10, 15, 20]
    .filter((s) => s <= sessions)
    .map((s) => `<text x="${px(s)}" y="${py(0) + 14}" text-anchor="middle" font-size="10" fill="${INK_SOFT}">${s}</text>`)
    .join("");
  const title = escape(learner.name) + (learner.heldOut ? ' <tspan fill="' + INK_SOFT + '" font-weight="400">(held out)</tspan>' : "");
  const subtitle = `first-try ${pct(learner.firstTryRate)} · in band ${pct(learner.inBandShare)}`;

  return [
    `<g>`,
    `<text x="${x0 + PLOT.left}" y="${y0 + 16}" font-size="13" font-weight="600" fill="${INK}">${title}</text>`,
    `<text x="${x0 + PLOT.left}" y="${y0 + 31}" font-size="10.5" fill="${INK_SOFT}">${subtitle}</text>`,
    gridlines,
    xTicks,
    `<polyline points="${points.join(" ")}" fill="none" stroke="${SERIES}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`,
    `<circle cx="${px(last.session).toFixed(1)}" cy="${py(last.mastered).toFixed(1)}" r="4" fill="${SERIES}" stroke="${SURFACE}" stroke-width="2"/>`,
    `<text x="${(px(last.session) + 8).toFixed(1)}" y="${(py(last.mastered) + 3.5).toFixed(1)}" font-size="10.5" font-weight="600" fill="${INK}">${last.mastered}</text>`,
    `</g>`,
  ].join("");
}

export function renderConvergenceChart(report: EvalReport, reportName: string): string {
  const { convergence } = report;
  const rows = Math.ceil(convergence.learners.length / COLUMNS);
  const width = MARGIN.sides * 2 + COLUMNS * FACET.width;
  const height = MARGIN.top + rows * FACET.height + MARGIN.bottom;
  const facets = convergence.learners.map((l, i) => facet(l, i, convergence.sessions)).join("\n");
  const { min, max } = convergence.targetAccuracyBand;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${FONT}" role="img" aria-label="Skills Mastered by Session for six Simulated Learners under the Baseline">`,
    `<rect width="${width}" height="${height}" fill="${SURFACE}"/>`,
    `<text x="${MARGIN.sides + PLOT.left}" y="28" font-size="17" font-weight="600" fill="${INK}">Skills Mastered by Session under the Baseline</text>`,
    `<text x="${MARGIN.sides + PLOT.left}" y="46" font-size="11.5" fill="${INK_SOFT}">${convergence.sessions} Sessions, ${SKILLS.length} Skills, six Simulated Learners. In band: share of Problems whose true first-try chance is ${min}–${max}.</text>`,
    facets,
    `<text x="${MARGIN.sides + PLOT.left}" y="${height - 14}" font-size="10.5" fill="${INK_SOFT}">Regenerated from ${escape(reportName)} with pnpm eval:chart. Simulated Learners only; never a real child's data.</text>`,
    `</svg>`,
    "",
  ].join("\n");
}
