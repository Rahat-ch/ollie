import type { Cell, LooseCounter, TenFrameModel } from "@/play/visuals";

const STAGGER_MS = 220;

/**
 * One or two ten-frames on a paper board, with any counters waiting beside
 * them. Two frames are drawn smaller so both fit beside the number pad.
 */
export function TenFrame({ model }: { readonly model: TenFrameModel }) {
  const twoFrames = model.frames.length > 1;
  const sizes = twoFrames ? { "--cell": "50px", "--counter": "36px" } : { "--cell": "60px", "--counter": "44px" };
  return (
    <div className="flex items-center gap-5" style={sizes as React.CSSProperties} data-testid="ten-frame">
      <div className="flex shrink-0 gap-4 rounded-card bg-paper-2 p-5 shadow-card">
        {model.frames.map((cells, f) => (
          <Frame key={f} cells={cells} />
        ))}
      </div>
      {model.loose.length > 0 && <Loose counters={model.loose} />}
    </div>
  );
}

function Frame({ cells }: { readonly cells: readonly Cell[] }) {
  let counted = 0;
  return (
    <div
      className="ten-frame grid grid-cols-[repeat(5,var(--cell))] grid-rows-[repeat(2,var(--cell))]"
      role="img"
      aria-label={`ten-frame with ${cells.filter((c) => c.counter).length} counters`}
    >
      {cells.map((cell, i) => {
        const order = cell.mark === "count" || cell.mark === "arrive" ? counted++ : 0;
        return <FrameCell key={i} cell={cell} order={order} />;
      })}
    </div>
  );
}

function FrameCell({ cell, order }: { readonly cell: Cell; readonly order: number }) {
  return (
    <div className="ten-frame-cell flex items-center justify-center">
      {cell.counter ? (
        <Counter color={cell.counter} mark={cell.mark} order={order} />
      ) : cell.mark === "count" ? (
        <span className="counter-count-empty size-(--counter) rounded-pill" style={{ animationDelay: `${order * STAGGER_MS}ms` }} />
      ) : cell.mark === "gone" ? (
        <span className="counter-gone size-(--counter) rounded-pill bg-counter-red" />
      ) : null}
    </div>
  );
}

function Loose({ counters }: { readonly counters: readonly LooseCounter[] }) {
  return (
    <div className="flex flex-col gap-2" role="img" aria-label={`${counters.length} counters waiting`}>
      {counters.map((counter, i) => (
        <Counter key={i} color={counter.color} mark={counter.mark} order={i} />
      ))}
    </div>
  );
}

function Counter({ color, mark, order }: { readonly color: "red" | "yellow"; readonly mark: Cell["mark"]; readonly order: number }) {
  const tone = color === "red" ? "bg-counter-red" : "bg-counter-yellow";
  const motion = mark === "count" ? "counter-count" : mark === "arrive" ? "counter-arrive" : "";
  return (
    <span
      className={`block size-(--counter) rounded-pill ${tone} ${motion}`.trim()}
      style={mark ? { animationDelay: `${order * STAGGER_MS}ms` } : undefined}
      data-counter={color}
    />
  );
}
