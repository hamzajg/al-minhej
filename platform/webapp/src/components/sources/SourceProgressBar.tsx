export function SourceProgressBar({ pct, height = 5 }: { pct: number; height?: number }) {
  const color =
    pct >= 40
      ? "bg-[var(--color-emerald)]"
      : pct > 0
      ? "bg-[var(--color-gold)]"
      : "bg-[#B0785A]";

  return (
    <div
      className="rounded-full bg-[var(--color-panel-2)] overflow-hidden"
      style={{ height }}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${color}`}
        style={{ width: `${Math.max(pct, 2)}%` }}
      />
    </div>
  );
}
