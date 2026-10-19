"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EXPERIMENTS, findExperiment } from "../experiments";
import { NATIVE } from "./registry";

/* One experiment, full screen, with a pill at the bottom: back to the
   grid, previous, next. Arrow keys and Escape work too. The pill can be
   hidden (its own button, or H) to see the experiment clear; a small button
   in the corner brings it back. Remembered on this device. */

const pad = (n: number) => String(n).padStart(2, "0");

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function Viewer({ slug }: { slug: string }) {
  const router = useRouter();
  const i = findExperiment(slug);
  const e = EXPERIMENTS[i];
  const n = EXPERIMENTS.length;
  const prev = EXPERIMENTS[(i - 1 + n) % n];
  const next = EXPERIMENTS[(i + 1) % n];
  const Native = NATIVE[slug];
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    // read after hydration (the server can't know), on the next frame
    const id = requestAnimationFrame(() => {
      try {
        setHidden(localStorage.getItem("lab-controls") === "hidden");
      } catch {}
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const hide = (v: boolean) => {
    setHidden(v);
    try {
      localStorage.setItem("lab-controls", v ? "hidden" : "shown");
    } catch {}
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, [contenteditable]") || t.isContentEditable)) return;
      if (ev.key === "ArrowLeft") router.push(`/lab/${prev.slug}`);
      if (ev.key === "ArrowRight") router.push(`/lab/${next.slug}`);
      if (ev.key === "Escape") router.push("/lab");
      if (ev.key === "h" || ev.key === "H") hide(!hidden);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, prev.slug, next.slug, hidden]);

  return (
    <div className="fixed inset-0 z-[70] overflow-clip bg-[var(--bg)]">
      {e.kind === "frame" ? (
        <iframe key={e.slug} src={e.src} title={e.title} className="absolute inset-0 h-full w-full border-0" />
      ) : Native ? (
        <Native />
      ) : null}

      {hidden ? (
        <button
          type="button"
          onClick={() => hide(false)}
          className="lab-glass lab-btn lab-focus absolute bottom-[max(16px,env(safe-area-inset-bottom))] right-4 z-[90] rounded-full opacity-50 transition-opacity hover:opacity-100 focus-visible:opacity-100"
          style={{ background: "color-mix(in oklab, var(--night) 55%, transparent)" }}
          aria-label="Show lab controls"
        >
          <Icon d="M6 15l6-6 6 6" />
        </button>
      ) : (
      <nav
        aria-label="Lab"
        className="lab-glass lab-in absolute bottom-[max(16px,env(safe-area-inset-bottom))] left-1/2 z-[90] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-1 rounded-full p-1"
        style={{ background: "color-mix(in oklab, var(--night) 55%, transparent)" }}
      >
        <Link href="/lab" className="lab-btn lab-focus" aria-label="All experiments">
          <Icon d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
        </Link>
        <Link href={`/lab/${prev.slug}`} className="lab-btn lab-focus" aria-label={`Previous: ${prev.title}`}>
          <Icon d="M15 5l-7 7 7 7" />
        </Link>
        <div className="min-w-0 px-2 text-center">
          <p className="truncate text-[14px] leading-tight">{e.title}</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--periwinkle)]">
            {pad(i + 1)} / {pad(n)}
          </p>
        </div>
        <Link href={`/lab/${next.slug}`} className="lab-btn lab-focus" aria-label={`Next: ${next.title}`}>
          <Icon d="M9 5l7 7-7 7" />
        </Link>
        {e.kind === "frame" && (
          <a href={e.src} target="_blank" rel="noreferrer" className="lab-btn lab-focus" aria-label={`Open ${e.title} on its own`}>
            <Icon d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
          </a>
        )}
        <button type="button" onClick={() => hide(true)} className="lab-btn lab-focus" aria-label="Hide lab controls (H)">
          <Icon d="M6 9l6 6 6-6" />
        </button>
      </nav>
      )}
    </div>
  );
}
