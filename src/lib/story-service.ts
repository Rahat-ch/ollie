/**
 * The server's side of the Content Pool: answer a Story request from the
 * bundled Pool and the Pool that has grown on this host, write a missing
 * variant live and add it, or fall back to the template. The file is
 * re-read under a per-file lock just before a Story is added, so two
 * Stories written at once for one Session never lose each other.
 */
import type { Generation } from "@/generation/types";
import { BUNDLED_POOL } from "@/story/bundled";
import { addToPool, fillStory, type ContentPool, type FilledStory, type PoolInput } from "@/story/pool";
import { readPoolFile, writePoolFile } from "./pool-file";

export type StoryAnswer = Pick<FilledStory, "text" | "source">;

export type StoryServiceOptions = {
  readonly poolFile: string;
  readonly writer: Pick<Generation, "writeStory">;
  /** The Pool shipped with the app; the bundled one unless a test says otherwise. */
  readonly bundled?: ContentPool;
};

const locks = new Map<string, Promise<void>>();

/** Run `change` on the file's Pool after every earlier change to the same file has finished. */
function updatePoolFile(file: string, change: (pool: ContentPool) => ContentPool): Promise<void> {
  const previous = locks.get(file) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(async () => writePoolFile(file, change(await readPoolFile(file))));
  locks.set(file, next);
  return next;
}

export async function storyFor(options: StoryServiceOptions, input: PoolInput, variant = 0): Promise<StoryAnswer> {
  const { poolFile, writer, bundled = BUNDLED_POOL } = options;
  const grown = await readPoolFile(poolFile);
  const filled = await fillStory({ ...bundled, ...grown }, writer, input, variant);
  if (filled.source === "generated") {
    // The file keeps only what grew here; the bundled Pool ships with the app.
    await updatePoolFile(poolFile, (latest) => addToPool(latest, input, filled.text));
  }
  return { text: filled.text, source: filled.source };
}
