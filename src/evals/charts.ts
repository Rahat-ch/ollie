/**
 * One chart per eval score, drawn beside the convergence chart from a
 * report file and never from a live run: Evidence Integrity, detection of
 * the planted weaknesses, false positives, where the Session Plans came
 * from, and the validity of the Stories and of the Parent Summaries. Each
 * reads on its own — a title, a subtitle naming the Coach that ran and the
 * report's date, labelled marks — and every number on it is a number the
 * report holds or a share of two of them.
 */
import { pct } from "./format";
import {
  bar,
  count,
  GUTTER,
  GRID,
  INK,
  INK_SOFT,
  paper,
  rightEdge,
  SERIES,
  splitTag,
  STATUS,
  SURFACE,
  swatch,
  text,
  track,
  type Frame,
} from "./chart-kit";
import { describeWeakness, type WeaknessTag } from "./learners";
import { describeGeneration, type EvalReport } from "./report";
import type { Validity } from "./stats";
import type { Calibration } from "./judge";

const WIDTH = 720;
const RIGHT = rightEdge(WIDTH);

/** The report's date, as the day it was written in UTC. */
const reportDate = (report: EvalReport): string => report.generatedAt.slice(0, 10);

/** Every subtitle ends the same way: which Coach ran, and when the report was written. */
const runLine = (report: EvalReport): string =>
  `Coach: ${describeGeneration(report.coach.generation)}. Report ${reportDate(report)}.`;

const frame = (report: EvalReport, reportName: string, rest: Omit<Frame, "width" | "reportName" | "subtitle"> & { detail: string }): Frame => ({
  width: WIDTH,
  reportName,
  subtitle: `${rest.detail} ${runLine(report)}`,
  height: rest.height,
  title: rest.title,
  label: rest.label,
  note: rest.note,
});

/** The Coach's citations over both splits, which is every citation the report counted. */
function citations(report: EvalReport) {
  const learners = report.hypotheses.learners;
  const sum = (of: (l: (typeof learners)[number]) => number) => learners.reduce((total, l) => total + of(l), 0);
  const checked = sum((l) => l.evidence.citations);
  const unknownIds = sum((l) => l.evidence.unknownIds);
  const inconsistent = sum((l) => l.evidence.inconsistent);
  return { checked, unknownIds, inconsistent, integrity: checked === 0 ? 1 : 1 - (unknownIds + inconsistent) / checked };
}

/**
 * Evidence Integrity: the rate as the headline, then the three counts it is
 * made of, so 1.00 reads as "every citation the Coach made is a Problem the
 * engine showed it, and says what the claim says".
 */
export function renderEvidenceIntegrityChart(report: EvalReport, reportName: string): string {
  const { checked, unknownIds, inconsistent, integrity } = citations(report);
  const { tuning, heldOut } = report.hypotheses.splits;
  const splits = [
    { name: "Tuning Learners", data: tuning },
    { name: "Held-out Learners", data: heldOut },
  ];
  const widest = Math.max(1, ...splits.map((s) => s.data.citations));
  const barX = 196;
  const barWidth = 320;

  const figure = (y: number, value: number, label: string, colour: string) => [
    swatch(GUTTER + 216, y, colour),
    text(GUTTER + 300, y, count(value), { size: 22, weight: 600, anchor: "end" }),
    text(GUTTER + 312, y, label, { size: 11.5, fill: INK_SOFT }),
  ];

  const splitRow = (y: number, name: string, checkedHere: number, rate: number) => [
    text(GUTTER, y, name, { size: 11.5 }),
    track(barX, y - 10, barWidth, 12),
    bar(barX, y - 10, (checkedHere / widest) * barWidth, 12, STATUS.ok),
    text(barX + barWidth + 10, y, `${count(checkedHere)} citations · ${rate.toFixed(2)}`, { size: 11.5, fill: INK_SOFT }),
  ];

  return paper(
    frame(report, reportName, {
      height: 312,
      title: "Evidence Integrity: every citation checked against the Session Log",
      detail: "Every Problem ID cited by every Notes the Coach wrote, rejected attempts included, checked against the Log it was shown.",
      label: `Evidence Integrity ${integrity.toFixed(2)} over ${checked} Problem citations, with ${unknownIds} unknown Problem IDs and ${inconsistent} inconsistent citations`,
    }),
    [
      text(GUTTER, 136, integrity.toFixed(2), { size: 62, weight: 600, fill: STATUS.okInk }),
      text(GUTTER, 162, "Evidence Integrity", { size: 13.5, weight: 600 }),
      text(GUTTER, 179, "consistent citations over all citations", { size: 11, fill: INK_SOFT }),
      ...figure(104, checked, "Problem citations checked", STATUS.ok),
      ...figure(144, unknownIds, "cite a Problem ID not in the Log", STATUS.bad),
      ...figure(184, inconsistent, "disagree with their own claim", STATUS.bad),
      `<line x1="${GUTTER}" x2="${RIGHT}" y1="206" y2="206" stroke="${GRID}" stroke-width="1"/>`,
      text(GUTTER, 226, "Citations checked, by split", { size: 11.5, weight: 600, fill: INK }),
      ...splitRow(254, "Tuning Learners", tuning.citations, tuning.evidenceIntegrity),
      ...splitRow(280, "Held-out Learners", heldOut.citations, heldOut.evidenceIntegrity),
    ],
  );
}

const DETECTION_ROW = 48;

/**
 * Detection: one Session timeline per planted weakness, 1 to 20, marked at
 * the Session a supported Hypothesis first named it in its own words, or
 * called never.
 */
export function renderDetectionChart(report: EvalReport, reportName: string): string {
  const sessions = report.sessions;
  const rows = report.hypotheses.learners.flatMap((learner) =>
    learner.planted.map((tag) => ({ learner, tag, session: learner.sessionsToDetection[tag] ?? null })),
  );
  const { tuning, heldOut } = report.hypotheses.splits;
  const trackX = 240;
  const trackWidth = 350;
  const px = (session: number) => trackX + ((session - 1) / Math.max(1, sessions - 1)) * trackWidth;
  const top = 96;
  const axisY = top + rows.length * DETECTION_ROW + 6;
  const ticks = [1, 5, 10, 15, 20].filter((s) => s <= sessions);

  const row = (index: number, name: string, heldOutLearner: boolean, tag: WeaknessTag, session: number | null) => {
    const y = top + index * DETECTION_ROW;
    const mark = session
      ? `<circle cx="${px(session).toFixed(1)}" cy="${y + 14}" r="6" fill="${STATUS.okInk}" stroke="${SURFACE}" stroke-width="2"/>` +
        text(px(session), y - 2, `Session ${session}`, { size: 10.5, weight: 600, fill: STATUS.okInk, anchor: "middle" })
      : "";
    return [
      text(GUTTER, y + 11, name, { size: 12.5, weight: 600 }),
      text(GUTTER, y + 26, `${describeWeakness(tag)} · ${splitTag(heldOutLearner)}`, { size: 10.5, fill: INK_SOFT }),
      track(trackX, y + 8, trackWidth, 12),
      mark,
      text(RIGHT, y + 18, session ? `Session ${session}` : "never named", {
        size: 11.5,
        weight: 600,
        fill: session ? STATUS.okInk : STATUS.bad,
        anchor: "end",
      }),
    ];
  };

  return paper(
    frame(report, reportName, {
      height: axisY + 66,
      title: "Detection: the Session a planted weakness was first named",
      detail: `${sessions} Sessions per Simulated Learner. A weakness counts as named only when a supported Hypothesis says the pattern in its own words, never when it only names the Skill.`,
      label: `The Session each planted weakness was first named, over ${sessions} Sessions, for the ${rows.length} Simulated Learners with a weakness planted`,
    }),
    [
      text(GUTTER, 80, "Simulated Learner", { size: 10.5, fill: INK_SOFT }),
      text(RIGHT, 80, "first named", { size: 10.5, fill: INK_SOFT, anchor: "end" }),
      ...ticks.map((s) => `<line x1="${px(s).toFixed(1)}" x2="${px(s).toFixed(1)}" y1="${top + 2}" y2="${axisY}" stroke="${GRID}" stroke-width="1"/>`),
      ...rows.flatMap(({ learner, tag, session }, index) => row(index, learner.name, learner.heldOut, tag, session)),
      ...ticks.map((s) => text(px(s), axisY + 14, `${s}`, { size: 10, fill: INK_SOFT, anchor: "middle" })),
      text(trackX + trackWidth + 16, axisY + 14, "Session", { size: 10.5, fill: INK_SOFT }),
      text(
        GUTTER,
        axisY + 34,
        `Tuning ${tuning.detected} of ${tuning.planted} named · held out ${heldOut.detected} of ${heldOut.planted}`,
        { size: 11.5, fill: INK_SOFT },
      ),
    ],
  );
}

const FALSE_ROW = 32;

/**
 * False positives: per Simulated Learner, the supported Hypotheses, with
 * the ones naming a weakness that Learner does not have marked off the end
 * of the bar.
 */
export function renderFalsePositivesChart(report: EvalReport, reportName: string): string {
  const learners = report.hypotheses.learners;
  const { tuning, heldOut } = report.hypotheses.splits;
  const widest = Math.max(1, ...learners.map((l) => l.supportedHypotheses));
  const barX = 240;
  const barWidth = 280;
  const top = 100;
  const axisY = top + learners.length * FALSE_ROW + 4;
  const unit = barWidth / widest;
  const ticks = Array.from({ length: widest + 1 }, (_, i) => i).filter((i) => i % 2 === 0);

  const row = (index: number, name: string, heldOutLearner: boolean, supported: number, falsePositives: number) => {
    const y = top + index * FALSE_ROW;
    const supportedWidth = supported * unit;
    const falseWidth = falsePositives * unit;
    const fairWidth = supportedWidth - falseWidth - (falsePositives > 0 && falsePositives < supported ? 2 : 0);
    return [
      text(GUTTER, y + 13, name, { size: 12 }),
      text(GUTTER, y + 25, splitTag(heldOutLearner), { size: 10, fill: INK_SOFT }),
      bar(barX, y + 4, fairWidth, 14, STATUS.ok),
      bar(barX + supportedWidth - falseWidth, y + 4, falseWidth, 14, STATUS.bad),
      text(barX + supportedWidth + 10, y + 15, `${falsePositives} of ${supported}`, { size: 11, fill: INK_SOFT }),
    ];
  };

  return paper(
    frame(report, reportName, {
      height: axisY + 66,
      title: "False positives: Hypotheses naming a weakness the Learner does not have",
      detail: "Each bar is one Simulated Learner's distinct supported Hypotheses over the run; the marked end is the false ones.",
      label: "Supported Hypotheses per Simulated Learner, with the false positives marked",
    }),
    [
      swatch(GUTTER + 290, 84, STATUS.ok),
      text(GUTTER + 306, 84, "supported Hypotheses", { size: 11.5 }),
      swatch(GUTTER + 450, 84, STATUS.bad),
      text(GUTTER + 466, 84, "false positives", { size: 11.5 }),
      ...ticks.map((t) => `<line x1="${(barX + t * unit).toFixed(1)}" x2="${(barX + t * unit).toFixed(1)}" y1="${top}" y2="${axisY}" stroke="${GRID}" stroke-width="1"/>`),
      ...learners.flatMap((l, index) => row(index, l.name, l.heldOut, l.supportedHypotheses, l.falsePositives)),
      ...ticks.map((t) => text(barX + t * unit, axisY + 14, `${t}`, { size: 10, fill: INK_SOFT, anchor: "middle" })),
      text(barX + barWidth + 16, axisY + 14, "supported Hypotheses", { size: 10.5, fill: INK_SOFT }),
      text(
        GUTTER,
        axisY + 34,
        `Tuning ${tuning.falsePositives} of ${tuning.supportedHypotheses} false (${pct(tuning.falsePositiveRate)}) · held out ${heldOut.falsePositives} of ${heldOut.supportedHypotheses} (${pct(heldOut.falsePositiveRate)})`,
        { size: 11.5, fill: INK_SOFT },
      ),
    ],
  );
}

/**
 * Where the Session Plans came from: the Coach, the Coach after a retry, or
 * the Baseline fallback the engine drops to when it rejects the Coach's
 * Plan twice, over every Session the Coach planned.
 */
export function renderPlanSourcesChart(report: EvalReport, reportName: string): string {
  const { tuning, heldOut } = report.hypotheses.splits;
  const sources = [
    { name: "Coach", value: tuning.sources.coach + heldOut.sources.coach, colour: SERIES.coach, note: "the Plan the Coach wrote, accepted first time" },
    { name: "Coach after a retry", value: tuning.sources.retry + heldOut.sources.retry, colour: SERIES.retry, note: "rejected once, rewritten, then accepted" },
    { name: "Baseline fallback", value: tuning.sources.baseline + heldOut.sources.baseline, colour: SERIES.baseline, note: "rejected twice; the engine planned instead" },
  ];
  const total = sources.reduce((sum, s) => sum + s.value, 0);
  const barWidth = RIGHT - GUTTER;
  const barY = 88;

  let cursor = GUTTER;
  const segments = sources.flatMap((source) => {
    if (source.value === 0) return [];
    const width = (source.value / Math.max(1, total)) * barWidth;
    const drawn = bar(cursor, barY, width - (cursor + width < GUTTER + barWidth ? 2 : 0), 26, source.colour);
    cursor += width;
    return [drawn];
  });

  const row = (index: number, name: string, value: number, colour: string, note: string) => {
    const y = 146 + index * 34;
    return [
      swatch(GUTTER, y, colour),
      text(GUTTER + 18, y, name, { size: 12.5, weight: 600 }),
      text(GUTTER + 18, y + 15, note, { size: 10.5, fill: INK_SOFT }),
      text(RIGHT, y, `${count(value)} of ${count(total)}`, { size: 13, weight: 600, anchor: "end" }),
      text(RIGHT, y + 15, pct(value / Math.max(1, total)), { size: 10.5, fill: INK_SOFT, anchor: "end" }),
    ];
  };

  return paper(
    frame(report, reportName, {
      height: 278,
      title: "Where every Session Plan came from",
      detail: `All ${count(total)} Sessions the Coach planned: ${count(tuning.sources.coach + tuning.sources.retry + tuning.sources.baseline)} for the tuning Learners, ${count(heldOut.sources.coach + heldOut.sources.retry + heldOut.sources.baseline)} held out. Every Plan is checked against the Plan Space before it is used.`,
      label: `Session Plans by source over ${total} Sessions: Coach, Coach after a retry, Baseline fallback`,
    }),
    [
      track(GUTTER, barY, barWidth, 26),
      ...segments,
      text(GUTTER + 14, barY + 18, `${count(sources[0].value)} of ${count(total)} Sessions planned by the Coach`, { size: 12.5, weight: 600, fill: SURFACE }),
      ...sources.flatMap((s, index) => row(index, s.name, s.value, s.colour, s.note)),
    ],
  );
}

type ValidityChart = {
  readonly title: string;
  /** `Stories` or `Summaries`, as the thing counted. */
  readonly noun: string;
  readonly attemptsLabel: string;
  readonly judgeScore: string;
  readonly detail: string;
  readonly note?: string;
};

/** The validity chart both writers share: three labelled bars, then the Judge's gate. */
function renderValidityChart(
  report: EvalReport,
  reportName: string,
  validity: Validity,
  calibration: Calibration,
  judgeName: string,
  score: { readonly judged: number; readonly passed: number; readonly passRate: number } | null,
  chart: ValidityChart,
): string {
  const { sample } = validity;
  const firstAttempt = Math.round(validity.firstAttemptRate * sample);
  const valid = Math.round(validity.validRate * sample);
  const barX = 290;
  const barWidth = 230;
  const rows = [
    { label: "Valid on the first attempt", value: firstAttempt, colour: STATUS.ok },
    { label: chart.attemptsLabel, value: valid, colour: STATUS.ok },
    { label: "Template fallbacks", value: validity.templates, colour: STATUS.bad },
  ];
  const panelY = 212;
  const meterX = GUTTER + 16;
  const meterWidth = 300;
  const meterY = panelY + 70;

  const row = (index: number, label: string, value: number, colour: string) => {
    const y = 104 + index * 34;
    return [
      text(GUTTER, y + 14, label, { size: 12 }),
      track(barX, y + 3, barWidth, 14),
      bar(barX, y + 3, (value / Math.max(1, sample)) * barWidth, 14, colour),
      text(barX + barWidth + 12, y + 14, `${value} of ${sample} (${pct(value / Math.max(1, sample))})`, { size: 11.5, fill: INK_SOFT }),
    ];
  };

  return paper(
    frame(report, reportName, {
      height: 340,
      title: chart.title,
      detail: chart.detail,
      label: `${chart.noun} validity: ${firstAttempt} of ${sample} valid on the first attempt, ${validity.templates} template fallbacks, and the Judge's calibration gate`,
      note: chart.note,
    }),
    [
      ...rows.flatMap((r, index) => row(index, r.label, r.value, r.colour)),
      `<rect x="${GUTTER}" y="${panelY}" width="${RIGHT - GUTTER}" height="94" rx="12" fill="${SURFACE}" stroke="${GRID}" stroke-width="1"/>`,
      text(GUTTER + 16, panelY + 24, `The Judge (${judgeName}): ${score ? chart.judgeScore : "scores withheld"}`, {
        size: 13,
        weight: 600,
        fill: score ? STATUS.okInk : STATUS.bad,
      }),
      text(
        GUTTER + 16,
        panelY + 42,
        score
          ? `${score.passed} of ${score.judged} pass (${pct(score.passRate)}); the Judge cleared calibration first.`
          : `Below the threshold, so the Judge's scores are not reported.`,
        { size: 11, fill: INK_SOFT },
      ),
      text(GUTTER + 16, meterY - 8, `Agreed with the Calibration Set on ${calibration.agreements} of ${calibration.size} ${chart.noun} (${pct(calibration.agreement)})`, {
        size: 11,
        fill: INK_SOFT,
      }),
      track(meterX, meterY, meterWidth, 10),
      bar(meterX, meterY, calibration.agreement * meterWidth, 10, calibration.passes ? STATUS.ok : STATUS.bad),
      `<line x1="${(meterX + calibration.threshold * meterWidth).toFixed(1)}" x2="${(meterX + calibration.threshold * meterWidth).toFixed(1)}" y1="${meterY - 4}" y2="${meterY + 14}" stroke="${INK}" stroke-width="2"/>`,
      text(meterX + meterWidth + 12, meterY + 9, `threshold ${pct(calibration.threshold)}`, { size: 10.5, fill: INK_SOFT }),
    ],
  );
}

/** The Judge, said as the text report says it. */
const judgeName = (name: string): string => (name === "fake" ? "the fake Judge" : describeGeneration(name));

/** Story validity and the Judge's readability gate. */
export function renderStoryValidityChart(report: EvalReport, reportName: string): string {
  const { validity, judge, generation } = report.stories;
  return renderValidityChart(report, reportName, validity, judge.calibration, judgeName(judge.name), judge.readability, {
    title: "Story validity: what the validator accepted",
    noun: "Stories",
    attemptsLabel: "Valid within three attempts",
    judgeScore: "readability reported",
    detail: `${validity.sample} Stories, one per Theme and Unit 3 structure, written through ${describeGeneration(generation)} in ${validity.attempts} attempts and checked by the validator.`,
    note: "The engine owns the numbers; the Story only dresses them.",
  });
}

/** Parent Summary validity and the Judge's faithfulness gate. */
export function renderSummaryValidityChart(report: EvalReport, reportName: string): string {
  const { validity, judge, generation } = report.summaries;
  return renderValidityChart(report, reportName, validity, judge.calibration, judgeName(judge.name), judge.faithfulness, {
    title: "Parent Summary validity: what the validator accepted",
    noun: "Summaries",
    attemptsLabel: "Valid within two attempts",
    judgeScore: "faithfulness reported",
    detail: `${validity.sample} Parent Summaries, one for each Simulated Learner's last Session, written through ${describeGeneration(generation)} in ${validity.attempts} attempts and checked by the validator.`,
  });
}

/** Every chart drawn beside the convergence chart, by file name. */
export const EVAL_CHARTS: readonly { readonly file: string; readonly render: (report: EvalReport, reportName: string) => string }[] = [
  { file: "evidence-integrity.svg", render: renderEvidenceIntegrityChart },
  { file: "detection.svg", render: renderDetectionChart },
  { file: "false-positives.svg", render: renderFalsePositivesChart },
  { file: "plan-sources.svg", render: renderPlanSourcesChart },
  { file: "story-validity.svg", render: renderStoryValidityChart },
  { file: "summary-validity.svg", render: renderSummaryValidityChart },
];
