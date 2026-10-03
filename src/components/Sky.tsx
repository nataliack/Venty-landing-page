/* Gradient skies, three families.
   light: LOCKED. The Crown, light from the top centre with a blue halo
          rising from below. Also the app Welcome gradient.
   purple: LOCKED. Haze, periwinkle washing in over cornflower.
   k1-k3: dark, Edge at three intensities. Night dominates.
   All share the four-light drift structure and the 11-15s timing. */
export type SkyVariant =
  | "light"
  | "purple"
  | "k1" | "k2" | "k3";

export type SkyConcept = { v: SkyVariant; name: string; note: string };

export const LIGHT: SkyConcept[] = [
  { v: "light", name: "Crown", note: "Light from the top centre, blue halo rising from below. Used by the app Welcome screen." },
];

export const PURPLE: SkyConcept[] = [
  { v: "purple", name: "Haze", note: "Periwinkle washes in from the top-left over cornflower. Locked." },
];

export const DARK: SkyConcept[] = [
  { v: "k1", name: "Edge", note: "As shown before. Soft cornflower glow rising from the bottom." },
  { v: "k2", name: "Edge, smaller", note: "Same softness and fade as 01, the whole glow at about 60%. Drifts along the bottom." },
  { v: "k3", name: "Edge, smaller, roaming", note: "The same soft small glow, wandering the lower two thirds." },
];

export function Sky({ variant = "light", className = "" }: { variant?: SkyVariant; className?: string }) {
  return (
    <div className={`sky sky-${variant} ${className}`} aria-hidden="true">
      <span className="drift d1" />
      <span className="drift d2" />
      <span className="drift d3" />
      <span className="drift d4" />
    </div>
  );
}
