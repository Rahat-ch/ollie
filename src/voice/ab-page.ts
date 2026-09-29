/**
 * The listening page of the voice A/B, served by `pnpm voice:ab --listen` on
 * localhost and never by the app. It knows each pair only by its ID and
 * text; the clips are `/clip/<id>/1` and `/clip/<id>/2`, and which side
 * each is comes back only in the tally the page saves.
 */
export function listeningPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ollie voice A/B</title>
<style>
  :root { --bg: #fbf7ef; --card: #fff; --ink: #2b2433; --muted: #6b6275; --line: #e4dccd; --accent: #6b4bd6; --win: #2f855a; }
  @media (prefers-color-scheme: dark) { :root { --bg: #1d1a22; --card: #28242f; --ink: #f1edf6; --muted: #b3aabd; --line: #3a3443; --accent: #a58cff; --win: #68d391; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 system-ui, sans-serif; }
  main { max-width: 720px; margin: 0 auto; padding: 24px 16px 64px; }
  h1 { font-size: 1.5rem; margin: 0 0 4px; }
  p.lede { color: var(--muted); margin: 0 0 24px; }
  ol { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
  li { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; }
  .kind { color: var(--muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; }
  .text { margin: 2px 0 10px; }
  .clips { display: flex; flex-wrap: wrap; gap: 8px; }
  button, label.choice { font: inherit; border: 1px solid var(--line); background: var(--bg); color: var(--ink); border-radius: 999px; padding: 6px 14px; cursor: pointer; }
  label.choice:has(input:checked) { border-color: var(--accent); outline: 2px solid var(--accent); }
  label.choice input { margin: 0 6px 0 0; }
  #save { margin-top: 20px; background: var(--accent); color: #fff; border-color: var(--accent); padding: 10px 20px; }
  #save:disabled { opacity: 0.5; cursor: not-allowed; }
  .won { color: var(--win); font-weight: 600; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  td, th { text-align: left; padding: 4px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  #status { color: var(--muted); margin-top: 8px; }
</style>
</head>
<body>
<main>
  <h1>Ollie voice A/B</h1>
  <p class="lede">Each line is said twice, in a random order. Play both, pick the one that sounds more like Ollie, and save when every line is rated. Which clip is which stays hidden until the tally is saved.</p>
  <section id="rate"><ol id="pairs"></ol><button id="save" disabled>Save tally</button><div id="status"></div></section>
  <section id="reveal" hidden></section>
</main>
<script>
const choices = {};
let total = 0;
const el = (tag, props = {}, ...children) => { const node = Object.assign(document.createElement(tag), props); node.append(...children); return node; };
const player = new Audio();
const play = (id, slot) => { player.src = "/clip/" + id + "/" + slot; void player.play(); };

function reveal(tally) {
  document.getElementById("rate").hidden = true;
  const section = document.getElementById("reveal");
  section.hidden = false;
  const side = (name) => tally.sides[name].modelId + " on voice " + tally.sides[name].voiceId;
  const verdict = tally.winner === "tie" ? "A tie." : "Side " + tally.winner.toUpperCase() + " wins: " + side(tally.winner) + ".";
  const rows = tally.lines.map((line) => el("tr", {}, el("td", { textContent: line.kind }), el("td", { textContent: line.text }), el("td", { className: "won", textContent: line.winner.toUpperCase() })));
  const kinds = Object.entries(tally.byKind).map(([kind, wins]) => kind + ": A " + wins.a + ", B " + wins.b).join("; ");
  section.replaceChildren(
    el("h2", { textContent: "Saved. " + verdict }),
    el("p", { textContent: "A is " + side("a") + ". B is " + side("b") + "." }),
    el("p", { textContent: "A won " + tally.wins.a + ", B won " + tally.wins.b + ". By kind: " + kinds + "." }),
    el("table", {}, el("tbody", {}, ...rows)),
  );
}

function refresh() {
  const rated = Object.keys(choices).length;
  document.getElementById("save").disabled = rated < total;
  document.getElementById("status").textContent = rated + " of " + total + " rated.";
}

async function load() {
  const { pairs, tally } = await (await fetch("/pairs")).json();
  if (tally) return reveal(tally);
  total = pairs.length;
  document.getElementById("pairs").replaceChildren(...pairs.map((pair) => {
    const pick = (slot) => el("label", { className: "choice" }, el("input", { type: "radio", name: "pair-" + pair.id, onchange: () => { choices[pair.id] = slot; refresh(); } }), "Clip " + slot + " is better");
    return el("li", {},
      el("div", { className: "kind", textContent: pair.kind }),
      el("div", { className: "text", textContent: pair.text }),
      el("div", { className: "clips" },
        el("button", { type: "button", textContent: "Play clip 1", onclick: () => play(pair.id, 1) }),
        el("button", { type: "button", textContent: "Play clip 2", onclick: () => play(pair.id, 2) }),
        pick(1), pick(2)));
  }));
  refresh();
}

document.getElementById("save").addEventListener("click", async () => {
  const answer = await fetch("/tally", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ choices }) });
  const body = await answer.json();
  if (!answer.ok) { document.getElementById("status").textContent = body.error; return; }
  reveal(body.tally);
});

void load();
</script>
</body>
</html>
`;
}
