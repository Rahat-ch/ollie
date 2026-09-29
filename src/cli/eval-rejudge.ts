/**
 * Judge stored reports' Stories again with the Story Judge as it stands
 * now, the gate first on the open half of the Story Calibration Set, and
 * print the stored readability beside the new one, how many new fails still
 * mention the placeholder, and every Story whose verdict changed. The
 * stored reports are not touched: the result is exploratory, after the
 * fact, and is written beside them as its own dated JSON and text.
 *
 *   pnpm eval:rejudge --report docs/evals/<date>.json [--report ...]   # Sonnet 5.5 Judge; needs ANTHROPIC_API_KEY
 *   pnpm eval:rejudge --fake --report docs/evals/<date>.json           # the fake Judge; no network
 *   pnpm eval:rejudge --report ... --out <dir>
 *
 * A live run writes under docs/evals; a fake run writes to the system's
 * temporary directory unless --out says otherwise, so it leaves nothing to
 * commit.
 */
import { tmpdir } from "node:os";
import { parseArgs } from "node:util";
import { readReport, writeRejudge } from "@/evals/files";
import { formatRejudgeRun, rejudgeRun } from "@/evals/rejudge";
import { EVALS_DIR } from "@/evals/report";
import { createRecorder } from "@/generation/telemetry";
import { chooseJudge } from "./generation";

const { values } = parseArgs({
  options: {
    report: { type: "string", multiple: true },
    fake: { type: "boolean", default: false },
    out: { type: "string" },
  },
});

const files = values.report ?? [];
if (files.length === 0) {
  console.error("Name at least one stored report: pnpm eval:rejudge --report docs/evals/<date>.json");
  process.exit(1);
}

async function main(): Promise<void> {
  // Read every report before the first call, so a bad path costs nothing.
  const reports = files.map((file) => ({ file, stories: readReport(file).stories }));
  const recorder = createRecorder();
  const { judge, name } = await chooseJudge(values.fake ? "fake" : "real", recorder);
  if (values.fake) console.log("The fake Judge is the validators' opinion and fails the gate by design, so readability is withheld.\n");
  const run = await rejudgeRun({ reports, judge, judgeName: name, recorder, generatedAt: new Date() });
  const text = formatRejudgeRun(run);
  const written = writeRejudge(run, text, values.out ?? (values.fake ? tmpdir() : EVALS_DIR));
  console.log(text);
  console.log("");
  console.log(`Re-judge: ${written.json}, ${written.text}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
