/** One dot per Problem: done in leaf, the current one in sun, the rest paper. */
export function ProgressDots({ total, done }: { readonly total: number; readonly done: number }) {
  return (
    <div className="flex justify-center gap-3" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Problems done">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`size-4 rounded-pill ${i < done ? "bg-leaf" : i === done ? "bg-sun" : "bg-paper-3"}`}
          data-testid="progress-dot"
          data-state={i < done ? "done" : i === done ? "current" : "pending"}
        />
      ))}
    </div>
  );
}
