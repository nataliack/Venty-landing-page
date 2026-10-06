"use client";

import { useEffect, useRef } from "react";
import { SCROLLER_ID, scrollToY } from "./SmoothScroll";

/* Our own scrollbar, from tablet up (the native one is hidden there, see
   .scroller in globals.css; phones keep theirs). A thin line on the right
   edge that follows the page, brightens while you scroll and on hover, and
   can be dragged, or clicked on its track to jump. It mirrors the page's
   scroll position only; keyboard and wheel scrolling are the page's own. */

const MIN_THUMB = 48; // px
const IDLE_MS = 1200;

export function ScrollBar() {
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sc = document.getElementById(SCROLLER_ID);
    const tr = track.current;
    const th = thumb.current;
    if (!sc || !tr || !th) return;

    let size = MIN_THUMB;
    let idle = 0;
    // the sizes are measured when they change (resize, the page growing),
    // never while scrolling: a scroll frame only moves the thumb
    let scrollRange = 1;
    let trackRoom = 1;
    const range = () => scrollRange;
    const room = () => trackRoom;
    const measure = () => {
      const view = tr.clientHeight;
      size = Math.max(MIN_THUMB, (view * sc.clientHeight) / sc.scrollHeight);
      scrollRange = Math.max(1, sc.scrollHeight - sc.clientHeight);
      trackRoom = Math.max(1, view - size);
      th.style.height = `${size}px`;
      const hidden = String(sc.scrollHeight <= sc.clientHeight + 1);
      if (tr.dataset.hidden !== hidden) tr.dataset.hidden = hidden;
      place();
    };
    const place = () => {
      th.style.transform = `translate3d(0, ${(sc.scrollTop / scrollRange) * trackRoom}px, 0)`;
    };
    const wake = () => {
      if (tr.dataset.active !== "true") tr.dataset.active = "true";
      clearTimeout(idle);
      idle = window.setTimeout(() => (tr.dataset.active = "false"), IDLE_MS);
    };
    const onScroll = () => {
      place();
      wake();
    };

    // drag the thumb: the page follows it, immediately
    let drag: { y: number; top: number } | null = null;
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      if (e.target === th) {
        drag = { y: e.clientY, top: sc.scrollTop };
        th.setPointerCapture(e.pointerId);
        tr.dataset.dragging = "true";
      } else {
        // a click on the track jumps there, smoothly, centring the thumb
        const r = tr.getBoundingClientRect();
        const at = (e.clientY - r.top - size / 2) / room();
        scrollToY(Math.max(0, Math.min(1, at)) * range());
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      scrollToY(drag.top + ((e.clientY - drag.y) / room()) * range(), true);
    };
    const onUp = () => {
      drag = null;
      tr.dataset.dragging = "false";
    };

    measure();
    sc.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(tr);
    ro.observe(sc);
    for (const child of sc.children) ro.observe(child); // the page content grows as sections lay out
    tr.addEventListener("pointerdown", onDown);
    th.addEventListener("pointermove", onMove);
    th.addEventListener("pointerup", onUp);
    th.addEventListener("pointercancel", onUp);
    return () => {
      clearTimeout(idle);
      sc.removeEventListener("scroll", onScroll);
      ro.disconnect();
      tr.removeEventListener("pointerdown", onDown);
      th.removeEventListener("pointermove", onMove);
      th.removeEventListener("pointerup", onUp);
      th.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <div ref={track} className="scrollbar" aria-hidden="true" data-active="false">
      <div ref={thumb} className="scrollbar__thumb" />
    </div>
  );
}
