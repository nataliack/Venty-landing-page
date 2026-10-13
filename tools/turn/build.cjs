/* The turn in See it on your body, from Jose's two clips: "front to back"
   (A) and "back to front" (B), joined into one 360° turn and encoded for
   the page (public/features/turn/, played by src/lib/sequence.ts).

     node tools/turn/build.cjs <front-to-back.mp4> <back-to-front.mp4>

   (the masters are in media/features/turn/).
   1. Colour: B is matched to A by per-channel histogram matching, learned on
      the frames where both clips show the same pose (A's last and B's first,
      the back; B's last and A's first, the front), applied to all of B.
   2. Pace: both clips start and end with long still holds and slow eases.
      Walking the joined clip (A, then B, looping back to A), a frame is kept
      once it has moved at least MIN since the last kept one: every frame
      where she turns is kept (none shown twice); the holds fold away.
   3. Joints: where A meets B (the back) and B meets A (the front, the loop),
      two blended frames bridge the switch.
   4. Web: each frame cropped to a 720 square on her, WebP 82, with a
      manifest (frame count, size, a version from the frames' bytes, and
      back: the frame where she shows her back, where the clips meet). */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const sharp = require("sharp");
const [clipA, clipB] = process.argv.slice(2);
if (!clipA || !clipB) throw new Error("usage: node tools/turn/build.cjs <front-to-back.mp4> <back-to-front.mp4>");
const S = path.join(__dirname, "build");
const W = 1280, H = 720;
const SIDE = 720; // the square cropped round her, in source px
const OUT = path.join(__dirname, "..", "..", "public", "features", "turn");
for (const [c, clip] of [["a", clipA], ["b", clipB]]) {
  fs.rmSync(path.join(S, c), { recursive: true, force: true });
  fs.mkdirSync(path.join(S, c), { recursive: true });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", clip, "-vf", "colorspace=all=bt709:iall=bt709:fast=1,format=rgb24", "-start_number", "0", path.join(S, c, "%04d.png")]);
}
const file = (c, i) => path.join(S, c, String(i).padStart(4, "0") + ".png");
const raw = (f) => sharp(f).removeAlpha().raw().toBuffer();

(async () => {
  // ---- 1. colour match B to A -------------------------------------------
  const hist = async (pairs) => {
    const h = [new Float64Array(256), new Float64Array(256), new Float64Array(256)];
    for (const f of pairs) {
      const d = await raw(f);
      for (let k = 0; k < d.length; k += 3) for (let c = 0; c < 3; c++) h[c][d[k + c]]++;
    }
    return h.map((x) => {
      const cdf = new Float64Array(256);
      let s = 0;
      const tot = x.reduce((a, b) => a + b, 0);
      for (let v = 0; v < 256; v++) cdf[v] = (s += x[v]) / tot;
      return cdf;
    });
  };
  const A = await hist([file("a", 120), file("a", 0)]);
  const B = await hist([file("b", 0), file("b", 120)]);
  const lut = [0, 1, 2].map((c) => {
    const m = new Float64Array(256);
    let j = 0;
    for (let v = 0; v < 256; v++) {
      while (j < 255 && A[c][j] < B[c][v]) j++;
      // between j-1 and j, by where the cdf falls
      const lo = j > 0 ? A[c][j - 1] : 0;
      const t = A[c][j] > lo ? (B[c][v] - lo) / (A[c][j] - lo) : 0;
      m[v] = j > 0 ? j - 1 + Math.min(1, Math.max(0, t)) : 0;
    }
    // smooth it a little and keep it rising, so no banding
    const s = new Float64Array(256);
    for (let v = 0; v < 256; v++) {
      let a = 0, n = 0;
      for (let d = -3; d <= 3; d++) if (v + d >= 0 && v + d < 256) (a += m[v + d]), n++;
      s[v] = a / n;
    }
    for (let v = 1; v < 256; v++) s[v] = Math.max(s[v], s[v - 1]);
    return s;
  });
  console.log("LUT samples (B -> A)", [16, 32, 64, 128, 192, 240].map((v) => `${v}:${lut.map((l) => l[v].toFixed(1)).join("/")}`).join("  "));

  // all source frames, in order: A 0..120, then B 0..120 (matched)
  const src = [];
  for (let i = 0; i <= 120; i++) src.push({ f: file("a", i), m: false });
  for (let i = 0; i <= 120; i++) src.push({ f: file("b", i), m: true });
  const cache = new Map();
  const frame = async (k) => {
    if (cache.has(k)) return cache.get(k);
    const d = await raw(src[k].f);
    if (src[k].m) for (let p = 0; p < d.length; p += 3) for (let c = 0; c < 3; c++) d[p + c] = Math.round(lut[c][d[p + c]]);
    if (cache.size > 12) cache.delete(cache.keys().next().value);
    cache.set(k, d);
    return d;
  };

  // ---- 2. motion between neighbours (and across the loop) -----------------
  const small = async (k) => sharp(await frame(k), { raw: { width: W, height: H, channels: 3 } }).extract({ left: 400, top: 0, width: 480, height: 720 }).resize(160, 240).greyscale().raw().toBuffer();
  const L = src.length;
  const step = [];
  let prev = await small(0);
  const first = prev;
  for (let k = 1; k <= L; k++) {
    const cur = k < L ? await small(k) : first; // the last step is back round to the start
    let s = 0;
    for (let p = 0; p < cur.length; p++) s += Math.abs(cur[p] - prev[p]);
    // a still frame's noise is not motion
    step.push(Math.max(0, s / cur.length - 0.35));
    prev = cur;
  }
  const cum = [0];
  for (const s of step) cum.push(cum[cum.length - 1] + s);
  const total = cum[L];
  console.log("source frames", L, "total motion", total.toFixed(1), "joint steps A120>B0", step[120].toFixed(2), "B120>A0", step[L - 1].toFixed(2));

  // ---- 3. keep the frames that move ------------------------------------
  // Walking the joined clip, a frame is kept once it has moved at least MIN
  // since the last kept one: where she turns every frame is kept (none is
  // ever shown twice), and the holds and slow ends fold into a few frames.
  // Across each joint (A to B at the back, B to A at the front) two blended
  // frames bridge the switch.
  const MIN = 2.6;
  const keep = [];
  let since = Infinity;
  for (let k = 0; k < L; k++) {
    since += k ? step[k - 1] : 0;
    if (since >= MIN || k === 0) {
      keep.push(k);
      since = 0;
    }
  }
  fs.rmSync(path.join(S, "out"), { recursive: true, force: true });
  fs.mkdirSync(path.join(S, "out"), { recursive: true });
  let n = 0;
  let back = 0;
  const put = async (buf) => sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 1 }).toFile(path.join(S, "out", String(n++).padStart(4, "0") + ".png"));
  const blend = async (x, y) => {
    const a = await frame(x), b = await frame(y);
    for (const t of [1 / 3, 2 / 3]) {
      const o = Buffer.alloc(a.length);
      for (let p = 0; p < a.length; p++) o[p] = Math.round(a[p] * (1 - t) + b[p] * t);
      await put(o);
    }
  };
  for (let i = 0; i < keep.length; i++) {
    await put(await frame(keep[i]));
    const next = keep[i + 1];
    if (next !== undefined && keep[i] <= 120 && next > 120) {
      back = n; // the back: where A meets B
      await blend(keep[i], next); // A to B, the back
    }
  }
  await blend(keep[keep.length - 1], 0); // B back round to A, the front (the loop)
  console.log("kept", keep.length, "of", L, "frames; with the joints", n, "frames per turn");

  // ---- 4. the web frames --------------------------------------------------
  fs.rmSync(path.join(OUT, "frames"), { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, "frames"), { recursive: true });
  const hash = crypto.createHash("sha1");
  const done = fs.readdirSync(path.join(S, "out")).sort();
  for (const [i, f] of done.entries()) {
    const dest = path.join(OUT, "frames", String(i + 1).padStart(4, "0") + ".webp");
    await sharp(path.join(S, "out", f)).extract({ left: Math.round((W - SIDE) / 2) + 4, top: 0, width: SIDE, height: H }).webp({ quality: 82, effort: 6 }).toFile(dest);
    hash.update(fs.readFileSync(dest));
  }
  const manifest = { version: hash.digest("hex").slice(0, 8), frames: done.length, width: SIDE, height: H, sourceFrames: done.map((_, i) => i), back };
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest));
  console.log("public/features/turn:", manifest.frames, "frames, version", manifest.version);
})();
