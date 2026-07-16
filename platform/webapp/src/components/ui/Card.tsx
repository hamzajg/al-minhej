import type { HTMLAttributes } from "react";

export function Card({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}

export function IconBadge({
  children,
  tone = "emerald",
  size = 40,
}: {
  children: React.ReactNode;
  tone?: "emerald" | "gold" | "muted";
  size?: number;
}) {
  const bg =
    tone === "emerald"
      ? "bg-[var(--color-emerald)] text-[#FBF7EE]"
      : tone === "gold"
      ? "bg-[var(--color-gold)] text-[#241c0a]"
      : "bg-[var(--color-panel-2)] text-[var(--color-sub)]";
  return (
    <div
      className={`grid place-items-center rounded-full font-bold ${bg}`}
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}
