/**
 * The Content Pool as shipped: filled at build time by `pnpm pool` and
 * bundled with the app, so a Session in Unit 3 is filled with no call at
 * all when a variant exists. The run-time additions live on the server
 * (see the story API route), not here.
 */
import data from "./pool.generated.json";
import type { ContentPool } from "./pool";

export const BUNDLED_POOL: ContentPool = data as ContentPool;
