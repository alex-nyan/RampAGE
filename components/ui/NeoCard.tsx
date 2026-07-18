import type { CSSProperties, ReactNode } from "react";

// The building block of the whole look: thick black border + hard offset shadow.
// `tilt` rotates it a touch (the landing scatters cards at -2°/2°); `shadow`
// overrides the drop colour (e.g. the pink leaderboard shadow).
export function NeoCard({
  children,
  className = "",
  tilt = 0,
  shadow = "var(--color-night)",
  shadowSize = 8,
  style,
}: {
  children: ReactNode;
  className?: string;
  tilt?: number;
  shadow?: string;
  shadowSize?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-[18px] border-[3.5px] border-night ${className}`}
      style={{
        boxShadow: `${shadowSize}px ${shadowSize}px 0 ${shadow}`,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
