/* Light sky, five concepts. Each variant is a CSS block in globals.css
   (.sky-v1 .. .sky-v5) that sets the base gradient, the beam and the
   drifting lights. Motion is slow and small on every variant. */
export type SkyVariant = 1 | 2 | 3 | 4 | 5;

export const SKY_VARIANTS: { v: SkyVariant; name: string; note: string }[] = [
  { v: 1, name: "Balanced", note: "Beam toned down, blue bottom-right lifted to match it." },
  { v: 2, name: "Twin lights", note: "Equal light top-left and blue bottom-right on a diagonal haze." },
  { v: 3, name: "Crown", note: "Light from the top centre, blue halo rising from below." },
  { v: 4, name: "Deep blue", note: "More cornflower everywhere, less white, haze sits lower." },
  { v: 5, name: "Fog", note: "Lowest contrast. Periwinkle mist with one blue bloom." },
];

export function Sky({ variant = 1, className = "" }: { variant?: SkyVariant; className?: string }) {
  return (
    <div className={`sky sky-v${variant} ${className}`} aria-hidden="true">
      <span className="drift d1" />
      <span className="drift d2" />
      <span className="drift d3" />
      <span className="drift d4" />
    </div>
  );
}
