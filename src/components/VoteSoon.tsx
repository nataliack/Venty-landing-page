"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import { createPortal } from "react-dom";

/* Vote for Venty, before the voting pages exist (VOTE_LINKS in site.ts with
   no href). A vote link still looks and moves like a link; tapped, it says
   the links are coming:

   - tablet and up: the links area answers in place. The links rise out of
     it and "Voting links coming soon" rises in, then after a moment they
     swap back (the tab's panel and the footer card, each with its own CSS:
     [data-soon] on the area)
   - phones: a bottom sheet, built like the app's (app.venty.au, Sheet in
     its ui.tsx): the card colour, 45px top corners, a handle set in a cut
     in the top edge that turns periwinkle while pressed, a light rim along
     the top, and the white secondary button. Tap Got it, the shade or
     Escape, or drag it down, to close it.

   Once a link has its href it is a plain link again and none of this runs. */

/** how long the "coming soon" message holds in place, ms */
const HOLD = 2600;
const PHONE = "(max-width: 767px)";

export const SOON_TEXT = "Voting links coming soon";

/** The behaviour for one place's vote links: `soon` while the message shows
    in place, `tell` for a pending link's click (and Enter or Space), and the
    sheet to render (phones). */
export function useVoteSoon() {
  const [soon, setSoon] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [used, setUsed] = useState(false); // the sheet is made the first time it's needed
  const t = useRef(0);
  const from = useRef<HTMLElement | null>(null);
  useEffect(() => () => window.clearTimeout(t.current), []);

  const tell = (e: { currentTarget: HTMLElement }) => {
    from.current = e.currentTarget;
    if (window.matchMedia(PHONE).matches) {
      // made closed, then opened a frame later, so it rises the first time too
      setUsed(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setSheet(true)));
      return;
    }
    setSoon(true);
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setSoon(false), HOLD);
  };
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    tell(e);
  };
  const close = useCallback(() => {
    setSheet(false);
    from.current?.focus({ preventScroll: true });
  }, []);

  return {
    soon,
    /** props for a pending link */
    pending: { onClick: tell, onKeyDown: onKey },
    /** read out to screen readers when the message shows in place */
    status: (
      <span className="sr-only" role="status">
        {soon ? SOON_TEXT : ""}
      </span>
    ),
    sheet: used ? <VoteSheet open={sheet} onClose={close} /> : null,
  };
}

/* ---- the sheet's surface, as the app draws it ------------------------------
   The handle (48 x 5, its top on the sheet's top edge) sits in a cut in the
   edge: the handle's outline pushed out by 5px, its corners rounding off into
   the edge. The sheet's top corners are 45px. */
const SH_W = 48;
const SH_H = 5;
const SH_G = 5;
const SH_R = 45;
function topPath(w: number, h: number) {
  const c = w / 2;
  const rh = SH_H / 2;
  const cy = rh;
  const half = SH_W / 2 - rh;
  const rn = rh + SH_G;
  const f = rh;
  const r = SH_R;
  const L = c - half;
  const R = c + half; // the centres of the cut's round ends
  const dx = Math.sqrt((rn + f) ** 2 - (f - cy) ** 2);
  const k = rn / (rn + f);
  const tl = [L - dx * k, cy + (f - cy) * k];
  const tr = [R + dx * k, cy + (f - cy) * k];
  return [
    `M ${r} 0`, `H ${L - dx}`, `A ${f} ${f} 0 0 1 ${tl[0]} ${tl[1]}`, `A ${rn} ${rn} 0 0 0 ${L} ${cy + rn}`, `H ${R}`,
    `A ${rn} ${rn} 0 0 0 ${tr[0]} ${tr[1]}`, `A ${f} ${f} 0 0 1 ${R + dx} 0`, `H ${w - r}`, `A ${r} ${r} 0 0 1 ${w} ${r}`,
    `V ${h}`, `H 0`, `V ${r}`, `A ${r} ${r} 0 0 1 ${r} 0`, "Z",
  ].join(" ");
}

function Surface({ w, h, on }: { w: number; h: number; on: boolean }) {
  const id = useId().replace(/:/g, "");
  const d = topPath(w, h);
  const x = w / 2 - SH_W / 2;
  const rr = SH_H / 2;
  return (
    <svg width={w} height={h} className="vsheet__surface" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="0.12" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}hw`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}hr`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.07" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={`${id}hp`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7387f6" />
          <stop offset="0.55" stopColor="#687ef5" />
          <stop offset="1" stopColor="#6479f2" />
        </linearGradient>
        <linearGradient id={`${id}hpr`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path d={d} fill="var(--vsheet-card)" />
      <path d={d} fill="none" stroke={`url(#${id}rim)`} strokeWidth="1" />
      {/* the handle at rest: the sheet's colour, half-pixel lines just inside its edge */}
      <rect x={x} y={0} width={SH_W} height={SH_H} rx={rr} fill="var(--vsheet-card)" />
      <rect x={x} y={0} width={SH_W} height={SH_H} rx={rr} fill={`url(#${id}hw)`} />
      <rect x={x + 0.25} y={0.25} width={SH_W - 0.5} height={SH_H - 0.5} rx={rr - 0.25} fill="none" stroke={`url(#${id}hr)`} strokeWidth="0.5" />
      {/* pressed or dragged: periwinkle, fading in over it */}
      <g className={`vsheet__handle-on ${on ? "is-on" : ""}`}>
        <rect x={x} y={0} width={SH_W} height={SH_H} rx={rr} fill={`url(#${id}hp)`} />
        <rect x={x + 0.25} y={0.25} width={SH_W - 0.5} height={SH_H - 0.5} rx={rr - 0.25} fill="none" stroke={`url(#${id}hpr)`} strokeWidth="0.5" />
      </g>
    </svg>
  );
}

/** how far down a drag has to go to close the sheet, px */
const DRAG_CLOSE = 90;

function VoteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [[w, h], setSize] = useState([0, 0]);
  const [press, setPress] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const ok = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ id: number; y: number; dy: number } | null>(null);
  const titleId = useId();

  // its size, for the surface
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const fit = () => setSize([el.offsetWidth, el.offsetHeight]);
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    return () => ro.disconnect();
  }, []);

  // open: Got it takes the focus; Escape closes
  useEffect(() => {
    if (!open) return;
    const f = window.setTimeout(() => ok.current?.focus({ preventScroll: true }), 50);
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(f);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // dragging it down: it follows the finger (never up), and lets go past DRAG_CLOSE
  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { id: e.pointerId, y: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    setPress(true);
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !body.current) return;
    d.dy = Math.max(0, e.clientY - d.y);
    body.current.style.transition = "none";
    body.current.style.translate = `0 ${d.dy}px`;
  };
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setPress(false);
    const el = body.current;
    if (el) {
      el.style.transition = "";
      el.style.translate = "";
    }
    if (d.dy > DRAG_CLOSE) onClose();
  };

  return createPortal(
    <div className="vsheet" data-open={open} inert={!open}>
      <div className="vsheet__shade" onClick={onClose} aria-hidden="true" />
      <div
        ref={body}
        className="vsheet__body"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {w > 0 && <Surface w={w} h={h} on={press} />}
        <p className="vsheet__kicker">QUT Design Festival · People&apos;s Choice Award</p>
        <h2 id={titleId} className="vsheet__title">
          {SOON_TEXT}
        </h2>
        <p className="vsheet__text">
          The voting pages for IxD and VisCom aren&apos;t open yet. The links will be here as soon as they are.
        </p>
        <button ref={ok} type="button" className="vsheet__ok" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>,
    document.body,
  );
}
