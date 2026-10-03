"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* The workbench. A pinned, full-bleed scroll scene rendered in Blender
   (tools/workbench): the camera comes down from straight above the table to
   a low front view while the window light drifts across it. Scroll position
   picks the frame; neighbouring frames are cross-faded so the motion stays
   smooth between them. The page goes dark as it arrives, three text beats
   play over the scene. At the end the camera sinks past the table edge, the
   table rises out of frame, and night fades up from the bottom of the screen
   into the call to action. */

const COUNT = 150; // 1 to 120 the orbit, 121 to 150 the descent below the table
const W = 1280;
const H = 720;
const CLOSE_UP = 119; // the last frame of the orbit, the still for reduced motion
const FRAMES_END = 0.97; // a short hold on solid night after the last frame
const src = (i: number) => `/workbench/f_${String(i + 1).padStart(3, "0")}.webp`;

export function Workbench() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = el.querySelector<HTMLCanvasElement>("[data-frames]")!;
    const dustCanvas = el.querySelector<HTMLCanvasElement>("[data-dust]")!;
    const counter = el.querySelector<HTMLElement>("[data-count]")!;
    const bar = el.querySelector<HTMLElement>("[data-bar]")!;
    const g = canvas.getContext("2d")!;

    // ------------------------------------------------------------ frames
    const frames: (HTMLImageElement | null)[] = new Array(COUNT).fill(null);
    let pos = reduce ? CLOSE_UP : 0;

    const nearest = (i: number) => {
      for (let d = 0; d < COUNT; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    };

    const cover = (img: HTMLImageElement, alpha: number) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const s = Math.max(cw / W, ch / H);
      const dw = W * s;
      const dh = H * s;
      g.globalAlpha = alpha;
      g.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    const draw = () => {
      const a = Math.floor(pos);
      const b = Math.min(COUNT - 1, a + 1);
      const t = pos - a;
      if (frames[a] && frames[b]) {
        cover(frames[a]!, 1);
        if (t > 0.001) cover(frames[b]!, t);
      } else {
        const n = nearest(Math.round(pos));
        if (n >= 0) cover(frames[n]!, 1);
      }
      g.globalAlpha = 1;
      const shown = Math.round(pos) + 1;
      counter.textContent = `${String(shown).padStart(3, "0")} / ${COUNT}`;
    };

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      dustCanvas.width = Math.round(dustCanvas.clientWidth * 0.75);
      dustCanvas.height = Math.round(dustCanvas.clientHeight * 0.75);
      draw();
    };
    const ro = new ResizeObserver(size);
    ro.observe(canvas);

    // coarse to fine: every 8th frame first, so scrubbing works early
    const order: number[] = [];
    for (const step of [8, 4, 2, 1]) {
      for (let i = 0; i < COUNT; i += step) if (!order.includes(i)) order.push(i);
    }
    if (!order.includes(COUNT - 1)) order.splice(1, 0, COUNT - 1);
    let started = false;
    let cancelled = false;
    const load = () => {
      if (started) return;
      started = true;
      let next = 0;
      const tries = new Array(COUNT).fill(0);
      const fetchFrame = (i: number, done: () => void) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          frames[i] = img;
          if (Math.abs(i - pos) < 9) draw();
          done();
        };
        // a frame that is not there yet (still rendering) is asked for again later
        img.onerror = () => {
          if (++tries[i] < 40) setTimeout(() => !cancelled && fetchFrame(i, () => {}), 20000);
          done();
        };
        img.src = src(i) + (tries[i] ? `?r=${tries[i]}` : "");
      };
      const worker = () => {
        if (cancelled || next >= order.length) return;
        fetchFrame(order[next++], worker);
      };
      for (let k = 0; k < 6; k++) worker();
    };
    const io = new IntersectionObserver((e) => e[0].isIntersecting && load(), { rootMargin: "200% 0px" });
    io.observe(el);

    // ------------------------------------------------------------ dust in the shaft
    let raf = 0;
    if (!reduce) {
      const d = dustCanvas.getContext("2d")!;
      const motes = Array.from({ length: 46 }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: 0.4 + Math.random() * 1.3,
        s: 0.2 + Math.random() * 0.8,
        p: Math.random() * Math.PI * 2,
      }));
      const tick = (time: number) => {
        const w = dustCanvas.width;
        const h = dustCanvas.height;
        d.clearRect(0, 0, w, h);
        for (const m of motes) {
          const x = ((m.x + time * 0.000004 * m.s + 0.012 * Math.sin(time * 0.0003 * m.s + m.p)) % 1) * w;
          const y = ((m.y - time * 0.0000025 * m.s + 1) % 1) * h;
          // brightest inside the shaft, which falls from the left
          const inShaft = Math.max(0, 1 - Math.abs(y / h - 0.55 - (x / w) * 0.1) * 3.2) * (1 - (x / w) * 0.6);
          const a = inShaft * (0.25 + 0.35 * (0.5 + 0.5 * Math.sin(time * 0.0012 * m.s + m.p)));
          if (a < 0.02) continue;
          d.globalAlpha = a;
          d.fillStyle = "#eff4ff";
          d.beginPath();
          d.arc(x, y, m.r, 0, Math.PI * 2);
          d.fill();
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    // ------------------------------------------------------------ scroll
    const ctx = gsap.context(() => {
      // Dark while the table is on screen. The CTA below turns the page light
      // again when it is scrolled back past, so the section re-asserts dark.
      const html = document.documentElement;
      let active = false;
      const dark = () => html.hasAttribute("data-theme") && html.removeAttribute("data-theme");
      const mo = new MutationObserver(() => active && dark());
      mo.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
      ScrollTrigger.create({
        trigger: el,
        start: "top 60%",
        end: "bottom 40%",
        onToggle: (self) => {
          active = self.isActive;
          if (active) dark();
        },
        onLeaveBack: () => html.setAttribute("data-theme", "light"),
      });

      if (reduce) {
        gsap.set("[data-beat='3'] [data-line]", { opacity: 1 });
        return () => mo.disconnect();
      }

      // the scene fades up out of night as the section arrives
      gsap.fromTo(
        "[data-stage]",
        { opacity: 0, scale: 1.08 },
        { opacity: 1, scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top top", scrub: true } },
      );

      // frames, the HUD bar
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const p = gsap.utils.clamp(0, 1, self.progress / FRAMES_END);
          pos = p * (COUNT - 1);
          bar.style.transform = `scaleX(${p})`;
          draw();
        },
      });

      // beats, bars and the exit, on one timeline the length of the section
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.8 },
      });
      const inLine = { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.02, duration: 0.06 };
      const outLine = { opacity: 0, y: -24, filter: "blur(10px)", stagger: 0.01, duration: 0.05, ease: "power2.in" };
      gsap.set("[data-line]", { opacity: 0, y: 30, filter: "blur(12px)" });
      tl.to("[data-bar-top], [data-bar-bottom]", { height: 0, duration: 0.3, ease: "power1.inOut" }, 0.02)
        .to("[data-beat='1'] [data-line]", inLine, 0.03)
        .to("[data-beat='1'] [data-line]", outLine, 0.2)
        .to("[data-beat='2'] [data-line]", inLine, 0.29)
        .to("[data-beat='2'] [data-line]", outLine, 0.45)
        .to("[data-beat='3'] [data-line]", { ...inLine, stagger: 0.035 }, 0.5)
        // clears so the close-up has a clean moment before the camera sinks (frame 121 at about 0.78)
        .to("[data-beat='3']", { opacity: 0, y: -40, filter: "blur(8px)", duration: 0.06, ease: "power2.in" }, 0.66)
        // night fades up from the bottom while the table rises out of frame
        .fromTo("[data-curtain]", { yPercent: 100 }, { yPercent: 0, duration: 0.18, ease: "power1.in" }, 0.8)
        .to("[data-hud]", { opacity: 0, duration: 0.05 }, 0.92)
        .set({}, {}, 1); // timeline length 1, so positions above are fractions of the scroll

      return () => mo.disconnect();
    }, el);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={ref}
      id="table"
      data-nav="The table"
      aria-label="The workbench"
      className="relative h-[500vh] motion-reduce:h-[100svh] [&_[data-line]]:opacity-0"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-night">
        <div data-stage className="absolute inset-0">
          <canvas data-frames aria-hidden className="absolute inset-0 h-full w-full" />
          {/* the render's shadows reach pure black; lighten lifts anything darker
              than night up to night, so the scene meets the page without a step */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-night mix-blend-lighten" />
          <canvas data-dust aria-hidden className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen" />
          {/* edges fall to night, and a soft pool of dark behind the type */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(130% 95% at 50% 45%, transparent 45%, rgba(11,12,21,0.85) 100%), linear-gradient(to bottom, rgba(11,12,21,0.55), transparent 30%, transparent 75%, rgba(11,12,21,0.6))",
            }}
          />
        </div>

        {/* letterbox, opens as the camera starts to move */}
        <div data-bar-top aria-hidden className="absolute inset-x-0 top-0 z-10 h-[9vh] bg-night" />
        <div data-bar-bottom aria-hidden className="absolute inset-x-0 bottom-0 z-10 h-[9vh] bg-night" />

        {/* beat 1, over the overhead view */}
        <div data-beat="1" className="absolute inset-0 z-20 grid place-items-center px-5 text-center text-cloud">
          <div
            className="px-10 py-12"
            style={{ background: "radial-gradient(closest-side, rgba(11,12,21,0.7), transparent)" }}
          >
            <p data-line className="eyebrow text-periwinkle">Fig. 04 / The table</p>
            <h2 className="headline mt-6 text-[clamp(2.6rem,7vw,7.5rem)]">
              <span data-line className="block">Where the pattern</span>
              <span data-line className="font-display block text-[1.08em] leading-[1.05]">meets the cloth.</span>
            </h2>
          </div>
        </div>

        {/* beat 2, low on the left while the camera comes down */}
        <div data-beat="2" className="absolute inset-x-0 bottom-[16vh] z-20 px-5 text-cloud md:px-10">
          <p data-line className="eyebrow text-periwinkle">Printed at 1:1</p>
          <p className="headline mt-5 max-w-[16ch] text-[clamp(1.9rem,4vw,4rem)]">
            <span data-line className="block">Printed at true size.</span>
            <span data-line className="block">Pinned to linen.</span>
            <span data-line className="block text-periwinkle">Every line drafted for one body.</span>
          </p>
        </div>

        {/* beat 3, in the dark above the table at the end of the move */}
        <div data-beat="3" className="absolute inset-x-0 top-[14vh] z-20 px-5 text-cloud md:px-10">
          <h2 className="headline text-[clamp(2.6rem,7.5vw,8rem)]">
            <span data-line className="block">Your measurements.</span>
            <span data-line className="block">Your cloth.</span>
            <span data-line className="font-display block text-[1.08em] leading-[1.05] text-cornflower">Your Sunday.</span>
          </h2>
        </div>

        {/* HUD: a quiet caption and the frame count */}
        <div data-hud className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-5 pb-6 md:px-10">
          <p className="eyebrow text-faint">Venty / Workbench</p>
          <div className="flex items-center gap-4">
            <span className="relative block h-px w-[18vw] max-w-56 overflow-hidden bg-cloud/15">
              <span data-bar className="absolute inset-0 origin-left scale-x-0 bg-cornflower" />
            </span>
            <span data-count className="eyebrow tabular-nums text-faint">001 / {COUNT}</span>
          </div>
        </div>

        {/* night fades up from the bottom as the camera sinks; its soft
            edge ends above the viewport, so the final state is solid night */}
        <div
          data-curtain
          aria-hidden
          className="absolute inset-x-0 bottom-0 z-40 h-[135svh]"
          style={{ background: "linear-gradient(to top, var(--color-night) 76%, transparent)", transform: "translateY(100%)" }}
        />
      </div>
    </section>
  );
}
