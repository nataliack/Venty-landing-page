/* Line icons for Made to measure, 24 x 24, drawn in currentColor. */
export const I = {
  plus: "M12 5v14M5 12h14",
  pen: "M4 20l4-1L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4zM14 6l3 3",
  // sketching is making, not editing: a brush with its painted stroke
  brush: "M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z",
  more: "M6 12h.01M12 12h.01M18 12h.01",
  marker: "M9 15l-4 4h6l1.5-1.5M9 15l7-7 3 3-7 7M9 15l3 3M14 6l2-2 4 4-2 2",
  erase: "M7 20h10M5.5 13.5l7-7a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12 17H8z",
  pin: "M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  undo: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  redo: "M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3",
  trash: "M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  form: "M10 3h4l-.3 3.5c2.8.9 4.3 3 4.1 6.5-.2 3-1.3 4.9-1.3 6.8 0 1.2.5 2.2 1.5 2.2H6c1 0 1.5-1 1.5-2.2 0-1.9-1.1-3.8-1.3-6.8-.2-3.5 1.3-5.6 4.1-6.5z",
  x: "M6 6l12 12M18 6L6 18",
  arrow: "M5 12h14M13 6l6 6-6 6",
  tape: "M3 9h18v6H3zM7 9v3M11 9v2M15 9v3M19 9v2",
  chev: "M7 10l5 5 5-5",
  image: "M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5zM4 15l4.5-4.5L13 15l2.5-2.5L20 17M15.5 8.5h.01",
  replace: "M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4",
  replay: "M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4",
  print: "M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v6H7z",
};

export function Icon({ d, size = 18, weight = 1.6 }: { d: string; size?: number; weight?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
