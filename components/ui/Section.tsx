import type { ReactNode } from "react";

// Full-bleed landing section with the signature black top rule and a centered
// inner column. `tone` picks one of the palette backgrounds.
type Tone = "acid" | "night" | "white" | "cream";

const tones: Record<Tone, string> = {
  acid: "bg-acid text-night",
  night: "bg-night text-white",
  white: "bg-white text-night",
  cream: "bg-cream text-night",
};

export function Section({
  id,
  tone = "acid",
  rule = true,
  className = "",
  innerClassName = "",
  children,
}: {
  id?: string;
  tone?: Tone;
  rule?: boolean; // the 4px black divider on top
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`${tones[tone]} ${rule ? "border-t-4 border-night" : ""} px-6 py-20 md:px-12 ${className}`}
    >
      <div className={`mx-auto w-full max-w-[1200px] ${innerClassName}`}>{children}</div>
    </section>
  );
}
