"use client";

import { useEffect, useRef, useState } from "react";

/* The film, filling the screen on black, with the browser's own controls.
   It tries to play straight away (it opens from a click on the festival
   page); where the browser holds back playback with sound, a play button
   sits in the middle until it is pressed. */

// a new cut: replace the files, then bump v so no browser keeps the old one
const FILM = { src: "/video/venty.mp4", poster: "/video/poster.jpg", v: 1 };

export function Film() {
  const ref = useRef<HTMLVideoElement>(null);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    ref.current?.play().catch(() => setHeld(true));
  }, []);

  const play = () => {
    setHeld(false);
    ref.current?.play().catch(() => setHeld(true));
  };

  return (
    <div className="film">
      <video
        ref={ref}
        src={`${FILM.src}?v=${FILM.v}`}
        poster={`${FILM.poster}?v=${FILM.v}`}
        controls
        playsInline
        preload="metadata"
        aria-label="Venty film"
        onPlay={() => setHeld(false)}
      />
      {held && (
        <button type="button" className="film__play" onClick={play} aria-label="Play the film">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </button>
      )}
    </div>
  );
}
