/**
 * Render every fixed Ollie line once and bundle it. For each line in the
 * catalogue (src/voice/lines) that has no audio yet, render it on the
 * designed voice and write it to public/voice as <audio key>.mp3, then
 * rewrite src/voice/lines.generated.json from what is actually on disk. A
 * line that already has a file is skipped, so the script resumes and running
 * it twice changes nothing.
 *
 *   pnpm voice:lines                     # Ollie's lines and the Problems' lines in the Skills' default ranges
 *   pnpm voice:lines --kinds ollie       # Ollie's own hand-written lines only: the Hints, cheers, Reveal, Mastered
 *   pnpm voice:lines --range standard    # every Problem the standards allow, not only the default ranges
 *   pnpm voice:lines --limit 100         # at most 100 new lines this run
 *   pnpm voice:lines --dry-run           # what is left to render, and what it would cost in characters
 *   pnpm voice:lines --fake --out /tmp/voice   # the Generation fake, a dry run of the script itself
 *
 * The key, the voice ID, and the model are read from the environment, or
 * from .env.local at the repo root when that file exists. Never hard-code a
 * voice: ELEVENLABS_VOICE_ID names the voice `pnpm voice:design` saved.
 */
import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { writeAudioFile } from "@/lib/audio-file";
import { mapLimit } from "@/lib/map-limit";
import { audioFileName, audioKey } from "@/voice/key";
import { fixedLines, ollieLines, problemLines, type LineKind, type LineRange, type OllieLine } from "@/voice/lines";
import { chooseRenderer } from "./generation";

/** Where the bundled audio ships, and the manifest the app reads. */
export const VOICE_DIR = "public/voice";
export const MANIFEST_FILE = "src/voice/lines.generated.json";

const { values } = parseArgs({
  options: {
    kinds: { type: "string", default: "ollie,problem" },
    range: { type: "string", default: "default" },
    limit: { type: "string" },
    concurrency: { type: "string", default: "4" },
    "dry-run": { type: "boolean", default: false },
    fake: { type: "boolean", default: false },
    out: { type: "string", default: VOICE_DIR },
  },
});

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const kinds = values.kinds.split(",").map((kind) => kind.trim()) as LineKind[];
for (const kind of kinds) if (kind !== "ollie" && kind !== "problem") fail(`--kinds must be ollie, problem, or both, got "${kind}"`);
if (values.range !== "default" && values.range !== "standard") fail(`--range must be default or standard, got "${values.range}"`);
const range: LineRange = values.range as LineRange;
const limit = values.limit === undefined ? Infinity : Number(values.limit);
const concurrency = Number(values.concurrency);
for (const [name, value] of [["limit", limit], ["concurrency", concurrency]] as const) {
  if (!(value >= 1) || (Number.isFinite(value) && !Number.isInteger(value))) fail(`--${name} must be a positive integer`);
}
if (values.fake && path.resolve(values.out) === path.resolve(VOICE_DIR)) {
  fail(`--fake writes a stand-in, not audio: give --out somewhere other than ${VOICE_DIR}`);
}

/** The audio keys already on disk, ignoring an empty file left by a run that was stopped. */
async function rendered(dir: string): Promise<Set<string>> {
  const keys = new Set<string>();
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return keys;
  }
  for (const name of names) {
    if (!name.endsWith(".mp3")) continue;
    const { size } = await stat(path.join(dir, name));
    if (size > 0) keys.add(name.slice(0, -".mp3".length));
  }
  return keys;
}

/** The manifest as what is actually on disk for a line in the catalogue, sorted, so it never claims audio that is not there. */
async function writeManifest(dir: string): Promise<number> {
  const onDisk = await rendered(dir);
  const keys = fixedLines("standard")
    .map((line) => audioKey(line.text))
    .filter((key) => onDisk.has(key))
    .sort();
  await writeFile(MANIFEST_FILE, `${JSON.stringify(keys, null, 2)}\n`);
  return keys.length;
}

async function main(): Promise<void> {
  const wanted: OllieLine[] = [
    ...(kinds.includes("ollie") ? ollieLines() : []),
    ...(kinds.includes("problem") ? problemLines(range) : []),
  ];
  const have = await rendered(values.out);
  const missing = wanted.filter((line) => !have.has(audioKey(line.text)));
  const todo = missing.slice(0, limit);
  const characters = todo.reduce((total, line) => total + line.text.length, 0);

  console.log(`Voice: ${values.fake ? "fake" : "ElevenLabs"}. Audio: ${values.out} (${have.size} lines rendered).`);
  console.log(`${wanted.length} lines in the catalogue (${kinds.join(", ")}; ${range} ranges); ${missing.length} without audio; rendering ${todo.length} now.`);
  console.log(`${characters} characters, which is what ElevenLabs charges for.\n`);
  if (values["dry-run"]) {
    for (const line of todo.slice(0, 10)) console.log(`  ${audioFileName(line.text)}  ${line.text}`);
    if (todo.length > 10) console.log(`  ... and ${todo.length - 10} more`);
    return;
  }

  const { renderer, name } = await chooseRenderer(values.fake ? "fake" : "real");
  console.log(`Rendering on ${name}.\n`);
  let done = 0;
  let failed = 0;
  const started = performance.now();
  await mapLimit(todo, concurrency, async (line) => {
    try {
      const { audio } = await renderer.renderSpeech({ text: line.text });
      await writeAudioFile(values.out, audioFileName(line.text), audio);
      done += 1;
    } catch (error) {
      failed += 1;
      console.log(`${audioFileName(line.text)}: ${error instanceof Error ? error.message : String(error)}`);
    }
    const seen = done + failed;
    if (seen % 25 === 0 || seen === todo.length) {
      console.log(`${seen} of ${todo.length}: ${done} rendered, ${failed} failed, ${Math.round((performance.now() - started) / 1000)} s`);
    }
  });

  console.log(`\nRendered ${done} lines to ${values.out}; ${failed} failed.`);
  if (path.resolve(values.out) === path.resolve(VOICE_DIR)) {
    console.log(`${await writeManifest(values.out)} lines in ${MANIFEST_FILE}.`);
  } else {
    console.log(`${MANIFEST_FILE} not rewritten: --out is not ${VOICE_DIR}, the directory that ships.`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
