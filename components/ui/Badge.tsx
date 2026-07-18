import type { ReactNode } from "react";

// Small Bungee chip. `solid` = black pill w/ acid text (the hero eyebrow);
// `pill` = outlined rounded tag (the hero feature pills).
export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-night px-3.5 py-2 font-display text-[12px] text-acid ${className}`}
    >
      {children}
    </span>
  );
}

export function Pill({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border-[2.5px] border-night bg-white px-3.5 py-1.5 text-[13px] font-bold text-night ${className}`}
    >
      {children}
    </span>
  );
}
