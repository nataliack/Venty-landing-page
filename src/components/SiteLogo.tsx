"use client";

import { LogoMark } from "./Logo";
import { scrollToElement } from "./SmoothScroll";

/* The Venty mark, top left on every section (fixed). It sits under the
   hero's announcement bar while that shows and level with the section menu
   opposite (.site-logo in globals.css). Takes you back to the top. The hero
   animates it in on load (data-logo). */
export function SiteLogo() {
  return (
    <a
      data-logo
      href="#top"
      aria-label="Venty, back to the top"
      className="site-logo fixed z-[70]"
      onClick={(e) => {
        const top = document.getElementById("top");
        if (!top) return;
        e.preventDefault();
        scrollToElement(top);
      }}
    >
      <LogoMark className="w-[clamp(32px,3.4vw,49px)] text-cornflower" />
    </a>
  );
}
