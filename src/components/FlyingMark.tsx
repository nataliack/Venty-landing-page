"use client";

import { useEffect, useRef, type SVGProps } from "react";
import { MARK, flightPose, type FlightOptions } from "@/lib/markFlight";

/* The Venty mark that can fly (src/lib/markFlight): at rest it is the mark,
   the one outline, exactly; while `flying` its wings beat. Taking off, the
   beat grows from nothing over the first half beat; landing, it dies away
   while the wings keep going, so it settles back on the mark without a jump.

   The svg is in the vertical lockup's units by default (viewBox
   0 0 2132 1786, as in the loading screen); pass a viewBox to frame it. */

type Props = Omit<SVGProps<SVGSVGElement>, "children"> &
  FlightOptions & {
    flying?: boolean;
    /** wingbeats per second */
    rate?: number;
  };

export function FlyingMark({ flying = true, rate = 2.4, depth, trail, lift, sweep, viewBox = "0 0 2132 1786", ...rest }: Props) {
  const whole = useRef<SVGPathElement>(null);
  const body = useRef<SVGPathElement>(null);
  const near = useRef<SVGPathElement>(null);
  const far = useRef<SVGPathElement>(null);
  const state = useRef({ beats: 0, amp: 0 });
  const opts = useRef<FlightOptions>({});
  // the beat's settings, read by the running loop without restarting it
  useEffect(() => {
    opts.current = { depth, trail, lift, sweep };
  }, [depth, trail, lift, sweep]);

  useEffect(() => {
    const parts = [whole.current!, body.current!, near.current!, far.current!];
    const show = (wings: boolean) => {
      parts[0].style.display = wings ? "none" : "";
      for (const p of parts.slice(1)) p.style.display = wings ? "" : "none";
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return show(false);
    const s = state.current;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.beats += dt * rate;
      // ease the beat in or out over about half a beat
      const goal = flying ? 1 : 0;
      s.amp += (goal - s.amp) * (1 - Math.exp((-dt * rate) / 0.18));
      if (!flying && s.amp < 0.003) {
        s.amp = 0;
        s.beats = 0;
        show(false);
        return;
      }
      const p = flightPose(s.beats, s.amp, opts.current);
      body.current!.setAttribute("d", p.body);
      near.current!.setAttribute("d", p.near);
      far.current!.setAttribute("d", p.far);
      show(true);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [flying, rate]);

  return (
    <svg viewBox={viewBox} fill="currentColor" aria-hidden="true" overflow="visible" {...rest}>
      <path ref={whole} d={MARK} />
      <path ref={body} style={{ display: "none" }} />
      <path ref={far} style={{ display: "none" }} />
      <path ref={near} style={{ display: "none" }} />
    </svg>
  );
}
