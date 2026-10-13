"use client";

import { useEffect, useState } from "react";
import { FESTIVAL_AT, MAKER_URL } from "@/lib/site";
import { useCountdown } from "@/lib/useCountdown";

/* The announcement bar across the top of the hero: who made Venty (to her
   site), a countdown to the QUT Design Festival, and a line that rolls
   through Venty's promise. It sits at the top of the hero and slides away
   once you scroll (html[data-announce], set by Hero.tsx). The logo and the
   section menu sit under it while it shows (--announce-h).

   Phones and tablets keep the maker and the countdown; the rolling line
   joins on laptops, where there is room for all three. */

const LINES = [
  "No sizes. Just measurements.",
  "Sketch it. Say it. Sew it.",
  "Your body is the pattern.",
  "From screen to scissors.",
  "Pin it. Cut it. Wear it.",
];
const ROLL_MS = 3600;

const pad = (n: number) => String(n).padStart(2, "0");

function Countdown() {
  const left = useCountdown();
  if (left?.over) return <span className="announce__time">Now on</span>;
  const parts: [number | null, string][] = [
    [left?.d ?? null, "d"],
    [left?.h ?? null, "h"],
    [left?.m ?? null, "m"],
    [left?.s ?? null, "s"],
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
    <p data-bar-item className="announce__roll">
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
      <span data-bar-line aria-hidden="true" className="announce__line" />
      <div className="announce__row">
        <a data-bar-item href={MAKER_URL} target="_blank" rel="noopener" className="announce__maker">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/natalia-chamon.webp" alt="" width={20} height={20} className="announce__face" />
          <span className="announce__who">
            <span className="announce__label">Made by:</span>
            <span>Natalia Chamon</span>
          </span>
        </a>

        <p data-bar-item className="announce__count">
          <span className="announce__count-label">QUT Festival:</span>
          <Countdown />
        </p>

        <Roller />
      </div>
    </div>
  );
}
