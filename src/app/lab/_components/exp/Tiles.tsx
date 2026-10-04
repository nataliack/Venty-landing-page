"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useGlow } from "../useGlow";

/* Glow tiles: a field of backlit glass tiles in the Venty palette, after
   the trading-floor reference. Everything is tunable from the panel and
   the settings live in the URL hash, so a link carries the exact look. */

type PaletteKey = "cornflower" | "periwinkle" | "moon" | "haze" | "steel" | "cloud";

const PALETTES: Record<PaletteKey, { name: string; swatch: string[]; vars: Record<string, string> }> = {
  cornflower: {
    name: "Cornflower",
    swatch: ["#0b0c15", "#687ef5", "#eff4ff"],
    vars: {},
  },
  periwinkle: {
    name: "Periwinkle",
    swatch: ["#0b0c15", "#9daccd", "#eff4ff"],
    vars: {
      "--t-top": "color-mix(in oklab, var(--periwinkle) 26%, var(--ink))",
      "--t-bot": "color-mix(in oklab, var(--periwinkle) 8%, var(--night))",
      "--t-glow": "var(--periwinkle)",
      "--t-bloom": "var(--periwinkle)",
    },
  },
  moon: {
    name: "Moon",
    swatch: ["#0b0c15", "#c0c8db", "#eff4ff"],
    vars: {
      "--t-top": "color-mix(in oklab, var(--cloud) 9%, var(--night))",
      "--t-bot": "var(--night)",
      "--t-glow": "var(--mist)",
      "--t-bloom": "var(--steel)",
    },
  },
  haze: {
    name: "Haze",
    swatch: ["#384c65", "#687ef5", "#c0c8db"],
    vars: {
      "--bg": "color-mix(in oklab, var(--cornflower) 40%, var(--night))",
      "--t-top": "color-mix(in oklab, var(--cornflower) 85%, var(--periwinkle))",
      "--t-bot": "color-mix(in oklab, var(--cornflower) 70%, var(--ink))",
      "--t-glow": "var(--mist)",
      "--t-bloom": "var(--periwinkle)",
    },
  },
  steel: {
    name: "Steel",
    swatch: ["#121524", "#485f88", "#c0c8db"],
    vars: {
      "--bg": "var(--ink)",
      "--t-top": "color-mix(in oklab, var(--steel) 55%, var(--ink))",
      "--t-bot": "color-mix(in oklab, var(--navy) 30%, var(--night))",
      "--t-glow": "color-mix(in oklab, var(--steel) 60%, var(--periwinkle))",
      "--t-hot": "var(--mist)",
      "--t-bloom": "var(--steel)",
    },
  },
  cloud: {
    name: "Cloud",
    swatch: ["#c0c8db", "#eff4ff", "#687ef5"],
    vars: {
      "--bg": "var(--mist)",
      "--t-top": "var(--cloud)",
      "--t-bot": "color-mix(in oklab, var(--mist) 55%, var(--cloud))",
      "--t-glow": "var(--cornflower)",
      "--t-hot": "#ffffff",
      "--t-text": "var(--ink)",
      "--t-bloom": "var(--cornflower)",
    },
  },
};

type Settings = {
  palette: PaletteKey;
  drift: boolean;
  intensity: number;
  reach: number;
  across: number;
  gap: number;
  radius: number;
  tilt: number;
  speed: number;
  labels: boolean;
};

const DEFAULTS: Settings = {
  palette: "cornflower",
  drift: false,
  intensity: 1,
  reach: 1.1,
  across: 2.2,
  gap: 14,
  radius: 18,
  tilt: 0,
  speed: 1,
  labels: true,
};

const SLIDERS: { key: keyof Settings; label: string; min: number; max: number; step: number; unit?: string }[] = [
  { key: "intensity", label: "Intensity", min: 0.2, max: 1.6, step: 0.05 },
  { key: "reach", label: "Light reach", min: 0.3, max: 3, step: 0.05, unit: "×" },
  { key: "across", label: "Tiles across", min: 1.2, max: 8, step: 0.1 },
  { key: "gap", label: "Gap", min: 2, max: 48, step: 1, unit: "px" },
  { key: "radius", label: "Corners", min: 0, max: 50, step: 1, unit: "%" },
  { key: "tilt", label: "Tilt", min: 0, max: 45, step: 1, unit: "°" },
  { key: "speed", label: "Drift speed", min: 0.2, max: 4, step: 0.1, unit: "×" },
];

/* Venty-flavoured labels in place of tickers: a measurement up the side,
   the body part along the bottom. */
const MEASURES: [string, string, boolean][] = [
  ["92 cm", "Bust", true],
  ["74 cm", "Waist", false],
  ["98 cm", "Hip", true],
  ["39 cm", "Shoulder", false],
  ["61 cm", "Sleeve", true],
  ["78 cm", "Inseam", false],
  ["36 cm", "Neck", true],
  ["56 cm", "Thigh", false],
  ["104 cm", "Length", true],
  ["16 cm", "Wrist", false],
  ["42 cm", "Back", true],
];

function fromHash(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  const p = new URLSearchParams(window.location.hash.slice(1));
  const s: Settings = { ...DEFAULTS };
  if (p.get("p") && p.get("p")! in PALETTES) s.palette = p.get("p") as PaletteKey;
  if (p.has("d")) s.drift = p.get("d") === "1";
  if (p.has("l")) s.labels = p.get("l") === "1";
  for (const sl of SLIDERS) {
    const v = Number(p.get(sl.key));
    if (p.has(sl.key) && Number.isFinite(v)) (s[sl.key] as number) = Math.min(sl.max, Math.max(sl.min, v));
  }
  return s;
}

function toHash(s: Settings) {
  const p = new URLSearchParams();
  p.set("p", s.palette);
  p.set("d", s.drift ? "1" : "0");
  p.set("l", s.labels ? "1" : "0");
  for (const sl of SLIDERS) p.set(sl.key, String(s[sl.key]));
  return "#" + p.toString();
}

const rnd = (min: number, max: number, step: number) => Number((Math.round((min + Math.random() * (max - min)) / step) * step).toFixed(2));

export function Tiles() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const stage = useRef<HTMLDivElement>(null);

  const short = Math.min(box.w, box.h) || 400;
  const size = Math.round((short - s.gap * (s.across - 1)) / s.across);
  const reachPx = Math.round(size * s.reach);
  const field = useGlow<HTMLDivElement>({ reach: reachPx, follow: !s.drift, speed: s.speed });

  // settings come from the hash after mount, so the server render stays default
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setS(fromHash());
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // every change goes to the hash too (idempotent, so safe in an updater)
  const update = (fn: (o: Settings) => Settings) =>
    setS((o) => {
      const n = fn(o);
      history.replaceState(null, "", toHash(n));
      return n;
    });
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => update((o) => ({ ...o, [k]: v }));
  const zoom = 1 + s.tilt / 40;
  const cols = box.w ? Math.ceil((box.w * zoom) / (size + s.gap)) + 2 : 0;
  const rows = box.h ? Math.ceil((box.h * zoom) / (size + s.gap)) + 2 : 0;

  const shuffle = () => {
    const keys = Object.keys(PALETTES) as PaletteKey[];
    update((o) => ({
      ...o,
      palette: keys[Math.floor(Math.random() * keys.length)],
      intensity: rnd(0.6, 1.4, 0.05),
      reach: rnd(0.6, 2, 0.05),
      across: rnd(1.6, 5, 0.1),
      gap: rnd(6, 28, 1),
      radius: rnd(8, 34, 1),
      tilt: Math.random() < 0.5 ? 0 : rnd(10, 35, 1),
    }));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the URL bar already holds the link */
    }
  };

  const pal = PALETTES[s.palette];
  const vars = {
    ...pal.vars,
    "--i": s.intensity,
    "--radius": `${s.radius}%`,
    "--reach": `${reachPx}px`,
  } as CSSProperties;

  return (
    <div ref={stage} className="absolute inset-0 overflow-clip bg-[var(--bg)] transition-colors duration-700" style={vars}>
      <div className="absolute inset-0 [perspective:1100px]">
        <div
          ref={field}
          className="glow-field absolute inset-0 transition-transform duration-700 ease-[var(--ease)]"
          style={{ transform: `rotateX(${s.tilt}deg) scale(${zoom})`, transformOrigin: "50% 60%" }}
        >
          <div
            className="absolute left-1/2 top-1/2 grid w-max -translate-x-1/2 -translate-y-1/2"
            style={{ gridTemplateColumns: `repeat(${cols}, ${size}px)`, gridAutoRows: `${size}px`, gap: s.gap }}
          >
            {Array.from({ length: cols * rows }, (_, k) => {
              const m = MEASURES[(k * 7 + Math.floor(k / cols) * 3) % MEASURES.length];
              return (
                <div key={k} data-glow className="glow-tile">
                  {s.labels && size > 70 && (
                    <>
                      <span className="glow-label glow-label--v">{m[0]}</span>
                      <span className="glow-label glow-label--b">
                        <i>{m[2] ? "▲" : "▼"}</i>
                        {m[1]}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* tune button, top right, clear of the lab pill */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="tiles-panel"
        className="lab-glass lab-btn lab-focus absolute right-4 top-[max(16px,env(safe-area-inset-top))] z-[95] gap-2 px-4"
      >
        <span className="flex items-center gap-2 text-[14px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="10" cy="17" r="2" />
          </svg>
          {open ? "Close" : "Tune"}
        </span>
      </button>

      {open && (
        <aside
          id="tiles-panel"
          data-lenis-prevent
          className="lab-glass lab-in absolute inset-x-2 bottom-[84px] z-[94] max-h-[58svh] overflow-y-auto rounded-[28px] p-5 text-[var(--cloud)] md:inset-x-auto md:bottom-auto md:right-4 md:top-[76px] md:max-h-[calc(100svh-180px)] md:w-[320px]"
          style={{ background: "color-mix(in oklab, var(--night) 84%, transparent)" }}
        >
          <p className="lab-eyebrow text-[var(--periwinkle)]">Palette</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(Object.keys(PALETTES) as PaletteKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => set("palette", k)}
                aria-pressed={s.palette === k}
                className={`lab-focus rounded-2xl p-2 text-left text-[12px] transition-colors ${s.palette === k ? "bg-[color-mix(in_oklab,var(--cornflower)_35%,transparent)] ring-1 ring-[var(--cornflower)]" : "bg-[color-mix(in_oklab,var(--cloud)_6%,transparent)]"}`}
              >
                <span className="flex h-5 overflow-hidden rounded-full">
                  {PALETTES[k].swatch.map((c) => (
                    <span key={c} className="flex-1" style={{ background: c }} />
                  ))}
                </span>
                <span className="mt-1.5 block">{PALETTES[k].name}</span>
              </button>
            ))}
          </div>

          <p className="lab-eyebrow mt-6 text-[var(--periwinkle)]">Light</p>
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-[color-mix(in_oklab,var(--cloud)_6%,transparent)] p-1 text-[13px]">
            {[
              { v: false, t: "Follows you" },
              { v: true, t: "Drifts" },
            ].map((o) => (
              <button
                key={o.t}
                type="button"
                onClick={() => set("drift", o.v)}
                aria-pressed={s.drift === o.v}
                className={`lab-focus h-9 rounded-full transition-colors ${s.drift === o.v ? "bg-[var(--cornflower)]" : ""}`}
              >
                {o.t}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-1">
            {SLIDERS.map((sl) => {
              const v = s[sl.key] as number;
              const fill = ((v - sl.min) / (sl.max - sl.min)) * 100;
              return (
                <label key={sl.key} className="block">
                  <span className="flex justify-between text-[13px]">
                    <span>{sl.label}</span>
                    <span className="tabular-nums text-[var(--periwinkle)]">
                      {Number.isInteger(sl.step) ? v : v.toFixed(sl.step < 0.1 ? 2 : 1)}
                      {sl.unit ?? ""}
                    </span>
                  </span>
                  <input
                    type="range"
                    className="lab-range"
                    min={sl.min}
                    max={sl.max}
                    step={sl.step}
                    value={v}
                    style={{ "--fill": `${fill}%` } as CSSProperties}
                    onChange={(ev) => set(sl.key, Number(ev.target.value) as never)}
                  />
                </label>
              );
            })}
          </div>

          <label className="mt-3 flex cursor-pointer items-center justify-between text-[13px]">
            <span>Measurement labels</span>
            <input type="checkbox" checked={s.labels} onChange={(ev) => set("labels", ev.target.checked)} className="lab-focus h-5 w-5 accent-[var(--cornflower)]" />
          </label>

          <div className="mt-6 grid grid-cols-3 gap-2 text-[13px]">
            <button type="button" onClick={shuffle} className="lab-focus h-10 rounded-full bg-[var(--cornflower)]">
              Shuffle
            </button>
            <button type="button" onClick={() => update(() => DEFAULTS)} className="lab-focus h-10 rounded-full bg-[color-mix(in_oklab,var(--cloud)_10%,transparent)]">
              Reset
            </button>
            <button type="button" onClick={copy} className="lab-focus h-10 rounded-full bg-[color-mix(in_oklab,var(--cloud)_10%,transparent)]">
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <p className="mt-3 text-[11px] leading-snug text-[var(--periwinkle)]">
            The link holds every setting. Send it back to me to lock a look in.
          </p>
        </aside>
      )}
    </div>
  );
}
