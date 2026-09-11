import { getSkill, SKILLS } from "./skills";
import type { Equation, ProfileState, SessionResult, SkillId } from "./types";

const ASSISTANCE_LABEL = {
  "first-try-correct": "first-try correct",
  "hint-assisted-correct": "Hint-assisted correct",
  revealed: "Revealed",
  unresolved: "unresolved",
} as const;

/** `7 + ? = 10`: the Equation with its unknown blanked. */
export function formatEquation(equation: Equation): string {
  const slot = (name: Equation["unknown"], value: number) =>
    equation.unknown === name ? "?" : String(value);
  return `${slot("left", equation.left)} ${equation.op} ${slot("right", equation.right)} = ${slot("result", equation.result)}`;
}

/** Pad each column to its widest cell, two spaces between columns. */
export function table(rows: string[][]): string[] {
  const widths = rows[0].map((_, col) => Math.max(...rows.map((r) => r[col].length)));
  return rows.map((row) => row.map((cell, col) => cell.padEnd(widths[col])).join("  ").trimEnd());
}

/** The Session Log, then the Knowledge Estimates and Mastery decisions, as plain text. */
export function formatSessionLog(result: SessionResult): string {
  const { log, profile } = result;
  const lines: string[] = [];
  lines.push(`Session ${log.sessionNumber} (seed ${log.seed})`, "");
  lines.push(
    ...table([
      ["#", "ID", "Skill", "Role", "Structure", "Problem", "Answer", "Assistance", "First try (ms)"],
      ...log.entries.map((entry) => [
        String(entry.position),
        entry.problem.id,
        entry.problem.skill,
        entry.problem.review ? "review" : "planned",
        entry.problem.structure,
        formatEquation(entry.problem.equation),
        String(entry.problem.answer),
        ASSISTANCE_LABEL[entry.assistance],
        entry.attempts[0] ? String(entry.attempts[0].responseMs) : "-",
      ]),
    ]),
  );
  lines.push("", formatEstimates(profile, result.newlyMastered));
  return lines.join("\n");
}

/** The Knowledge Estimates and Mastery decisions per Skill, as a table. */
export function formatEstimates(profile: ProfileState, newlyMastered: readonly SkillId[] = []): string {
  return [
    "Knowledge Estimates",
    "",
    ...table([
      ["Skill", "Estimate", "Last 10 first attempts", "Mastered"],
      ...SKILLS.map(({ id }) => {
        const state = profile.skills[id];
        const newly = newlyMastered.includes(id) ? " (this Session)" : "";
        return [
          getSkill(id).name,
          state.estimate.toFixed(3),
          state.recentFirstAttempts.map((c) => (c ? "1" : "0")).join("") || "-",
          (state.mastered ? "yes" : "no") + newly,
        ];
      }),
    ]),
  ].join("\n");
}

/**
 * One line per Session: the mix, the Review count, the first-try count, and
 * what changed. For watching many Sessions go by.
 */
export function formatSessionLine(result: SessionResult): string {
  const { log } = result;
  const planned = new Map<SkillId, number>(log.plan.skills.map((s) => [s.skill, 0]));
  let review = 0;
  for (const { problem } of log.entries) {
    if (problem.review) review += 1;
    else planned.set(problem.skill, (planned.get(problem.skill) ?? 0) + 1);
  }
  const mix = [...planned].filter(([, n]) => n > 0).map(([skill, n]) => `${skill} x${n}`);
  if (review > 0) mix.push(`review x${review}`);
  const firstTry = log.entries.filter((e) => e.assistance === "first-try-correct").length;
  const changes = [
    ...result.newlyMastered.map((id) => `Mastered ${id}`),
    ...result.newlyUnlockedUnits.map((unit) => `Unit ${unit} unlocked`),
  ];
  return [
    `Session ${log.sessionNumber}: ${mix.join(", ")}`,
    `first-try ${firstTry}/${log.entries.length}`,
    changes.length > 0 ? changes.join("; ") : "no change",
  ].join("; ");
}
