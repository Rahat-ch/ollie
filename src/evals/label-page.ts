/**
 * The labelling page, served by `pnpm label` on localhost and never by the
 * app. One item at a time, with its evidence and the questions its set asks;
 * each answer is posted as it is saved, and the server writes the labeller's
 * file. It is only ever sent this labeller's own labels.
 */
export function labelPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ollie labelling</title>
<style>
  :root { --bg: #fbf7ef; --card: #fff; --ink: #2b2433; --muted: #6b6275; --line: #e4dccd; --accent: #6b4bd6; --done: #2f855a; --warn: #b7791f; }
  @media (prefers-color-scheme: dark) { :root { --bg: #1d1a22; --card: #28242f; --ink: #f1edf6; --muted: #b3aabd; --line: #3a3443; --accent: #a58cff; --done: #68d391; --warn: #f6ad55; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 system-ui, sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 24px 16px 64px; }
  h1 { font-size: 1.5rem; margin: 0 0 4px; }
  h2 { font-size: 1.05rem; margin: 18px 0 6px; }
  p.lede, .muted { color: var(--muted); }
  p.lede { margin: 0 0 16px; }
  nav.sets { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  nav.sets button[aria-pressed="true"] { border-color: var(--accent); outline: 2px solid var(--accent); }
  button, label.choice { font: inherit; border: 1px solid var(--line); background: var(--card); color: var(--ink); border-radius: 999px; padding: 6px 14px; cursor: pointer; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  button.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
  label.choice { display: inline-flex; align-items: center; gap: 6px; margin: 0 6px 6px 0; }
  label.choice:has(input:checked) { border-color: var(--accent); outline: 2px solid var(--accent); }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; }
  .quote { font-size: 1.1rem; margin: 4px 0; white-space: pre-wrap; overflow-wrap: anywhere; }
  .progress { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; color: var(--muted); margin-bottom: 8px; }
  .labelled { color: var(--done); font-weight: 600; }
  table { border-collapse: collapse; width: 100%; font-size: 0.95rem; }
  td, th { text-align: left; padding: 4px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  .table-wrap { overflow-x: auto; }
  .unrecorded { color: var(--warn); }
  fieldset { border: 1px solid var(--line); border-radius: 12px; padding: 10px 14px; margin: 0 0 12px; }
  legend { padding: 0 6px; font-weight: 600; }
  .hint { color: var(--muted); font-size: 0.9rem; margin: 0 0 8px; }
  textarea { width: 100%; font: inherit; min-height: 3em; border: 1px solid var(--line); border-radius: 8px; padding: 6px 8px; background: var(--bg); color: var(--ink); }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  #status { margin-top: 8px; color: var(--muted); min-height: 1.5em; }
  ul.rubric { margin: 4px 0 0; padding-left: 20px; }
</style>
</head>
<body>
<main>
  <h1>Ollie labelling</h1>
  <p class="lede">Labelling as <strong id="labeller"></strong>. One item at a time: read the evidence, answer every question, then save. Every save goes straight to your label file. Nobody else's labels are shown, and the order is shuffled for you.</p>
  <nav class="sets" id="sets"></nav>
  <div class="progress"><span id="position"></span><span id="count"></span></div>
  <section id="item"></section>
  <form id="form"></form>
  <div class="actions">
    <button type="button" id="prev">Previous</button>
    <button type="button" id="save" class="primary" disabled>Save and next</button>
    <button type="button" id="next">Next</button>
    <button type="button" id="unlabelled">Next unlabelled</button>
  </div>
  <div id="status" role="status"></div>
</main>
<script>
const SET_NAMES = { stories: "Stories", summaries: "Parent Summaries", claims: "Hypothesis claims" };
const ONE_OF = { stories: "Story", summaries: "Parent Summary", claims: "Claim" };
const WEAKNESSES = [
  ["crossing-ten", "Crossing ten", "A sum or difference that bridges ten, such as 8 + 5 or 13 - 8. Naming the Skill make-a-ten alone is not naming it."],
  ["change-unknown", "Change unknown", "The change or missing addend is the unknown, such as 9 + ? = 13, or a word problem that asks how many came or went. Naming the Skill unknown addend alone is not naming it."],
];
const POLARITY = [
  ["difficulty", "Difficulty", "something the Learner finds hard: misses, needs a Hint, is Revealed"],
  ["strength", "Strength", "something the Learner does well: first try, no Hints"],
  ["contrast", "Contrast", "sets the two against each other: first try here, help there"],
  ["neither", "Neither", "no claim about how well the Learner does: timing, position, a plan"],
];
const SUPPORT = [
  ["supports", "Supports it", "the Assistance States shown say what the claim says"],
  ["does-not-support", "Does not support it", "they say something else, or the opposite"],
  ["cannot-tell", "Cannot tell", "too few of the cited Problems are recorded to say"],
];
const RUBRIC = {
  stories: ["A six-year-old could follow it after hearing it once.", "What happens matches the arithmetic: arriving is adding, leaving is taking away, and a change-unknown Story asks how many came or went without saying it.", "It reads as a scene in the Theme, not a bare sum with a Theme word pasted on."],
  summaries: ["Every claim is supported by the tally it was written from. A Hypothesis may be mentioned only as something Ollie is watching.", "It never claims to know how the child was thinking, what she understands, or why she missed.", "It keeps first-try correct, correct after a Hint, and Revealed apart, and never runs them together as got it right."],
};

let data = null;
let set = "stories";
const position = { stories: 0, summaries: 0, claims: 0 };
let answer = {};

const el = (tag, props = {}, ...children) => { const node = Object.assign(document.createElement(tag), props); node.append(...children.filter((c) => c !== null && c !== undefined)); return node; };
const items = () => data.sets[set].items;
const labels = () => data.sets[set].labels;
const current = () => items()[position[set]];

function table(head, rows) {
  return el("div", { className: "table-wrap" }, el("table", {}, el("thead", {}, el("tr", {}, ...head.map((h) => el("th", { textContent: h })))), el("tbody", {}, ...rows.map((row) => el("tr", {}, ...row.map((cell) => typeof cell === "string" || typeof cell === "number" ? el("td", { textContent: String(cell) }) : el("td", {}, cell)))))));
}

function showStory(item) {
  return [
    el("div", { className: "card" }, el("div", { className: "muted", textContent: "The Story" }), el("p", { className: "quote", textContent: item.text })),
    el("div", { className: "card" }, table(["Theme", "Skill", "Structure", "Problem", "Answer"], [[item.theme, item.skill, item.structure, item.equation, item.answer]])),
  ];
}

function showSummary(item) {
  const tally = table(["Skill", "Evidence"], item.tally.map((row) => [row.skill, row.parts.join(", ")]));
  const facts = el("p", { className: "muted", textContent: "Session " + item.sessionNumber + ", " + item.problems + " Problems. Mastered this Session: " + (item.mastered.length ? item.mastered.join(", ") : "nothing new") + ". Powers earned: " + (item.powers.length ? item.powers.join(", ") : "none") + ". Weakest Skill: " + (item.weakest ?? "none") + "." });
  const watching = item.watching.length === 0 ? null : el("div", {}, el("h2", { textContent: "Hypotheses in the Learner Notes (not facts)" }), el("ul", {}, ...item.watching.map((h) => el("li", { textContent: h.claim + " (" + h.status + ")" }))));
  return [
    el("div", { className: "card" }, el("h2", { textContent: "The tally it was written from" }), tally, facts, watching),
    el("div", { className: "card" }, el("div", { className: "muted", textContent: "The note" }), el("p", { className: "quote", textContent: item.practiced }), el("div", { className: "muted", textContent: "The activity" }), el("p", { className: "quote", textContent: item.activity })),
  ];
}

function showClaim(item) {
  const recorded = item.evidence.filter((e) => e.recorded).length;
  const rows = item.evidence.filter((e) => e.recorded).map((e) => [e.problem, "Session " + e.session, e.skill, e.equation + "  (" + e.answer + ")", e.assistance]);
  const unrecorded = item.evidence.filter((e) => !e.recorded).map((e) => e.problem);
  return [
    el("div", { className: "card" }, el("div", { className: "muted", textContent: "The claim (" + item.status + ")" }), el("p", { className: "quote", textContent: item.claim })),
    el("div", { className: "card" },
      el("h2", { textContent: "Its cited Problems" }),
      el("p", { className: "hint", textContent: recorded + " of " + item.evidence.length + " recorded. The stored runs keep the first Session's Log only; a Problem from a later Session is not recorded." }),
      rows.length ? table(["Problem", "When", "Skill", "Problem (answer)", "Assistance State"], rows) : null,
      unrecorded.length ? el("p", {}, el("span", { className: "unrecorded", textContent: "Not recorded: " }), unrecorded.join(", ")) : null),
  ];
}

function radios(name, options, chosen, onPick) {
  return options.map(([value, text, hint]) => el("label", { className: "choice", title: hint ?? "" },
    el("input", { type: "radio", name, value, checked: chosen === value, onchange: () => onPick(value) }), text));
}

function complete() {
  if (set !== "claims") return typeof answer.pass === "boolean";
  return !!answer.polarity && !!answer.citedSupport && WEAKNESSES.every(([tag]) => typeof answer.namesAsDifficulty?.[tag] === "boolean");
}

function refreshSave() { document.getElementById("save").disabled = !complete(); }

function showForm(item) {
  const saved = labels()[item.id];
  answer = saved ? JSON.parse(JSON.stringify(saved)) : { id: item.id };
  if (set === "claims" && !answer.namesAsDifficulty) answer.namesAsDifficulty = {};
  const note = el("textarea", { id: "note", placeholder: "Why, in a sentence (optional)", value: answer.note ?? "", oninput: (e) => { answer.note = e.target.value; } });
  const fields = set === "claims"
    ? [
        el("fieldset", {}, el("legend", { textContent: "Polarity: what is the claim about?" }), el("p", { className: "hint", textContent: POLARITY.map(([, t, h]) => t + ": " + h).join(". ") + "." }), ...radios("polarity", POLARITY, answer.polarity, (v) => { answer.polarity = v; refreshSave(); })),
        ...WEAKNESSES.map(([tag, name, hint]) => el("fieldset", {}, el("legend", { textContent: "Does it name " + name.toLowerCase() + " as a difficulty the Learner has?" }), el("p", { className: "hint", textContent: hint }),
          ...radios("names-" + tag, [["yes", "Yes"], ["no", "No"]], answer.namesAsDifficulty[tag] === undefined ? undefined : answer.namesAsDifficulty[tag] ? "yes" : "no", (v) => { answer.namesAsDifficulty[tag] = v === "yes"; refreshSave(); }))),
        el("fieldset", {}, el("legend", { textContent: "Do its cited Problems support it?" }), el("p", { className: "hint", textContent: SUPPORT.map(([, t, h]) => t + ": " + h).join(". ") + "." }), ...radios("support", SUPPORT, answer.citedSupport, (v) => { answer.citedSupport = v; refreshSave(); })),
      ]
    : [
        el("fieldset", {}, el("legend", { textContent: "Does it pass? It passes only if all three hold:" }), el("ul", { className: "rubric" }, ...RUBRIC[set].map((line) => el("li", { textContent: line }))),
          el("div", { style: "margin-top: 8px" }, ...radios("pass", [["pass", "Pass"], ["fail", "Fail"]], answer.pass === undefined ? undefined : answer.pass ? "pass" : "fail", (v) => { answer.pass = v === "pass"; refreshSave(); }))),
      ];
  document.getElementById("form").replaceChildren(...fields, el("fieldset", {}, el("legend", { textContent: "Note" }), note));
  refreshSave();
}

function render() {
  const list = items();
  const item = current();
  const done = list.filter((i) => labels()[i.id]).length;
  document.getElementById("sets").replaceChildren(...Object.keys(SET_NAMES).map((name) => {
    const count = data.sets[name].items.filter((i) => data.sets[name].labels[i.id]).length;
    return el("button", { type: "button", ariaPressed: String(name === set), textContent: SET_NAMES[name] + " " + count + "/" + data.sets[name].items.length, onclick: () => { set = name; render(); } });
  }));
  document.getElementById("position").replaceChildren(ONE_OF[set] + " " + (position[set] + 1) + " of " + list.length + " ", el("span", { className: "muted", textContent: "(" + item.id + ")" }), labels()[item.id] ? el("span", { className: "labelled", textContent: "  labelled" }) : "");
  document.getElementById("count").textContent = done + " of " + list.length + " labelled";
  document.getElementById("item").replaceChildren(...(set === "stories" ? showStory(item) : set === "summaries" ? showSummary(item) : showClaim(item)));
  showForm(item);
  document.getElementById("prev").disabled = position[set] === 0;
  document.getElementById("next").disabled = position[set] === list.length - 1;
  document.getElementById("unlabelled").disabled = done === list.length;
}

function move(to) { position[set] = Math.max(0, Math.min(items().length - 1, to)); document.getElementById("status").textContent = ""; render(); }

function nextUnlabelled() {
  const list = items();
  for (let step = 1; step <= list.length; step++) {
    const i = (position[set] + step) % list.length;
    if (!labels()[list[i].id]) return move(i);
  }
}

document.getElementById("prev").addEventListener("click", () => move(position[set] - 1));
document.getElementById("next").addEventListener("click", () => move(position[set] + 1));
document.getElementById("unlabelled").addEventListener("click", nextUnlabelled);
document.getElementById("save").addEventListener("click", async () => {
  const label = { ...answer };
  if (!label.note) delete label.note;
  const response = await fetch("/label", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ set, label }) });
  const body = await response.json();
  if (!response.ok) { document.getElementById("status").textContent = "Not saved: " + body.error; return; }
  labels()[label.id] = body.label;
  const saved = label.id;
  if (Object.keys(labels()).length === items().length) { render(); document.getElementById("status").textContent = "Saved " + saved + ". Every item in this set is labelled."; return; }
  nextUnlabelled();
  document.getElementById("status").textContent = "Saved " + saved + ".";
});

(async () => {
  data = await (await fetch("/items")).json();
  document.getElementById("labeller").textContent = data.labeller;
  render();
})();
</script>
</body>
</html>
`;
}
