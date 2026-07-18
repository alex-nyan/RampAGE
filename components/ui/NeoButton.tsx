import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Neubrutalist call-to-action. `NeoButton` renders a Next <Link> (needs `href`);
// `NeoActionButton` renders a <button>. Share these everywhere — landing CTAs,
// game screens — so every clickable thing wears the same identity.
type Variant = "primary" | "ghost" | "hot" | "amber";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-display uppercase tracking-wide " +
  "rounded-2xl border-[3px] border-night transition duration-150 " +
  "active:translate-x-[2px] active:translate-y-[2px]";

const variants: Record<Variant, string> = {
  primary:
    "bg-night text-acid shadow-hard hover:bg-hot hover:text-white hover:shadow-hard-sm",
  ghost: "bg-white text-night shadow-hard-sm hover:bg-amber",
  hot: "bg-hot text-white shadow-hard hover:brightness-110",
  amber: "bg-amber text-night shadow-hard-sm hover:brightness-105",
};

const sizes: Record<Size, string> = {
  sm: "text-[13px] px-4 py-2.5",
  md: "text-[15px] px-6 py-3.5",
  lg: "text-[17px] px-9 py-[18px]",
};

function classes(variant: Variant, size: Size, extra: string) {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function NeoButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={classes(variant, size, className)}>
      {children}
    </Link>
  );
}

export function NeoActionButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
} & ComponentProps<"button">) {
  return (
    <button
      className={classes(variant, size, `disabled:opacity-60 disabled:pointer-events-none ${className}`)}
      {...rest}
    >
      {children}
    </button>
  );
}
