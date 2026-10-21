/* What you can make: the placeholder images. Jose's real ones will be, per
   girl, one background and one cutout per outfit (transparent, on the same
   canvas as the background). These stand in for the cutouts: each body
   drawn from her own measures, the outfit cut to it, rendered to a
   transparent image on a 2:3 canvas, so the swap works on them exactly as it
   will on the photographs. */

export type Body = { id: string; name: string; h: number; m: [number, number, number] };
export const BODIES: Body[] = [
  { id: "mei", name: "Mei", h: 152, m: [82, 64, 88] },
  { id: "natalia", name: "Natalia", h: 168, m: [92, 74, 98] },
  { id: "amara", name: "Amara", h: 170, m: [112, 96, 118] },
  { id: "ines", name: "Ines", h: 182, m: [86, 70, 94] },
];

export type OutfitKey = "gown" | "slip" | "wrap" | "puffer";
export const OUTFITS: { k: OutfitKey; name: string; short: string; icon: string }[] = [
  { k: "gown", name: "Halter gown", short: "Gown", icon: "M10 3h4l2 6-1 1 4 11H5l4-11-1-1z" },
  { k: "slip", name: "Slip dress", short: "Slip", icon: "M9 3l-1 5 1 1-2 12h10L15 9l1-1-1-5" },
  { k: "wrap", name: "Wrap top, wide-leg trousers", short: "Wrap", icon: "M7 4l5 3 5-3 1 6H6zM8 11h8l1 10h-4l-1-6-1 6H7z" },
  { k: "puffer", name: "Cropped puffer, A-line skirt", short: "Puffer", icon: "M6 4h12l1 7H5zM8 12h8l3 9H5z" },
];

/** placeholder backgrounds: a dark room, each its own tone (the light from above is in code, Swap and wy.css) */
export const BACKDROPS = [
  "radial-gradient(70% 30% at 50% 96%, rgb(104 126 245 / 0.16), transparent 70%), linear-gradient(180deg, #161a2b, #0b0c15)",
  "radial-gradient(70% 30% at 50% 96%, rgb(72 95 136 / 0.22), transparent 70%), linear-gradient(180deg, #121627, #0b0c15)",
  "radial-gradient(70% 30% at 50% 96%, rgb(104 126 245 / 0.2), transparent 70%), linear-gradient(180deg, #181b2e, #0b0c15)",
  "radial-gradient(70% 30% at 50% 96%, rgb(56 76 101 / 0.24), transparent 70%), linear-gradient(180deg, #131628, #0b0c15)",
];

/* ---- the figure, drawn from the body ------------------------------------ */
const GROUND = 232;
// the canvas: 2:3, the figure standing in it with room under her feet for the label
export const VIEW = { x: -36, y: -8, w: 172, h: 258 };
function geo(b: Body) {
  const fh = 214 * (b.h / 182);
  const y0 = GROUND - fh;
  const y = (f: number) => +(y0 + f * fh).toFixed(2);
  const k = 0.15;
  const [bu, wa, hi] = b.m;
  const B = bu * k;
  return { fh, y, B, W: wa * k, H: hi * k, S: B * 1.02, N: fh * 0.02, c: 50 };
}
type G = ReturnType<typeof geo>;
const f = (n: number) => n.toFixed(2);
const mirror = (g: G, pts: [number, number][]) => {
  const L = pts.map(([dx, yy]) => `${f(g.c - dx)} ${f(yy)}`);
  const R = [...pts].reverse().map(([dx, yy]) => `${f(g.c + dx)} ${f(yy)}`);
  return `M${[...L, ...R].join(" L")} Z`;
};

const SKIN = "#1d2236";
const RIM = "rgb(157 172 205 / 0.28)";
const WEAR: Record<string, string> = { gown: "#687ef5", slip: "#c0c8db", top: "#eff4ff", trousers: "#485f88", puffer: "#9daccd", skirt: "#384c65" };
const SEAM = 'fill="none" stroke="rgb(11 12 21 / 0.28)" stroke-width="0.45" stroke-dasharray="1.4 1.1"';

function bodySvg(g: G) {
  const { y, B, W, H, S, N, c } = g;
  const torso = `M${f(c - N)} ${y(0.165)} L${f(c - S)} ${y(0.19)} Q${f(c - B - 1)} ${y(0.24)} ${f(c - B)} ${y(0.28)} Q${f(c - W - 1)} ${y(0.34)} ${f(c - W)} ${y(0.385)} Q${f(c - H)} ${y(0.43)} ${f(c - H)} ${y(0.5)} L${f(c - H * 0.9)} ${y(0.57)} L${f(c - H * 0.55)} ${y(0.76)} L${f(c - H * 0.36)} ${y(0.965)} L${f(c - H * 0.12)} ${y(0.965)} L${f(c - 1.1)} ${y(0.6)} L${f(c + 1.1)} ${y(0.6)} L${f(c + H * 0.12)} ${y(0.965)} L${f(c + H * 0.36)} ${y(0.965)} L${f(c + H * 0.55)} ${y(0.76)} L${f(c + H * 0.9)} ${y(0.57)} L${f(c + H)} ${y(0.5)} Q${f(c + H)} ${y(0.43)} ${f(c + W)} ${y(0.385)} Q${f(c + W + 1)} ${y(0.34)} ${f(c + B)} ${y(0.28)} Q${f(c + B + 1)} ${y(0.24)} ${f(c + S)} ${y(0.19)} L${f(c + N)} ${y(0.165)} Z`;
  const arm = (s: 1 | -1) => `M${f(c + s * S * 0.94)} ${y(0.2)} Q${f(c + s * (H + 3.2))} ${y(0.33)} ${f(c + s * (H + 2.2))} ${y(0.5)}`;
  const skin = `fill="${SKIN}" stroke="${RIM}" stroke-width="0.4"`;
  return [
    `<path d="${arm(-1)}" fill="none" stroke="${SKIN}" stroke-linecap="round" stroke-width="${f(g.fh * 0.032)}"/>`,
    `<path d="${arm(1)}" fill="none" stroke="${SKIN}" stroke-linecap="round" stroke-width="${f(g.fh * 0.032)}"/>`,
    `<path d="M${f(c - N)} ${y(0.115)} H${f(c + N)} V${y(0.175)} H${f(c - N)} Z" ${skin}/>`,
    `<path d="${torso}" ${skin}/>`,
    `<ellipse cx="${c}" cy="${y(0.065)}" rx="${f(g.fh * 0.046)}" ry="${f(g.fh * 0.062)}" ${skin}/>`,
  ].join("");
}
function outfitSvg(k: OutfitKey, g: G) {
  const { y, B, W, H, S, N, c } = g;
  const fill = (col: string) => `fill="${col}" stroke="rgb(11 12 21 / 0.35)" stroke-width="0.35" stroke-linejoin="round"`;
  const sleeve = (s: 1 | -1, to: number, col: string, w: number) =>
    `<path d="M${f(c + s * S * 0.94)} ${y(0.2)} Q${f(c + s * (H + 3.4))} ${y(0.31)} ${f(c + s * (H + 2.7))} ${y(to)}" fill="none" stroke="${col}" stroke-linecap="round" stroke-width="${f(g.fh * w)}"/>`;
  switch (k) {
    case "gown":
      return `<path d="M${f(c - 1.5)} ${y(0.165)} L${f(c - B * 0.92)} ${y(0.25)} Q${f(c - B - 0.6)} ${y(0.3)} ${f(c - W - 0.4)} ${y(0.385)} Q${f(c - H - 1)} ${y(0.5)} ${f(c - H * 1.9)} ${y(0.985)} Q${f(c)} ${y(1.005)} ${f(c + H * 1.9)} ${y(0.985)} Q${f(c + H + 1)} ${y(0.5)} ${f(c + W + 0.4)} ${y(0.385)} Q${f(c + B + 0.6)} ${y(0.3)} ${f(c + B * 0.92)} ${y(0.25)} L${f(c + 1.5)} ${y(0.165)} Z" ${fill(WEAR.gown)}/><path d="M${f(c - W)} ${y(0.385)} Q${f(c)} ${y(0.4)} ${f(c + W)} ${y(0.385)}" ${SEAM}/>`;
    case "slip":
      return `<path d="M${f(c - B * 0.78)} ${y(0.235)} L${f(c + B * 0.78)} ${y(0.235)} L${f(c + B + 0.4)} ${y(0.285)} Q${f(c + W + 0.7)} ${y(0.34)} ${f(c + W + 0.6)} ${y(0.385)} Q${f(c + H + 0.9)} ${y(0.47)} ${f(c + H * 1.28)} ${y(0.79)} Q${f(c)} ${y(0.805)} ${f(c - H * 1.28)} ${y(0.79)} Q${f(c - H - 0.9)} ${y(0.47)} ${f(c - W - 0.6)} ${y(0.385)} Q${f(c - W - 0.7)} ${y(0.34)} ${f(c - B - 0.4)} ${y(0.285)} Z" ${fill(WEAR.slip)}/><path d="M${f(c - B * 0.7)} ${y(0.24)} L${f(c - S * 0.62)} ${y(0.185)} M${f(c + B * 0.7)} ${y(0.24)} L${f(c + S * 0.62)} ${y(0.185)}" fill="none" stroke="${WEAR.slip}" stroke-width="0.7"/>`;
    case "wrap":
      return [
        `<path d="M${f(c - W - 0.7)} ${y(0.385)} Q${f(c - H - 0.9)} ${y(0.45)} ${f(c - H - 0.9)} ${y(0.53)} L${f(c - H * 1.05)} ${y(0.975)} L${f(c - H * 0.08)} ${y(0.975)} L${f(c)} ${y(0.62)} L${f(c + H * 0.08)} ${y(0.975)} L${f(c + H * 1.05)} ${y(0.975)} L${f(c + H + 0.9)} ${y(0.53)} Q${f(c + H + 0.9)} ${y(0.45)} ${f(c + W + 0.7)} ${y(0.385)} Z" ${fill(WEAR.trousers)}/>`,
        sleeve(-1, 0.4, WEAR.top, 0.04),
        sleeve(1, 0.4, WEAR.top, 0.04),
        `<path d="M${f(c - N - 1)} ${y(0.168)} L${f(c - S - 1)} ${y(0.19)} Q${f(c - B - 1.6)} ${y(0.25)} ${f(c - B - 0.6)} ${y(0.29)} Q${f(c - W - 0.3)} ${y(0.35)} ${f(c - W - 0.9)} ${y(0.405)} L${f(c + W + 0.9)} ${y(0.405)} Q${f(c + W + 0.3)} ${y(0.35)} ${f(c + B + 0.6)} ${y(0.29)} Q${f(c + B + 1.6)} ${y(0.25)} ${f(c + S + 1)} ${y(0.19)} L${f(c + N + 1)} ${y(0.168)} L${f(c)} ${y(0.27)} Z" ${fill(WEAR.top)}/>`,
        `<path d="M${f(c - N - 0.5)} ${y(0.17)} L${f(c + W * 0.7)} ${y(0.4)}" ${SEAM}/>`,
      ].join("");
    case "puffer":
      return [
        `<path d="M${f(c - W - 0.6)} ${y(0.385)} L${f(c + W + 0.6)} ${y(0.385)} L${f(c + H * 1.6)} ${y(0.84)} Q${f(c)} ${y(0.86)} ${f(c - H * 1.6)} ${y(0.84)} Z" ${fill(WEAR.skirt)}/>`,
        sleeve(-1, 0.47, WEAR.puffer, 0.062),
        sleeve(1, 0.47, WEAR.puffer, 0.062),
        `<path d="${mirror(g, [[N + 2, y(0.152)], [S + 3.2, y(0.19)], [B + 3.6, y(0.27)], [B + 3, y(0.405)]])}" ${fill(WEAR.puffer)}/>`,
        `<path d="${[0.25, 0.31, 0.37].map((t) => `M${f(c - B - 3)} ${y(t)} Q${f(c)} ${y(t + 0.012)} ${f(c + B + 3)} ${y(t)}`).join(" ")}" ${SEAM}/>`,
      ].join("");
  }
}

/** the placeholder cutout for a body in an outfit: a transparent image (blob URL), made once */
const cache = new Map<string, string>();
export function cutout(b: Body, k: OutfitKey) {
  const key = `${b.id}-${k}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const g = geo(b);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}" width="${VIEW.w * 4}" height="${VIEW.h * 4}">${bodySvg(g)}${outfitSvg(k, g)}</svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  cache.set(key, url);
  return url;
}
