/* Gradient skies, three families.
   light: LOCKED. The Crown, light from the top centre with a blue halo
          rising from below. Also the app Welcome gradient.
   p1-p5: purple concepts. Cornflower body with a soft pale bloom, after
          Jose's reference tile.
   k1-k5: dark concepts. Night almost everywhere, light kept to a hint.
   All share the four-light drift structure and the 11-15s timing. */
export type SkyVariant =
  | "light"
  | "p1" | "p2" | "p3" | "p4" | "p5"
  | "k1" | "k2" | "k3" | "k4" | "k5";

export type SkyConcept = { v: SkyVariant; name: string; note: string };

export const LIGHT: SkyConcept[] = [
  { v: "light", name: "Crown", note: "Light from the top centre, blue halo rising from below. Used by the app Welcome screen." },
];

export const PURPLE: SkyConcept[] = [
  { v: "p1", name: "Bloom", note: "Closest to the reference. Flat cornflower with one soft pale bloom right of centre." },
  { v: "p2", name: "Dusk", note: "Cornflower above sinking to indigo below, pale bloom drifting mid-right." },
  { v: "p3", name: "Haze", note: "Lighter. Periwinkle washes in from the top-left over cornflower." },
  { v: "p4", name: "Deep", note: "Indigo-leaning cornflower, one bright cloud bloom, more contrast." },
  { v: "p5", name: "Lilac", note: "Two blooms, lavender and mist, on a cornflower field." },
];

export const DARK: SkyConcept[] = [
  { v: "k1", name: "Night", note: "Night with a faint ink lift at the top. No colour." },
  { v: "k2", name: "Ember", note: "Night with one very faint cornflower bloom bottom-right." },
  { v: "k3", name: "Crown, dark", note: "Night with a hint of periwinkle from the top centre." },
  { v: "k4", name: "Ink", note: "Night falling to ink, a trace of steel drifting through." },
  { v: "k5", name: "Edge", note: "Night with a thin cornflower horizon at the very bottom." },
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
