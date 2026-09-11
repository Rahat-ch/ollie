import { getSkill, SKILLS } from "@/loop";
import type { ConvergenceReport } from "./convergence";

function table(rows: string[][]): string[] {
  const widths = rows[0].map((_, col) => Math.max(...rows.map((r) => r[col].length)));
  return rows.map((row) => row.map((cell, col) => cell.padEnd(widths[col])).join("  ").trimEnd());
}

const pct = (share: number): string => `${Math.round(share * 100)}%`;

/** The convergence results as a table: Sessions to Mastery per Skill and the band share, per Learner. */
export function formatConvergence(report: ConvergenceReport): string {
  const { min, max } = report.targetAccuracyBand;
  return [
    `Convergence under the ${report.planner}, ${report.sessions} Sessions per Simulated Learner`,
    `Sessions to Mastery per Skill (- never); in band: share of Problems whose true first-try chance is ${min} to ${max}`,
    "",
    ...table([
      ["Learner", "Split", ...SKILLS.map((s) => getSkill(s.id).name), "First-try", "In band"],
      ...report.learners.map((l) => [
        l.name,
        l.heldOut ? "held out" : "tuning",
        ...SKILLS.map((s) => l.sessionsToMastery[s.id]?.toString() ?? "-"),
        pct(l.firstTryRate),
        pct(l.inBandShare),
      ]),
    ]),
  ].join("\n");
}
