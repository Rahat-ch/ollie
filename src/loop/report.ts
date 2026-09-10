import { getSkill, SKILLS } from "./skills";
import type { Equation, SessionResult } from "./types";

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

function padEnd(text: string, width: number): string {
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

function table(rows: string[][]): string[] {
  const widths = rows[0].map((_, col) => Math.max(...rows.map((r) => r[col].length)));
  return rows.map((row) => row.map((cell, col) => padEnd(cell, widths[col])).join("  ").trimEnd());
}

/** The Session Log, then the Knowledge Estimates and Mastery decisions, as plain text. */
export function formatSessionReport(result: SessionResult): string {
  const { log, profile } = result;
  const lines: string[] = [];
  lines.push(`Session ${log.sessionNumber} (seed ${log.seed})`, "");
  lines.push(
    ...table([
      ["#", "ID", "Skill", "Structure", "Problem", "Answer", "Assistance", "First try (ms)"],
      ...log.entries.map((entry) => [
        String(entry.position),
        entry.problem.id,
        entry.problem.skill,
        entry.problem.structure,
        formatEquation(entry.problem.equation),
        String(entry.problem.answer),
        ASSISTANCE_LABEL[entry.assistance],
        entry.attempts[0] ? String(entry.attempts[0].responseMs) : "-",
      ]),
    ]),
  );
  lines.push("", "Knowledge Estimates", "");
  lines.push(
    ...table([
      ["Skill", "Estimate", "Last 10 first attempts", "Mastered"],
      ...SKILLS.map(({ id }) => {
        const state = profile.skills[id];
        const newly = result.newlyMastered.includes(id) ? " (this Session)" : "";
        return [
          getSkill(id).name,
          state.estimate.toFixed(3),
          state.recentFirstAttempts.map((c) => (c ? "1" : "0")).join("") || "-",
          (state.mastered ? "yes" : "no") + newly,
        ];
      }),
    ]),
  );
  return lines.join("\n");
}
