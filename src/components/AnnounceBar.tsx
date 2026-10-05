"use client";

import { useEffect, useState } from "react";
import { FESTIVAL_AT } from "@/lib/site";
import { scrollToElement } from "./SmoothScroll";

/* The announcement bar across the top of the hero: who made Venty (to Meet
   the maker), a countdown to the QUT Design Festival, and a line that rolls
   through Venty's promise. It sits at the top of the hero and slides away
   once you scroll (html[data-announce], set by Hero.tsx). The logo and the
   section menu sit under it while it shows (--announce-h).

   Phones and tablets keep the maker and the countdown; the rolling line
   joins on laptops, where there is room for all three. */

const LINES = [
  "No sizes. Just measurements.",
  "Start from a photo, a sketch or a few words.",
  "Drafted from your measurements.",
  "Ready to print.",
];
const ROLL_MS = 3600;

const pad = (n: number) => String(n).padStart(2, "0");

function Countdown() {
  // empty until mounted: the server cannot know the visitor's clock
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const at = new Date(FESTIVAL_AT).getTime();
    const tick = () => setLeft(Math.max(0, at - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (left === 0) return <span className="announce__time">Now on</span>;

  const s = left === null ? null : Math.floor(left / 1000);
  const parts: [number | null, string][] = [
    [s === null ? null : Math.floor(s / 86400), "d"],
    [s === null ? null : Math.floor(s / 3600) % 24, "h"],
    [s === null ? null : Math.floor(s / 60) % 60, "m"],
    [s === null ? null : s % 60, "s"],
  ];
  return (
    <time className="announce__time" dateTime={FESTIVAL_AT}>
      {parts.map(([v, u]) => (
        <span key={u}>
          {v === null ? "--" : pad(v)}
          {u}
        </span>
      ))}
    </time>
  );
}

function Roller() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % LINES.length), ROLL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="announce__roll">
      {/* screen readers get the first line once; the roll is decoration */}
      <span className="sr-only">{LINES[0]}</span>
      {LINES.map((line, n) => (
        <span key={line} aria-hidden="true" data-state={n === i ? "in" : n === (i - 1 + LINES.length) % LINES.length ? "out" : "wait"}>
          {line}
        </span>
      ))}
    </p>
  );
}

export function AnnounceBar() {
  return (
    <div data-bar className="announce">
      <div className="announce__row">
        <a
          href="#maker"
          className="announce__maker"
          onClick={(e) => {
            const target = document.getElementById("maker");
            if (!target) return;
            e.preventDefault();
            scrollToElement(target);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/natalia.png" alt="" width={15} height={15} className="announce__face" />
          <span className="announce__who">
            <span className="announce__label">Made by:</span>
            <span>Natalia Chamon</span>
          </span>
        </a>

        <p className="announce__count">
          <span className="announce__count-label">QUT Festival:</span>
          <Countdown />
        </p>

        <Roller />
      </div>
    </div>
  );
}
