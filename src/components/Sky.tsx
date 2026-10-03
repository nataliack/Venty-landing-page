/* Gradient skies, three families.
   light: LOCKED. The Crown, light from the top centre with a blue halo
          rising from below. Also the app Welcome gradient.
   purple: LOCKED. Haze, periwinkle washing in over cornflower.
   k1-k5: dark concepts. Night almost everywhere, light kept to a hint.
   All share the four-light drift structure and the 11-15s timing. */
export type SkyVariant =
  | "light"
  | "purple"
  | "k1" | "k2" | "k3" | "k4" | "k5";

export type SkyConcept = { v: SkyVariant; name: string; note: string };

export const LIGHT: SkyConcept[] = [
  { v: "light", name: "Crown", note: "Light from the top centre, blue halo rising from below. Used by the app Welcome screen." },
];

export const PURPLE: SkyConcept[] = [
  { v: "purple", name: "Haze", note: "Periwinkle washes in from the top-left over cornflower. Locked." },
];

export const DARK: SkyConcept[] = [
  { v: "k1", name: "Night", note: "Ink breathing at the top, nothing else. No colour." },
  { v: "k2", name: "Ember", note: "A wide cornflower warmth low right, barely there." },
  { v: "k3", name: "Crown, dark", note: "Periwinkle haze from above, very wide, the Crown's ghost." },
  { v: "k4", name: "Ink", note: "Night to ink with steel fog drifting across the middle." },
  { v: "k5", name: "Edge", note: "A long soft cornflower glow rising from the bottom." },
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
