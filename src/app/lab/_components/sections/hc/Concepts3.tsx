"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { End, Head, Lines, Shell, Slot, STEPS, Up } from "./parts";
import { Tape } from "./Tape";
import "./tape.css";
import "./c3.css";

/* How it works: five more layout concepts. Type, cards, image slots and
   the tape drawn in code; motion stays simple (slides, rises, fades). */

const mmFor = (w: number) => (w >= 1280 ? 6 : w >= 768 ? 5 : 3);
function useMm() {
  const [mm, setMm] = useState(5);
  useEffect(() => {
    const on = () => setMm(mmFor(window.innerWidth));
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return mm;
}

function Arrow({ left = false }: { left?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={left ? { rotate: "180deg" } : undefined}
    >
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/* ---- 37 · Carousel -------------------------------------------------------
   Three wide panels side by side, swiped or dragged sideways (or moved with
   the arrows), each snapping into place. Under them runs one long tape,
   part of the same row, so it slides along with them; each panel starts at
   its own ten. */
export function HcCarousel() {
  const mm = useMm();
  const row = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  useEffect(() => {
    const r = row.current;
    if (!r) return;
    const on = () => {
      const w = r.scrollWidth - r.clientWidth;
      setAt(Math.round((r.scrollLeft / Math.max(1, w)) * (STEPS.length - 1)));
    };
    r.addEventListener("scroll", on, { passive: true });
    // drag with the mouse, as with a finger
    let drag: { x: number; left: number } | null = null;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      drag = { x: e.clientX, left: r.scrollLeft };
      r.dataset.drag = "true";
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      r.scrollLeft = drag.left - (e.clientX - drag.x);
    };
    const up = () => {
      if (!drag) return;
      drag = null;
      delete r.dataset.drag;
    };
    r.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      r.removeEventListener("scroll", on);
      r.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);
  const go = (d: number) => {
    const r = row.current;
    const panel = r?.querySelector<HTMLElement>(".cr-panel");
    if (r && panel)
      r.scrollBy({ left: d * (panel.offsetWidth + 24), behavior: "smooth" });
  };
  return (
    <Shell>
      <section
        className="hc-sec hc-carousel"
        style={{ "--mm": `${mm}px` } as CSSProperties}
      >
        <div className="cr-top">
          <Head />
          <div className="cr-nav">
            <span className="cr-count">
              <b>{String(at + 1).padStart(2, "0")}</b> / 03
            </span>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous step"
              disabled={at === 0}
            >
              <Arrow left />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next step"
              disabled={at === STEPS.length - 1}
            >
              <Arrow />
            </button>
          </div>
        </div>
        <div
          ref={row}
          className="cr-row"
          role="region"
          aria-label="The three steps"
        >
          <div className="cr-track">
            {STEPS.map((s, i) => (
              <article
                key={s.n}
                data-in
                className={`cr-panel ${i === at ? "is-at" : ""}`}
              >
                <Up className="cr-panel__img">
                  <Slot step={s} ratio="5 / 4" />
                </Up>
                <div className="cr-panel__text">
                  <p className="cr-panel__n">{s.n}</p>
                  <p className="cr-panel__k">{s.k}</p>
                  <h3 className="cr-panel__h">
                    <Lines lines={[s.h]} d={0.1} />
                  </h3>
                  <Up as="p" d={0.2} className="hc-p">
                    {s.p}
                  </Up>
                </div>
              </article>
            ))}
            <div className="cr-tape">
              <Tape cm={180} style={{ "--mm": `${mm}px` } as CSSProperties} />
            </div>
          </div>
        </div>
        <End />
      </section>
    </Shell>
  );
}

/* ---- 38 · Tabs -----------------------------------------------------------
   The app's own switch: Measure, Describe, Print. One big card below shows
   the step in hand, its image on one side and its words on the other. It
   moves on by itself, timed by a cornflower marker running along a short
   tape; it holds while the pointer is over it, and a tap picks a step. */
const DWELL = 6; // seconds a step stays
export function HcTabs() {
  const mm = useMm();
  const [on, setOn] = useState(0);
  const [held, setHeld] = useState(false);
  const [run, setRun] = useState(0); // restarts the timer
  useEffect(() => {
    if (held) return;
    const t = window.setTimeout(
      () => setOn((o) => (o + 1) % STEPS.length),
      DWELL * 1000,
    );
    return () => window.clearTimeout(t);
  }, [on, held, run]);
  const pick = (i: number) => {
    setOn(i);
    setRun((r) => r + 1);
  };
  const s = STEPS[on];
  return (
    <Shell>
      <section
        className="hc-sec hc-tabs"
        style={{ "--mm": `${mm}px` } as CSSProperties}
      >
        <Head align="center" />
        <div data-in className="tb-switch-wrap">
          <Up className="tb-switch">
            <div role="tablist" aria-label="Steps" className="tb-tabs">
              {STEPS.map((x, i) => (
                <button
                  key={x.n}
                  type="button"
                  role="tab"
                  aria-selected={on === i}
                  className="tb-tab"
                  onClick={() => pick(i)}
                >
                  <b>{x.n}</b> {x.k}
                </button>
              ))}
              <span
                className="tb-thumb"
                style={{ "--on": on } as CSSProperties}
                aria-hidden="true"
              />
            </div>
          </Up>
          {/* the timer: a marker running along 10 cm of tape */}
          <Up d={0.1} className={`tb-timer ${held ? "is-held" : ""}`}>
            <Tape
              cm={10}
              from={on * 10}
              style={{ "--mm": `${Math.max(3, mm - 2)}px` } as CSSProperties}
            />
            <span
              key={`${on}-${run}`}
              className="tb-marker"
              style={{ "--t": `${DWELL}s` } as CSSProperties}
              aria-hidden="true"
            />
          </Up>
        </div>
        <div
          data-in
          className="tb-card"
          onPointerEnter={() => setHeld(true)}
          onPointerLeave={() => setHeld(false)}
          role="tabpanel"
        >
          <div key={s.n} className="tb-card__in">
            <div className="tb-card__img">
              <Slot step={s} />
            </div>
            <div className="tb-card__text">
              <p className="tb-card__n">{s.n}</p>
              <h3 className="tb-card__h">
                <Lines lines={[s.h]} />
              </h3>
              <p className="hc-p tb-card__p">{s.p}</p>
            </div>
          </div>
        </div>
        <End />
      </section>
    </Shell>
  );
}

/* ---- 39 · Bento ----------------------------------------------------------
   A light grid of tiles: the three steps as the big ones (image, number,
   title, copy), and between them small tiles with the facts the steps
   rest on, set large. A piece of tape lies along the first. */
const FACTS = [
  { big: "4", small: "measures to start" },
  { big: "A4 · A0", small: "at home, or at a print shop" },
  { big: "1", small: "body, saved for every pattern after" },
];
export function HcBento() {
  const mm = useMm();
  return (
    <Shell>
      <section
        className="hc-sec hc-bento"
        style={{ "--mm": `${mm}px` } as CSSProperties}
      >
        <Head />
        <div className="bn-grid">
          {STEPS.map((s, i) => (
            <article
              key={s.n}
              data-in
              className={`bn-tile bn-step is-${i + 1}`}
            >
              <Up className="bn-step__img">
                <Slot step={s} ratio="auto" />
              </Up>
              <div className="bn-step__text">
                <p className="bn-step__top">
                  <b>{s.n}</b> {s.k}
                </p>
                <h3 className="bn-step__h">
                  <Lines lines={[s.h]} d={0.1} />
                </h3>
                <Up as="p" d={0.18} className="hc-p">
                  {s.p}
                </Up>
              </div>
              {i === 0 && (
                <span className="bn-tape" aria-hidden="true">
                  <Tape
                    cm={20}
                    style={
                      { "--mm": `${Math.max(3, mm - 2)}px` } as CSSProperties
                    }
                  />
                </span>
              )}
            </article>
          ))}
          {FACTS.map((f, i) => (
            <div
              key={f.small}
              data-in
              className={`bn-tile bn-fact is-${i + 1}`}
            >
              <Up as="p" className="bn-fact__big">
                {f.big}
              </Up>
              <Up as="p" d={0.1} className="bn-fact__small">
                {f.small}
              </Up>
            </div>
          ))}
        </div>
        <End />
      </section>
    </Shell>
  );
}

/* ---- 40 · Zigzag ---------------------------------------------------------
   A tape runs down the middle; the steps sit either side of it, in turn,
   each at its own mark, its image across the tape from it. A cornflower
   pin joins each step to the tape. Phones: the tape down the left, all the
   steps to its right. */
const ZAT = [6, 30, 54];
export function HcZigzag() {
  const mm = useMm();
  const len = 66;
  return (
    <Shell>
      <section
        className="hc-sec hc-zigzag"
        style={{ "--mm": `${mm}px`, "--zlen": len } as CSSProperties}
      >
        <Head align="center" big />
        <div className="zz-body">
          <div className="zz-tape" aria-hidden="true">
            <Tape cm={len} style={{ "--mm": `${mm}px` } as CSSProperties} />
          </div>
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              data-in
              className={`zz-step ${i % 2 ? "is-right" : "is-left"}`}
              style={{ "--at": ZAT[i] } as CSSProperties}
            >
              <span className="zz-pin" aria-hidden="true" />
              <div className="zz-step__text">
                <p className="zz-step__n">{s.n}</p>
                <p className="zz-step__k">
                  {s.k} <span>· {ZAT[i]} cm</span>
                </p>
                <h3 className="zz-step__h">
                  <Lines lines={[s.h]} d={0.08} />
                </h3>
                <Up as="p" d={0.16} className="hc-p">
                  {s.p}
                </Up>
              </div>
              <Up d={0.12} className="zz-step__img">
                <Slot step={s} ratio="4 / 3" />
              </Up>
            </div>
          ))}
        </div>
        <End />
      </section>
    </Shell>
  );
}

/* ---- 41 · Swing tags -----------------------------------------------------
   Each step is a garment swing tag, hung from a thread across the section
   by a loop of string through its eyelet. The tags hang a little crooked
   and swing a touch when the pointer comes over them. Phones: one under the
   other, each on its own short string. */
export function HcTags() {
  return (
    <Shell>
      <section className="hc-sec hc-tags">
        <Head />
        <div className="tg-line">
          <span className="tg-thread" aria-hidden="true" />
          <ol className="tg-tags">
            {STEPS.map((s, i) => (
              <li
                key={s.n}
                data-in
                className="tg-tag"
                style={{ "--i": i, "--sy": i === 1 ? 30 : 16 } as CSSProperties}
              >
                <span className="tg-string" aria-hidden="true" />
                <div className="tg-card">
                  <span className="tg-eyelet" aria-hidden="true" />
                  <p className="tg-card__n">{s.n}</p>
                  <p className="tg-card__k">{s.k}</p>
                  <div className="tg-card__img">
                    <Slot step={s} ratio="1 / 1" />
                  </div>
                  <h3 className="tg-card__h">{s.h}</h3>
                  <p className="hc-p">{s.p}</p>
                  <p className="tg-card__foot" aria-hidden="true">
                    <span>Venty</span>
                    <span>Size: yours</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <End />
      </section>
    </Shell>
  );
}
