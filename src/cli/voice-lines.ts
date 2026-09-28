/**
 * Render every fixed Ollie line once and bundle it. For each line in the
 * catalogue (src/voice/lines) that has no audio yet, or whose audio was
 * rendered on another model or voice than the configured ones, render it on
 * the designed voice and write it to public/voice as <audio key>.mp3, then
 * rewrite src/voice/lines.generated.json, the manifest that records what
 * each line was rendered on (src/voice/manifest). A line already rendered on
 * the configured model and voice is skipped, so the script resumes and
 * running it twice changes nothing; changing ELEVENLABS_MODEL_ID or
 * ELEVENLABS_VOICE_ID makes every line stale.
 *
 *   pnpm voice:lines                        # Ollie's own hand-written lines: the Hints, the cheers, the Reveal, the end of a Session
 *   pnpm voice:lines --kinds ollie,problem  # and every Problem's spoken line, as the voice budget allows
 *   pnpm voice:lines --kinds problem --range standard  # every Problem the standards allow, not only the default ranges
 *   pnpm voice:lines --limit 100            # at most 100 lines this run
 *   pnpm voice:lines --dry-run              # what is missing or stale, and what it would cost in characters
 *   pnpm voice:lines --adopt                # record the configured voice on lines whose voice was never recorded; renders nothing
 *   pnpm voice:lines --fake --out /tmp/voice   # the Generation fake, a dry run of the script itself (its manifest is <out>/manifest.json)
 *
 * Ollie's own lines are the default because they are the spec's fixed lines
 * and the ones a Learner hears most; the Problems' lines are thousands and
 * are rendered as the budget allows (.scratch/k5-math/decisions.md).
 *
 * The key, the voice ID, and the model are read from the environment, or
 * from .env.local at the repo root when that file exists. Never hard-code a
 * voice: ELEVENLABS_VOICE_ID names the voice `pnpm voice:design` saved. A
 * dry run needs no key; with no voice ID configured it compares the model only.
 */
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { writeAudioFile } from "@/lib/audio-file";
import { mapLimit } from "@/lib/map-limit";
import type { SkillRange } from "@/loop";
import { audioFileName, audioKey } from "@/voice/key";
import { fixedLines, ollieLines, problemLines, type LineKind, type OllieLine } from "@/voice/lines";
import { adoptRendition, parseManifest, planRender, recordRendered, renditions, type ConfiguredVoice, type VoiceManifest } from "@/voice/manifest";
import { chooseRenderer, configuredVoice } from "./generation";

/** Where the bundled audio ships, and the manifest the app reads. */
export const VOICE_DIR = "public/voice";
export const MANIFEST_FILE = "src/voice/lines.generated.json";

const { values } = parseArgs({
  options: {
    kinds: { type: "string", default: "ollie" },
    range: { type: "string", default: "default" },
    limit: { type: "string" },
    concurrency: { type: "string", default: "3" },
    "dry-run": { type: "boolean", default: false },
    adopt: { type: "boolean", default: false },
    fake: { type: "boolean", default: false },
    out: { type: "string", default: VOICE_DIR },
  },
});

// Annotated, so TypeScript knows a check that fails never comes back.
const fail: (message: string) => never = (message) => {
  console.error(message);
  process.exit(1);
};

const kinds = values.kinds.split(",").map((kind) => kind.trim()) as LineKind[];
for (const kind of kinds) if (kind !== "ollie" && kind !== "problem") fail(`--kinds must be ollie, problem, or both, got "${kind}"`);
if (values.range !== "default" && values.range !== "standard") fail(`--range must be default or standard, got "${values.range}"`);
const range: SkillRange = values.range;
const limit = values.limit === undefined ? Infinity : Number(values.limit);
const concurrency = Number(values.concurrency);
for (const [name, value] of [["limit", limit], ["concurrency", concurrency]] as const) {
  if (!(value >= 1) || (Number.isFinite(value) && !Number.isInteger(value))) fail(`--${name} must be a positive integer`);
}
const shipping = path.resolve(values.out) === path.resolve(VOICE_DIR);
if (values.fake && shipping) {
  fail(`--fake writes a stand-in, not audio: give --out somewhere other than ${VOICE_DIR}`);
}
/** The app's manifest for the directory that ships; a manifest of its own beside the audio anywhere else. */
const manifestFile = shipping ? MANIFEST_FILE : path.join(values.out, "manifest.json");

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

async function readManifest(): Promise<VoiceManifest> {
  let text: string;
  try {
    text = await readFile(manifestFile, "utf8");
  } catch {
    return [];
  }
  return parseManifest(JSON.parse(text));
}

/** Writes the manifest, keeping only lines in the catalogue, so it never claims audio for a line nothing says any more. */
async function writeManifest(manifest: VoiceManifest): Promise<number> {
  const catalogue = new Set(fixedLines("standard").map((line) => audioKey(line.text)));
  const kept = manifest.map((group) => ({ ...group, keys: group.keys.filter((key) => catalogue.has(key)) })).filter((group) => group.keys.length > 0);
  await writeFile(manifestFile, `${JSON.stringify(kept, null, 2)}\n`);
  return kept.reduce((total, group) => total + group.keys.length, 0);
}

const describeVoice = ({ modelId, voiceId }: { readonly modelId: string; readonly voiceId: string | null | undefined }): string =>
  `${modelId} on ${voiceId === undefined ? "any voice (none configured)" : voiceId === null ? "a voice never recorded" : `voice ${voiceId}`}`;

/** How many of the stale lines were rendered on each model and voice, so a dry run says why they are stale. */
function staleBy(stale: readonly OllieLine[], manifest: VoiceManifest): string[] {
  const byKey = renditions(manifest);
  const counts = new Map<string, number>();
  for (const line of stale) {
    const rendition = byKey.get(audioKey(line.text));
    const said = rendition ? describeVoice(rendition) : "nothing the manifest records";
    counts.set(said, (counts.get(said) ?? 0) + 1);
  }
  return [...counts].map(([said, count]) => `  ${count} rendered on ${said}`);
}

async function adopt(configured: ConfiguredVoice): Promise<void> {
  if (configured.voiceId === undefined) fail("--adopt records the configured voice, and ELEVENLABS_VOICE_ID is not set");
  const { manifest, adopted } = adoptRendition(await readManifest(), { modelId: configured.modelId, voiceId: configured.voiceId });
  if (values["dry-run"]) {
    console.log(`Would record ${describeVoice(configured)} on ${adopted} lines whose voice was never recorded.`);
    return;
  }
  await writeManifest(manifest);
  console.log(`Recorded ${describeVoice(configured)} on ${adopted} lines whose voice was never recorded, in ${manifestFile}. Nothing was rendered.`);
}

async function main(): Promise<void> {
  const configured = configuredVoice();
  if (values.adopt) return adopt(configured);

  const wanted: OllieLine[] = [
    ...(kinds.includes("ollie") ? ollieLines() : []),
    ...(kinds.includes("problem") ? problemLines(range) : []),
  ];
  const have = await rendered(values.out);
  const manifest = await readManifest();
  const plan = planRender(wanted, have, manifest, configured);
  const todo = [...plan.missing, ...plan.stale].slice(0, limit);
  const characters = todo.reduce((total, line) => total + line.text.length, 0);

  console.log(`Voice: ${values.fake ? "fake" : "ElevenLabs"}, configured as ${describeVoice(configured)}. Audio: ${values.out} (${have.size} lines on disk); manifest: ${manifestFile}.`);
  console.log(
    `${wanted.length} lines in the catalogue (${kinds.join(", ")}; ${range} ranges); ${plan.missing.length} without audio, ${plan.stale.length} stale, ${plan.current.length} current; rendering ${todo.length} now.`,
  );
  if (plan.stale.length > 0) console.log(`Stale, because the configured model or voice is not what they were rendered on:\n${staleBy(plan.stale, manifest).join("\n")}`);
  console.log(`${characters} characters, which is what ElevenLabs charges for.\n`);
  if (todo.length === 0) {
    console.log("Nothing to render.");
    return;
  }
  if (values["dry-run"]) {
    for (const line of todo.slice(0, 10)) console.log(`  ${audioFileName(line.text)}  ${line.text}`);
    if (todo.length > 10) console.log(`  ... and ${todo.length - 10} more`);
    return;
  }

  const { renderer, name } = await chooseRenderer(values.fake ? "fake" : "real");
  console.log(`Rendering on ${name}.\n`);
  const done: string[] = [];
  let failed = 0;
  const started = performance.now();
  try {
    await mapLimit(todo, concurrency, async (line) => {
      try {
        const { audio } = await renderer.renderSpeech({ text: line.text });
        await writeAudioFile(values.out, audioFileName(line.text), audio);
        done.push(audioKey(line.text));
      } catch (error) {
        failed += 1;
        console.log(`${audioFileName(line.text)}: ${error instanceof Error ? error.message : String(error)}`);
      }
      const seen = done.length + failed;
      if (seen % 25 === 0 || seen === todo.length) {
        console.log(`${seen} of ${todo.length}: ${done.length} rendered, ${failed} failed, ${Math.round((performance.now() - started) / 1000)} s`);
      }
    });
  } finally {
    // Recorded even when a run is cut short, so what was rendered is known to have been.
    const recorded = await writeManifest(recordRendered(manifest, await rendered(values.out), done, configured));
    console.log(`\nRendered ${done.length} lines to ${values.out}; ${failed} failed. ${recorded} lines in ${manifestFile}.`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
