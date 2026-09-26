"use client";

import { useRef } from "react";

/* Primary pill from the Figma Button/Pill component.
   - cornflower fill with the inset cloud glow
   - dot texture that fades at the rim and dodges the pointer
   - two steel arcs on the outline, top-left and bottom-right, that travel
     along the pill on hover so they swap sides
   - whole pill shrinks on hover, label slides up and is replaced */
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
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    // dots drift away from the pointer, a few px opposite to where it sits
    const dx = ((x / r.width) - 0.5) * -8;
    const dy = ((y / r.height) - 0.5) * -8;
    el.style.setProperty("--dx", `${dx}px`);
    el.style.setProperty("--dy", `${dy}px`);
  };

  return (
    <a
      ref={ref}
      href={href}
      onPointerMove={onMove}
      className={`btn-primary ${size === "sm" ? "is-small" : ""} ${className}`}
    >
      <span className="btn-primary__dots" aria-hidden="true" />
      <svg className="btn-primary__arcs" aria-hidden="true" preserveAspectRatio="none">
        <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="50%" ry="50%" pathLength={100} />
      </svg>
      <span className="btn-primary__label">
        <span className="btn-primary__text">{children}</span>
        <span className="btn-primary__text" aria-hidden="true">{children}</span>
      </span>
      {trailing}
    </a>
  );
}
