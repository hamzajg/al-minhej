import type { ButtonHTMLAttributes } from "react";

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Pill({ active, className = "", ...rest }: PillProps) {
  return (
    <button
      className={[
        "rounded-full border px-3 py-1.5 text-[11.5px] whitespace-nowrap transition-colors font-sans",
        active
          ? "bg-[var(--color-emerald)] text-[#F4EFE2] border-[var(--color-emerald)]"
          : "bg-transparent text-[var(--color-sub)] border-[var(--color-line)] hover:border-[var(--color-gold)]",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}
