"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* The page is dark by default. A section with data-theme-zone="light"
   turns <html> light while it holds the middle of the screen (or from its
   own data-theme-at, a ScrollTrigger start, for one that rises over the
   section before it). */
// Chrome on Android tints its toolbar from theme-color: cornflower while the
// page is dark, the page colour while it is light, like Safari's bars.
const BAR = { dark: "#687ef5", light: "#eff4ff" };

export function ThemeZones() {
  useEffect(() => {
    const html = document.documentElement;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const zones = gsap.utils.toArray<HTMLElement>("[data-theme-zone]");
    // Zones can overlap (one rising over the last screen of another), so the
    // theme follows the latest zone in page order that is active right now.
    const active = new Set<number>();
    const apply = () => {
      const last = Math.max(-1, ...active);
      if (last < 0) return; // between zones: keep the last theme
      const light = zones[last].dataset.themeZone === "light";
      if (light) html.setAttribute("data-theme", "light");
      else html.removeAttribute("data-theme");
      meta?.setAttribute("content", light ? BAR.light : BAR.dark);
    };
    const triggers = zones.map((z, i) =>
      ScrollTrigger.create({
        trigger: z,
        start: z.dataset.themeAt ?? "top 55%",
        end: "bottom 55%",
        onToggle: (self) => {
          if (self.isActive) active.add(i);
          else active.delete(i);
          apply();
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
