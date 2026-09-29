/**
 * The blind A/B of Ollie's voice (src/voice/ab). Renders the fixed set of
 * about 15 lines on two model and voice pairs, then serves a listening page
 * on localhost that plays each pair in random order and saves the tally.
 *
 *   pnpm voice:ab --b-voice <new voice id> --dry-run   # what it would render, and the characters it would spend
 *   pnpm voice:ab --b-voice <new voice id>             # A: the configured model and voice; B: eleven_v4 on the new voice
 *   pnpm voice:ab --a-model eleven_v3 --a-voice <id> --b-model eleven_v4 --b-voice <id>
 *   pnpm voice:ab --fake --out /tmp/voice-ab           # the Generation fake, a dry run of the script itself
 *   pnpm voice:ab --listen                             # the blind listening page on http://localhost:3200
 *
 * Side A defaults to ELEVENLABS_MODEL_ID and ELEVENLABS_VOICE_ID, read from
 * the environment or .env.local; side B to eleven_v4 and whatever --b-voice
 * names. Each side renders into its own directory under --out, named after
 * its model and voice, so a line already rendered on that pair is skipped
 * and a changed voice never reuses the old audio. The tally is written to
 * --tally, docs/voice/ab-tally.json by default, to be committed.
 */
import { randomInt } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { parseArgs } from "node:util";
import { writeAudioFile } from "@/lib/audio-file";
import { abCharacters, abLines, blindPairs, NEW_VOICE_MODEL_ID, respondAb, type AbLine, type AbSide, type AbSides, type AbState, type SideName } from "@/voice/ab";
import { audioFileName, audioKey, AUDIO_MIME } from "@/voice/key";
import { isCurrent, parseManifest, renditions, renditionTag, type Rendition } from "@/voice/manifest";
import { configuredVoice, elevenLabsApiKey } from "./generation";

const DEFAULT_OUT = "data/voice-ab";
/** The bundled audio and its manifest, as `pnpm voice:lines` writes them. */
const VOICE_DIR = "public/voice";
const MANIFEST_FILE = "src/voice/lines.generated.json";

const { values } = parseArgs({
  options: {
    "a-model": { type: "string" },
    "a-voice": { type: "string" },
    "b-model": { type: "string", default: NEW_VOICE_MODEL_ID },
    "b-voice": { type: "string" },
    "dry-run": { type: "boolean", default: false },
    fake: { type: "boolean", default: false },
    listen: { type: "boolean", default: false },
    port: { type: "string", default: "3200" },
    out: { type: "string", default: DEFAULT_OUT },
    tally: { type: "string", default: "docs/voice/ab-tally.json" },
  },
});

// Annotated, so TypeScript knows a check that fails never comes back.
const fail: (message: string) => never = (message) => {
  console.error(message);
  process.exit(1);
};

if (values.fake && path.resolve(values.out) === path.resolve(DEFAULT_OUT)) {
  fail(`--fake writes a stand-in, not audio: give --out somewhere other than ${DEFAULT_OUT}`);
}

/** What the render left for the listening page: the sides and the lines, in the order they were rendered. */
type AbRun = { readonly sides: AbSides; readonly lines: readonly AbLine[] };
const runFile = () => path.join(values.out, "ab.json");

/** Each side's audio sits in a directory named after its model and voice. */
const sideDir = (side: AbSide): string => path.join(values.out, renditionTag({ modelId: side.modelId, voiceId: side.voiceId }));
const clipFile = (side: AbSide, text: string): string => path.join(sideDir(side), audioFileName(text));

async function hasAudio(file: string): Promise<boolean> {
  try {
    return (await stat(file)).size > 0;
  } catch {
    return false;
  }
}

const describeSide = (side: AbSide): string => `${side.modelId} on ${side.voiceId ? `voice ${side.voiceId}` : "no voice given"}`;

async function render(): Promise<void> {
  const configured = configuredVoice();
  const sides: AbSides = {
    a: { modelId: values["a-model"] ?? configured.modelId, voiceId: values["a-voice"] ?? configured.voiceId ?? "" },
    b: { modelId: values["b-model"], voiceId: values["b-voice"] ?? "" },
  };
  if (sides.a.modelId === sides.b.modelId && sides.a.voiceId === sides.b.voiceId) fail(`A and B are the same model and voice (${describeSide(sides.a)}): nothing to compare`);
  const lines = abLines();
  console.log(`A: ${describeSide(sides.a)}.\nB: ${describeSide(sides.b)}.`);
  console.log(`${lines.length} lines (${[...new Set(lines.map((l) => l.kind))].join(", ")}), ${abCharacters(lines)} characters a side.\n`);

  const bundled = values.fake ? new Map<string, Rendition>() : renditions(parseManifest(JSON.parse(await readFile(MANIFEST_FILE, "utf8"))));
  const todo: { side: SideName; line: AbLine }[] = [];
  const reuse: { side: SideName; line: AbLine }[] = [];
  for (const side of ["a", "b"] as const) {
    for (const line of lines) {
      if (await hasAudio(clipFile(sides[side], line.text))) continue;
      // A bundled line the manifest records on exactly this model and voice is copied, not paid for again.
      const onThisSide = sides[side].voiceId !== "" && isCurrent(bundled.get(audioKey(line.text)), sides[side]);
      if (onThisSide && (await hasAudio(path.join(VOICE_DIR, audioFileName(line.text))))) reuse.push({ side, line });
      else todo.push({ side, line });
    }
  }
  const characters = todo.reduce((total, { line }) => total + line.text.length, 0);
  console.log(`${todo.length} clips to render (${todo.filter((t) => t.side === "a").length} on A, ${todo.filter((t) => t.side === "b").length} on B): ${characters} characters, which is what ElevenLabs charges for.`);
  if (reuse.length > 0) console.log(`${reuse.length} more copied from ${VOICE_DIR}, where the manifest records them on that model and voice.`);
  if (values["dry-run"]) {
    for (const { side, line } of todo.slice(0, 6)) console.log(`  ${side.toUpperCase()}  ${line.text}`);
    if (todo.length > 6) console.log(`  ... and ${todo.length - 6} more`);
    return;
  }
  if (!values.fake) for (const side of ["a", "b"] as const) if (!sides[side].voiceId) fail(`Side ${side.toUpperCase()} has no voice: give --${side}-voice`);

  for (const { side, line } of reuse) {
    await writeAudioFile(sideDir(sides[side]), audioFileName(line.text), new Uint8Array(await readFile(path.join(VOICE_DIR, audioFileName(line.text)))));
  }
  const renderers = await rendererFor(sides);
  let failed = 0;
  for (const { side, line } of todo) {
    try {
      const { audio } = await renderers[side].renderSpeech({ text: line.text });
      await writeAudioFile(sideDir(sides[side]), audioFileName(line.text), audio);
    } catch (error) {
      failed += 1;
      console.log(`${side.toUpperCase()} ${audioFileName(line.text)}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  await mkdir(values.out, { recursive: true });
  await writeFile(runFile(), `${JSON.stringify({ sides, lines } satisfies AbRun, null, 2)}\n`);
  console.log(`\nRendered ${todo.length - failed} clips to ${values.out}; ${failed} failed. Now: pnpm voice:ab --listen${values.out === DEFAULT_OUT ? "" : ` --out ${values.out}`}`);
}

async function rendererFor(sides: AbSides) {
  if (values.fake) {
    const { fakeGeneration } = await import("@/generation");
    return { a: fakeGeneration(), b: fakeGeneration() };
  }
  const apiKey = elevenLabsApiKey();
  const { elevenLabsGeneration } = await import("@/generation/elevenlabs");
  return { a: elevenLabsGeneration({ apiKey, ...sides.a }), b: elevenLabsGeneration({ apiKey, ...sides.b }) };
}

async function listen(): Promise<void> {
  let run: AbRun;
  try {
    run = JSON.parse(await readFile(runFile(), "utf8")) as AbRun;
  } catch {
    return fail(`No A/B has been rendered into ${values.out}: run pnpm voice:ab first`);
  }
  for (const side of ["a", "b"] as const) {
    for (const line of run.lines) if (!(await hasAudio(clipFile(run.sides[side], line.text)))) fail(`Side ${side.toUpperCase()} has no clip for "${line.text}": run pnpm voice:ab again`);
  }
  const state: AbState = { sides: run.sides, pairs: blindPairs(run.lines, () => randomInt(2 ** 32) / 2 ** 32), saved: undefined };

  const server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk: Buffer) => (body += chunk.toString()));
    request.on("end", () => {
      void (async () => {
        const answer = respondAb(state, { method: request.method ?? "GET", path: (request.url ?? "/").split("?")[0], body });
        if (answer.clip) {
          const audio = await readFile(clipFile(state.sides[answer.clip.side], answer.clip.text));
          response.writeHead(200, { "content-type": AUDIO_MIME, "cache-control": "no-store" });
          response.end(audio);
          return;
        }
        if (answer.save) {
          await mkdir(path.dirname(values.tally), { recursive: true });
          await writeFile(values.tally, `${JSON.stringify(answer.save, null, 2)}\n`);
          console.log(`Tally saved to ${values.tally}: A ${answer.save.wins.a}, B ${answer.save.wins.b}. Commit it with the decision.`);
        }
        response.writeHead(answer.status, answer.type ? { "content-type": answer.type, "cache-control": "no-store" } : {});
        response.end(answer.body ?? "");
      })().catch((error: unknown) => {
        response.writeHead(500);
        response.end(error instanceof Error ? error.message : String(error));
      });
    });
  });
  const port = Number(values.port);
  server.listen(port, "127.0.0.1", () => console.log(`Listening page: http://localhost:${port}  (${state.pairs.length} pairs; Ctrl-C to stop)`));
}

(values.listen ? listen() : render()).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
