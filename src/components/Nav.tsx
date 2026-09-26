"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LogoMark, Wordmark } from "./Logo";
import { PrimaryButton } from "./PrimaryButton";

gsap.registerPlugin(ScrollTrigger);

const links = [
  { href: "#how", label: "How it works" },
  { href: "#measure", label: "Measure" },
  { href: "#features", label: "Inside" },
];

export function Nav() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from(el, { y: -24, opacity: 0, duration: 1.2, delay: 0.4, ease: "expo.out" });
      let hidden = false;
      ScrollTrigger.create({
        start: 80,
        onUpdate: (self) => {
          const shouldHide = self.direction === 1 && self.scroll() > 200;
          if (shouldHide !== hidden) {
            hidden = shouldHide;
            gsap.to(el, { yPercent: hidden ? -160 : 0, duration: 0.6, ease: "expo.out", overwrite: true });
          }
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <header ref={ref} className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 md:top-6">
      <nav className="glass flex w-full max-w-5xl items-center justify-between rounded-full py-2 pl-5 pr-2 md:pl-6">
        <a href="#top" className="flex items-center gap-2 text-fg" aria-label="Venty home">
          <LogoMark className="h-5 w-auto" />
          <Wordmark className="h-[18px] w-auto" />
        </a>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="group relative block px-4 py-2 text-[0.95rem] font-normal text-muted transition-colors hover:text-fg"
              >
                {l.label}
                <span className="absolute bottom-1 left-4 right-4 h-px origin-left scale-x-0 bg-cornflower transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-100" />
              </a>
            </li>
          ))}
        </ul>
        <PrimaryButton href="#cta" size="sm">
          Get the app
        </PrimaryButton>
      </nav>
    </header>
  );
}
