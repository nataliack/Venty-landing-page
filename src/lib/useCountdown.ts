"use client";

import { useEffect, useState } from "react";
import { FESTIVAL_AT } from "./site";

/** Time left to the QUT Design Festival (FESTIVAL_AT), ticking every
    second: days, hours, minutes, seconds. Null until mounted (the server
    cannot know the visitor's clock); all zero once it has begun. Used by
    the announcement bar and the footer. */
export function useCountdown() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const at = new Date(FESTIVAL_AT).getTime();
    const tick = () => setLeft(Math.max(0, at - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  if (left === null) return null;
  const s = Math.floor(left / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60, over: left === 0 };
}
