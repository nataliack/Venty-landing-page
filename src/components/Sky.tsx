/* Gradient skies.
   "light" is LOCKED: the Crown, light from the top centre with a blue halo
   rising from below. It is also the app's Welcome gradient.
   "d1".."d5" are dark concepts for the landing page, built on the same
   four-light structure and the same drift timing. */
export type SkyVariant = "light" | "d1" | "d2" | "d3" | "d4" | "d5";

export const DARK_VARIANTS: { v: SkyVariant; name: string; note: string }[] = [
  { v: "d1", name: "Crown, inverted", note: "Same structure as the light. Dim periwinkle crown above, cornflower halo below, night between." },
  { v: "d2", name: "Blue crown", note: "The light from above becomes cornflower. Everything below falls to night." },
  { v: "d3", name: "Horizon", note: "Night above, a cornflower band low in the frame. Matches the hero's bottom glow." },
  { v: "d4", name: "Twin, dark", note: "Steel glow top-left, cornflower bottom-right, both quiet." },
  { v: "d5", name: "Void", note: "Almost pure night. One cornflower bloom wanders, nothing else." },
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
