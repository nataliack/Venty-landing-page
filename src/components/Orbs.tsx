"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/* Soft gradient field. Three large radial blobs that drift on their own and
   lean toward the pointer. No blur filter, the softness is in the gradient,
   so it stays cheap on phones. */
export function Orbs({
  className = "",
  intensity = 1,
  interactive = true,
}: {
  className?: string;
  intensity?: number;
  interactive?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const blobs = Array.from(el.querySelectorAll<HTMLElement>("[data-orb]"));
    const ctx = gsap.context(() => {
      blobs.forEach((b, i) => {
        gsap.to(b, {
          xPercent: gsap.utils.random(-12, 12),
          yPercent: gsap.utils.random(-10, 10),
          scale: gsap.utils.random(0.9, 1.15),
          duration: gsap.utils.random(9, 15),
          delay: i * 0.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
    }, el);

    if (!interactive) return () => ctx.revert();

    const movers = blobs.map((b, i) => ({
      x: gsap.quickTo(b, "x", { duration: 1.4 + i * 0.3, ease: "power3" }),
      y: gsap.quickTo(b, "y", { duration: 1.4 + i * 0.3, ease: "power3" }),
      depth: (i + 1) * 28 * intensity,
    }));
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      movers.forEach((m) => {
        m.x(nx * m.depth);
        m.y(ny * m.depth);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, [intensity, interactive]);

  return (
    <div ref={ref} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div
        data-orb
        className="absolute left-[-10%] top-[-20%] h-[80vmax] w-[80vmax] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--color-cornflower) 55%, transparent), transparent 70%)",
        }}
      />
      <div
        data-orb
        className="absolute right-[-20%] top-[10%] h-[70vmax] w-[70vmax] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--color-steel) 70%, transparent), transparent 70%)",
        }}
      />
      <div
        data-orb
        className="absolute left-[20%] bottom-[-40%] h-[90vmax] w-[90vmax] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--color-cloud) 22%, transparent), transparent 70%)",
        }}
      />
    </div>
  );
}
