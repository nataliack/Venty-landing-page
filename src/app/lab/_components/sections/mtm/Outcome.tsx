"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import { GARMENT, NARROW, PIECES, WIDE, type Body, type Fit, type Plan } from "./data";
import { Icon, I } from "./icons";

/* The outcome: the finished garment on a light table, its pattern pieces
   laid round it like a flat lay, each pinned on a paper card with a
   hairline to where it sits on the garment. Hover a piece and its place
   on the garment lights; hover the garment and its pieces do.

   On each draft: the pieces fly in from the Draft button (FLIP), the
   garment rises out of the table with a light sweep, then the leader
   lines draw and the spec and the CTA arrive. Pieces float at slightly
   different depths with the pointer. */

type Level = 0 | 1 | 2 | 3; // empty, pieces, garment, lines and spec

export function Outcome({ run, from, body, fit, onReplay }: { run: number; from: () => DOMRect | null; body: Body; fit: Fit; onReplay: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [plan, setPlan] = useState<Plan>(WIDE);
  const [level, setLevel] = useState<Level>(0);
  const [hot, setHot] = useState<string | null>(null);

  // wide or narrow arrangement, by the column's width
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setPlan(e.contentRect.width < 560 ? NARROW : WIDE));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // each draft plays the build
  useEffect(() => {
    if (!run) return;
    const el = box.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLevel(3);
      return;
    }
    setLevel(1);
    const ids: number[] = [];
    // after the pieces have rendered, fly each one in from the button
    const raf = requestAnimationFrame(() => {
      const src = from();
      el.querySelectorAll<HTMLElement>("[data-piece]").forEach((p, i) => {
        const r = p.getBoundingClientRect();
        const dx = src ? src.left + src.width / 2 - (r.left + r.width / 2) : -120;
        const dy = src ? src.top + src.height / 2 - (r.top + r.height / 2) : 0;
        p.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(0.18) rotate(${i % 2 ? 10 : -10}deg)`, opacity: 0 },
            { opacity: 1, offset: 0.25 },
            { transform: "none", opacity: 1 },
          ],
          { duration: 1000, delay: 120 + i * 95, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" },
        );
      });
    });
    ids.push(window.setTimeout(() => setLevel(2), 1050));
    ids.push(window.setTimeout(() => setLevel(3), 1950));
    return () => {
      cancelAnimationFrame(raf);
      ids.forEach(clearTimeout);
    };
  }, [run, from]);

  // depth: the pieces drift a few px with the pointer
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    e.currentTarget.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };

  const g = plan.garment;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const narrow = plan === NARROW;

  return (
    <div className="mtm-out" data-level={level}>
      <div className="mtm-out__table" aria-hidden="true" />
      <div className="mtm-out__veil" aria-hidden="true" />

      <div
        ref={box}
        className="mtm-stage"
        style={{ aspectRatio: `${plan.w} / ${plan.h}` }}
        onPointerMove={onMove}
        onPointerLeave={(e) => {
          e.currentTarget.style.setProperty("--px", "0");
          e.currentTarget.style.setProperty("--py", "0");
        }}
      >
        {level === 0 && <p className="mtm-out__wait">Your pattern lands here</p>}

        {/* leader lines, in the design space */}
        <svg className="mtm-leaders" viewBox={`0 0 ${plan.w} ${plan.h}`} aria-hidden="true">
          {PIECES.map((p, i) => {
            const b = plan.at[p.key];
            const x1 = b.side === "r" ? b.x + b.w : b.side === "l" ? b.x : b.x + b.w / 2;
            const y1 = b.side === "t" ? b.y : b.y + b.h / 2;
            const x2 = g.x + p.at[0] * g.w;
            const y2 = g.y + p.at[1] * g.h;
            return (
              <g key={p.key} className={hot === p.key ? "is-hot" : ""}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} style={{ transitionDelay: `${i * 70}ms` }} />
                <circle cx={x2} cy={y2} r={3} style={{ transitionDelay: `${300 + i * 70}ms` }} />
              </g>
            );
          })}
        </svg>

        {/* the garment */}
        <div className="mtm-garment" style={{ left: pct(g.x, plan.w), top: pct(g.y, plan.h), width: pct(g.w, plan.w), height: pct(g.h, plan.h) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={GARMENT} alt="The finished gown" draggable={false} />
          <span className="mtm-garment__sweep" aria-hidden="true" />
          {PIECES.map((p) => (
            <span
              key={p.key}
              className={`mtm-spot ${hot === p.key ? "is-hot" : ""}`}
              style={{ left: `${p.at[0] * 100}%`, top: `${p.at[1] * 100}%` }}
              onPointerEnter={() => setHot(p.key)}
              onPointerLeave={() => setHot(null)}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* the pieces, pinned on paper */}
        {PIECES.map((p) => {
          const b = plan.at[p.key];
          return (
            <button
              key={`${p.key}-${run}`}
              type="button"
              data-piece
              className={`mtm-pc ${hot === p.key ? "is-hot" : ""}`}
              style={{ left: pct(b.x, plan.w), top: pct(b.y, plan.h), width: pct(b.w, plan.w), height: pct(b.h, plan.h), "--d": p.depth } as CSSProperties}
              onPointerEnter={() => setHot(p.key)}
              onPointerLeave={() => setHot(null)}
              onFocus={() => setHot(p.key)}
              onBlur={() => setHot(null)}
              aria-label={`${p.name}, ${p.note}`}
              tabIndex={level >= 1 ? 0 : -1}
            >
              <span className="mtm-pc__pin" aria-hidden="true" />
              <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="mtm-pc__shape" aria-hidden="true">
                <path d={p.d} />
                <line x1="50" y1="24" x2="50" y2="76" className="mtm-pc__grain" />
              </svg>
              <span className="mtm-pc__name">{p.name}</span>
              {!narrow && <span className="mtm-pc__note">{p.note}</span>}
            </button>
          );
        })}

        {/* spec and what next */}
        <div className="mtm-spec" style={{ top: pct(plan.spec, plan.h) }}>
          <p className="mtm-spec__tag">
            {PIECES.length} pieces · {body.name} · {body.date} · {fit} fit · A4, 16 pages
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <PrimaryButton href={APP_URL} size="sm">
              {CTA_LABEL}
            </PrimaryButton>
            <button type="button" className="mtm-ghost" onClick={onReplay}>
              <Icon d={I.replay} size={16} /> Replay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
