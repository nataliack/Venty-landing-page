"use client";

import { useEffect } from "react";

/* Sections a screen or more away from the view get data-off, and their CSS
   animations (glows drifting, rings turning, cards swaying) pause until
   they come back (globals.css). Nothing is seen to stop: they are paused
   only while off screen. */
export function PauseOffscreen() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("main > section, main > div, body footer");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) el.removeAttribute("data-off");
          else el.setAttribute("data-off", "");
        }
      },
      { rootMargin: "100% 0px 100% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
