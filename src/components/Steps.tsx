"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    n: "01",
    eyebrow: "Measure",
    title: "Build a body that is yours.",
    text: "Photo, tape, or both. Four measures to start, twenty more when you want the closest fit. Saved, versioned, named.",
  },
  {
    n: "02",
    eyebrow: "Describe",
    title: "Show it, say it, sketch it.",
    text: "A screenshot, a sentence, a scribble. Tell Venty how close you want it to sit, pick a fabric, and watch it draft on you.",
  },
  {
    n: "03",
    eyebrow: "Print",
    title: "Cut on Sunday.",
    text: "A4, A0 or projector. Seam allowance on or off. Grainlines, notches and labels on every piece, with a page map to tape it together.",
  },
];

function Visual({ i }: { i: number }) {
  if (i === 0)
    return (
      <div className="card-grad aspect-[4/5] w-full max-w-[420px] p-7 text-cloud">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-medium">Bust</p>
            <p className="eyebrow mt-1 text-cloud/60">Around you</p>
          </div>
          <span className="glass rounded-full px-3 py-1 text-xs">cm</span>
        </div>
        <div className="mt-[28%] flex items-baseline gap-3">
          <span data-count className="font-display text-[5.5rem] leading-none">88</span>
          <span className="eyebrow text-cloud/70">.0 cm</span>
        </div>
        <div className="relative mt-auto pt-10">
          <div className="ticks w-full text-cloud opacity-70" />
          <span className="absolute left-1/2 top-4 h-9 w-0.5 -translate-x-1/2 bg-cloud" />
        </div>
      </div>
    );
  if (i === 1)
    return (
      <div className="card-dark aspect-[4/5] w-full max-w-[420px] p-7 text-cloud">
        <p className="eyebrow text-cloud/50">Prompt</p>
        <p data-type className="mt-5 min-h-[7.5rem] text-[1.6rem] leading-tight">
          <span data-typed />
          <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-1 bg-cornflower [animation:blink_1s_steps(1)_infinite]" />
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {["Close fit", "Easy fit", "Loose"].map((c, k) => (
            <span
              key={c}
              className={`rounded-full px-3.5 py-1.5 text-sm ${k === 1 ? "bg-cornflower text-cloud" : "glass text-cloud/80"}`}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="mt-auto pt-10">
          <div className="flex items-center justify-between rounded-2xl bg-cloud/5 px-4 py-3 ring-1 ring-cloud/10">
            <span className="text-sm text-cloud/70">Fabric</span>
            <span className="text-sm">Silk crepe de chine</span>
          </div>
        </div>
      </div>
    );
  return (
    <div className="card-grad aspect-[4/5] w-full max-w-[420px] p-7 text-cloud">
      <div className="flex items-start justify-between">
        <p className="text-lg font-medium">Print</p>
        <span className="glass rounded-full px-3 py-1 text-xs">1:1</span>
      </div>
      <div className="mt-8 flex items-baseline gap-4">
        <span className="font-display text-[4.5rem] leading-none">A4</span>
        <span className="font-display text-[2.2rem] leading-none text-cloud/50">A0</span>
      </div>
      <div className="mt-8 grid grid-cols-4 gap-1.5" data-pages>
        {Array.from({ length: 16 }).map((_, k) => (
          <span key={k} className="aspect-[1/1.41] rounded-[3px] bg-cloud/15 ring-1 ring-cloud/20" />
        ))}
      </div>
      <p className="eyebrow mt-auto pt-6 text-cloud/60">16 pages · page map included</p>
    </div>
  );
}

export function Steps() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", () => {
      const track = el.querySelector<HTMLElement>("[data-track]")!;
      const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", el);
      const tween = gsap.to(track, {
        xPercent: -100 * (panels.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          pin: true,
          scrub: 0.8,
          end: () => "+=" + track.scrollWidth,
          snap: { snapTo: 1 / (panels.length - 1), duration: 0.5, ease: "power2.inOut" },
        },
      });
      panels.forEach((p) => {
        gsap.from(p.querySelector("[data-num]"), {
          xPercent: 40,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: p, containerAnimation: tween, start: "left 90%", end: "left 40%", scrub: true },
        });
      });
    });
    mm.add("(max-width: 899px)", () => {
      gsap.utils.toArray<HTMLElement>("[data-panel]", el).forEach((p) => {
        gsap.from(p.children, {
          y: 40,
          opacity: 0,
          stagger: 0.1,
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: { trigger: p, start: "top 80%" },
        });
      });
    });

    // Typing in step 02
    const ctx = gsap.context(() => {
      const typed = el.querySelector<HTMLElement>("[data-typed]")!;
      const text = "A slip dress, bias cut, midi, in silk.";
      const o = { n: 0 };
      gsap.to(o, {
        n: text.length,
        duration: 2.6,
        ease: "none",
        onUpdate: () => (typed.textContent = text.slice(0, Math.round(o.n))),
        scrollTrigger: { trigger: el, start: "top 60%" },
      });
      const pages = el.querySelectorAll("[data-pages] > span");
      gsap.to(pages, {
        backgroundColor: "rgba(239,244,255,0.55)",
        stagger: { each: 0.06, from: "start" },
        duration: 0.3,
        repeat: -1,
        yoyo: true,
        repeatDelay: 1.5,
      });
    }, el);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} id="how" data-wing="frame" data-nav="How it works" className="relative overflow-hidden">
      <div className="px-5 pt-[14vh] md:px-10">
        <p className="eyebrow text-faint">How it works</p>
        <h2 className="headline mt-4 text-[clamp(2.2rem,4.5vw,4.5rem)]">Three steps. Then scissors.</h2>
      </div>
      <div data-track className="flex flex-col md:h-[100svh] md:flex-row">
        {steps.map((s, i) => (
          <article
            key={s.n}
            data-panel
            className="grid w-full shrink-0 grid-cols-1 items-center gap-10 px-5 py-16 md:h-full md:w-screen md:grid-cols-12 md:px-10"
          >
            <div className="md:col-span-6">
              <p data-num className="font-display text-[clamp(6rem,18vw,18rem)] leading-[0.8] text-cornflower">
                {s.n}
              </p>
              <p className="eyebrow mt-6 text-faint">{s.eyebrow}</p>
              <h3 className="headline mt-3 max-w-[14ch] text-[clamp(2rem,4vw,4rem)]">{s.title}</h3>
              <p className="body-lg mt-5 max-w-md text-muted">{s.text}</p>
            </div>
            <div className="flex justify-center md:col-span-6 md:justify-end">
              <Visual i={i} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
