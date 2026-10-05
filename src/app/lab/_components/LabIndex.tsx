"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EXPERIMENTS, GROUPS, groupOf, type Group } from "../experiments";

/* The lab index: shelves (loaders, sections, gradients, ...), newest or
   oldest first, as a grid or a list. The three latest carry a New mark.
   Choices are remembered in this browser only. */

const pad = (n: number) => String(n).padStart(2, "0");
const KEY = "venty-lab-view";
const LATEST = new Set([...EXPERIMENTS].sort((a, b) => b.no - a.no).slice(0, 3).map((e) => e.slug));

type View = { group: Group | "all"; sort: "new" | "old"; layout: "grid" | "list" };
const DEFAULT: View = { group: "all", sort: "new", layout: "grid" };

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; t: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1 rounded-full bg-[color-mix(in_oklab,var(--cloud)_6%,transparent)] p-1">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          aria-pressed={value === o.v}
          onClick={() => onChange(o.v)}
          className={`lab-focus h-8 rounded-full px-3 text-[13px] transition-colors ${value === o.v ? "bg-[var(--cornflower)] text-[var(--cloud)]" : "text-[var(--periwinkle)] hover:text-[var(--cloud)]"}`}
        >
          {o.t}
        </button>
      ))}
    </div>
  );
}

export function LabIndex() {
  const [view, setView] = useState<View>(DEFAULT);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setView({ ...DEFAULT, ...saved });
    } catch {
      /* storage blocked: defaults */
    }
  }, []);
  const set = (patch: Partial<View>) =>
    setView((v) => {
      const n = { ...v, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(n));
      } catch {
        /* storage blocked: still works for this visit */
      }
      return n;
    });

  const count = (g: Group) => EXPERIMENTS.filter((e) => groupOf(e) === g).length;
  const list = EXPERIMENTS.filter((e) => view.group === "all" || groupOf(e) === view.group).sort((a, b) =>
    view.sort === "new" ? b.no - a.no : a.no - b.no,
  );
  const label = (g: Group) => GROUPS.find((x) => x.key === g)!.label;

  return (
    <main className="mx-auto max-w-[1100px] px-4 pb-20 pt-10 sm:px-8 md:pt-14">
      <p className="lab-eyebrow text-[var(--periwinkle)]">Venty · Laboratory</p>
      <h1 className="lab-display mt-2 text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.9]">The lab</h1>

      <div className="mt-7 flex flex-wrap items-center gap-2">
        <Seg
          label="Shelf"
          value={view.group}
          onChange={(group) => set({ group })}
          options={[{ v: "all" as const, t: `All ${EXPERIMENTS.length}` }, ...GROUPS.map((g) => ({ v: g.key, t: `${g.label} ${count(g.key)}` }))]}
        />
        <div className="ml-auto flex gap-2">
          <Seg label="Order" value={view.sort} onChange={(sort) => set({ sort })} options={[{ v: "new", t: "Newest" }, { v: "old", t: "Oldest" }]} />
          <Seg label="Layout" value={view.layout} onChange={(layout) => set({ layout })} options={[{ v: "grid", t: "Grid" }, { v: "list", t: "List" }]} />
        </div>
      </div>

      {view.layout === "grid" ? (
        <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => (
            <li key={e.slug}>
              <Link href={`/lab/${e.slug}`} className="lab-card lab-focus">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-[17px]">{e.title}</span>
                  <span className="flex shrink-0 items-center gap-2 text-[11px] tabular-nums text-[var(--steel)]">
                    {LATEST.has(e.slug) && <span className="rounded-full bg-[var(--cornflower)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--cloud)]">New</span>}
                    Nº {pad(e.no)}
                  </span>
                </span>
                <span className="mt-1 block text-[13px] leading-snug text-[var(--periwinkle)]">{e.note}</span>
                <span className="mt-3 flex gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--steel)]">
                  <span>{label(groupOf(e))}</span>
                  <span>·</span>
                  <span>{e.date}</span>
                  {e.kind === "frame" && (
                    <>
                      <span>·</span>
                      <span>Site page</span>
                    </>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 divide-y divide-[color-mix(in_oklab,var(--cloud)_8%,transparent)] overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--cloud)_9%,transparent)]">
          {list.map((e) => (
            <li key={e.slug}>
              <Link
                href={`/lab/${e.slug}`}
                className="lab-focus grid grid-cols-[3rem_1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-[color-mix(in_oklab,var(--cornflower)_14%,transparent)] sm:grid-cols-[3rem_14rem_1fr_auto]"
              >
                <span className="text-[12px] tabular-nums text-[var(--steel)]">Nº {pad(e.no)}</span>
                <span className="flex items-center gap-2 text-[15px]">
                  {e.title}
                  {LATEST.has(e.slug) && <span className="rounded-full bg-[var(--cornflower)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">New</span>}
                </span>
                <span className="hidden truncate text-[13px] text-[var(--periwinkle)] sm:block">{e.note}</span>
                <span className="text-right text-[10px] uppercase tracking-[0.16em] text-[var(--steel)]">
                  {label(groupOf(e))} · {e.date}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
