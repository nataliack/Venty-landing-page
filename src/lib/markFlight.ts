/* The Venty mark, in flight: the bird beats its wings, and travels head first.

   The mark is a bird facing right: its head and neck the long piece up to
   the right, its big wing raised at the top left, its tail the point at the
   lower left. It is one closed outline. Here it is cut into three pieces
   that fill exactly the same shape at rest: the body (with the tail), the
   wing ("near"), and the head and neck ("far": seen in flight, it beats like
   the far wing). Each cut is a hinge between two points of the outline; each
   piece reaches a little past its cut into the next, so the pieces overlap
   there and no hairline seam shows between them.

   Everything is posed in 3D and drawn in perspective:
   - A beat: the wing and the head turn about their hinges, rolling over like
     paper rather than creasing (the bend spreads over a band next to the
     hinge, so the corner between them stays round). The tip trails the root.
     The body lifts on each downstroke and settles on the upstroke.
   - A turn: the bird turns about an upright axis (180 faces it left), head
     first. The head turns on its neck to look the new way while the body
     still faces the old one; then the body comes round after it, from the
     neck down to the tail, carrying the head, which settles back straight on
     its neck as the body catches up. The way a real bird follows its face.
   - A heading: the bird tilts in the picture, so it can point along its way.
   - On a path (flightRoute) the bird points along it all the way, its body
     (tail to beak) on the line it is flying, nose up as it climbs, nose down
     as it dives. Where the path bends back on itself it would end up flying
     upside down, so there it rolls over along its line of flight, head
     first, like a bird banking, and flies on the right way up.

   Any pose with no beat, no turn and no tilt is the mark, exactly. All
   numbers are in the logo's own units (the vertical lockup's viewBox,
   0 0 2132 1786; the mark spans about 1334 x 797 of it). */

export const MARK =
  "M619.823 25.0127C624.577 22.0044 627.073 22.0765 631.88 19.6243C647.161 11.828 660.294 -2.48179 678.52 0.37042C688.732 1.96732 707.767 22.6944 707.734 31.9944C707.656 56.3843 699.814 80.5262 700.432 105.57C700.625 116.376 701.769 127.145 703.859 137.743C704.396 140.597 705.181 144.359 705.96 148.346C708.435 160.988 710.174 173.925 715.433 185.674C720.751 197.546 727.823 210.519 733.023 217.21C744.992 232.608 762.065 251.277 775.785 265.097C804.527 293.524 846.79 315.004 882.892 332.163C927.142 353.195 945.208 359.199 969.402 403.521C996.034 452.304 1026.77 502.741 1029.45 556.347C1029.45 592.738 1022.71 618.329 1014.97 636.523C1003.7 663.005 1012.46 670.926 1032.99 650.823C1096.64 588.519 1101.72 491.68 1165.56 435.805C1168.55 433.189 1180.64 418.569 1183.72 415.992C1192.2 408.897 1201.81 401.266 1210.48 393.855L1213.78 390.22C1214.78 389.199 1215.75 388.311 1216.7 387.523C1225.49 380.205 1236.09 375.256 1246.53 370.604C1252.66 367.868 1258.8 366.177 1267.73 362.952C1269.54 362.295 1278.84 357.566 1281.65 356.256C1285.83 353.553 1307.41 348.613 1313.43 346.323C1322.66 342.811 1332.96 338.859 1342.33 336.022C1364.58 331.014 1374.76 327.461 1395.95 320.111C1431.44 309.343 1466.78 293.785 1500.05 277.338C1510.09 272.378 1521.17 267.248 1530.96 261.528C1532.98 260.352 1535.39 260.057 1537.6 260.786C1542.99 262.559 1544.82 269.261 1540.9 273.372C1511.48 304.201 1474.71 328.121 1447.29 360.378C1434.03 375.972 1425.14 394.177 1412.88 410.686C1409.03 415.875 1405.03 422.644 1400.5 427.241C1384.52 448.61 1372.66 478.947 1356.13 500.797C1329.64 535.804 1295.92 574.711 1261.46 601.726C1249.03 611.463 1228.62 621.659 1214.59 631.055C1195.72 641.756 1174.75 649.736 1155.84 659.891C1131.42 673.008 1107.13 687.358 1082.63 700.445C1076.15 703.902 1069.56 709.701 1064.03 712.92C1059.31 716.49 1052.09 719.885 1046.68 722.635C1038.66 725.787 1030.2 729.273 1021.87 731.378C1009.13 736.244 984.716 750.052 971.988 754.5C931.876 768.504 905.866 782.319 862.296 783.597C857.066 783.749 848.725 787.214 842.666 787.789C838.959 788.592 835.329 789.513 831.541 789.633C822.21 790.542 812.921 793.324 803.313 794.875C788.846 797.211 772.298 797.273 757.326 796.695C733.082 794.781 699.35 783.506 678.004 771.275C665.474 764.098 640.253 736.156 627.884 725.933C615.41 715.617 603.952 692.506 593.373 680.281C574.073 657.98 559.299 633.823 541.636 610.7C537.293 604.945 516.759 594.318 509.836 589.774C500.941 583.934 500.941 584.166 482.481 574.893C469.426 568.334 449.426 558.291 445.556 556.347C428.812 547.939 424.44 546.687 406.83 537.839C402.94 535.884 398.778 534.523 394.497 533.746C382.472 531.556 369.71 528.877 358.713 530.78C339.165 535.3 303.068 537.605 275.847 546.505C259.011 552.014 241.427 558.317 224.222 562.524C220.665 563.392 216.905 564.104 213.207 564.855C210.757 565.35 208.296 563.99 207.361 561.659C206.371 559.196 207.491 556.394 209.823 555.139C219.931 549.701 226.469 542.615 236.423 535.3C248.168 526.672 260.484 520.416 273.72 514.435C281.15 511.14 290.04 511.691 297.643 509.49C317.568 503.72 337.078 495.643 356.749 489.302C372.208 484.321 390.16 485.28 404.773 476.323C409.051 473.702 411.43 474.251 414.932 470.284C415.165 470.02 415.236 469.654 415.13 469.32C415.058 469.085 414.909 468.886 414.696 468.768C414.296 468.549 413.928 468.417 413.441 468.279C400.123 464.476 358.698 435.233 348.072 425.567C310.236 391.143 287.16 350.671 274.414 301.205C272.515 293.84 270.022 285.779 268.796 277.974C268.157 273.916 267.585 269.84 266.926 265.785C265.408 256.443 265.239 246.569 265.892 236.825C266.815 223.054 278.051 213.985 290.732 208.669C292.404 207.969 294.52 206.875 295.944 205.752C301.466 201.399 307.221 194.908 313.117 192.195C319.479 189.266 324.639 190.105 331.448 186.054C354.676 172.239 359.915 160.625 384.399 156.948C387.624 156.464 390.078 154.194 391.041 151.063C391.388 149.928 392.1 148.704 393.081 148.042C396.434 145.782 398.772 147.451 402.283 149.774C402.963 150.224 403.202 151.118 402.829 151.845C402.49 152.507 402.645 153.356 403.337 153.624C404.236 153.973 405.196 153.97 406.34 154.088C406.381 154.092 406.419 154.114 406.439 154.148C406.48 154.205 406.471 154.283 406.419 154.331L404.948 155.699C404.875 155.766 404.84 155.864 404.851 155.963C404.881 156.159 405.085 156.276 405.266 156.2L409.836 154.304C410.076 154.205 410.324 154.129 410.575 154.074C412.807 153.584 415.002 152.87 416.809 151.625C419.354 149.873 418.446 146.293 419.654 143.441C420.182 142.198 421.233 141.205 422.275 140.352C440.615 125.355 452.426 124.802 470.451 111.3C473.804 109.453 476.632 107.049 479.627 104.663C491.309 96.6939 507.227 88.6288 517.88 80.3913C533.152 68.5828 527.303 67.3905 547.984 63.406C554.708 62.1108 573.165 51.9715 580.534 49.1128C585.986 46.9967 596.653 36.91 602.691 34.3228C608.438 31.0985 614.733 28.6757 619.823 25.0127Z";

type Pt = [number, number];
type Cubic = [Pt, Pt, Pt]; // control 1, control 2, end

/** The outline as cubics: P[k] is the anchor that segment k ends on; P[0] is
    the start (M), and the last segment ends back on it. Straight lines are
    held as cubics, so every point deforms the same way. */
function parse(d: string) {
  const t = d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi)!;
  const segs: Cubic[] = [];
  let start: Pt = [0, 0];
  let cur: Pt = [0, 0];
  let cmd = "";
  for (let i = 0; i < t.length; ) {
    if (/[A-Z]/i.test(t[i])) cmd = t[i++];
    if (cmd === "Z") continue;
    const n = (k: number) => +t[i + k];
    if (cmd === "M") {
      cur = start = [n(0), n(1)];
      i += 2;
    } else if (cmd === "L") {
      const p: Pt = [n(0), n(1)];
      segs.push([lerp(cur, p, 1 / 3), lerp(cur, p, 2 / 3), p]);
      cur = p;
      i += 2;
    } else {
      segs.push([[n(0), n(1)], [n(2), n(3)], [n(4), n(5)]]);
      cur = [n(4), n(5)];
      i += 6;
    }
  }
  return { start, segs };
}

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

const { start: P0, segs: SEG } = parse(MARK);

/** The mark's box in the logo's units (its outline's extremes, curves
    included), so its place can be worked out from the svg's box alone */
export const MARK_BOUNDS = (() => {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let p = P0;
  for (const [c1, c2, e] of SEG) {
    for (let k = 0; k <= 32; k++) {
      const t = k / 32;
      const a = (1 - t) ** 3;
      const b = 3 * (1 - t) ** 2 * t;
      const c = 3 * (1 - t) * t * t;
      const d = t ** 3;
      const x = a * p[0] + b * c1[0] + c * c2[0] + d * e[0];
      const y = a * p[1] + b * c1[1] + c * c2[1] + d * e[1];
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    p = e;
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
})();
/** The anchor segment k ends on (k = 0: the start) */
const anchor = (k: number): Pt => (k === 0 ? P0 : SEG[k - 1][2]);
/** Segments a..b inclusive, 1-based as in the outline (segment k ends on P[k]) */
const run = (a: number, b: number) => SEG.slice(a - 1, b);

/* The cuts, by anchor: the near wing runs from P70 (where the head meets the
   wing's leading edge) round its tip to P13 (the root of its trailing edge,
   above the notch between the wings); the far wing from P14 (the other side
   of the notch) round its tip to P36 (where its lower edge becomes the belly). */
const NEAR = { from: 70, to: 13 };
const FAR = { from: 14, to: 36 };

type Hinge = {
  a: Pt;
  b: Pt;
  u: Pt; // along the hinge, a to b
  n: Pt; // across it, towards the wing
  reach: number; // the wing's farthest point from the hinge
};

function hinge(a: Pt, b: Pt, toward: Pt): Hinge {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const u: Pt = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  let n: Pt = [-u[1], u[0]];
  if ((toward[0] - a[0]) * n[0] + (toward[1] - a[1]) * n[1] < 0) n = [-n[0], -n[1]];
  return { a, b, u, n, reach: 0 };
}

/** A curve from a to b bowed by `bow` towards side n (bow < 0: the other way) */
const bowed = (a: Pt, b: Pt, n: Pt, bow: number): Cubic => {
  const k = bow / 0.75; // a cubic's two equal offsets bow it by three quarters of them
  return [
    [a[0] + (b[0] - a[0]) / 3 + n[0] * k, a[1] + (b[1] - a[1]) / 3 + n[1] * k],
    [a[0] + (2 * (b[0] - a[0])) / 3 + n[0] * k, a[1] + (2 * (b[1] - a[1])) / 3 + n[1] * k],
    b,
  ];
};

const nearSegs = [...run(NEAR.from + 1, SEG.length), ...run(1, NEAR.to)];
const farSegs = run(FAR.from + 1, FAR.to);
const NH = hinge(anchor(NEAR.from), anchor(NEAR.to), anchor(2)); // towards its tip (top)
const FH = hinge(anchor(FAR.from), anchor(FAR.to), anchor(28)); // towards its tip (right)

const across = (h: Hinge, p: Pt) => (p[0] - h.a[0]) * h.n[0] + (p[1] - h.a[1]) * h.n[1];
for (const [h, segs] of [[NH, nearSegs], [FH, farSegs]] as const) {
  h.reach = Math.max(...segs.flatMap((s) => s.map((p) => across(h, p))));
}

/* The overlaps along the cuts: how far each wing reaches under the body, and
   the body into each wing (its shoulder, which shows as a wing folds). */
const NEAR_UNDER = 24;
const NEAR_SHOULDER = 22;
const FAR_UNDER = 6;
const FAR_SHOULDER = 10;

/** The three pieces at rest: closed outlines, each starting at its first anchor */
const PIECES = {
  body: {
    start: anchor(NEAR.to),
    segs: [
      ...run(NEAR.to + 1, FAR.from), // the notch between the wings
      bowed(anchor(FAR.from), anchor(FAR.to), FH.n, FAR_SHOULDER),
      ...run(FAR.to + 1, NEAR.from), // the belly, the tail, the back
      bowed(anchor(NEAR.from), anchor(NEAR.to), NH.n, NEAR_SHOULDER),
    ],
  },
  near: { start: anchor(NEAR.from), segs: [...nearSegs, bowed(anchor(NEAR.to), anchor(NEAR.from), NH.n, -NEAR_UNDER)] },
  far: { start: anchor(FAR.from), segs: [...farSegs, bowed(anchor(FAR.to), anchor(FAR.from), FH.n, -FAR_UNDER)] },
};

/* ---- the pose ------------------------------------------------------- */

/** The bird's middle: the centre of its turns, tilts and perspective */
export const MARK_CENTRE: Pt = [874, 400];
/** Camera distance for the perspective, in logo units */
const LENS = 2600;
/** Which way the bird points at rest (radians, screen axes: y down): its
    body's line, from the tip of the tail to the tip of the beak */
export const BODY_ANGLE = (() => {
  const beak = anchor(28);
  const tail = anchor(60);
  return Math.atan2(beak[1] - tail[1], beak[0] - tail[0]);
})();

export type FlightOptions = {
  /** How far a wing turns at the bottom of the beat, in degrees (180 = folded flat below its hinge) */
  depth?: number;
  /** How far the tip trails the root, as a fraction of a beat */
  trail?: number;
  /** How much the body lifts on a downstroke, in logo units */
  lift?: number;
  /** How far a wing also swings round in the picture as it goes down, in degrees */
  sweep?: number;
  /** How much of the fold is a rounded roll next to the hinge, as a share of
      the wing's reach (0 = a sharp crease) */
  roll?: number;
  /** The head's share of the beat (1 = it beats like the far wing; less
      holds it steadier, leading the way) */
  head?: number;
  /** The turn about the upright axis, in degrees (180: facing left). As a
      turn under way, { from, to, t } (t 0..1): the head goes first and the
      rest follows it, down to the tail. */
  turn?: number | Turn;
  /** The tilt in the picture, in degrees, clockwise. As a tilt under way,
      { from, to, t } (t 0..1): the head goes first and the rest follows it,
      down to the tail, so the bird curves into its new line rather than
      turning stiff, like a board. */
  heading?: number | Turn;
  /** The line the turn is about, as a direction in the picture (degrees,
      after the tilt): the line of flight, so a turn is a roll along it.
      Left out, the turn is about the bird's own upright axis, before the
      tilt (it turns round to face the other way). */
  axis?: number;
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
/** One beat, phase 0..1: from up (0) down to 1 in the first 44% (the
    downstroke, quicker), then back up. Smooth at both turns. */
const beat = (phase: number) => {
  const p = phase - Math.floor(phase);
  return p < 0.44 ? smooth(p / 0.44) : 1 - smooth((p - 0.44) / 0.56);
};

type P3 = [number, number, number];
export type Turn = { from: number; to: number; t: number };

/* For the turn. The neck: from the middle of the head's hinge to the tip of
   the beak; the head turns about an upright axis through the neck's base.
   The spine: from the neck's base (0) to the tip of the tail (1); the body
   comes round in a wave along it. */
const BEAK = anchor(28);
const TAIL = anchor(60);
const NECK: Pt = [(FH.a[0] + FH.b[0]) / 2, (FH.a[1] + FH.b[1]) / 2];
const along = (from: Pt, to: Pt) => {
  const v: Pt = [to[0] - from[0], to[1] - from[1]];
  const v2 = v[0] * v[0] + v[1] * v[1];
  return (p: Pt) => Math.min(1, Math.max(0, ((p[0] - from[0]) * v[0] + (p[1] - from[1]) * v[1]) / v2));
};
const upNeck = along(NECK, BEAK);
const downSpine = along(NECK, TAIL);
/** How much of the head's own turn a point takes: none at the neck's base,
    all of it a third of the way up */
const headShare = (p: Pt) => smooth(upNeck(p) / 0.34);
/** How far the head turns ahead of the body, as a share of the turn still to come */
const HEAD_LEAD = 0.62;
/** For a tilt under way: from the tip of the beak (0) to the tip of the tail (1) */
const beakToTail = along(BEAK, TAIL);
/** How far behind the beak the tail comes round, as a share of the tilt */
const TILT_WAVE = 0.7;

/** The pose `beats` beats in (any real number), at `amp` of full depth
    (amp 0, turn 0, heading 0: the mark at rest, exactly). */
export function flightPose(
  beats: number,
  amp = 1,
  { depth = 118, trail = 0.05, lift = 40, sweep = 30, roll = 0.42, head = 1, turn = 0, heading = 0, axis }: FlightOptions = {},
) {
  const rad = (depth * Math.PI) / 180;
  const swing = (sweep * Math.PI) / 180;
  const [cx, cy] = MARK_CENTRE;

  const turning = typeof turn === "number" ? null : turn;
  const still = typeof turn === "number" ? turn === 0 : turn.from === 0 && turn.to === 0;
  const tilting = typeof heading === "number" ? null : heading;
  const level = typeof heading === "number" ? heading === 0 : heading.from === 0 && heading.to === 0;
  if (amp === 0 && still && level) {
    const id = (p: Pt) => p;
    return { body: draw(PIECES.body, id), near: draw(PIECES.near, id), far: draw(PIECES.far, id) };
  }

  // the body rises through the downstroke and settles through the upstroke,
  // and pitches a touch with it
  const rise = -lift * amp * beat(beats - 0.12);
  const pitch = ((2.2 * Math.PI) / 180) * amp * Math.sin(2 * Math.PI * (beats - 0.05));
  const pc = Math.cos(pitch);
  const ps = Math.sin(pitch);

  // the turn: one angle for the whole bird, or under way, head first. The
  // head swings round on its neck towards you (it would vanish into the wing
  // if it went right round on its own: HEAD_LEAD of what the body has still
  // to turn, at most); the body follows from 12%, the neck first and the tail
  // last, carrying the head, all square by the end, the head straight on its
  // neck again.
  const deg = Math.PI / 180;
  const bodyAt = (k: number) => {
    if (!turning) return (turn as number) * deg;
    return (turning.from + (turning.to - turning.from) * smooth((turning.t - 0.12 - 0.25 * k) / 0.6)) * deg;
  };
  const headTurn = turning ? HEAD_LEAD * (turning.to - turning.from) * (smooth(turning.t / 0.4) - smooth((turning.t - 0.12) / 0.6)) * deg : 0;
  // the tilt in the picture: one angle, or under way, head first (the beak
  // starts it, the tail ends it, all square by the end)
  const tiltAt = (k: number) => {
    if (!tilting) return (heading as number) * deg;
    return (tilting.from + (tilting.to - tilting.from) * smooth(tilting.t * (1 + TILT_WAVE) - TILT_WAVE * k)) * deg;
  };
  const tiltOf = (rest: Pt) => tiltAt(beakToTail(rest));
  const hd = tilting ? 1 : tiltAt(0); // non-zero if there is any tilt to do
  // a roll along the line of flight: about a line in the picture through
  // the point o, direction u, by angle a (n: across it, in the picture)
  const ux = axis === undefined ? 0 : Math.cos(axis * deg);
  const uy = axis === undefined ? 0 : Math.sin(axis * deg);
  const rollAbout = (o: Pt, a: number, p: P3): P3 => {
    const dx = p[0] - o[0];
    const dy = p[1] - o[1];
    const on = dx * ux + dy * uy;
    const across = -dx * uy + dy * ux;
    const across2 = across * Math.cos(a) - p[2] * Math.sin(a);
    return [o[0] + on * ux - across2 * uy, o[1] + on * uy + across2 * ux, across * Math.sin(a) + p[2] * Math.cos(a)];
  };
  const tilt = (x: number, y: number, a: number): Pt => {
    const c = Math.cos(a);
    const n = Math.sin(a);
    return [cx + (x - cx) * c - (y - cy) * n, cy + (x - cx) * n + (y - cy) * c];
  };

  /** a point of the bird in its own 3D space (z towards you), on screen;
      rest is where the point sits in the mark, for the turn; neck: whether
      it is on the head (which turns on its neck) */
  const show = ([x0, y0, z0]: P3, rest: Pt, neck = false): Pt => {
    // the body's lift and pitch
    let x = cx + (x0 - cx) * pc - (y0 - cy) * ps;
    let y = cy + (x0 - cx) * ps + (y0 - cy) * pc + rise;
    let z = z0;
    if (axis !== undefined) {
      // on a path: tilted onto the line of flight, then rolled along it, the
      // head (on its neck) first and the body after it
      [x, y] = tilt(x, y, tiltOf(rest));
      let p: P3 = [x, y, z];
      const h = neck && headTurn !== 0 ? headTurn * headShare(rest) : 0;
      if (h !== 0) {
        const [nx, ny] = tilt(cx + (NECK[0] - cx) * pc - (NECK[1] - cy) * ps, cy + (NECK[0] - cx) * ps + (NECK[1] - cy) * pc + rise, tiltOf(NECK));
        p = rollAbout([nx, ny], h, p);
      }
      const a = bodyAt(downSpine(rest));
      if (a !== 0) p = rollAbout([cx, cy], a, p);
      const k = LENS / (LENS - p[2]);
      return [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k];
    }
    // the head's own turn, on its neck
    const h = neck && headTurn !== 0 ? headTurn * headShare(rest) : 0;
    if (h !== 0) {
      const bx = cx + (NECK[0] - cx) * pc - (NECK[1] - cy) * ps; // the neck's base, after the lift and pitch
      const dx = x - bx;
      x = bx + dx * Math.cos(h) - z * Math.sin(h);
      z = dx * Math.sin(h) + z * Math.cos(h);
    }
    // the body's turn, carrying the head
    const a = bodyAt(downSpine(rest));
    if (a !== 0) {
      const dx = x - cx;
      x = cx + dx * Math.cos(a) - z * Math.sin(a);
      z = dx * Math.sin(a) + z * Math.cos(a);
    }
    // the tilt
    if (hd !== 0) [x, y] = tilt(x, y, tiltOf(rest));
    const k = LENS / (LENS - z);
    return [cx + (x - cx) * k, cy + (y - cy) * k];
  };

  // a wing point: rolled over about its hinge by an angle that trails further
  // behind the beat the farther it is from the hinge. The roll is a curve, not
  // a crease: over a band next to the hinge the wing bends round an arc, and
  // beyond it carries on straight. It swings round in the picture as it goes
  // down (more towards the tip, so the root stays put). towards = +1: it comes
  // towards you as it goes down; side = +1: it swings clockwise; share: how
  // much of the beat it takes.
  const wing = (h: Hinge, towards: number, side: number, share: number, neck = false) => {
    const mx = (h.a[0] + h.b[0]) / 2;
    const my = (h.a[1] + h.b[1]) / 2;
    const band = roll * h.reach;
    return (p: Pt): Pt => {
      const d = across(h, p);
      if (d <= 0 || amp * share === 0) return show([p[0], p[1], 0], p, neck && d > 0);
      const w = d / h.reach;
      const down = amp * share * beat(beats - trail * w * w);
      const phi = rad * down;
      // distance out along the wing (d) to across the hinge (flat) and depth
      let flat = d;
      let deep = 0;
      if (phi > 1e-6 && band > 0) {
        const r = band / phi; // the roll's radius
        const t = Math.min(d, band) / r; // how far round the roll this point is
        flat = r * Math.sin(t);
        deep = r * (1 - Math.cos(t));
        if (d > band) {
          flat += (d - band) * Math.cos(phi);
          deep += (d - band) * Math.sin(phi);
        }
      } else if (phi > 1e-6) {
        flat = d * Math.cos(phi);
        deep = d * Math.sin(phi);
      }
      const along: Pt = [p[0] - h.n[0] * d, p[1] - h.n[1] * d]; // its foot on the hinge
      const fx = along[0] + h.n[0] * flat - mx;
      const fy = along[1] + h.n[1] * flat - my;
      const a = side * swing * down * w;
      return show([mx + fx * Math.cos(a) - fy * Math.sin(a), my + fx * Math.sin(a) + fy * Math.cos(a), towards * deep], p, neck);
    };
  };

  return {
    body: draw(PIECES.body, (p) => show([p[0], p[1], 0], p)),
    near: draw(PIECES.near, wing(NH, 1, 1, 1)),
    far: draw(PIECES.far, wing(FH, -1, -1, head, true)),
  };
}

/* ---- a journey along a drawn path -------------------------------------- */

/** Where the mark is: a translation (px) and scale of its svg, with the
    transform origin at the svg's top left */
export type Place = { x: number; y: number; scale: number };

/**
 * A point the path passes through (a smooth curve runs through them all).
 * space "screen": x and y as shares of the frame it flies in; "from" or
 * "to": offsets from the mark's middle where it starts or lands, in widths of
 * the mark there. ox: a further offset across, in mark widths (to start
 * beyond an edge).
 */
export type Waypoint = { space: "screen" | "from" | "to"; x: number; y: number; ox?: number };

/** The loading screen's entrance (drawn by Jose): in from the right edge, high
    along the top, then down in a loop round its place, curling back up into
    it from the lower left. Lands facing right, as the mark. */
export const ENTER_PATH: Waypoint[] = [
  { space: "screen", x: 1, y: 0.22, ox: 0.9 },
  { space: "screen", x: 0.93, y: 0.27 },
  { space: "screen", x: 0.84, y: 0.24 },
  { space: "screen", x: 0.72, y: 0.16 },
  { space: "screen", x: 0.6, y: 0.125 },
  { space: "to", x: 0.3, y: -1.9 },
  { space: "to", x: -0.6, y: -1.45 },
  { space: "to", x: -1.0, y: -0.45 },
  { space: "to", x: -0.75, y: 0.32 },
  { space: "to", x: -0.42, y: 0.12 },
];

/** Its way out to the logo (drawn by Jose): it lifts and curls left over its
    place, swoops down through the middle of the screen, rises to the top
    left and hooks round onto the logo, facing right. */
export const EXIT_PATH: Waypoint[] = [
  { space: "from", x: 0.3, y: -0.35 },
  { space: "from", x: -0.1, y: -0.52 },
  { space: "from", x: -0.65, y: -0.42 },
  { space: "screen", x: 0.39, y: 0.345 },
  { space: "screen", x: 0.29, y: 0.42 },
  { space: "screen", x: 0.2, y: 0.37 },
  { space: "screen", x: 0.12, y: 0.255 },
  { space: "screen", x: 0.055, y: 0.15 },
  { space: "to", x: -0.7, y: 1.4 },
  { space: "to", x: -0.78, y: 0.45 },
  { space: "to", x: -0.5, y: 0.06 },
];

/** The footer's way in: from beyond the left edge, high, gliding down in
    one arc onto its place in the lockup. It flies right all the way, the way
    it faces at rest, so it never has to turn round. */
export const FOOTER_IN: Waypoint[] = [
  { space: "screen", x: 0, y: 0.16, ox: -0.9 },
  { space: "screen", x: 0.26, y: 0.1 },
  { space: "to", x: -1.1, y: -1.05 },
];

/** The footer's way out: it lifts off its place and away in one arc beyond
    the right edge, still facing the way it flies (the end, off the screen,
    is the route's `to`). */
export const FOOTER_OUT: Waypoint[] = [
  { space: "from", x: 0.35, y: -0.75 },
  { space: "screen", x: 0.7, y: 0.12 },
];

export type RouteOptions = {
  /** where it starts and lands (from may be replaced by a start waypoint) */
  from: Place;
  to: Place;
  /** the svg's own top left on screen, untransformed */
  origin: Pt;
  /** the mark's middle inside the svg, px at scale 1 */
  centre: Pt;
  /** the mark's width, px at scale 1 */
  width: number;
  /** the frame screen waypoints are shares of */
  frame: { left: number; top: number; width: number; height: number };
  /** the points between; and a waypoint to start from instead of `from` */
  via: Waypoint[];
  start?: Waypoint;
  /** seconds from start to touching down */
  duration: number;
  /** "out": already flying as it starts (an entrance) and slowing in; "in-out": from rest to rest;
      "land": flying in at full speed, a short flare at the end; "launch": slow off the ground, building */
  ease?: "out" | "in-out" | "land" | "launch";
  /** which way it faces at the start: 0 right (the mark), 180 left */
  facing?: number;
  /** wingbeats per second */
  rate?: number;
  /** seconds per turn, and how long the last one may run on after touching down */
  turnS?: number;
  settle?: number;
};

const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const outEase = (x: number) => 1 - Math.pow(1 - x, 3);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * A flight along a path. The path is a smooth curve (centripetal
 * Catmull-Rom) through the start, the waypoints and the landing; the bird
 * keeps to it at an eased speed, pointing along it all the way. Wherever the
 * path turns back on itself it rolls over along its line of flight, head
 * first, starting just before, so it stays the right way up; its wings beat. It touches down exactly on `to`, at
 * rest and facing right (a last turn, if needed, lands with it). at(seconds)
 * gives the place and the pose.
 */
export function flightRoute(o: RouteOptions) {
  const { from, to, origin, centre, width, frame, via, duration, ease = "in-out", facing = 0, rate = 2.6, turnS = 0.6, settle = 0.14 } = o;
  const c0: Pt = [origin[0] + from.x + from.scale * centre[0], origin[1] + from.y + from.scale * centre[1]];
  const c1: Pt = [origin[0] + to.x + to.scale * centre[0], origin[1] + to.y + to.scale * centre[1]];
  const resolve = (w: Waypoint): Pt => {
    const ox = (w.ox ?? 0) * width * from.scale;
    if (w.space === "screen") return [frame.left + w.x * frame.width + ox, frame.top + w.y * frame.height];
    const [c, s] = w.space === "from" ? [c0, from.scale] : [c1, to.scale];
    return [c[0] + w.x * width * s + ox, c[1] + w.y * width * s];
  };
  const pts: Pt[] = [o.start ? resolve(o.start) : c0, ...via.map(resolve), c1];

  // the curve, sampled, measured along its length
  const line: Pt[] = [];
  const ext = (a: Pt, b: Pt): Pt => [2 * a[0] - b[0], 2 * a[1] - b[1]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? ext(pts[0], pts[1]);
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? ext(pts[pts.length - 1], pts[pts.length - 2]);
    const tj = (a: Pt, b: Pt) => Math.max(1e-3, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
    const t1 = tj(p0, p1);
    const t2 = t1 + tj(p1, p2);
    const t3 = t2 + tj(p2, p3);
    for (let k = 0; k < 48; k++) {
      const t = t1 + ((t2 - t1) * k) / 48;
      const mix = (a: Pt, b: Pt, ta: number, tb: number): Pt => [((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta), ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta)];
      const a1 = mix(p0, p1, 0, t1);
      const a2 = mix(p1, p2, t1, t2);
      const a3 = mix(p2, p3, t2, t3);
      line.push(mix(mix(a1, a2, 0, t2), mix(a2, a3, t1, t3), t1, t2));
    }
  }
  line.push(c1);
  const len = [0];
  for (let i = 1; i < line.length; i++) len.push(len[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  const total = len[len.length - 1] || 1;
  const pointAt = (s: number): Pt => {
    const d = clamp01(s) * total;
    let lo = 0;
    let hi = len.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (len[mid] < d) lo = mid;
      else hi = mid;
    }
    const k = (d - len[lo]) / (len[hi] - len[lo] || 1);
    return [line[lo][0] + (line[hi][0] - line[lo][0]) * k, line[lo][1] + (line[hi][1] - line[lo][1]) * k];
  };
  const wayAt = (s: number) => {
    const a = pointAt(Math.min(1, s + 0.004));
    const b = pointAt(Math.max(0, s - 0.004));
    return Math.atan2(a[1] - b[1], a[0] - b[0]);
  };
  // land: already flying, at full speed until the last fifth, then a short
  // flare down to a soft touchdown; launch: from rest, slow off the ground,
  // building to full speed. Both from a speed profile, integrated.
  const profile = ease === "land" ? (u: number) => 1 - 0.88 * smooth((u - 0.8) / 0.2) : ease === "launch" ? (u: number) => 0.22 + 0.78 * smooth(u / 0.42) : null;
  const table: number[] = [];
  if (profile) {
    let sum = 0;
    for (let i = 0; i <= 400; i++) {
      table.push(sum);
      sum += profile((i + 0.5) / 400);
    }
    for (let i = 0; i < table.length; i++) table[i] /= table[400];
  }
  const fromTable = (u: number) => {
    const x = clamp01(u) * 400;
    const i = Math.min(399, Math.floor(x));
    return table[i] + (table[i + 1] - table[i]) * (x - i);
  };
  const inFlight = ease === "out" || ease === "land"; // already flying as it starts
  const progress = (u: number) => (profile ? fromTable(u) : ease === "out" ? outEase(u) : inOut(u));

  // the turns: wherever the way across flips (with some give, so a wobble
  // does not set one off), starting a little before; the last must leave it
  // facing right by the time it has settled
  const turns: { start: number; from: number; to: number }[] = [];
  let face = facing;
  for (let i = 1; i <= 400; i++) {
    const time = (duration * i) / 400;
    const across = Math.cos(wayAt(progress(time / duration)));
    const want = across < -0.3 ? 180 : across > 0.3 ? 0 : face;
    if (want !== face) {
      const prev = turns[turns.length - 1];
      turns.push({ start: Math.max(time - 0.12, prev ? prev.start + turnS : 0), from: face, to: want });
      face = want;
    }
  }
  if (face !== 0) turns.push({ start: duration + settle - turnS, from: face, to: 0 });
  const last = turns[turns.length - 1];
  if (last && last.to === 0) last.start = Math.min(last.start, duration + settle - turnS);
  const end = Math.max(duration, last ? last.start + turnS : 0);

  return {
    total: end,
    at(time: number) {
      const u = clamp01(time / duration);
      const s = progress(u);
      const c = pointAt(s);
      const scale = from.scale + (to.scale - from.scale) * s;
      let turn: number | Turn = facing;
      for (const t of turns) {
        if (time < t.start) break;
        turn = { from: t.from, to: t.to, t: clamp01((time - t.start) / turnS) };
      }
      // it points along its way: its body on the line it is flying (eased in
      // from rest as it takes off, and back to rest as it settles); where the
      // way bends back it rolls along that line (the turns above), so it
      // stays the right way up
      const way = wayAt(Math.min(s, 0.985));
      // taking off it comes onto its line head first, and settling it comes
      // off it head first: the head finds the new angle and the body follows
      const line = (wrap(way - BODY_ANGLE) * 180) / Math.PI;
      const heading: number | Turn =
        !inFlight && u < 0.12 ? { from: 0, to: line, t: u / 0.12 } : u > 0.84 ? (u >= 1 ? 0 : { from: line, to: 0, t: (u - 0.84) / 0.16 }) : line;
      // the wings: beating from the start (or growing from rest), still before it touches down
      // (landing, they beat on through the flare and fold as it touches down)
      const amp = (inFlight ? 1 : smooth(u / 0.12)) * (1 - (ease === "land" ? smooth((u - 0.86) / 0.14) : smooth((u - 0.72) / 0.26)));
      const pose = flightPose(time * rate, amp, { turn, heading, axis: (way * 180) / Math.PI, head: 0.45 });
      return { x: c[0] - origin[0] - scale * centre[0], y: c[1] - origin[1] - scale * centre[1], scale, pose, done: time >= end };
    },
  };
}

const f = (v: number) => Math.round(v * 1000) / 1000;
function draw(piece: { start: Pt; segs: Cubic[] }, map: (p: Pt) => Pt) {
  const s = map(piece.start);
  let d = `M${f(s[0])} ${f(s[1])}`;
  for (const c of piece.segs) {
    const [a, b, e] = c.map(map);
    d += `C${f(a[0])} ${f(a[1])} ${f(b[0])} ${f(b[1])} ${f(e[0])} ${f(e[1])}`;
  }
  return d + "Z";
}
