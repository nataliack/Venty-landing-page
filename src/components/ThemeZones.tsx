"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* The page is dark by default. A section with data-theme-zone="light"
   turns <html> light while it holds the middle of the screen. */
export function ThemeZones() {
  useEffect(() => {
    const html = document.documentElement;
    const zones = gsap.utils.toArray<HTMLElement>("[data-theme-zone]");
    const triggers = zones.map((z) =>
      ScrollTrigger.create({
        trigger: z,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => {
          if (self.isActive && z.dataset.themeZone === "light") html.setAttribute("data-theme", "light");
          else if (self.isActive) html.removeAttribute("data-theme");
        },
      }),
    );
    return () => {
      triggers.forEach((t) => t.kill());
      html.removeAttribute("data-theme");
    };
  }, []);
  return null;
}
