"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { End, Head, Lines, Shell, Slot, STEPS, Up, useBox } from "./parts";

/* How it works: five layout concepts. Type, cards and image slots only;
   the motion is the page's own (lines rising from masks, objects fading up,
   cards moving as whole things). Shared parts and styles: parts.tsx, hc.css. */

/* ---- 29 · Index ----------------------------------------------------------
   An editorial index: one row per step, the step's word set huge, its
   copy beside it. The row under the pointer opens its image (on touch
   screens every row shows its image). Hairlines draw in between rows. */
export function HcIndex() {
  const [open, setOpen] = useState(0);
  return (
    <Shell>
      <section className="hc-sec hc-index">
        <Head />
        <ol className="hc-index__rows">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              data-in
              className={`hc-row ${open === i ? "is-open" : ""}`}
              onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(i)}
              onClick={() => setOpen(i)}
            >
              <span className="hc-row__rule" aria-hidden="true" />
              <span className="hc-row__n">
                <Lines lines={[s.n]} />
              </span>
              <h3 className="hc-row__k">
                <Lines lines={[s.k]} d={0.05} />
              </h3>
              <div className="hc-row__img">
                <Slot step={s} />
              </div>
              <div className="hc-row__copy">
                <Up as="p" d={0.15} className="hc-h">
                  {s.h}
                </Up>
                <Up as="p" d={0.22} className="hc-p">
                  {s.p}
                </Up>
              </div>
            </li>
          ))}
        </ol>
        <End align="start" />
      </section>
    </Shell>
  );
}

/* ---- 30 · Stack ----------------------------------------------------------
   Three big cards, each half copy and half image. They hold (sticky) as
   you scroll and the next card slides up over the last, which steps back a
   little and dims: a deck building up. The last card is cornflower. */
export function HcStack() {
  return (
    <Shell>
      <Stack />
    </Shell>
  );
}
function Stack() {
  const box = useBox();
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const ol = list.current;
    if (!box || !ol) return;
    const cards = Array.from(ol.querySelectorAll<HTMLElement>(".hc-card"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const rects = cards.map((c) => c.getBoundingClientRect());
      cards.forEach((c, i) => {
        const next = rects[i + 1];
        // how far the next card has come over this one, 0..1
        const k = next
          ? Math.min(
              1,
              Math.max(0, 1 - (next.top - rects[i].top) / rects[i].height),
            )
          : 0;
        c.style.setProperty("--k", k.toFixed(3));
      });
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    box.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      box.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [box]);
  return (
    <section className="hc-sec hc-stack">
      <Head align="center" />
      <ol ref={list} className="hc-stack__deck">
        {STEPS.map((s, i) => (
          <li
            key={s.n}
            className={`hc-card is-${i + 1}`}
            style={{ "--i": i } as CSSProperties}
          >
            <div data-in className="hc-card__copy">
              <p className="hc-card__top">
                <span className="hc-card__n">{s.n}</span>
                <span className="hc-card__k">{s.k}</span>
              </p>
              <h3 className="hc-card__h">
                <Lines lines={[s.h]} />
              </h3>
              <Up as="p" d={0.15} className="hc-p">
                {s.p}
              </Up>
            </div>
            <Slot step={s} ratio="auto" className="hc-card__img" />
          </li>
        ))}
      </ol>
      <End />
    </section>
  );
}

/* ---- 31 · Split ----------------------------------------------------------
   The words stay put on the left while the images scroll by on the right.
   As each image reaches the middle of the screen, the left side changes to
   its step: the number rolls, the word and the copy rise in. A three-part
   bar shows where you are. Phones: image, then words, per step. */
export function HcSplit() {
  return (
    <Shell>
      <Split />
    </Shell>
  );
}
function Split() {
  const box = useBox();
  const [on, setOn] = useState(0);
  const right = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const r = right.current;
    if (!box || !r) return;
    // the step is the last image whose top has passed the middle of the
    // screen (worked out on scroll, so a fast fling never skips one)
    const items = Array.from(r.querySelectorAll<HTMLElement>("[data-i]"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = box.getBoundingClientRect().top + box.clientHeight / 2;
      let k = 0;
      items.forEach((el, i) => el.getBoundingClientRect().top < mid && (k = i));
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
  }, [box]);
  return (
    <section className="hc-sec hc-split">
      <div className="hc-split__grid">
        <div className="hc-split__left">
          <div className="hc-split__pin">
            <Head />
            <div data-in className="hc-split__now">
              <p className="hc-split__n" aria-hidden="true">
                <span
                  className="hc-roll"
                  style={{ "--on": on } as CSSProperties}
                >
                  {STEPS.map((s) => (
                    <span key={s.n}>{s.n}</span>
                  ))}
                </span>
              </p>
              <div className="hc-split__words">
                {STEPS.map((s, i) => (
                  <div
                    key={s.n}
                    className={`hc-split__step ${on === i ? "is-on" : ""}`}
                    aria-hidden={on !== i}
                  >
                    <p className="hc-split__k">
                      <Lines lines={[s.k]} />
                    </p>
                    <h3 className="hc-split__h">
                      <Lines lines={[s.h]} d={0.05} />
                    </h3>
                    <p className="hc-p hc-split__p">{s.p}</p>
                  </div>
                ))}
              </div>
              <ol className="hc-bar" aria-hidden="true">
                {STEPS.map((s, i) => (
                  <li key={s.n} className={i <= on ? "is-on" : ""}>
                    <span>{s.k}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
        <div ref={right} className="hc-split__right">
          {STEPS.map((s, i) => (
            <div key={s.n} data-i={i} data-in className="hc-split__item">
              <Up>
                <Slot step={s} />
              </Up>
              {/* phones: the words come with each image */}
              <div className="hc-split__mobile">
                <p className="hc-split__k">
                  {s.n} · {s.k}
                </p>
                <h3 className="hc-split__h">{s.h}</h3>
                <p className="hc-p">{s.p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <End />
    </section>
  );
}

/* ---- 32 · Staircase --------------------------------------------------------
   Three columns stepping down like stairs, each a tall image with its
   number tab at the corner, then the title and the copy. A pale, very large
   number sits behind each column. Phones: one column. */
export function HcStairs() {
  return (
    <Shell>
      <section className="hc-sec hc-stairs">
        <Head align="center" big />
        <ol className="hc-stairs__cols">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              data-in
              className="hc-stair"
              style={{ "--i": i } as CSSProperties}
            >
              <span className="hc-stair__ghost" aria-hidden="true">
                {s.n}
              </span>
              <Up className="hc-stair__img">
                <Slot step={s} />
                <span className="hc-tab">
                  <b>{s.n}</b> {s.k}
                </span>
              </Up>
              <h3 className="hc-stair__h">
                <Lines lines={[s.h]} d={0.12} />
              </h3>
              <Up as="p" d={0.22} className="hc-p">
                {s.p}
              </Up>
            </li>
          ))}
        </ol>
        <End />
      </section>
    </Shell>
  );
}

/* ---- 33 · Sentence ---------------------------------------------------------
   The three step titles read as one giant sentence, with a small image
   pill set into the line after each (the pills open out as the line rises).
   Under it, the three steps in detail, in three columns. */
export function HcSentence() {
  return (
    <Shell>
      <section className="hc-sec hc-sentence">
        <header data-in className="hc-head is-start">
          <p className="hc-eyebrow">
            <Lines lines={["Three steps · How it works"]} />
          </p>
        </header>
        <div data-in className="hc-sentence__big">
          {STEPS.map((s, i) => (
            <span key={s.n} className="hc-sentence__part">
              {/* the number and its words wrap as one */}
              <span className="hc-sentence__w">
                <sup className="hc-sentence__n">{s.n}</sup>
                <Lines lines={[s.h]} d={i * 0.18} className="is-inline" />
              </span>
              <span
                className="hc-pill"
                style={{ "--d": 0.3 + i * 0.18 } as CSSProperties}
              >
                <span
                  className="hc-pill__img"
                  title={`Image · ${s.n} ${s.k}: ${s.img}`}
                />
              </span>{" "}
            </span>
          ))}
        </div>
        <Up as="p" className="hc-sub hc-sentence__sub">
          From your body to the cutting table.
        </Up>
        <ol className="hc-sentence__cols">
          {STEPS.map((s, i) => (
            <li key={s.n} data-in>
              <Up as="p" d={i * 0.08} className="hc-sentence__k">
                <b>{s.n}</b> {s.k}
              </Up>
              <Up as="p" d={0.08 + i * 0.08} className="hc-p">
                {s.p}
              </Up>
            </li>
          ))}
        </ol>
        <End align="start" />
      </section>
    </Shell>
  );
}
