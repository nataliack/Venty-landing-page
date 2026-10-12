"use client";

import { useState } from "react";
import { FilamentLoader } from "@/components/FilamentLoader";
import { LogoMark } from "@/components/Logo";
import { heroPoster } from "@/lib/heroSequence";
import "./loaders.css";

/* The page's loading screen, on the bench: the hero's first frame behind
   (what the squares clear to), a stand-in of the site's logo at the top left
   (where the mark lands), a simulated load, and Replay. */
export function FilamentLab() {
  const [run, setRun] = useState(1);
  const [gone, setGone] = useState(false);
  const [slow, setSlow] = useState(false);
  // the night: the zipper loader's (on the page) or the locked dark sky, Edge
  const [sky, setSky] = useState<"loader" | "dark">("loader");

  const replay = () => {
    setGone(false);
    setRun((r) => r + 1);
  };

  return (
    <div className="absolute inset-0 overflow-clip bg-[var(--night)]">
      <div className="ld-page is-hero absolute inset-0 overflow-clip">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroPoster} alt="" draggable={false} />
      </div>
      {/* the logo the mark lands on, shown once it has */}
      <span className="absolute left-[clamp(16px,2.5vw,36px)] top-[clamp(16px,3vh,32px)]" style={{ visibility: gone ? "visible" : "hidden" }}>
        <LogoMark data-lab-logo className="w-[clamp(32px,3.4vw,49px)] text-[var(--cornflower)]" />
      </span>
      {!gone && <FilamentLoader key={`${run}-${slow}-${sky}`} contained sim={3.2} pace={slow ? 4 : 1} sky={sky} target={() => document.querySelector("[data-lab-logo]")} onDone={() => setGone(true)} />}

      <div
        className="lab-glass absolute left-1/2 top-[max(12px,env(safe-area-inset-top))] z-[80] flex -translate-x-1/2 items-center gap-1 rounded-full p-1 text-[13px]"
        style={{ background: "color-mix(in oklab, var(--night) 55%, transparent)" }}
      >
        {(["loader", "dark"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={sky === k}
            onClick={() => {
              setSky(k);
              replay();
            }}
            title={k === "loader" ? "The zipper loader's night (on the page now)" : "Edge, the locked dark sky: a cornflower glow roaming the lower two thirds"}
            className={`lab-focus h-9 rounded-full px-3 transition-colors ${sky === k ? "bg-[color-mix(in_oklab,var(--cloud)_16%,transparent)]" : "text-[var(--periwinkle)]"}`}
          >
            {k === "loader" ? "Zipper night" : "Edge"}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={slow}
          onClick={() => {
            setSlow((s) => !s);
            replay();
          }}
          className={`lab-focus h-9 rounded-full px-3 transition-colors ${slow ? "bg-[color-mix(in_oklab,var(--cloud)_16%,transparent)]" : "text-[var(--periwinkle)]"}`}
        >
          Slow motion
        </button>
        <button type="button" onClick={replay} className="lab-focus h-9 rounded-full bg-[var(--cornflower)] px-4">
          Replay
        </button>
      </div>
    </div>
  );
}
