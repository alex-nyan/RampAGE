// Infinite scrolling marquee. Duplicates the text so the -50% keyframe loops
// seamlessly. `speed` is seconds per lap; higher = slower.
export function Ticker({
  text,
  speed = 30,
  tone = "light",
  className = "",
}: {
  text: string;
  speed?: number;
  tone?: "light" | "acid";
  className?: string;
}) {
  const color = tone === "acid" ? "text-acid" : "text-white";
  return (
    <div
      className={`flex h-[26px] items-center overflow-hidden border-t-2 border-night/40 bg-night ${className}`}
    >
      <div
        className={`animate-tick flex whitespace-nowrap font-display text-[12px] ${color}`}
        style={{ ["--tick-speed" as string]: `${speed}s` }}
      >
        <span className="pr-6">{text}</span>
        <span className="pr-6">{text}</span>
      </div>
    </div>
  );
}
