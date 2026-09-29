/**
 * The labelling page: every Story, Parent Summary and Hypothesis claim of the
 * labelled sets, one at a time with its evidence, served on localhost. Each
 * label is written as it is saved to docs/evals/labels/<set>.<labeller>.json,
 * to be committed. No account, no key, no network.
 *
 *   pnpm label --labeller second                # http://localhost:3300
 *   pnpm label --labeller owner --port 3301
 *   pnpm label --labeller second --dir /tmp/l   # somewhere other than docs/evals/labels
 *
 * The page shows nobody else's labels. Every item is labelled, the sealed
 * half included: labelling is not tuning, and the labels on the sealed half
 * are read only in a final run (src/evals/sealed.ts).
 */
import { createServer } from "node:http";
import { parseArgs } from "node:util";
import { labelFilePath, readLabels, writeLabels } from "@/evals/label-files";
import { labelState, respondLabel } from "@/evals/label-server";
import { claimItems, finalRun, storyItems, summaryItems } from "@/evals/sealed";

const { values } = parseArgs({
  options: {
    labeller: { type: "string" },
    port: { type: "string", default: "3300" },
    dir: { type: "string" },
  },
});

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const labeller = values.labeller ?? fail("Say who is labelling: pnpm label --labeller <name>, such as owner or second");
const access = finalRun("the labelling page: every item is labelled, the sealed half included");
const dir = values.dir;

let state: ReturnType<typeof labelState>;
try {
  state = labelState({
    labeller,
    items: { stories: storyItems(access), summaries: summaryItems(access), claims: claimItems(access) },
    files: { stories: readLabels("stories", labeller, access, dir), summaries: readLabels("summaries", labeller, access, dir), claims: readLabels("claims", labeller, access, dir) },
  });
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const server = createServer((request, response) => {
  let body = "";
  request.on("data", (chunk: Buffer) => (body += chunk.toString()));
  request.on("end", () => {
    try {
      const answer = respondLabel(state, { method: request.method ?? "GET", path: (request.url ?? "/").split("?")[0], body });
      if (answer.save) {
        const file = writeLabels(answer.save, dir);
        console.log(`${answer.save.set}: ${answer.save.labels.length} labelled, saved to ${file}`);
      }
      response.writeHead(answer.status, answer.type ? { "content-type": answer.type, "cache-control": "no-store" } : {});
      response.end(answer.body ?? "");
    } catch (error) {
      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    }
  });
});

const port = Number(values.port);
server.listen(port, "127.0.0.1", () => {
  const counts = (["stories", "summaries", "claims"] as const).map((set) => `${state.files[set].labels.length}/${state.views[set].length} ${set}`).join(", ");
  console.log(`Labelling page for ${labeller}: http://localhost:${port}  (${counts} labelled so far; Ctrl-C to stop)`);
  console.log(`Labels are written to ${labelFilePath("stories", labeller, dir).replace(/stories\./, "<set>.")}; commit them when you are done.`);
});
