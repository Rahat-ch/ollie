/**
 * The Content Pool's run-time additions on disk: one JSON file on the
 * persistent volume, read before a miss is generated and rewritten after.
 * The only I/O the Pool has; the Pool itself is plain data (src/story/pool).
 */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ContentPool } from "@/story/pool";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The Pool in the file, or empty when there is no file or it is not a Pool. */
export async function readPoolFile(file: string): Promise<ContentPool> {
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch {
    return {};
  }
  try {
    const value: unknown = JSON.parse(text);
    if (!isRecord(value)) return {};
    const pool: Record<string, string[]> = {};
    for (const [key, variants] of Object.entries(value)) {
      if (Array.isArray(variants) && variants.every((v) => typeof v === "string")) pool[key] = variants;
    }
    return pool;
  } catch {
    return {};
  }
}

let writes = 0;

/** Write the whole Pool, sorted by key, through a temporary file of its own so a reader never sees half of it and two writes never share one. */
export async function writePoolFile(file: string, pool: ContentPool): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const sorted = Object.fromEntries(Object.keys(pool).sort().map((key) => [key, pool[key]]));
  writes += 1;
  const temporary = `${file}.${process.pid}.${writes}.tmp`;
  await writeFile(temporary, JSON.stringify(sorted, null, 2) + "\n");
  await rename(temporary, file);
}
