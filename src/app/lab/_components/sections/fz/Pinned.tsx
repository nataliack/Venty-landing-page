"use client";

import { useRef, useState, type CSSProperties } from "react";
import { FEATS, Shell, Visual, clamp, useScrub, useTurn } from "./parts";
import "./pinned.css";

/* Features, calmer: three vertical pinned scrolls, easy to read. Each
   feature is a slot (number, title, line, visual) so the final copy and
   images drop straight in; the visuals here are stand-ins. */

const N = FEATS.length;

/** which feature the scroll is on, 0..N-1, from progress p */
const stepOf = (p: number) => Math.min(N - 1, Math.floor(p * N));

/** scroll the shell so step i is in the middle of its stretch */
function goTo(wrap: HTMLElement | null, i: number) {
  const sc = wrap?.closest<HTMLElement>("[data-fz-scroll]");
  if (!wrap || !sc) return;
  const span = wrap.offsetHeight - sc.clientHeight;
  sc.scrollTo({ top: wrap.offsetTop + (span * (i + 0.5)) / N, behavior: "smooth" });
}

/* ---- Split ------------------------------------------------------------------
   The list of features holds on the left, the one you're on lit and open
   with its line; its visual holds on the right, and the next slides up
   into its place. A thin rule fills as you go. Tap a feature to jump. */
export function FzSplit({ inShell = true }: { inShell?: boolean }) {
  const wrap = useRef<HTMLElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const [turnImg, setTurn] = useTurn();
  const [at, setAt] = useState(0);
  useScrub(wrap, (p) => {
    const i = stepOf(p);
    setAt((o) => (o === i ? o : i));
    fill.current?.style.setProperty("--p", String(p));
    // she turns while her feature is on
    setTurn(clamp(p * N - 2) * 360);
  });
  const body = (
    <section ref={wrap} className="fz-pin-wrap" style={{ height: `${N * 70 + 100}svh` }}>
      <div className="fz-stage fz-split">
        <div className="fz-split__list">
          <p className="fz-eyebrow">Everything a pattern needs</p>
          <ol>
            {FEATS.map((f, i) => (
              <li key={f.k} className={i === at ? "is-on" : ""}>
                <button type="button" onClick={() => goTo(wrap.current, i)} aria-current={i === at}>
                  <span className="fz-n">{f.n}</span>
                  <span className="fz-split__t">{f.t}</span>
                </button>
                <p className="fz-split__p">{f.s}</p>
              </li>
            ))}
          </ol>
          <span className="fz-split__rule" aria-hidden="true">
            <span ref={fill} />
          </span>
        </div>
        <div className="fz-split__vis">
          {FEATS.map((f, i) => (
            <Visual key={f.k} k={f.k} turnRef={f.k === "body" ? turnImg : undefined} className={i === at ? "is-on" : i < at ? "is-past" : ""} />
          ))}
          <p className="fz-split__count" aria-hidden="true">
            {FEATS[at].n} / 0{N}
          </p>
        </div>
      </div>
    </section>
  );
  return inShell ? <Shell>{body}</Shell> : body;
}

/* ---- Deck --------------------------------------------------------------------
   One big card per feature, copy on one side and the visual on the other.
   Each card holds at the top and the next rides up over it; the one
   underneath steps back and dims, so the deck builds as you scroll.
   Cards alternate cloud, cornflower and ink. */
export function FzDeck() {
  const wrap = useRef<HTMLElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const [turnImg, setTurn] = useTurn();
  useScrub(wrap, (p) => {
    const t = p * (N - 1); // cards passed
    cards.current.forEach((el, i) => {
      // how far the next card has come over this one
      el?.style.setProperty("--k", clamp(t - i).toFixed(4));
    });
    setTurn(clamp((t - 1.5) / 1.5) * 360);
  });
  return (
    <Shell>
      <section ref={wrap} className="fz-deck">
        {FEATS.map((f, i) => (
          <article
            key={f.k}
            ref={(el) => {
              cards.current[i] = el;
            }}
            className={`fz-deck__card is-c${i % 3}`}
            style={{ "--i": i } as CSSProperties}
          >
            <div className="fz-deck__copy">
              <p className="fz-n">
                {f.n} / 0{N}
              </p>
              <h3 className="fz-h is-xl">{f.t}</h3>
              <p className="fz-p">{f.s}</p>
            </div>
            <Visual k={f.k} turnRef={f.k === "body" ? turnImg : undefined} className="fz-deck__vis" />
          </article>
        ))}
      </section>
    </Shell>
  );
}

/* ---- Spotlight ------------------------------------------------------------------
   The bento stays, but it plays: all six cards on screen at once, and the
   scroll brings each forward in turn. The one you're on grows, its line
   and visual open; the others shrink back to their titles. On a phone it
   is an accordion: one open, five titles. */
export function FzSpotlight() {
  const wrap = useRef<HTMLElement>(null);
  const [turnImg, setTurn] = useTurn();
  const [at, setAt] = useState(0);
  useScrub(wrap, (p) => {
    const i = stepOf(p);
    setAt((o) => (o === i ? o : i));
    setTurn(clamp(p * N - 2) * 360);
  });
  const rowOf = (i: number) => (i < 3 ? 0 : 1);
  return (
    <Shell>
      <section ref={wrap} className="fz-pin-wrap" style={{ height: `${N * 70 + 100}svh` }}>
        <div className="fz-stage fz-spot">
          {[0, 1].map((r) => (
            <div key={r} className={`fz-spot__row ${rowOf(at) === r ? "is-on" : ""}`}>
              {FEATS.slice(r * 3, r * 3 + 3).map((f, j) => {
                const i = r * 3 + j;
                return (
                  <article key={f.k} className={`fz-spot__card ${i === at ? "is-on" : ""}`} onClick={() => goTo(wrap.current, i)}>
                    <div className="fz-spot__copy">
                      <p className="fz-n">{f.n}</p>
                      <h3 className="fz-spot__t">{f.t}</h3>
                      <p className="fz-spot__p">{f.s}</p>
                    </div>
                    <Visual k={f.k} turnRef={f.k === "body" ? turnImg : undefined} className="fz-spot__vis" />
                  </article>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
