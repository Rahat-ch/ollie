import type { NumberLineModel } from "@/play/visuals";

const STEP = 26;
const PAD = 24;
const BASE_Y = 64;
const STAGGER_MS = 320;

/** A 0 to 20 number line: a start marker, hops that draw in one at a time, and the landing. */
export function NumberLine({ model }: { readonly model: NumberLineModel }) {
  const x = (n: number) => PAD + (n - model.min) * STEP;
  const width = PAD * 2 + (model.max - model.min) * STEP;
  const ticks = Array.from({ length: model.max - model.min + 1 }, (_, i) => model.min + i);
  const hops = model.showHops ? Array.from({ length: model.hops }, (_, i) => model.start + i) : [];
  return (
    <div className="rounded-card bg-paper-2 px-2 py-3 shadow-card" data-testid="number-line">
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
