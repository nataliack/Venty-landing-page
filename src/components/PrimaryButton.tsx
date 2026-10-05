"use client";

import { useEffect, useRef } from "react";

/* Primary pill, from the Venty app's primary (.pill-primary): a periwinkle
   core with light pooling at the edges and a fine dot grid, and a soft
   gradient that swirls inside it on hover.

   Our hover, in place of the app's lift and outer glow: the pill is drawn a
   few px toward the pointer (the label a little further, so it sits in
   depth), and gives slightly under it, its inner edge light tightening.
   The pull is set here as --mx/--my; the rest is CSS (.btn-primary). */

const PULL = 0.22; // share of the pointer's distance from the centre
const MAX_X = 8; // px
const MAX_Y = 5; // px

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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !fine.matches || still.matches) return;
      const r = el.getBoundingClientRect();
      // measured from the resting centre: take back the pull on screen now
      // (the computed translate, mid-transition included)
      const [mx = 0, my = 0] = getComputedStyle(el).translate.split(" ").map((v) => parseFloat(v) || 0);
      const dx = e.clientX - (r.left - mx + r.width / 2);
      const dy = e.clientY - (r.top - my + r.height / 2);
      el.style.setProperty("--mx", `${clamp(dx * PULL, MAX_X).toFixed(2)}px`);
      el.style.setProperty("--my", `${clamp(dy * PULL, MAX_Y).toFixed(2)}px`);
    };
    const onLeave = () => {
      el.style.setProperty("--mx", "0px");
      el.style.setProperty("--my", "0px");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <a ref={ref} href={href} className={`btn-primary ${size === "sm" ? "is-small" : ""} ${className}`}>
      <span className="btn-primary__label">
        {children}
        {trailing}
      </span>
    </a>
  );
}
