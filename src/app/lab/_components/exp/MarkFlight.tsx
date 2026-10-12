"use client";

import { useState } from "react";
import { FlyingMark } from "@/components/FlyingMark";

/* The mark in flight, on the bench: big in the middle, and at the sizes it
   is used at (the site logo, the loading screen). Fly and Land, and the
   beat's settings. */

const MARK_BOX = "170 -260 1420 1320"; // the mark, with room for the wings below and the lift above

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

export function MarkFlight() {
  const [flying, setFlying] = useState(true);
  const [rate, setRate] = useState(2.4);
  const [depth, setDepth] = useState(112);
  const [trail, setTrail] = useState(0.05);
  const [lift, setLift] = useState(40);
  const [sweep, setSweep] = useState(30);
  const props = { flying, rate, depth, trail, lift, sweep, viewBox: MARK_BOX };

  return (
    <div className="absolute inset-0 grid grid-rows-[1fr_auto] overflow-clip bg-[var(--night)] text-[var(--cloud)]">
      <div className="grid place-items-center">
        <FlyingMark {...props} className="w-[min(72vw,560px)] text-[var(--cornflower)]" />
      </div>

      <div className="flex flex-wrap items-end justify-center gap-10 px-4 pb-[max(20px,env(safe-area-inset-bottom))]">
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

      <div
        className="lab-glass absolute left-1/2 top-[max(12px,env(safe-area-inset-top))] z-[80] flex w-[min(92vw,560px)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-[22px] p-2 text-[13px]"
        style={{ background: "color-mix(in oklab, var(--night) 55%, transparent)" }}
      >
        <button type="button" onClick={() => setFlying((f) => !f)} className="lab-focus h-9 rounded-full bg-[var(--cornflower)] px-4">
          {flying ? "Land" : "Fly"}
        </button>
        <Slider label="Beats/s" value={rate} min={0.4} max={5} step={0.1} onChange={setRate} />
        <Slider label="Depth" value={depth} min={30} max={170} step={1} onChange={setDepth} unit="°" />
        <Slider label="Trail" value={trail} min={0} max={0.25} step={0.01} onChange={setTrail} />
        <Slider label="Sweep" value={sweep} min={0} max={60} step={1} onChange={setSweep} unit="°" />
        <Slider label="Lift" value={lift} min={0} max={90} step={1} onChange={setLift} />
      </div>
    </div>
  );
}
