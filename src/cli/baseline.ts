/**
 * Run N Baseline Sessions on one Profile through the pure Loop with a
 * scripted policy and print one line per Session with its Mastery and Unit
 * transitions, then the final Knowledge Estimates.
 *
 *   pnpm baseline
 *   pnpm baseline --sessions 10 --seed puppies --script fhrfffhf
 *   pnpm baseline --verbose      # the full Session Log for every Session
 *
 * The first Session is the Diagnostic Session; every later one is the Baseline
 * rule: 6 Problems from the current Skill plus 2 Review Problems, advancing on
 * the 8-of-10 rule. --script uses one letter per Problem position: f first-try
 * correct, h Hint-assisted correct, r Revealed; the last letter repeats.
 */
import { parseArgs } from "node:util";
import { baselinePlan, newProfile, runSession, scripted } from "@/loop";
import { formatEstimates, formatSessionLog, formatSessionLine } from "@/loop/format";

const { values } = parseArgs({
  options: {
    seed: { type: "string", default: "baseline" },
    script: { type: "string", default: "f" },
    sessions: { type: "string", default: "10" },
    verbose: { type: "boolean", default: false },
  },
});

const sessions = Number(values.sessions);
if (!Number.isInteger(sessions) || sessions < 1) {
  console.error(`--sessions must be a positive integer, got "${values.sessions}"`);
  process.exit(1);
}

let profile = newProfile();
for (let i = 0; i < sessions; i++) {
  const result = runSession(baselinePlan(profile), profile, values.seed, scripted(values.script));
  console.log(formatSessionLine(result));
  if (values.verbose) console.log("", formatSessionLog(result), "", "");
  profile = result.profile;
}

console.log("", formatEstimates(profile));
