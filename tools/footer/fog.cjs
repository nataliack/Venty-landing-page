/* The fog that drifts over the hills in the footer: a soft, wispy band of
   mist, white, seamless left to right (so it can slide forever), written to
   public/footer/fog.webp. Fractal value noise, wrapped across the width,
   stretched sideways like mist lying in a valley, shaped into a band that
   fades out above and below.

     node tools/footer/fog.cjs [seed]                                        */
const sharp = require("sharp");
const path = require("path");

const W = 2048;
const H = 400;
let seed = +(process.argv[2] || 7);
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// value noise on a lattice that wraps across the width
function layer(cellsX, cellsY) {
  const g = Array.from({ length: (cellsY + 1) * cellsX }, rand);
  const at = (i, j) => g[j * cellsX + (((i % cellsX) + cellsX) % cellsX)];
  const s = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = (x / W) * cellsX;
    const fy = (y / H) * cellsY;
    const i = Math.floor(fx);
    const j = Math.min(cellsY - 1, Math.floor(fy));
    const tx = s(fx - i);
    const ty = s(fy - j);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * tx;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * tx;
    return a + (b - a) * ty;
  };
}
// wide, flat cells: mist lies in sheets
const octaves = [layer(5, 2), layer(11, 4), layer(23, 6), layer(47, 10), layer(97, 18)];
const weights = [1, 0.55, 0.3, 0.16, 0.08];
const total = weights.reduce((a, b) => a + b, 0);

const out = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
  // the band: thickest a little below the middle, fading to nothing at the edges
  const v = y / (H - 1);
  const band = Math.exp(-Math.pow((v - 0.55) / 0.24, 2));
  for (let x = 0; x < W; x++) {
    let n = 0;
    for (let k = 0; k < octaves.length; k++) n += octaves[k](x, y) * weights[k];
    n /= total;
    // soft threshold: wisps, with clear sky between them
    const t = Math.min(1, Math.max(0, (n - 0.33) / 0.44));
    const a = Math.min(1, t * t * (3 - 2 * t) * band * 1.5);
    const p = (y * W + x) * 4;
    out[p] = 246;
    out[p + 1] = 248;
    out[p + 2] = 255;
    out[p + 3] = Math.round(a * 255);
  }
}
sharp(out, { raw: { width: W, height: H, channels: 4 } })
  .blur(10)
  .webp({ quality: 82, alphaQuality: 80, effort: 6 })
  .toFile(path.join(__dirname, "..", "..", "public", "footer", "fog.webp"))
  .then((i) => console.log("public/footer/fog.webp", i.width, "x", i.height, i.size, "bytes"));
