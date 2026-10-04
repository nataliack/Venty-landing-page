"use client";

import { useState } from "react";

/* Colour pairs: choose a background and a text colour from the palette,
   see them on real type and read the WCAG 2.2 contrast ratio. Below, every
   text colour on the chosen background, best first. */

const PALETTE = [
  { name: "Night", hex: "#0B0C15" },
  { name: "Ink", hex: "#121524" },
  { name: "Navy", hex: "#384C65" },
  { name: "Steel", hex: "#485F88" },
  { name: "Cornflower", hex: "#687EF5" },
  { name: "Periwinkle", hex: "#9DACCD" },
  { name: "Mist", hex: "#C0C8DB" },
  { name: "Cloud", hex: "#EFF4FF" },
];

function luminance(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function grade(r: number) {
  if (r >= 7) return { t: "AAA", ok: true };
  if (r >= 4.5) return { t: "AA", ok: true };
  if (r >= 3) return { t: "Large only", ok: true };
  return { t: "Fail", ok: false };
}

function Chips({ label, value, onPick }: { label: string; value: number; onPick: (i: number) => void }) {
  return (
    <fieldset>
      <legend className="lab-eyebrow text-[var(--periwinkle)]">{label}</legend>
      <div className="mt-3 grid grid-cols-8 gap-1.5 sm:gap-2">
        {PALETTE.map((c, i) => (
          <button
            key={c.hex}
            type="button"
            onClick={() => onPick(i)}
            aria-pressed={value === i}
            aria-label={c.name}
            title={`${c.name} ${c.hex}`}
            className={`lab-focus aspect-square rounded-xl transition-transform duration-300 ${value === i ? "scale-105 ring-2 ring-[var(--cloud)] ring-offset-2 ring-offset-[var(--night)]" : "ring-1 ring-[color-mix(in_oklab,var(--cloud)_14%,transparent)]"}`}
            style={{ background: c.hex }}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function Pairs() {
  const [bg, setBg] = useState(0);
  const [fg, setFg] = useState(7);
  const B = PALETTE[bg];
  const F = PALETTE[fg];
  const r = ratio(B.hex, F.hex);
  const g = grade(r);
  const others = PALETTE.map((c, i) => ({ ...c, i, r: ratio(B.hex, c.hex) }))
    .filter((c) => c.i !== bg)
    .sort((a, b) => b.r - a.r);

  return (
    <div data-lenis-prevent className="absolute inset-0 overflow-y-auto bg-[var(--night)]">
      <div className="mx-auto grid max-w-[1100px] gap-6 px-4 pb-32 pt-6 sm:px-8 md:grid-cols-[1.3fr_1fr] md:pt-12">
        <section
          className="lab-in relative flex min-h-[340px] ring-1 ring-[color-mix(in_oklab,var(--cloud)_10%,transparent)] flex-col justify-between overflow-hidden rounded-[28px] p-6 transition-colors duration-500 md:min-h-[520px] md:p-10"
          style={{ background: B.hex, color: F.hex }}
          aria-label="Preview"
        >
          <p className="lab-eyebrow" style={{ color: F.hex }}>
            {F.name} on {B.name}
          </p>
          <div>
            <h2 className="lab-display text-[clamp(2.6rem,7vw,5rem)] leading-[0.9]">Made to measure</h2>
            <p className="mt-4 max-w-[38ch] text-[16px] leading-snug">
              A printable sewing pattern drafted to your exact measurements, shown on a 3D model of your own body.
            </p>
            <p className="mt-3 text-[12px]">Small print sits at 12px, the hardest case for contrast.</p>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <span className="rounded-full px-5 py-2.5 text-[15px]" style={{ background: F.hex, color: B.hex }}>
              Start your pattern
            </span>
            <span className="text-right">
              <span className="lab-display block text-[clamp(2.4rem,6vw,3.6rem)] leading-none tabular-nums">{r.toFixed(2)}</span>
              <span className="text-[12px]">: 1 · {g.t}</span>
            </span>
          </div>
        </section>

        <div className="lab-in space-y-7" style={{ animationDelay: "120ms" }}>
          <Chips label={`Background · ${B.name} ${B.hex}`} value={bg} onPick={setBg} />
          <Chips label={`Text · ${F.name} ${F.hex}`} value={fg} onPick={setFg} />

          <div>
            <p className="lab-eyebrow text-[var(--periwinkle)]">Every text colour on {B.name}</p>
            <ul className="mt-3 divide-y divide-[color-mix(in_oklab,var(--cloud)_8%,transparent)] overflow-hidden rounded-2xl bg-[color-mix(in_oklab,var(--cloud)_4%,transparent)]">
              {others.map((c) => {
                const gr = grade(c.r);
                return (
                  <li key={c.hex}>
                    <button
                      type="button"
                      onClick={() => setFg(c.i)}
                      className={`lab-focus flex w-full items-center gap-3 px-3 py-2.5 text-left text-[14px] transition-colors hover:bg-[color-mix(in_oklab,var(--cloud)_6%,transparent)] ${c.i === fg ? "bg-[color-mix(in_oklab,var(--cornflower)_22%,transparent)]" : ""}`}
                    >
                      <span className="grid h-8 w-12 shrink-0 place-items-center rounded-lg text-[13px]" style={{ background: B.hex, color: c.hex }}>
                        Aa
                      </span>
                      <span className="flex-1">{c.name}</span>
                      <span className="tabular-nums text-[var(--periwinkle)]">{c.r.toFixed(2)}</span>
                      <span
                        className={`w-[84px] rounded-full py-0.5 text-center text-[11px] ${gr.ok ? "bg-[color-mix(in_oklab,var(--cornflower)_30%,transparent)]" : "bg-[color-mix(in_oklab,var(--cloud)_6%,transparent)] text-[var(--periwinkle)]"}`}
                      >
                        {gr.t}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[11px] leading-snug text-[var(--periwinkle)]">
              WCAG 2.2: AA needs 4.5:1 for body text, 3:1 for large text (24px, or 18.7px bold) and for UI parts like borders and icons.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
