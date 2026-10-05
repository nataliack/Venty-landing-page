/* Primary pill, the same button as the Venty app's primary (.pill-primary,
   from the app's overhaul branch): a periwinkle core with light pooling at
   the edges and a fine dot grid. On hover it lifts, the inner glow
   brightens and a soft gradient swirls slowly inside it; a press dips it
   and springs back. All of it is CSS, see .btn-primary in globals.css. */

export function PrimaryButton({
  href,
  children,
  size = "md",
  className = "",
  trailing,
}: {
  href: string;
  children: string;
  size?: "md" | "sm";
  className?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <a href={href} className={`btn-primary ${size === "sm" ? "is-small" : ""} ${className}`}>
      {children}
      {trailing}
    </a>
  );
}
