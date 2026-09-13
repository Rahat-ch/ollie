import type { NumberLineModel } from "@/play/visuals";

const STEP = 26;
const PAD = 24;
const BASE_Y = 64;
const STAGGER_MS = 320;

/**
 * Count-On Flight: a pair of sky wing beats over every hop, one beat per
 * hop, so the jumps are flown rather than drawn.
 */
function WingBeats({ x, y, delay }: { readonly x: number; readonly y: number; readonly delay: number }) {
  return (
    <g className="hop-beat" style={{ animationDelay: `${delay}ms`, transformOrigin: `${x}px ${y}px` }} aria-hidden="true">
      <path d={`M${x - 2} ${y} C${x - 10} ${y - 6} ${x - 16} ${y - 5} ${x - 20} ${y + 1} C${x - 14} ${y + 3} ${x - 7} ${y + 3} ${x - 2} ${y}Z`} className="fill-sky" />
      <path d={`M${x + 2} ${y} C${x + 10} ${y - 6} ${x + 16} ${y - 5} ${x + 20} ${y + 1} C${x + 14} ${y + 3} ${x + 7} ${y + 3} ${x + 2} ${y}Z`} className="fill-sky" />
    </g>
  );
}

/**
 * Missing Number Detective: a magnifying glass, the same shapes as Ollie's
 * pose for it, searching from the number the Learner knows up to the whole.
 */
function Magnifier({ from, to, y }: { readonly from: number; readonly to: number; readonly y: number }) {
  return (
    <g
      className="detective-glass"
      style={{ "--sweep-from": `${from}px`, "--sweep-to": `${to}px` } as React.CSSProperties}
      data-testid="detective-glass"
      aria-hidden="true"
    >
      <path d={`M6 ${y - 26}L10 ${y - 29}L17 ${y - 18}C18 ${y - 16} 15 ${y - 14} 13 ${y - 16}Z`} className="fill-plum" />
      <circle cx="0" cy={y - 36} r="11" className="fill-sky" fillOpacity="0.35" />
      <circle cx="0" cy={y - 36} r="11" className="detective-rim" />
    </g>
  );
}

/** A 0 to 20 number line: a start marker, hops that draw in one at a time, and the landing. */
export function NumberLine({ model }: { readonly model: NumberLineModel }) {
  const x = (n: number) => PAD + (n - model.min) * STEP;
  const width = PAD * 2 + (model.max - model.min) * STEP;
  const ticks = Array.from({ length: model.max - model.min + 1 }, (_, i) => model.min + i);
  const hops = model.showHops ? Array.from({ length: model.hops }, (_, i) => model.start + i) : [];
  return (
    <div className="rounded-card bg-paper-2 px-2 py-3 shadow-card" data-testid="number-line" data-power={model.power ?? undefined}>
      <svg viewBox={`0 0 ${width} 100`} width={width} height={100} role="img" aria-label={`number line from ${model.start}${model.showEnd ? ` to ${model.end}` : ""}`}>
        <line x1={PAD - 12} y1={BASE_Y} x2={width - PAD + 12} y2={BASE_Y} className="number-line-ink" />
        {ticks.map((n) => (
          <g key={n}>
            <line x1={x(n)} y1={BASE_Y - 7} x2={x(n)} y2={BASE_Y + 7} className="number-line-ink" />
            <text x={x(n)} y={BASE_Y + 26} textAnchor="middle" className="number-line-label">
              {n}
            </text>
          </g>
        ))}
        {hops.map((from, i) => (
          <path
            key={from}
            d={`M${x(from)} ${BASE_Y - 4} Q${x(from) + STEP / 2} ${BASE_Y - 40} ${x(from + 1)} ${BASE_Y - 4}`}
            className="number-line-hop"
            style={{ animationDelay: `${i * STAGGER_MS}ms` }}
          />
        ))}
        <circle cx={x(model.start)} cy={BASE_Y} r={9} className="fill-sun" />
        {model.power === "count-on-flight" &&
          hops.map((from, i) => <WingBeats key={`beat-${from}`} x={x(from) + STEP / 2} y={BASE_Y - 34} delay={i * STAGGER_MS} />)}
        {model.power === "missing-number-detective" && <Magnifier from={x(model.start)} to={x(model.end)} y={BASE_Y} />}
        {model.showEnd && (
          <circle
            cx={x(model.end)}
            cy={BASE_Y}
            r={9}
            className="number-line-landing fill-leaf"
            style={{ animationDelay: `${hops.length * STAGGER_MS}ms` }}
          />
        )}
      </svg>
    </div>
  );
}
