/**
 * Run the Diagnostic Session through the pure Loop with a scripted policy and
 * print the Session Log, Knowledge Estimates, and Mastery decisions.
 *
 *   pnpm diagnostic
 *   pnpm diagnostic --seed puppies --script fhrfffhf
 *   pnpm diagnostic --sessions 3 --script f
 *
 * --script uses one letter per Problem position: f first-try correct,
 * h Hint-assisted correct, r Revealed; the last letter repeats.
 */
import { parseArgs } from "node:util";
import { DIAGNOSTIC_PLAN, newProfile, runSession, scripted } from "@/loop";
import { formatSessionLog } from "@/loop/format";

const { values } = parseArgs({
  options: {
    seed: { type: "string", default: "diagnostic" },
    script: { type: "string", default: "f" },
    sessions: { type: "string", default: "1" },
  },
});

const sessions = Number(values.sessions);
if (!Number.isInteger(sessions) || sessions < 1) {
  console.error(`--sessions must be a positive integer, got "${values.sessions}"`);
  process.exit(1);
}

let profile = newProfile();
for (let i = 0; i < sessions; i++) {
  const result = runSession(DIAGNOSTIC_PLAN, profile, values.seed, scripted(values.script));
  console.log(formatSessionLog(result));
  console.log("");
  profile = result.profile;
}
