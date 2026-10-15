"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { End, Head, Lines, Shell, Slot, STEPS, Up, useBox } from "./parts";
import { Tape, TapeCase } from "./Tape";
import "./tape.css";

/* How it works: three more layout concepts, each built round a tape
   measure drawn in code (Tape.tsx). Motion stays simple: things slide,
   rise and fade. */

/** the tape's millimetre in px at this screen width (whole pixels) */
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

/* ---- 34 · Pull -----------------------------------------------------------
   The section holds while you scroll it. A tape case sits on the left; the
   scroll pulls its tape out across the screen, the steel tip leading, the
   reading under the tip in centimetres. Above the tape, the three steps:
   each lights up (and shows its image) as the tip passes under it. */
export function HcPull() {
  return (
    <Shell>
      <Pull />
    </Shell>
  );
}
function Pull() {
  const box = useBox();
  const mm = useMm();
  const sec = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const tape = useRef<HTMLDivElement>(null);
  const read = useRef<HTMLParagraphElement>(null);
  const [on, setOn] = useState(-1);
  useEffect(() => {
    const s = sec.current;
    const tr = track.current;
    const tp = tape.current;
    const rd = read.current;
    if (!box || !s || !tr || !tp || !rd) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const run = s.offsetHeight - box.clientHeight;
      const p = Math.min(1, Math.max(0, (box.scrollTop - s.offsetTop) / Math.max(1, run)));
      const span = tr.clientWidth;
      // eased a touch at both ends, like a hand pulling it
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const x = Math.round(e * span * 0.94);
      tp.style.transform = `translate3d(${x - tp.offsetWidth}px, 0, 0)`;
      rd.style.transform = `translate3d(${x}px, 0, 0)`;
      rd.firstElementChild!.textContent = (x / (mm * 10)).toFixed(1);
      // a step lights when the tip passes the middle of its card
      const cards = Array.from(s.querySelectorAll<HTMLElement>(".pl-card"));
      let k = -1;
      if (cards.length > 1 && cards[0].offsetLeft === cards[1].offsetLeft) {
        // phones: the cards are stacked in one place, so the steps follow
        // how far the tape is out, a third each
        k = Math.min(cards.length - 1, Math.floor(e * cards.length * 1.08));
      } else {
        cards.forEach((c, i) => {
          const mid = c.offsetLeft + c.offsetWidth / 2;
          if (x >= mid - tr.offsetLeft) k = i;
        });
      }
      setOn(k);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    box.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      box.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [box, mm]);
  return (
    <>
      <section ref={sec} className="hc-pull" style={{ "--mm": `${mm}px` } as CSSProperties}>
        <div className="pl-stage">
          <Head />
          <ol className="pl-cards">
            {STEPS.map((s, i) => (
              <li key={s.n} className={`pl-card ${i === on ? "is-on" : ""} ${i < on ? "is-past" : ""}`}>
                <div className="pl-card__img">
                  <Slot step={s} ratio="16 / 10" />
                </div>
                <p className="pl-card__top">
                  <b>{s.n}</b> {s.k}
                </p>
                <h3 className="pl-card__h">{s.h}</h3>
                <p className="hc-p">{s.p}</p>
              </li>
            ))}
          </ol>
          <div className="pl-bench">
            <TapeCase className="pl-case" />
            <div ref={track} className="pl-track">
              {/* the tape, its tip on the right, slid out to the tip's place */}
              <div ref={tape} className="pl-tape-move">
                <Tape cm={48} reverse style={{ "--mm": `${mm}px` } as CSSProperties} />
              </div>
              <p ref={read} className="pl-read">
                <span>0.0</span> cm
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="hc-sec hc-after">
        <End />
      </section>
    </>
  );
}

/* ---- 35 · Ruler ----------------------------------------------------------
   A long tape runs down the left like a ruler; each step sits at its own
   centimetre. A cornflower needle stays in the middle of the screen and
   reads the tape as it goes by; the step it is on lights up. */
const AT = [8, 26, 44]; // where each step sits on the ruler, cm
export function HcRuler() {
  return (
    <Shell>
      <Ruler />
    </Shell>
  );
}
function Ruler() {
  const box = useBox();
  const mm = useMm();
  const col = useRef<HTMLDivElement>(null);
  const needle = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(0);
  useEffect(() => {
    const c = col.current;
    const n = needle.current;
    if (!box || !c || !n) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = box.getBoundingClientRect().top + box.clientHeight / 2;
      const cm = (mid - c.getBoundingClientRect().top) / (mm * 10);
      n.textContent = Math.max(0, cm).toFixed(1);
      let k = 0;
      AT.forEach((a, i) => cm >= a - 4 && (k = i));
      setOn(k);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    box.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      box.removeEventListener("scroll", onScroll);
    };
  }, [box, mm]);
  const len = 56;
  return (
    <section className="hc-sec hc-ruler" style={{ "--mm": `${mm}px` } as CSSProperties}>
      <Head />
      <div className="rl-body">
        <div ref={col} className="rl-col" style={{ height: `calc(${len} * 10 * var(--mm))` }}>
          <div className="rl-tape">
            <Tape cm={len} style={{ "--mm": `${mm}px` } as CSSProperties} />
          </div>
          <div className="rl-needle" aria-hidden="true">
            <span className="rl-needle__line" />
            <span className="rl-needle__read">
              <span ref={needle}>0.0</span> cm
            </span>
          </div>
        </div>
        <ol className="rl-steps">
          {STEPS.map((s, i) => (
            <li key={s.n} data-in className={`rl-step ${i === on ? "is-on" : ""}`} style={{ top: `calc(${AT[i]} * 10 * var(--mm))` }}>
              <p className="rl-step__at">
                <b>{s.n}</b> {s.k} <span>at {AT[i]} cm</span>
              </p>
              <h3 className="rl-step__h">
                <Lines lines={[s.h]} />
              </h3>
              <Up as="p" d={0.12} className="hc-p">
                {s.p}
              </Up>
              <Up d={0.2} className="rl-step__img">
                <Slot step={s} ratio="16 / 10" />
              </Up>
            </li>
          ))}
        </ol>
      </div>
      <End align="start" />
    </section>
  );
}

/* ---- 36 · Taped ----------------------------------------------------------
   Three paper cards, each with a short piece of tape laid across its top
   corner, showing its stretch of the tape (0 to 7 cm, 10 to 17, 20 to 27).
   The case sits by the title with a little of its tape pulled out. */
export function HcTaped() {
  const mm = useMm();
  return (
    <Shell>
      <section className="hc-sec hc-taped" style={{ "--mm": `${mm}px` } as CSSProperties}>
        <div className="tpd-head">
          <Head />
          <div data-in className="tpd-object">
            <Up className="tpd-object__in">
              <Tape cm={6} reverse className="tpd-object__tape" style={{ "--mm": `${mm}px` } as CSSProperties} />
              <TapeCase className="tpd-object__case" />
            </Up>
          </div>
        </div>
        <ol className="tpd-cards">
          {STEPS.map((s, i) => (
            <li key={s.n} data-in className="tpd-card" style={{ "--i": i } as CSSProperties}>
              <span className="tpd-card__tape">
                <Tape cm={7} from={i * 10} style={{ "--mm": `${Math.max(3, mm - 2)}px` } as CSSProperties} />
              </span>
              <Up className="tpd-card__paper">
                <Slot step={s} ratio="4 / 3" />
                <p className="tpd-card__top">
                  <b>{s.n}</b> {s.k}
                </p>
                <h3 className="tpd-card__h">{s.h}</h3>
                <p className="hc-p">{s.p}</p>
              </Up>
            </li>
          ))}
        </ol>
        <End />
      </section>
    </Shell>
  );
}
