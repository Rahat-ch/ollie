import { getSkill, SKILLS } from "@/loop";
import { table } from "@/loop/format";
import type { ConvergenceReport } from "./convergence";

export const pct = (share: number): string => `${Math.round(share * 100)}%`;

/** The convergence results as a table: Sessions to Mastery per Skill and the band share, per Learner and per split. */
export function formatConvergence(report: ConvergenceReport): string {
  const { min, max } = report.targetAccuracyBand;
  const splits = [report.splits.tuning, report.splits.heldOut];
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
    "",
    ...table([
      ["Split", "Learners", "Skills Mastered (mean)", "First-try (mean)", "In band (mean)"],
      ...splits.map((s) => [
        s.split === "held-out" ? "held out" : "tuning",
        s.learners.join(", "),
        s.meanSkillsMastered.toFixed(2),
        pct(s.meanFirstTryRate),
        pct(s.meanInBandShare),
      ]),
    ]),
  ].join("\n");
}
