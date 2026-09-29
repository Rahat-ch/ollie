#!/usr/bin/env node
// Pre-registration 1 (docs/evals/preregistration-1.md): read every numbered
// row of its Metrics and thresholds table from the stored reports and print
// the Results table, the per-role verdicts and the Coach latency tail.
// Reads JSON only; calls no model and writes nothing. Zero dependencies.
//
//   node scripts/preregistration-1-results.mjs
//
// Every value comes from the report as the eval wrote it. Rates carry the
// 95% Wilson interval, computed here with the same formula as
// `wilsonInterval` in src/evals/stats.ts and checked against the intervals
// the reports store, so a drift between the two fails loudly. Pass or fail
// is read from the point value against the row's line, as the
// pre-registration says.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EVALS = path.join(ROOT, "docs", "evals");

const SONNET = ["2026-09-29T19-10-40Z", "2026-09-29T19-24-39Z", "2026-09-29T19-37-11Z"];
const OPUS = ["2026-09-18T18-12-41Z", "2026-09-18T18-41-44Z", "2026-09-18T19-09-56Z"];
const SPLITS = [
  ["tuning", "tuning"],
  ["heldOut", "held out"],
];

const read = (name) => JSON.parse(readFileSync(path.join(EVALS, `${name}.json`), "utf8"));
const sonnet = SONNET.map(read);
const opus = OPUS.map(read);

// ---- arithmetic ------------------------------------------------------------

const Z = 1.96;
function wilson(hits, total) {
  if (total === 0) return null;
  const p = hits / total;
  const z2 = Z * Z;
  const d = 1 + z2 / total;
  const centre = (p + z2 / (2 * total)) / d;
  const half = (Z / d) * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total));
  return { lower: hits <= 0 ? 0 : Math.max(0, centre - half), upper: hits >= total ? 1 : Math.min(1, centre + half) };
}

function checkInterval(stored, hits, total, what) {
  const mine = wilson(hits, total);
  if (!stored || !mine) return;
  if (Math.abs(stored.lower - mine.lower) > 1e-9 || Math.abs(stored.upper - mine.upper) > 1e-9) {
    throw new Error(`${what}: stored interval ${JSON.stringify(stored)} differs from ${JSON.stringify(mine)}`);
  }
}

const f = (x, d = 3) => x.toFixed(d);
const ci = (hits, total, d = 3) => {
  const w = wilson(hits, total);
  return w ? `CI ${f(w.lower, d)} to ${f(w.upper, d)}` : "no interval";
};
const low = (xs) => Math.min(...xs);
const high = (xs) => Math.max(...xs);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const run = (i) => `run ${i + 1}`;
// The pre-registration asks for the three Sonnet values low to high.
const lowToHigh = (items, sep = "; ") => [...items].sort((a, b) => a.v - b.v).map((x) => x.text).join(sep);
const verdict = (ok) => (ok ? "**pass**" : "**fail**");

function percentile(values, share) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(share * sorted.length) - 1)];
}

// ---- the rows ---------------------------------------------------------------

const rows = [];
const add = (id, metric, value, opusText, line, pass) => rows.push({ id, metric, value, opusText, line, pass });

// 1. Evidence Integrity, each split, every run, absolute floor 0.999.
{
  const parts = [];
  const invented = [];
  let ok = true;
  for (const [key, label] of SPLITS) {
    const items = sonnet.map((r, i) => {
      const s = r.hypotheses.splits[key];
      checkInterval(s.evidenceIntegrityInterval, s.existingCitations, s.citations, `row 1 ${label} ${run(i)}`);
      if (s.evidenceIntegrity < 0.999) ok = false;
      if (s.unknownIds > 0) invented.push(`${run(i)} ${label}: ${s.unknownIds}`);
      return { i, v: s.evidenceIntegrity, text: `${run(i)} ${f(s.evidenceIntegrity, 4)} (${s.existingCitations} of ${s.citations}, ${ci(s.existingCitations, s.citations, 4)})` };
    });
    parts.push(`${label}: ${items.sort((a, b) => a.v - b.v).map((x) => x.text).join("; ")}`);
  }
  const total = sum(sonnet.flatMap((r) => SPLITS.map(([k]) => r.hypotheses.splits[k].citations)));
  const unknown = sum(sonnet.flatMap((r) => SPLITS.map(([k]) => r.hypotheses.splits[k].unknownIds)));
  parts.push(`invented Problem IDs: ${unknown} in ${total} citations${invented.length ? ` (${invented.join(", ")})` : ""}`);
  add("1", "Evidence Integrity, each split", parts.join("<br>"), "1.0000 in all six split-runs; 1 invented ID in 95,922", "≥ 0.999 in every split of every run", ok);
}

// 2. Claim Agreement, each split: tuning ≥ 0.893, held out ≥ 0.900.
{
  const parts = [];
  let ok = true;
  const lines = { tuning: 0.893, heldOut: 0.9 };
  for (const [key, label] of SPLITS) {
    const items = sonnet.map((r, i) => {
      const s = r.hypotheses.splits[key];
      const agree = s.citations - s.inconsistent;
      checkInterval(s.claimAgreementInterval, agree, s.citations, `row 2 ${label} ${run(i)}`);
      if (s.claimAgreement < lines[key]) ok = false;
      return { v: s.claimAgreement, text: `${run(i)} ${f(s.claimAgreement)} (${ci(agree, s.citations)})` };
    });
    parts.push(`${label}: ${items.sort((a, b) => a.v - b.v).map((x) => x.text).join("; ")}`);
  }
  add("2", "Claim Agreement, each split", parts.join("<br>"), "tuning 0.923 to 0.940; held out 0.931 to 0.951", "tuning ≥ 0.893; held out ≥ 0.900", ok);
}

// 3a and 3b. Plan sources, pooled over 360 Sessions.
{
  const per = sonnet.map((r) => {
    const s = r.hypotheses.splits;
    return { coach: s.tuning.sources.coach + s.heldOut.sources.coach, retry: s.tuning.sources.retry + s.heldOut.sources.retry, baseline: s.tuning.sources.baseline + s.heldOut.sources.baseline };
  });
  const n = 360;
  const sessions = sum(per.map((p) => p.coach + p.retry + p.baseline));
  if (sessions !== n) throw new Error(`row 3: expected 360 Sessions, found ${sessions}`);
  const first = sum(per.map((p) => p.coach));
  const retries = sum(per.map((p) => p.retry));
  const fallbacks = sum(per.map((p) => p.baseline));
  add("3a", "First-attempt Coach Plans, pooled", `${first} of ${n} (${f(first / n)}, ${ci(first, n)}); ${retries} retries (per run ${per.map((p) => p.retry).join(", ")})`, "358 of 360 (0.994); 2 retries", "≥ 342 of 360", first >= 342);
  add("3b", "Baseline fallbacks, pooled", `${fallbacks} of ${n} (${ci(fallbacks, n)})`, "0 of 360", "≤ 3 of 360", fallbacks <= 3);
}

// 4a. Detection, pooled: ≥ 3 of 6 and each planted weakness named in at least one run.
{
  const named = {};
  const hits = [];
  sonnet.forEach((r, i) => {
    for (const l of r.hypotheses.learners) {
      for (const w of l.planted) {
        named[w] ??= [];
        const at = l.sessionsToDetection[w];
        named[w].push(at == null ? `${run(i)} never` : `${run(i)} Session ${at}`);
        if (at != null) hits.push(w);
      }
    }
  });
  const chances = sum(Object.values(named).map((v) => v.length));
  if (chances !== 6) throw new Error(`row 4a: expected 6 chances, found ${chances}`);
  const every = Object.keys(named).every((w) => hits.includes(w));
  const detail = Object.entries(named).map(([w, v]) => `${w}: ${v.join(", ")}`).join("; ");
  add("4a", "Detection (prose reader), pooled", `${hits.length} of ${chances} (${f(hits.length / chances, 2)}, ${ci(hits.length, chances, 2)}); ${detail}`, "4 of 6; Sessions 6, 6, 13, 16", "≥ 3 of 6, each weakness named in at least one run", hits.length >= 3 && every);
}

// 4b and 4c. False positives, each run: no worse than the worst Opus run.
for (const [id, key, label, opusWorst, lineText, opusText] of [
  ["4b", "tuning", "tuning", 10 / 45, "every run ≤ 0.222 (10 of 45)", "4/39, 7/44, 10/45: 0.103 to 0.222"],
  ["4c", "heldOut", "held out", 3 / 30, "every run ≤ 0.100 (3 of 30)", "3/30, 0/20, 2/20: 0.000 to 0.100"],
]) {
  let ok = true;
  const items = sonnet.map((r, i) => {
    const s = r.hypotheses.splits[key];
    checkInterval(s.falsePositiveRateInterval, s.falsePositives, s.supportedHypotheses, `row ${id} ${run(i)}`);
    // The line is the worst Opus run's own rate, margin zero; 1e-9 only absorbs float noise.
    if (s.falsePositiveRate > opusWorst + 1e-9) ok = false;
    return { v: s.falsePositiveRate, text: `${run(i)} ${s.falsePositives}/${s.supportedHypotheses} = ${f(s.falsePositiveRate)} (${ci(s.falsePositives, s.supportedHypotheses)})` };
  });
  add(id, `False positives (prose reader), ${label}`, items.sort((a, b) => a.v - b.v).map((x) => x.text).join("; "), opusText, lineText, ok);
}

// 5. Sessions to Mastery: tuning ≥ 5.25, held out ≥ 4.50 in every run.
{
  let ok = true;
  const lines = { tuning: 5.25, heldOut: 4.5 };
  const parts = SPLITS.map(([key, label]) => {
    const vs = sonnet.map((r) => r.convergence.coach.splits[key].meanSkillsMastered);
    if (vs.some((v) => v < lines[key])) ok = false;
    return `${label}: ${lowToHigh(vs.map((v, i) => ({ v, text: `${run(i)} ${f(v, 2)}` })), ", ")} (Baseline ${f(sonnet[0].convergence.baseline.splits[key].meanSkillsMastered, 2)})`;
  });
  add("5", "Mean Skills Mastered by Session 20", parts.join("<br>"), "tuning 5.75, 5.75, 6.50; held out 5.50, 5.50, 5.00", "tuning ≥ 5.25; held out ≥ 4.50, every run", ok);
}

// 6. p95 Coach latency, per run: < 30.0 s.
{
  const ls = sonnet.map((r) => r.telemetry.latency.coach);
  sonnet.forEach((r, i) => {
    const ms = r.telemetry.calls.filter((c) => c.operation === "coach").map((c) => c.ms);
    if (percentile(ms, 0.95) !== ls[i].p95Ms || percentile(ms, 0.5) !== ls[i].p50Ms) throw new Error(`row 6 ${run(i)}: stored p50/p95 do not match the calls`);
  });
  add("6", "p95 Coach latency, per run", lowToHigh(ls.map((l, i) => ({ v: l.p95Ms, text: `${run(i)} p95 ${f(l.p95Ms / 1000, 1)} s (p50 ${f(l.p50Ms / 1000, 1)} s, ${l.calls} calls)` }))), "not recorded; mean 69.9 to 73.3 s", "p95 < 30.0 s in every run", ls.every((l) => l.p95Ms < 30000));
}

// 7. Cost per Session: every run < $0.2083.
{
  const vs = sonnet.map((r) => r.telemetry.perSession.dollarsPerSession);
  const opusVs = opus.map((r) => r.telemetry.perSession.dollarsPerSession);
  add("7", "Cost per Session", lowToHigh(vs.map((v, i) => ({ v, text: `${run(i)} $${f(v, 4)}` })), ", "), `$${f(low(opusVs), 4)} to $${f(high(opusVs), 4)}`, "every run < $0.2083", vs.every((v) => v < 0.2083));
}

// 8a to 10. Summary, Story and Judge.
const gate = (r, set) => r[set].judge.calibration;
const counts = (validity) => ({ first: Math.round(validity.firstAttemptRate * validity.sample), valid: Math.round(validity.validRate * validity.sample), n: validity.sample, templates: validity.templates });
{
  const s = sonnet.map((r) => counts(r.summaries.validity));
  add("8a", "Summary validity, first attempt", s.map((c, i) => `${run(i)} ${c.first} of ${c.n} (${ci(c.first, c.n)})`).join("; "), "6 of 6 every run", "≥ 5 of 6 in every run", s.every((c) => c.first >= 5));
  add("8b", "Summary template fallbacks", s.map((c, i) => `${run(i)} ${c.templates}`).join(", "), "0 every run", "0 in every run", s.every((c) => c.templates === 0));
}
function judged(id, metric, set, field, opusText, lineText, passes) {
  const parts = [];
  let ok = true;
  let opened = 0;
  sonnet.forEach((r, i) => {
    const cal = gate(r, set);
    const score = r[set].judge[field];
    if (!cal.passes || score == null) {
      parts.push({ v: -1, text: `${run(i)} **withheld** (${cal.withheld ?? "no score"})` });
      return;
    }
    opened += 1;
    checkInterval(score.passRateInterval, score.passed, score.judged, `row ${id} ${run(i)}`);
    if (!passes(score)) ok = false;
    parts.push({ v: score.passRate, text: `${run(i)} ${score.passed} of ${score.judged} = ${f(score.passRate)} (${ci(score.passed, score.judged)})` });
  });
  add(id, metric, lowToHigh(parts), opusText, lineText, opened === 0 ? null : ok);
}
judged("8c", "Summary faithfulness (Judge, gate open)", "summaries", "faithfulness", "6 of 6 every run", "≥ 5 of 6 in every run the gate opened", (s) => s.passed >= 5);
{
  const s = sonnet.map((r) => counts(r.stories.validity));
  add("9a", "Story validity, first attempt (of 30)", s.map((c, i) => `${run(i)} ${c.first} (${ci(c.first, c.n)})`).join("; "), "26, 27, 28", "≥ 24 of 30 in every run", s.every((c) => c.first >= 24));
  add("9b", "Story validity within three attempts (of 30)", s.map((c, i) => `${run(i)} ${c.valid}, ${c.templates} templates (${ci(c.valid, c.n)})`).join("; "), "30, 29, 29; templates 0, 1, 1", "≥ 28 of 30 in every run", s.every((c) => c.valid >= 28));
}
judged("9c", "Story readability (Judge, gate open)", "stories", "readability", "20/30, 21/29, 19/29: 0.655 to 0.724", "≥ 0.55 in every run the gate opened", (s) => s.passRate >= 0.55);
{
  let ok = true;
  const parts = [];
  for (const [set, label] of [["stories", "Stories"], ["summaries", "Summaries"]]) {
    parts.push(
      `${label}: ` +
        lowToHigh(sonnet
          .map((r, i) => {
            const c = gate(r, set);
            checkInterval(c.agreementInterval, c.agreements, c.size, `row 10 ${label} ${run(i)}`);
            const pass = c.agreement >= 0.8 && c.kappa >= 0.6;
            if (!pass) ok = false;
            return { v: c.agreement, text: `${run(i)} ${c.agreements} of ${c.size} = ${f(c.agreement, 2)} (${ci(c.agreements, c.size)}), kappa ${f(c.kappa, 2)}` };
          })),
    );
  }
  add("10", "Judge gate, both Calibration Sets", parts.join("<br>"), "Stories 20/20 kappa 1.00 every run; Summaries 9/10, 10/10, 10/10", "agreement ≥ 0.80 and kappa ≥ 0.60, both sets, every run", ok);
}

// ---- print --------------------------------------------------------------------

const mark = (p) => (p === null ? "**withheld**" : verdict(p));
console.log(`Pre-registration 1 results, from ${SONNET.map((n) => `${n}.json`).join(", ")} (Sonnet 5.5, runs 1 to 3)`);
console.log(`against ${OPUS.map((n) => `${n}.json`).join(", ")} (Opus 5).\n`);
console.log("| # | Metric | Sonnet 5.5, three runs | Opus 5, three runs | Threshold (pass) | Result |");
console.log("|---|---|---|---|---|---|");
for (const r of rows) console.log(`| ${r.id} | ${r.metric} | ${r.value} | ${r.opusText} | ${r.line} | ${mark(r.pass)} |`);

const byId = Object.fromEntries(rows.map((r) => [r.id, r.pass]));
const role = (name, ids) => {
  const results = ids.map((id) => byId[id]);
  const failed = ids.filter((id) => byId[id] === false);
  const withheld = ids.filter((id) => byId[id] === null);
  const ok = failed.length === 0 && withheld.length === 0;
  const why = [failed.length ? `fails ${failed.join(", ")}` : "", withheld.length ? `withheld ${withheld.join(", ")}` : ""].filter(Boolean).join("; ");
  return `- ${name} (rows ${ids[0]} to ${ids[ids.length - 1]}): ${ok ? "acceptable" : "not acceptable"}${why ? ` (${why})` : ""}; ${results.filter((p) => p === true).length} of ${ids.length} pass`;
};
console.log("\nPer role:");
console.log(role("Coach", ["1", "2", "3a", "3b", "4a", "4b", "4c", "5", "6", "7"]));
console.log(role("Parent Summary", ["8a", "8b", "8c"]));
console.log(role("Story writer", ["9a", "9b", "9c"]));
console.log(role("Judge", ["10"]));

console.log("\nCost, telemetry.total.dollars:");
let running = 0;
sonnet.forEach((r, i) => {
  running += r.telemetry.total.dollars;
  console.log(`  ${run(i)} $${f(r.telemetry.total.dollars, 4)}, Sonnet runs so far $${f(running, 4)}`);
});

// The Coach latency tail: calls in the order they were recorded (completion
// order), numbered among the Coach calls only, from 1.
console.log("\nCoach calls over 60 s, by completion-order position among the run's Coach calls:");
for (const [i, r] of sonnet.entries()) {
  const coach = r.telemetry.calls.filter((c) => c.operation === "coach");
  const tps = (c) => c.outputTokens / (c.ms / 1000);
  const slow = coach.map((c, k) => ({ ...c, pos: k + 1 })).filter((c) => c.ms > 60000);
  const normal = coach.filter((c) => c.ms <= 60000);
  const median = (xs) => percentile(xs, 0.5);
  const groups = [];
  for (const c of slow) {
    const g = groups[groups.length - 1];
    if (g && c.pos - g[g.length - 1] <= 2) g.push(c.pos);
    else groups.push([c.pos]);
  }
  console.log(
    `  ${run(i)}: ${slow.length} of ${coach.length} calls over 60 s at positions ${groups.map((g) => (g.length > 1 ? `${g[0]}-${g[g.length - 1]}` : `${g[0]}`)).join(", ")}` +
      ` (${groups.map((g) => g.join(",")).join(" | ")})`,
  );
  console.log(
    `    slow: median ${f(median(slow.map((c) => c.ms)) / 1000, 1)} s, median output ${median(slow.map((c) => c.outputTokens))} tokens, median ${f(median(slow.map(tps)), 1)} output tok/s` +
      `; the rest: median ${f(median(normal.map((c) => c.ms)) / 1000, 1)} s, median output ${median(normal.map((c) => c.outputTokens))} tokens, median ${f(median(normal.map(tps)), 1)} output tok/s`,
  );
  console.log(
    `    the rest alone: p95 ${f(percentile(normal.map((c) => c.ms), 0.95) / 1000, 1)} s, slowest ${f(high(normal.map((c) => c.ms)) / 1000, 1)} s; no Coach call between 60 and 80 s: ${coach.every((c) => c.ms <= 60000 || c.ms >= 80000)}` +
      `; calls served by another model: ${coach.filter((c) => c.model !== "claude-sonnet-5-5").length}`,
  );
}

// Supported Hypotheses, the false-positive denominators, beside Opus's.
console.log("\nSupported Hypotheses (tuning, held out) per run:");
for (const [label, reports] of [["Opus 5", opus], ["Sonnet 5.5", sonnet]]) {
  console.log(`  ${label}: ${reports.map((r) => `${r.hypotheses.splits.tuning.supportedHypotheses}, ${r.hypotheses.splits.heldOut.supportedHypotheses}`).join("; ")}`);
}

// The Story Judge's reasons: how many of its fails, and of its calibration
// disagreements, cite the {{nickname}} placeholder every Story carries by design.
console.log("\nStory Judge fails citing the {{nickname}} placeholder:");
for (const [label, reports] of [["Opus 5", opus], ["Sonnet 5.5", sonnet]]) {
  const cites = (reason) => /placeholder|\{\{nickname\}\}/i.test(reason);
  const text = reports.map((r, i) => {
    const fails = r.stories.stories.filter((s) => s.judged && !s.judged.pass);
    const dis = r.stories.judge.calibration.disagreements;
    return `${run(i)} ${fails.filter((s) => cites(s.judged.reason)).length} of ${fails.length} fails; ${dis.filter((d) => cites(d.reason)).length} of ${dis.length} calibration disagreements`;
  });
  console.log(`  ${label}: ${text.join("; ")}`);
}
