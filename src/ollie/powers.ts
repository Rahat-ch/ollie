/**
 * The pose Ollie takes on a Problem it has a Power for. The pose files and
 * the Powers happen to be named alike, and this table says so on purpose,
 * so renaming one never silently picks up the wrong drawing; `poses.test.ts`
 * checks every pose here is one the rig has.
 */
import type { PowerId } from "@/loop";
import type { OlliePose } from "./poses.generated";

export const POWER_POSES: Readonly<Record<PowerId, OlliePose>> = {
  "count-on-flight": "count-on-flight",
  "make-ten-magic": "make-ten-magic",
  "missing-number-detective": "missing-number-detective",
  "story-solver": "story-solver",
};

/** The pose for a Power Ollie is using. */
export const poseFor = (power: PowerId): OlliePose => POWER_POSES[power];
