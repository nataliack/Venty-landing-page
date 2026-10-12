"use client";

import { useEffect, useRef, useState } from "react";
import { FlyingMark } from "@/components/FlyingMark";
import { MARK, MARK_CENTRE, flightRoute } from "@/lib/markFlight";

/* The mark in flight, on the bench. Two views:
   - Journey: the loading screen's flight, big enough to see. The bird turns
     head first to face the way (the head, then the body after it), flies along a low arc, touches
     down on the outline at the top left and turns back to face right.
   - Hover: big in the middle, beating its wings on the spot, and at the
     sizes it is used at. Fly and Land, and the beat's settings. */

const MARK_BOX = "170 -260 1420 1320"; // the mark, with room for the wings below and the lift above
const LANDING = 64; // px, the mark's width where it lands

function Slider({ label, value, min, max, step, onChange, unit = "" }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <label className="flex items-center gap-2 text-[12px] text-[var(--periwinkle)]">
      <span className="w-[52px] shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-[110px] accent-[var(--cornflower)]" />
      <span className="w-[44px] tabular-nums text-[var(--cloud)]">
        {value}
        {unit}
      </span>
    </label>
  );
}

/** The flight from the middle to the outline at the top left, run again for each `run` */
function Journey({ run, slow }: { run: number; slow: boolean }) {
  const bird = useRef<SVGSVGElement>(null);
  const spot = useRef<SVGPathElement>(null);

  useEffect(() => {
    const m = bird.current!;
    const path = m.querySelector<SVGPathElement>("[data-whole]")!;
    const [body, far, near] = ["body", "far", "near"].map((k) => m.querySelector<SVGPathElement>(`[data-piece="${k}"]`)!);
    const pieces = (on: boolean) => {
      path.style.display = on ? "none" : "";
      for (const p of [body, far, near]) p.style.display = on ? "" : "none";
    };
    m.style.transform = "";
    pieces(false);
    const a = path.getBoundingClientRect();
    const b = spot.current!.getBoundingClientRect();
    const box = m.getBoundingClientRect();
    const s = b.width / a.width;
    const unit = path.getBBox();
    const u = a.width / unit.width;
    const centre: [number, number] = [a.left - box.left + (MARK_CENTRE[0] - unit.x) * u, a.top - box.top + (MARK_CENTRE[1] - unit.y) * u];
    const route = flightRoute({ x: 0, y: 0, scale: 1 }, { x: b.left - box.left - (a.left - box.left) * s, y: b.top - box.top - (a.top - box.top) * s, scale: s }, centre);
    const pace = slow ? 4 : 1;
    let raf = 0;
    let t0 = 0;
    const tick = (now: number) => {
      if (!t0) t0 = now + 600; // a moment still before take-off
      const t = Math.max(0, (now - t0) / 1000 / pace);
      const at = route.at(Math.min(t, route.total));
      m.style.transform = `translate(${at.x}px, ${at.y}px) scale(${at.scale})`;
      body.setAttribute("d", at.pose.body);
      far.setAttribute("d", at.pose.far);
      near.setAttribute("d", at.pose.near);
      pieces(!at.done);
      if (!at.done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, slow]);

  return (
    <div className="absolute inset-0">
      {/* where it lands: the mark's outline, where the logo sits */}
      <svg viewBox="207 0 1334 797" className="absolute left-[clamp(16px,2.5vw,36px)] top-[132px]" style={{ width: LANDING }} overflow="visible" aria-hidden="true">
        <path ref={spot} d={MARK} fill="none" stroke="var(--steel)" strokeWidth={14} strokeDasharray="40 30" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <svg ref={bird} viewBox={MARK_BOX} className="w-[min(60vw,440px)] text-[var(--cornflower)]" style={{ transformOrigin: "0 0" }} fill="currentColor" overflow="visible" aria-hidden="true">
          <path data-whole d={MARK} />
          <path data-piece="body" style={{ display: "none" }} />
          <path data-piece="far" style={{ display: "none" }} />
          <path data-piece="near" style={{ display: "none" }} />
        </svg>
      </div>
    </div>
  );
}

export function MarkFlight() {
  const [view, setView] = useState<"journey" | "hover">("journey");
  const [run, setRun] = useState(1);
  const [slow, setSlow] = useState(false);
  const [flying, setFlying] = useState(true);
  const [rate, setRate] = useState(2.4);
  const [depth, setDepth] = useState(118);
  const [roll, setRoll] = useState(0.42);
  const [trail, setTrail] = useState(0.05);
  const [lift, setLift] = useState(40);
  const [sweep, setSweep] = useState(30);
  const props = { flying, rate, depth, roll, trail, lift, sweep, viewBox: MARK_BOX };
  const tab = (on: boolean) => `lab-focus h-9 rounded-full px-3 transition-colors ${on ? "bg-[color-mix(in_oklab,var(--cloud)_16%,transparent)]" : "text-[var(--periwinkle)]"}`;

  return (
    <div className="absolute inset-0 overflow-clip bg-[var(--night)] text-[var(--cloud)]">
      {view === "journey" ? (
        <Journey run={run} slow={slow} />
      ) : (
        <div className="absolute inset-0 grid grid-rows-[1fr_auto] pt-[150px]">
          <div className="grid place-items-center">
            <FlyingMark {...props} className="w-[min(72vw,560px)] text-[var(--cornflower)]" />
          </div>
          <div className="flex flex-wrap items-end justify-center gap-10 px-4 pb-[max(72px,env(safe-area-inset-bottom))]">
            {[
              { w: 49, label: "Site logo" },
              { w: 96, label: "" },
              { w: 180, label: "Loading screen" },
            ].map(({ w, label }) => (
              <figure key={w} className="flex flex-col items-center gap-2">
                <FlyingMark {...props} style={{ width: w }} className="text-[var(--cloud)]" />
                <figcaption className="text-[11px] text-[var(--steel)]">{label || `${w}px`}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      <div
        className="lab-glass absolute left-1/2 top-[max(12px,env(safe-area-inset-top))] z-[80] flex w-[min(92vw,560px)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-[22px] p-2 text-[13px]"
        style={{ background: "color-mix(in oklab, var(--night) 55%, transparent)" }}
      >
        <button type="button" aria-pressed={view === "journey"} onClick={() => setView("journey")} className={tab(view === "journey")}>
          Journey
        </button>
        <button type="button" aria-pressed={view === "hover"} onClick={() => setView("hover")} className={tab(view === "hover")}>
          Hover
        </button>
        {view === "journey" ? (
          <>
            <button type="button" aria-pressed={slow} onClick={() => setSlow((v) => !v)} className={tab(slow)}>
              Slow motion
            </button>
            <button type="button" onClick={() => setRun((r) => r + 1)} className="lab-focus h-9 rounded-full bg-[var(--cornflower)] px-4">
              Replay
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setFlying((f) => !f)} className="lab-focus h-9 rounded-full bg-[var(--cornflower)] px-4">
              {flying ? "Land" : "Fly"}
            </button>
            <Slider label="Beats/s" value={rate} min={0.4} max={5} step={0.1} onChange={setRate} />
            <Slider label="Depth" value={depth} min={30} max={170} step={1} onChange={setDepth} unit="°" />
            <Slider label="Roll" value={roll} min={0} max={0.8} step={0.02} onChange={setRoll} />
            <Slider label="Trail" value={trail} min={0} max={0.25} step={0.01} onChange={setTrail} />
            <Slider label="Sweep" value={sweep} min={0} max={60} step={1} onChange={setSweep} unit="°" />
            <Slider label="Lift" value={lift} min={0} max={90} step={1} onChange={setLift} />
          </>
        )}
      </div>
    </div>
  );
}
