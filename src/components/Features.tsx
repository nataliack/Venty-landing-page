"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Features. On desktop the section pins: the four names stay listed on the
   left, scroll moves the active one down the list, and the right side swaps
   to that feature's visual. On phones each feature is a block with its
   visual underneath. */

function BodyLibrary() {
  const bodies = [
    { n: "Me", d: "October 2026", m: "24 measures" },
    { n: "Me", d: "March 2026", m: "18 measures" },
    { n: "Mum", d: "June 2026", m: "12 measures" },
  ];
  return (
    <div className="relative mx-auto h-[340px] w-full max-w-[420px]">
      {bodies.map((b, i) => (
        <div
          key={i}
          className="feat-body card-grad absolute inset-x-6 top-6 flex h-[260px] flex-col justify-between p-6 text-cloud"
          style={{ "--i": i, zIndex: 3 - i } as React.CSSProperties}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-4xl leading-none">{b.n}</p>
              <p className="eyebrow mt-2 text-cloud/70">{b.d}</p>
            </div>
            <svg viewBox="0 0 40 80" className="h-16 w-8 opacity-80" aria-hidden>
              <circle cx="20" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 22 Q20 18 32 22 L30 46 Q34 58 30 78 M10 22 L10 46 Q6 58 10 78" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <div className="ticks w-full text-cloud" />
            <p className="mt-3 text-sm text-cloud/80">{b.m}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Fit() {
  return (
    <div className="card-dark mx-auto w-full max-w-[420px] p-6 text-cloud">
      <div className="relative flex rounded-full bg-cloud/5 p-1 ring-1 ring-cloud/10">
        <span className="feat-fit-pill absolute inset-y-1 left-1 w-[calc((100%-8px)/3)] rounded-full bg-cornflower" />
        {["Close", "Easy", "Loose"].map((c) => (
          <span key={c} className="relative z-10 flex-1 py-2 text-center text-sm">{c}</span>
        ))}
      </div>
      <svg viewBox="0 0 300 260" className="mt-6 w-full" aria-hidden>
        <path d="M110 20 Q150 30 190 20 L200 70 Q206 110 192 140 Q210 180 214 240 L86 240 Q90 180 108 140 Q94 110 100 70 Z" fill="#eff4ff" fillOpacity="0.05" stroke="#9daccd" strokeOpacity="0.6" strokeWidth="1.5" />
        <g className="feat-fit-garment" style={{ transformOrigin: "150px 130px" }}>
          <path d="M110 20 Q150 30 190 20 L200 70 Q206 110 192 140 Q210 180 214 240 L86 240 Q90 180 108 140 Q94 110 100 70 Z" fill="none" stroke="#687ef5" strokeWidth="2.5" />
        </g>
      </svg>
      <div className="relative mt-4 h-6 overflow-hidden text-sm text-cloud/80">
        <span className="feat-fit-l absolute inset-0" style={{ "--i": 0 } as React.CSSProperties}>Sits close. Room to move, nothing more.</span>
        <span className="feat-fit-l absolute inset-0" style={{ "--i": 1 } as React.CSSProperties}>Easy. A little air around you.</span>
        <span className="feat-fit-l absolute inset-0" style={{ "--i": 2 } as React.CSSProperties}>Loose. Falls away from the body.</span>
      </div>
    </div>
  );
}

function Fabric() {
  const fabrics = [
    { n: "Silk crepe de chine", t: "Drapes", s: 1, c: "#687ef5" },
    { n: "Viscose twill", t: "Drapes", s: 0.75, c: "#485f88" },
    { n: "Linen", t: "Holds the shape", s: 0.3, c: "#9daccd" },
    { n: "Denim", t: "Will fight the bias", s: 0.06, c: "#384c65", warn: true },
  ];
  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-3">
      {fabrics.map((f) => (
        <div key={f.n} className={`card-dark flex items-center gap-4 p-3 pr-5 text-cloud ${f.warn ? "ring-1 ring-cornflower" : ""}`}>
          <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl" style={{ background: f.c }}>
            <span className="feat-drape absolute -inset-2" style={{ "--s": f.s } as React.CSSProperties} />
          </span>
          <span className="flex-1">
            <span className="block">{f.n}</span>
            <span className={`eyebrow mt-1 block ${f.warn ? "text-cornflower" : "text-cloud/50"}`}>{f.t}</span>
          </span>
          {f.warn && <span className="grid h-6 w-6 place-items-center rounded-full bg-cornflower text-xs">!</span>}
        </div>
      ))}
    </div>
  );
}

function PatternLibrary() {
  const items = [
    { n: "Slip dress", v: "v3", d: "M30 10 Q50 6 70 10 L74 40 L90 110 Q50 116 10 110 L26 40 Z" },
    { n: "Shell top", v: "v1", d: "M20 14 Q50 26 80 14 L86 40 L82 100 L18 100 L14 40 Z" },
    { n: "Wide-leg trousers", v: "v2", d: "M24 8 L76 8 L86 110 L56 110 L50 44 L44 110 L14 110 Z" },
    { n: "A-line skirt", v: "v1", d: "M30 12 L70 12 L90 108 Q50 114 10 108 Z" },
  ];
  return (
    <div className="mx-auto grid w-full max-w-[420px] grid-cols-2 gap-3">
      {items.map((it, i) => (
        <div key={it.n} className="card-dark p-4 text-cloud">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-cloud/50">{String(i + 1).padStart(2, "0")}</span>
            <span className="rounded-full bg-cornflower px-2 py-0.5 text-[11px]">{it.v}</span>
          </div>
          <svg viewBox="0 0 100 120" className="mx-auto mt-3 h-24" aria-hidden>
            <path className="feat-draw" d={it.d} fill="none" stroke="#eff4ff" strokeWidth="1.5" pathLength={1} style={{ "--i": i } as React.CSSProperties} />
            <path d={it.d} fill="none" stroke="#687ef5" strokeWidth="1" strokeDasharray="3 3" transform="translate(50 60) scale(1.08) translate(-50 -60)" />
          </svg>
          <p className="mt-3 text-sm">{it.n}</p>
        </div>
      ))}
    </div>
  );
}

const FEATURES = [
  { t: "Body library", d: "Every body you measure, saved and dated. Measure again next season and keep both, or keep a body for someone you sew for.", V: BodyLibrary },
  { t: "Fit in plain words", d: "Close, easy or loose. No ease tables to read. The technical terms are there when you want them.", V: Fit },
  { t: "Fabric suggestions", d: "Fabrics that will hang the way you pictured, and a flag on the ones that will fight the shape.", V: Fabric },
  { t: "Pattern library", d: "Every pattern you draft, with its versions, your notes and the body it was drafted on. Print it again any time.", V: PatternLibrary },
];

export function Features() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = gsap.utils.toArray<HTMLElement>("[data-feat]", el);
    const visuals = gsap.utils.toArray<HTMLElement>("[data-feat-visual]", el);
    const needle = el.querySelector<HTMLElement>("[data-needle]")!;
    const thread = el.querySelector<HTMLElement>("[data-thread]")!;
    const mm = gsap.matchMedia();

    mm.add("(min-width: 900px)", () => {
      let active = -1;
      const set = (i: number) => {
        if (i === active) return;
        active = i;
        items.forEach((it, k) => (it.dataset.active = String(k === i)));
        visuals.forEach((v, k) => (v.dataset.active = String(k === i)));
      };
      set(0);
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const p = self.progress;
          set(Math.min(items.length - 1, Math.floor(p * items.length)));
          thread.style.transform = `scaleY(${p})`;
          needle.style.top = `${p * 100}%`;
        },
      });
      return () => {
        st.kill();
        items.forEach((it) => (it.dataset.active = "true"));
      };
    });

    mm.add("(max-width: 899px)", () => {
      items.forEach((it) => (it.dataset.active = "true"));
      items.forEach((it) =>
        gsap.from(it.children, { y: 40, opacity: 0, stagger: 0.1, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: it, start: "top 80%" } }),
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={ref} id="features" data-wing="spread" data-nav="Features" data-theme-zone="dark" className="relative overflow-x-clip md:h-[420vh]">
      <div className="relative px-5 py-[14vh] md:sticky md:top-0 md:h-[100svh] md:px-10 md:pb-[4vh] md:pt-[12vh]">
        <div className="relative h-full md:grid md:grid-cols-12 md:items-center md:gap-10">
          <div className="md:col-span-6">
            <p className="eyebrow text-periwinkle">Features</p>
            <h2 className="headline mt-4 max-w-[14ch] text-[clamp(2.2rem,3.4vw,3.6rem)] text-fg">Everything a pattern needs.</h2>

            <div className="relative mt-10 md:mt-10 md:pl-10">
              {/* thread and needle, desktop only */}
              <span aria-hidden className="absolute bottom-0 left-0 top-0 hidden w-px bg-line md:block" />
              <span data-thread aria-hidden className="absolute bottom-0 left-0 top-0 hidden w-px origin-top bg-cornflower md:block" style={{ transform: "scaleY(0)" }} />
              <span data-needle aria-hidden className="absolute -left-[3px] top-0 hidden h-7 w-[7px] -translate-y-1/2 rounded-full bg-cloud shadow-[0_0_18px_var(--color-cornflower)] md:block" />

              <ol className="flex flex-col gap-16 md:gap-5">
                {FEATURES.map(({ t, d, V }, i) => (
                  <li key={t} data-feat data-active="true" className="group">
                    <div className="flex items-baseline gap-4">
                      <span className="font-display w-7 shrink-0 text-lg text-cornflower md:text-faint md:transition-colors md:duration-500 md:group-data-[active=true]:text-cornflower">0{i + 1}</span>
                      <h3 className="text-[clamp(1.9rem,3.1vw,3.2rem)] font-normal leading-none tracking-[-0.04em] text-fg md:opacity-30 md:transition-[opacity,transform] md:duration-700 md:ease-[var(--ease-out-expo)] md:group-data-[active=true]:translate-x-3 md:group-data-[active=true]:opacity-100">
                        {t}
                      </h3>
                    </div>
                    <div className="grid md:grid-rows-[0fr] md:transition-[grid-template-rows] md:duration-700 md:ease-[var(--ease-out-expo)] md:group-data-[active=true]:grid-rows-[1fr]">
                      <p className="body-lg mt-4 max-w-[34ch] overflow-hidden pl-9 text-muted md:pl-12">{d}</p>
                    </div>
                    <div className="mt-10 md:hidden">
                      <V />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* desktop visuals, one per feature, stacked */}
          <div className="relative hidden h-full md:col-span-6 md:block">
            {FEATURES.map(({ t, V }) => (
              <div
                key={t}
                data-feat-visual
                data-active="false"
                className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-[opacity,transform,filter] duration-700 ease-[var(--ease-out-expo)] [filter:blur(12px)] [transform:translateY(40px)_scale(0.96)] data-[active=true]:pointer-events-auto data-[active=true]:opacity-100 data-[active=true]:[filter:blur(0)] data-[active=true]:[transform:none]"
              >
                <div className="w-full">
                  <V />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
