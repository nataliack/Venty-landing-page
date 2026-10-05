"use client";

import { useEffect, useState, type ComponentType } from "react";
import { LogoMark, Wordmark } from "@/components/Logo";
import { VoteTab } from "@/components/VoteTab";
import { heroPoster } from "@/lib/heroSequence";
import type { LoaderProps } from "./shared";
import "./loaders.css";

/* Test bench for loader concepts: a stand-in page behind, a simulated
   network in front, and Replay. The stand-in is deliberately not the real
   Hero (that is being rebuilt elsewhere); it only shows the hand-off. */

const SPEEDS = [
  { key: "fast", label: "Fast", seconds: 1.2 },
  { key: "typical", label: "Typical", seconds: 3.6 },
  { key: "slow", label: "Slow", seconds: 9 },
] as const;

/* Ten assets of uneven size arriving in parallel, the biggest (the hero
   film) trickling in with a stall, like a real first visit. */
function useFakeLoad(seconds: number, run: number) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let seed = run * 9301 + 49297;
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const T = seconds * 1000;
    const assets = Array.from({ length: 10 }, (_, i) => {
      const start = i === 0 ? 0 : rand() * 0.35 * T;
      return { size: i === 0 ? 6 : 0.4 + rand() * 1.4, start, dur: i === 0 ? T : Math.min(T - start, (0.15 + rand() * 0.6) * T) };
    });
    const total = assets.reduce((a, b) => a + b.size, 0);
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const e = t - t0;
      let got = 0;
      for (const a of assets) {
        let k = Math.min(1, Math.max(0, (e - a.start) / a.dur));
        if (a.size > 4) k = k < 0.55 ? k * 0.9 : k < 0.75 ? 0.495 + (k - 0.55) * 0.2 : 0.535 + (k - 0.75) * 1.86; // the stall
        got += a.size * Math.min(1, k);
      }
      const v = e >= T ? 1 : got / total;
      setP(v);
      if (v < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seconds, run]);
  return p;
}

type Tone = "dark" | "light" | "hero";
const TONES: Tone[] = ["dark", "light", "hero"];

function StandIn({ live, tone }: { live: boolean; tone: Tone }) {
  // the hero's opening frame, exactly as the hero poster draws it
  if (tone === "hero")
    return (
      <div className="ld-page is-hero absolute inset-0 overflow-clip">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroPoster} alt="" draggable={false} />
      </div>
    );
  return (
    <div className={`ld-page absolute inset-0 overflow-clip ${live ? "is-live" : ""} ${tone === "light" ? "is-light" : ""}`}>
      <div className="ld-page__glow" />
      <header className="ld-page__in absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5 md:px-10" style={{ "--d": "0.15s" } as React.CSSProperties}>
        <span className="ld-page__fg flex items-center gap-2 text-[22px]">
          <LogoMark className="h-[1.05em] w-auto" />
          <Wordmark className="h-[0.95em] w-auto" />
        </span>
        <span className="ld-page__muted text-[13px]">Stand-in page</span>
      </header>
      <div className="absolute inset-x-0 bottom-[22%] px-5 md:bottom-[18%] md:px-10">
        <p className="ld-page__in ld-page__muted lab-eyebrow" style={{ "--d": "0.25s" } as React.CSSProperties}>
          Venty · made to measure
        </p>
        <h2 className="ld-page__in lab-display mt-3 max-w-[12ch] text-[clamp(2.8rem,9vw,7rem)] leading-[0.88]" style={{ "--d": "0.35s" } as React.CSSProperties}>
          Your body, your pattern.
        </h2>
        <span
          className="ld-page__in mt-6 inline-flex h-12 items-center rounded-full bg-[var(--cornflower)] px-6 text-[16px] text-[var(--cloud)]"
          style={{ "--d": "0.5s", boxShadow: "inset 0 0 18px var(--cloud)" } as React.CSSProperties}
        >
          Draft your pattern
        </span>
      </div>
    </div>
  );
}

export function Harness({ Concept, page = "dark", vote = false }: { Concept: ComponentType<LoaderProps>; page?: Tone; vote?: boolean }) {
  const [tone, setTone] = useState(page);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]["key"]>("typical");
  const [run, setRun] = useState(1);
  const [live, setLive] = useState(false);
  const [gone, setGone] = useState(false);
  const seconds = SPEEDS.find((s) => s.key === speed)!.seconds;
  const progress = useFakeLoad(seconds, run);

  const replay = () => {
    setLive(false);
    setGone(false);
    setRun((r) => r + 1);
  };

  return (
    <div className="absolute inset-0 overflow-clip bg-[var(--night)]">
      <StandIn live={live} tone={tone} />
      {!gone && <Concept key={run} progress={progress} onExit={() => setLive(true)} onDone={() => setGone(true)} />}
      {/* the site's real Vote for Venty tab, there from the first frame of
          the loader: its entrance runs on mount, so Replay remounts it */}
      {vote && <VoteTab key={`vote-${run}`} />}

      <div
        className="lab-glass absolute left-1/2 top-[max(12px,env(safe-area-inset-top))] z-[80] flex -translate-x-1/2 items-center gap-1 rounded-full p-1 text-[13px]"
        style={{ background: "color-mix(in oklab, var(--night) 55%, transparent)" }}
      >
        {SPEEDS.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={speed === s.key}
            onClick={() => {
              setSpeed(s.key);
              replay();
            }}
            className={`lab-focus h-9 rounded-full px-3 transition-colors ${speed === s.key ? "bg-[color-mix(in_oklab,var(--cloud)_16%,transparent)]" : "text-[var(--periwinkle)]"}`}
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setTone((t) => TONES[(TONES.indexOf(t) + 1) % TONES.length]);
            replay();
          }}
          aria-label={`Page behind the loader: ${tone}. Switch`}
          title="Page behind the loader: dark, light or the hero's first frame"
          className="lab-focus grid h-9 w-9 place-items-center rounded-full text-[var(--periwinkle)]"
        >
          <span
            className="block h-3.5 w-3.5 rounded-full border border-current"
            style={{ background: tone === "light" ? "var(--cloud)" : tone === "hero" ? "linear-gradient(135deg, var(--steel), var(--night))" : "var(--night)" }}
          />
        </button>
        <button type="button" onClick={replay} className="lab-focus h-9 rounded-full bg-[var(--cornflower)] px-4">
          Replay
        </button>
      </div>
    </div>
  );
}
