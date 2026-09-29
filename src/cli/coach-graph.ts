/**
 * Draw the Coach graph (ADR 0004) from the compiled graph itself, as
 * Mermaid, and put the drawing in the README between its markers. A test
 * fails when the README's drawing is not the compiled graph's.
 *
 *   pnpm coach:graph            # rewrite the drawing in README.md
 *   pnpm coach:graph --print    # print the Mermaid instead
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { coachGraphMermaid } from "@/coach/graph";

const README = "README.md";
const BEGIN = "<!-- BEGIN:coach-graph (pnpm coach:graph) -->";
const END = "<!-- END:coach-graph -->";

const { values } = parseArgs({ options: { print: { type: "boolean", default: false } } });

async function main(): Promise<void> {
  const mermaid = await coachGraphMermaid();
  if (values.print) {
    console.log(mermaid);
  } else {
    const readme = readFileSync(README, "utf8");
    const start = readme.indexOf(BEGIN);
    const end = readme.indexOf(END);
    if (start === -1 || end < start) {
      throw new Error(`${README} has no ${BEGIN} … ${END} markers`);
    }
    writeFileSync(README, `${readme.slice(0, start + BEGIN.length)}\n\`\`\`mermaid\n${mermaid}\n\`\`\`\n${readme.slice(end)}`);
    console.log(`Drew the Coach graph into ${README}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
