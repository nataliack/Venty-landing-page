"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* The page is dark by default. A section with data-theme-zone="light"
   turns <html> light while it holds the middle of the screen. */
// Chrome on Android tints its toolbar from theme-color: cornflower while the
// page is dark, the page colour while it is light, like Safari's bars.
const BAR = { dark: "#687ef5", light: "#eff4ff" };

export function ThemeZones() {
  useEffect(() => {
    const html = document.documentElement;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const zones = gsap.utils.toArray<HTMLElement>("[data-theme-zone]");
    const triggers = zones.map((z) =>
      ScrollTrigger.create({
        trigger: z,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => {
          if (!self.isActive) return;
          const light = z.dataset.themeZone === "light";
          if (light) html.setAttribute("data-theme", "light");
          else html.removeAttribute("data-theme");
          meta?.setAttribute("content", light ? BAR.light : BAR.dark);
        },
      }),
    );
    return () => {
      triggers.forEach((t) => t.kill());
      html.removeAttribute("data-theme");
      meta?.setAttribute("content", BAR.dark);
    };
  }, []);
  return null;
}
