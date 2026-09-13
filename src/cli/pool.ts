/**
 * Fill the Content Pool: for every Theme, Unit 3 Skill and structure, and
 * equation in the Skill's default range, write a Story on Sonnet 5 with
 * the Nickname placeholder, keep it if the validator allows it, and save
 * the lot to src/story/pool.generated.json, which ships with the app. Keys
 * that already have enough variants are skipped, so the script resumes.
 *
 *   pnpm pool                          # every Theme, one variant per key; needs ANTHROPIC_API_KEY
 *   pnpm pool --themes puppies,space   # some Themes only
 *   pnpm pool --variants 2             # up to two variants per key
 *   pnpm pool --range standard         # every equation in the Skills' standard ranges (2 to 20), not only the defaults
 *   pnpm pool --limit 50               # at most 50 new Stories this run
 *   pnpm pool --fake --out /tmp/p.json # the Generation fake, a dry run of the script
 *
 * The key is read from the environment, or from .env.local at the repo
 * root when that file exists.
 */
import { parseArgs } from "node:util";
import { mapLimit } from "@/lib/map-limit";
import { readPoolFile, writePoolFile } from "@/lib/pool-file";
import { THEMES, type ThemeId } from "@/profile/identity";
import { poolInputs, type PoolRange } from "@/play/stories";
import { NICKNAME_PLACEHOLDER } from "@/story/nickname";
import { addToPool, poolKey, poolVariants, type ContentPool, type PoolInput } from "@/story/pool";
import { writeValidStory } from "@/story/write";
import { chooseGeneration } from "./generation";

export const POOL_FILE = "src/story/pool.generated.json";

const { values } = parseArgs({
  options: {
    themes: { type: "string", default: THEMES.map((t) => t.id).join(",") },
    variants: { type: "string", default: "1" },
    range: { type: "string", default: "default" },
    limit: { type: "string" },
    concurrency: { type: "string", default: "6" },
    fake: { type: "boolean", default: false },
    out: { type: "string", default: POOL_FILE },
  },
});

const themeIds = THEMES.map((t) => t.id);
const themes = values.themes.split(",").map((t) => t.trim()) as ThemeId[];
const unknownTheme = themes.find((t) => !themeIds.includes(t));
if (unknownTheme) {
  console.error(`--themes must be from ${themeIds.join(", ")}, got "${unknownTheme}"`);
  process.exit(1);
}
if (values.range !== "default" && values.range !== "standard") {
  console.error(`--range must be default or standard, got "${values.range}"`);
  process.exit(1);
}
const range: PoolRange = values.range;
const variants = Number(values.variants);
const limit = values.limit === undefined ? Infinity : Number(values.limit);
const concurrency = Number(values.concurrency);
for (const [name, value] of [["variants", variants], ["limit", limit], ["concurrency", concurrency]] as const) {
  if (!(value >= 1) || (Number.isFinite(value) && !Number.isInteger(value))) {
    console.error(`--${name} must be a positive integer`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const { generation, storyName } = await chooseGeneration(values.fake ? "fake" : "real");
  let pool: ContentPool = await readPoolFile(values.out);
  const wanted = poolInputs(themes, range);
  const jobs: PoolInput[] = wanted.flatMap((input) => Array<PoolInput>(Math.max(0, variants - poolVariants(pool, input).length)).fill(input));
  const todo = jobs.slice(0, limit);
  console.log(`Stories: ${storyName}. Pool: ${values.out} (${Object.keys(pool).length} keys).`);
  console.log(`${wanted.length} keys for ${themes.join(", ")}; ${jobs.length} Stories to write for ${variants} variant${variants === 1 ? "" : "s"} each; writing ${todo.length} now.\n`);

  let generated = 0;
  let failed = 0;
  let retries = 0;
  const reasons = new Map<string, number>();
  const started = performance.now();
  // Saves are chained so a later snapshot, always a superset, never lands before an earlier one.
  let saving: Promise<void> = Promise.resolve();
  const save = (): Promise<void> => (saving = saving.then(() => writePoolFile(values.out, pool)));
  await mapLimit(todo, concurrency, async (input, index) => {
    const story = await writeValidStory(generation, { ...input, nickname: NICKNAME_PLACEHOLDER });
    retries += story.rejections.length;
    for (const rejection of story.rejections) {
      for (const reason of rejection.reasons) reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
    }
    if (story.source === "story") {
      pool = addToPool(pool, input, story.text);
      generated += 1;
    } else {
      failed += 1;
      console.log(`${poolKey(input)}: no valid Story in ${story.rejections.length} attempts`);
    }
    const done = index + 1;
    if (done % 50 === 0 || done === todo.length) {
      await save();
      console.log(`${done} of ${todo.length}: ${generated} written, ${failed} failed, ${retries} retries, ${Math.round((performance.now() - started) / 1000)} s`);
    }
  });
  await save();

  console.log(`\nWrote ${generated} Stories to ${values.out}; ${failed} keys got no valid Story; ${retries} rejected attempts.`);
  if (reasons.size > 0) {
    console.log("Rejection reasons:");
    for (const [reason, count] of [...reasons].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`  ${count} × ${reason}`);
  }
  const short = wanted.filter((input) => poolVariants(pool, input).length < variants).length;
  console.log(`${wanted.length - short} of ${wanted.length} keys have ${variants} variant${variants === 1 ? "" : "s"}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
