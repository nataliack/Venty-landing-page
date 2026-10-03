/* Gradient skies, three families.
   light: LOCKED. The Crown, light from the top centre with a blue halo
          rising from below. Also the app Welcome gradient.
   purple: LOCKED. Haze, periwinkle washing in over cornflower.
   dark: LOCKED. Edge, a soft small cornflower glow roaming over night.
   All share the four-light drift structure and the 11-15s timing. */
export type SkyVariant =
  | "light"
  | "purple"
  | "dark";

export type SkyConcept = { v: SkyVariant; name: string; note: string };

export const LIGHT: SkyConcept[] = [
  { v: "light", name: "Crown", note: "Light from the top centre, blue halo rising from below. Used by the app Welcome screen." },
];

export const PURPLE: SkyConcept[] = [
  { v: "purple", name: "Haze", note: "Periwinkle washes in from the top-left over cornflower. Locked." },
];

export const DARK: SkyConcept[] = [
  { v: "dark", name: "Edge", note: "A soft small cornflower glow roaming the lower two thirds of night. Locked." },
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
