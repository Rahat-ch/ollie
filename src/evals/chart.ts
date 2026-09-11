import { colors } from "@/design/tokens";
import { SKILLS } from "@/loop";
import type { LearnerConvergence } from "./convergence";
import { pct } from "./format";
import type { LearnerHypotheses } from "./hypotheses";
import type { WeaknessTag } from "./learners";
import { describeGeneration, type EvalReport } from "./report";

/**
 * The convergence chart: Skills Mastered by Session under the Coach and
 * under the Baseline, one small facet per Simulated Learner, rendered as a
 * self-contained SVG string from a report file and never from a live run.
 * Colours are the app's paper and ink tokens for the surface and text; the
 * two series are categorical slots 1 and 2 of the dataviz reference
 * palette, validated together on the paper surface, with a legend and
 * direct end labels so identity is never colour alone.
 */
const SURFACE = colors.paper;
const INK = colors.ink;
const INK_SOFT = colors.inkSoft;
const GRID = colors.paper3;
const SERIES = { coach: "#2a78d6", baseline: "#eb6834" } as const;

const COLUMNS = 3;
const FACET = { width: 260, height: 190 } as const;
const PLOT = { left: 34, top: 44, right: 28, bottom: 30 } as const;
const MARGIN = { top: 64, bottom: 36, sides: 16 } as const;
const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const escape = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const WEAKNESS_LABEL: Readonly<Record<WeaknessTag, string>> = {
  "crossing-ten": "crossing ten",
  "change-unknown": "change unknown",
};

/** What the facet says under its title: the planted weakness and when the Coach named it, or the first-try rates. */
function subtitle(coach: LearnerConvergence, baseline: LearnerConvergence, hypotheses: LearnerHypotheses | undefined): string {
  const planted = hypotheses?.planted ?? [];
  if (planted.length > 0 && hypotheses) {
    return planted
      .map((tag) => {
        const session = hypotheses.sessionsToDetection[tag];
        return `${WEAKNESS_LABEL[tag]}: ${session ? `named after Session ${session}` : "not named"}`;
      })
      .join(" · ");
  }
  return `first-try Coach ${pct(coach.firstTryRate)} · Baseline ${pct(baseline.firstTryRate)}`;
}

function facet(
  coach: LearnerConvergence,
  baseline: LearnerConvergence,
  hypotheses: LearnerHypotheses | undefined,
  index: number,
  sessions: number,
): string {
  const x0 = MARGIN.sides + (index % COLUMNS) * FACET.width;
  const y0 = MARGIN.top + Math.floor(index / COLUMNS) * FACET.height;
  const plotWidth = FACET.width - PLOT.left - PLOT.right;
  const plotHeight = FACET.height - PLOT.top - PLOT.bottom;
  const maxSkills = SKILLS.length;
  const px = (session: number) => x0 + PLOT.left + ((session - 1) / Math.max(1, sessions - 1)) * plotWidth;
  const py = (mastered: number) => y0 + PLOT.top + plotHeight - (mastered / maxSkills) * plotHeight;

  const line = (learner: LearnerConvergence, colour: string) => {
    const points = learner.perSession.map((p) => `${px(p.session).toFixed(1)},${py(p.mastered).toFixed(1)}`);
    const last = learner.perSession[learner.perSession.length - 1];
    return (
      `<polyline points="${points.join(" ")}" fill="none" stroke="${colour}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<circle cx="${px(last.session).toFixed(1)}" cy="${py(last.mastered).toFixed(1)}" r="4" fill="${colour}" stroke="${SURFACE}" stroke-width="2"/>`
    );
  };
  const endLabel = (learner: LearnerConvergence) => {
    const last = learner.perSession[learner.perSession.length - 1];
    return `<text x="${(px(last.session) + 8).toFixed(1)}" y="${(py(last.mastered) + 3.5).toFixed(1)}" font-size="10.5" font-weight="600" fill="${INK}">${last.mastered}</text>`;
  };
  const coachEnd = coach.perSession[coach.perSession.length - 1].mastered;
  const baselineEnd = baseline.perSession[baseline.perSession.length - 1].mastered;

  const gridlines = Array.from({ length: maxSkills + 1 }, (_, m) =>
    `<line x1="${px(1)}" x2="${px(sessions)}" y1="${py(m)}" y2="${py(m)}" stroke="${GRID}" stroke-width="1"/>` +
    `<text x="${px(1) - 6}" y="${py(m) + 3.5}" text-anchor="end" font-size="10" fill="${INK_SOFT}">${m}</text>`,
  ).join("");
  const xTicks = [1, 5, 10, 15, 20]
    .filter((s) => s <= sessions)
    .map((s) => `<text x="${px(s)}" y="${py(0) + 14}" text-anchor="middle" font-size="10" fill="${INK_SOFT}">${s}</text>`)
    .join("");
  const title = escape(coach.name) + (coach.heldOut ? ' <tspan fill="' + INK_SOFT + '" font-weight="400">(held out)</tspan>' : "");

  return [
    `<g>`,
    `<text x="${x0 + PLOT.left}" y="${y0 + 16}" font-size="13" font-weight="600" fill="${INK}">${title}</text>`,
    `<text x="${x0 + PLOT.left}" y="${y0 + 31}" font-size="10.5" fill="${INK_SOFT}">${escape(subtitle(coach, baseline, hypotheses))}</text>`,
    gridlines,
    xTicks,
    line(baseline, SERIES.baseline),
    line(coach, SERIES.coach),
    endLabel(coach),
    coachEnd === baselineEnd ? "" : endLabel(baseline),
    `</g>`,
  ].join("");
}

function legend(x: number, y: number): string {
  const item = (label: string, colour: string, offset: number) =>
    `<line x1="${x + offset}" x2="${x + offset + 18}" y1="${y - 4}" y2="${y - 4}" stroke="${colour}" stroke-width="2" stroke-linecap="round"/>` +
    `<circle cx="${x + offset + 9}" cy="${y - 4}" r="3.5" fill="${colour}" stroke="${SURFACE}" stroke-width="1.5"/>` +
    `<text x="${x + offset + 24}" y="${y}" font-size="11.5" fill="${INK}">${label}</text>`;
  return item("Coach", SERIES.coach, 0) + item("Baseline", SERIES.baseline, 82);
}

export function renderConvergenceChart(report: EvalReport, reportName: string): string {
  const { convergence, hypotheses, sessions } = report;
  const rows = Math.ceil(convergence.coach.learners.length / COLUMNS);
  const width = MARGIN.sides * 2 + COLUMNS * FACET.width;
  const height = MARGIN.top + rows * FACET.height + MARGIN.bottom;
  const facets = convergence.coach.learners
    .map((coach, i) =>
      facet(
        coach,
        convergence.baseline.learners.find((l) => l.id === coach.id) ?? coach,
        hypotheses.learners.find((l) => l.id === coach.id),
        i,
        sessions,
      ),
    )
    .join("\n");
  const generation = escape(describeGeneration(report.coach.generation));
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${FONT}" role="img" aria-label="Skills Mastered by Session for six Simulated Learners under the Coach and under the Baseline">`,
    `<rect width="${width}" height="${height}" fill="${SURFACE}"/>`,
    `<text x="${MARGIN.sides + PLOT.left}" y="28" font-size="17" font-weight="600" fill="${INK}">Skills Mastered by Session: Coach vs Baseline</text>`,
    `<text x="${MARGIN.sides + PLOT.left}" y="46" font-size="11.5" fill="${INK_SOFT}">${sessions} Sessions, ${SKILLS.length} Skills, six Simulated Learners on identical seeds. Coach: ${generation}. Baseline: the fixed 8-of-10 gate.</text>`,
    legend(width - MARGIN.sides - PLOT.right - 176, 28),
    facets,
    `<text x="${MARGIN.sides + PLOT.left}" y="${height - 14}" font-size="10.5" fill="${INK_SOFT}">Regenerated from ${escape(reportName)} with pnpm eval:chart. Simulated Learners only; never a real child's data.</text>`,
    `</svg>`,
    "",
  ].join("\n");
}
