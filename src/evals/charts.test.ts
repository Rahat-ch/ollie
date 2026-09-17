/**
 * The six eval charts, drawn from the committed fake report so the test
 * checks the drawing and not a fresh run: each is well-formed XML on the
 * paper surface, names the Coach that ran and the report's date, and
 * carries the report's own numbers as text.
 */
import path from "node:path";
import { describe, expect, it } from "vitest";
import { colors } from "@/design/tokens";
import {
  EVAL_CHARTS,
  renderDetectionChart,
  renderEvidenceIntegrityChart,
  renderFalsePositivesChart,
  renderPlanSourcesChart,
  renderStoryValidityChart,
  renderSummaryValidityChart,
} from "@/evals/charts";
import { readReport } from "@/evals/files";

const REPORT_FILE = "docs/evals/2026-09-13T17-38-41Z.json";
const REPORT_NAME = path.basename(REPORT_FILE);
const report = readReport(REPORT_FILE);
const draw = (render: (r: typeof report, name: string) => string) => render(report, REPORT_NAME);

const TAG = /<(\/?)([a-zA-Z][\w:.-]*)((?:\s+[\w:.-]+="[^"]*")*)\s*(\/?)>/g;

/** Everything about the SVG that is not well-formed XML: stray markup, an unquoted attribute, an element left open. */
function xmlProblems(svg: string): string[] {
  const problems: string[] = [];
  const open: string[] = [];
  let cursor = 0;
  for (const match of svg.matchAll(TAG)) {
    if (/[<>]/.test(svg.slice(cursor, match.index))) problems.push(`markup that does not parse before <${match[2]}>`);
    cursor = match.index + match[0].length;
    if (match[1] === "/") {
      if (open.pop() !== match[2]) problems.push(`</${match[2]}> closes an element that is not open`);
    } else if (match[4] !== "/") {
      open.push(match[2]);
    }
  }
  if (/[<>]/.test(svg.slice(cursor))) problems.push("markup that does not parse at the end");
  if (open.length > 0) problems.push(`left open: ${open.join(", ")}`);
  return problems;
}

describe("the eval charts", () => {
  it("draws one well-formed SVG per eval score, on paper, small enough to read in the video", () => {
    expect(EVAL_CHARTS.map((chart) => chart.file)).toEqual([
      "evidence-integrity.svg",
      "detection.svg",
      "false-positives.svg",
      "plan-sources.svg",
      "story-validity.svg",
      "summary-validity.svg",
    ]);
    for (const chart of EVAL_CHARTS) {
      const svg = chart.render(report, REPORT_NAME);
      expect(xmlProblems(svg), chart.file).toEqual([]);
      expect(svg.startsWith("<svg"), chart.file).toBe(true);
      expect(svg, chart.file).toContain(`fill="${colors.paper}"`);
      expect(Buffer.byteLength(svg), chart.file).toBeLessThan(12 * 1024);
    }
  });

  it("names the Coach that ran and the report's date in every subtitle, and the report it came from", () => {
    for (const chart of EVAL_CHARTS) {
      const svg = chart.render(report, REPORT_NAME);
      expect(svg, chart.file).toContain("Coach: the Generation fake.");
      expect(svg, chart.file).toContain("Report 2026-09-13.");
      expect(svg, chart.file).toContain(REPORT_NAME);
    }
  });

  it("puts the report's Evidence Integrity rate and citation counts on the integrity chart", () => {
    const svg = draw(renderEvidenceIntegrityChart);
    const { tuning, heldOut } = report.hypotheses.splits;
    expect(svg).toContain(">1.00<");
    expect(svg).toContain(`>${(tuning.citations + heldOut.citations).toLocaleString("en-US")}<`);
    expect(svg).toContain(`${tuning.citations.toLocaleString("en-US")} citations · ${tuning.evidenceIntegrity.toFixed(2)}`);
    expect(svg).toContain(`${heldOut.citations.toLocaleString("en-US")} citations · ${heldOut.evidenceIntegrity.toFixed(2)}`);
    expect(svg).toContain(">0<");
  });

  it("puts every planted Learner on the detection timeline, marked at the Session or called never", () => {
    const svg = draw(renderDetectionChart);
    const planted = report.hypotheses.learners.filter((learner) => learner.planted.length > 0);
    expect(planted).toHaveLength(2);
    for (const learner of planted) {
      expect(svg).toContain(learner.name);
      for (const tag of learner.planted) {
        const session = learner.sessionsToDetection[tag];
        expect(svg).toContain(session ? `Session ${session}` : "never named");
      }
    }
    expect(svg).toContain(`Tuning ${report.hypotheses.splits.tuning.detected} of ${report.hypotheses.splits.tuning.planted} named`);
    expect(svg).toContain(">20<");
  });

  it("puts each Learner's false positives against its supported Hypotheses", () => {
    const svg = draw(renderFalsePositivesChart);
    for (const learner of report.hypotheses.learners) {
      expect(svg).toContain(learner.name);
      expect(svg).toContain(`${learner.falsePositives} of ${learner.supportedHypotheses}`);
    }
    expect(svg).toContain("Tuning 3 of 18 false (17%) · held out 0 of 8 (0%)");
  });

  it("splits every Session Plan between the Coach, a retry, and the Baseline fallback", () => {
    const svg = draw(renderPlanSourcesChart);
    const { tuning, heldOut } = report.hypotheses.splits;
    const total = Object.values(tuning.sources).reduce((a, b) => a + b, 0) + Object.values(heldOut.sources).reduce((a, b) => a + b, 0);
    expect(total).toBe(120);
    expect(svg).toContain(`${tuning.sources.coach + heldOut.sources.coach} of ${total}`);
    expect(svg).toContain(">Coach after a retry<");
    expect(svg).toContain(">Baseline fallback<");
    expect(svg).toContain(`>0 of ${total}<`);
  });

  it("puts Story validity and the Judge's withheld gate on the Story chart", () => {
    const svg = draw(renderStoryValidityChart);
    const { validity, judge } = report.stories;
    expect(judge.readability).toBeNull();
    expect(svg).toContain(`${validity.sample} of ${validity.sample} (100%)`);
    expect(svg).toContain(`${validity.templates} of ${validity.sample} (0%)`);
    expect(svg).toContain("scores withheld");
    expect(svg).toContain(`${judge.calibration.agreements} of ${judge.calibration.size} Stories (60%)`);
    expect(svg).toContain("threshold 80%");
  });

  it("puts Parent Summary validity and the Judge's withheld gate on the Summary chart", () => {
    const svg = draw(renderSummaryValidityChart);
    const { validity, judge } = report.summaries;
    expect(judge.faithfulness).toBeNull();
    expect(svg).toContain(`${validity.sample} of ${validity.sample} (100%)`);
    expect(svg).toContain("scores withheld");
    expect(svg).toContain(`${judge.calibration.agreements} of ${judge.calibration.size} Summaries (60%)`);
  });
});
