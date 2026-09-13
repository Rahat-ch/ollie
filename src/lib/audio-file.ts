/**
 * Rendered audio on the persistent volume: the Content Pool's audio, one file
 * per line, named after what the line says (src/voice/key). The name is an
 * address and not a hiding place — a line with the Nickname in it is spoken
 * by the file it names — but nothing here ties a line to a Profile (ADR
 * 0002). The only I/O the speech service has.
 */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/** The audio in the file, or nothing when it was never rendered here. */
export async function readAudioFile(dir: string, name: string): Promise<Uint8Array | undefined> {
  try {
    return new Uint8Array(await readFile(path.join(dir, name)));
  } catch {
    return undefined;
  }
}

let writes = 0;

/** Write through a temporary file of its own, so a reader never gets half a line and two writes never share one. */
export async function writeAudioFile(dir: string, name: string, audio: Uint8Array): Promise<void> {
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, name);
  writes += 1;
  const temporary = `${file}.${process.pid}.${writes}.tmp`;
  await writeFile(temporary, audio);
  await rename(temporary, file);
}
