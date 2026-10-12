/* The Venty mark, in flight: the bird beats its wings.

   The mark is one closed outline. Here it is cut into three pieces that fill
   exactly the same shape when the wings are at rest: the body (head, beak,
   belly), the near wing (the big raised wing, top left) and the far wing
   (the long one, up to the right). Each cut is a straight hinge between two
   points of the outline; the wing piece reaches a little under the body and
   the body a little into the wing, so the pieces overlap along the cut and no
   hairline seam shows between them.

   A wing beats in 3D: it turns about its hinge, so the part away from the
   hinge folds through edge-on and down below it, coming towards you (the
   near wing) or going away (the far one), drawn with a little perspective.
   The tip trails the root, so the wing bends like feathers rather than
   turning like a card. The body lifts on each downstroke and settles on the
   upstroke.

   flightPose(0, ...) and any pose with amp 0 is the mark exactly. All
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
      ...run(FAR.to + 1, NEAR.from), // the belly, the beak, the head
      bowed(anchor(NEAR.from), anchor(NEAR.to), NH.n, NEAR_SHOULDER),
    ],
  },
  near: { start: anchor(NEAR.from), segs: [...nearSegs, bowed(anchor(NEAR.to), anchor(NEAR.from), NH.n, -NEAR_UNDER)] },
  far: { start: anchor(FAR.from), segs: [...farSegs, bowed(anchor(FAR.to), anchor(FAR.from), FH.n, -FAR_UNDER)] },
};

/* ---- the beat ------------------------------------------------------- */

/** The bird's middle, for the perspective and the body's sway */
export const MARK_CENTRE: Pt = [874, 400];
/** Camera distance for the perspective, in logo units */
const LENS = 2600;

export type FlightOptions = {
  /** How far a wing turns at the bottom of the beat, in degrees (180 = folded flat below its hinge) */
  depth?: number;
  /** How far the tip trails the root, as a fraction of a beat */
  trail?: number;
  /** How much the body lifts on a downstroke, in logo units */
  lift?: number;
  /** How far a wing also swings round in the picture as it goes down, in
      degrees: the near wing forward (towards the beak), the far one back */
  sweep?: number;
};

const smooth = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));
/** One beat, phase 0..1: from up (0) down to 1 in the first 44% (the
    downstroke, quicker), then back up. Smooth at both turns. */
const beat = (phase: number) => {
  const p = phase - Math.floor(phase);
  return p < 0.44 ? smooth(p / 0.44) : 1 - smooth((p - 0.44) / 0.56);
};

/** The pose `beats` beats in (any real number), at `amp` of full depth
    (0 = the mark at rest, exactly). */
export function flightPose(beats: number, amp = 1, { depth = 112, trail = 0.05, lift = 40, sweep = 30 }: FlightOptions = {}) {
  const rad = (depth * Math.PI) / 180;
  const swing = (sweep * Math.PI) / 180;
  // the body rises through the downstroke and settles through the upstroke,
  // and pitches a touch with it
  const rise = -lift * amp * beat(beats - 0.12);
  const pitch = ((2.2 * Math.PI) / 180) * amp * Math.sin(2 * Math.PI * (beats - 0.05));
  const cos = Math.cos(pitch);
  const sin = Math.sin(pitch);
  const [cx, cy] = MARK_CENTRE;
  const body = (p: Pt): Pt => {
    const x = p[0] - cx;
    const y = p[1] - cy;
    return [cx + x * cos - y * sin, cy + x * sin + y * cos + rise];
  };

  // a wing point: turned about its hinge in 3D by an angle that trails
  // further behind the beat the farther it is from the hinge, swung round
  // in the picture with it (more towards the tip, so the root stays put),
  // then seen in perspective (towards = +1: it comes towards you as it goes
  // down; turn = +1: it swings clockwise)
  const wing = (h: Hinge, towards: number, turn: number) => {
    const mx = (h.a[0] + h.b[0]) / 2;
    const my = (h.a[1] + h.b[1]) / 2;
    return (p: Pt): Pt => {
      const d = across(h, p);
      if (d <= 0 || amp === 0) return body(p);
      const w = d / h.reach;
      const down = amp * beat(beats - trail * w * w);
      const phi = rad * down;
      const along: Pt = [p[0] - h.n[0] * d, p[1] - h.n[1] * d]; // its foot on the hinge
      const flat = d * Math.cos(phi);
      const z = towards * d * Math.sin(phi);
      const fx = along[0] + h.n[0] * flat - mx;
      const fy = along[1] + h.n[1] * flat - my;
      const a = turn * swing * down * w;
      const x = mx + fx * Math.cos(a) - fy * Math.sin(a);
      const y = my + fx * Math.sin(a) + fy * Math.cos(a);
      const k = LENS / (LENS - z);
      return body([cx + (x - cx) * k, cy + (y - cy) * k]);
    };
  };

  return {
    body: draw(PIECES.body, body),
    near: draw(PIECES.near, wing(NH, 1, 1)),
    far: draw(PIECES.far, wing(FH, -1, -1)),
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
