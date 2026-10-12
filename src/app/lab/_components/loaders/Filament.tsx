"use client";

import { useState } from "react";
import { FilamentLoader } from "@/components/FilamentLoader";
import { heroPoster } from "@/lib/heroSequence";
import "./loaders.css";

/* The page's loading screen, on the bench: the hero's first frame behind
   (what the burst opens onto), a simulated load, Replay, and Hold to stop
   the burst at any point and look at the squares and the glitter. */
export function FilamentLab() {
  const [run, setRun] = useState(1);
  const [gone, setGone] = useState(false);
  const [hold, setHold] = useState<number | null>(null);

  const replay = () => {
    setHold(null);
    setGone(false);
    setRun((r) => r + 1);
  };

  return (
    <div className="absolute inset-0 overflow-clip bg-[var(--night)]">
      <div className="ld-page is-hero absolute inset-0 overflow-clip">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroPoster} alt="" draggable={false} />
      </div>
      {!gone && <FilamentLoader key={`${run}-${hold === null ? "run" : "hold"}`} contained sim={3.2} scrub={hold} onDone={() => setGone(true)} />}

      <div
        className="lab-glass absolute left-1/2 top-[max(12px,env(safe-area-inset-top))] z-[80] flex -translate-x-1/2 items-center gap-2 rounded-full p-1 pl-3 text-[13px]"
        style={{ background: "color-mix(in oklab, var(--night) 55%, transparent)" }}
      >
        <label className="flex items-center gap-2 text-[var(--periwinkle)]">
          <input
            type="checkbox"
            checked={hold !== null}
            onChange={(e) => {
              setGone(false);
              setHold(e.target.checked ? 0.35 : null);
              if (!e.target.checked) setRun((r) => r + 1);
            }}
          />
          Hold the burst
        </label>
        {hold !== null && (
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={hold}
            onChange={(e) => setHold(Number(e.target.value))}
            aria-label="Where the burst is held"
            className="w-[min(220px,40vw)]"
          />
        )}
        <button type="button" onClick={replay} className="lab-focus h-9 rounded-full bg-[var(--cornflower)] px-4">
          Replay
        </button>
      </div>
    </div>
  );
}
