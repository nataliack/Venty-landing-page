/* Hero video → scroll sequence.

   Reads the master (media/hero/hero-master.mp4), decodes every frame at full
   quality and writes two WebP sets plus a manifest the site reads:

     public/hero/sequence/landscape/0001.webp …   full frame, source size
     public/hero/sequence/portrait/0001.webp …    4:5 crop that follows her
     public/hero/sequence/manifest.json           counts, sizes, version

   Nothing is ever scaled up or down: both sets keep every source pixel, so
   the only resample is the one the browser does to fit the screen.
   The portrait crop is centred on her: each frame's brightness-weighted
   centre, smoothed across neighbouring frames so the crop glides.

     node tools/hero/encode.mjs [--master path] [--quality 92] [--reuse]

   --reuse skips decoding when tools/hero/build/frames already holds the
   frames of the same master. Needs ffmpeg and ffprobe on PATH. */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const MASTER = path.resolve(ROOT, opt("master", "media/hero/hero-master.mp4"));
const QUALITY = Number(opt("quality", "92"));
const REUSE = args.includes("--reuse");
const PORTRAIT = 4 / 5; // width / height of the portrait crop
const BUILD = path.join(ROOT, "tools/hero/build/frames");
const OUT = path.join(ROOT, "public/hero/sequence");

const probe = JSON.parse(
  execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries", "stream=width,height,r_frame_rate,nb_read_frames", "-of", "json", MASTER]).toString(),
).streams[0];
const W = probe.width;
const H = probe.height;
const [fn, fd] = probe.r_frame_rate.split("/").map(Number);
const FPS = fn / fd;
const masterHash = createHash("sha1").update(fs.readFileSync(MASTER)).digest("hex").slice(0, 10);
console.log(`master ${path.relative(ROOT, MASTER)}: ${W}x${H}, ${FPS} fps, ${probe.nb_read_frames} frames, ${masterHash}`);

// 1. decode. The master is untagged HD, which players treat as BT.709 limited
//    range; the conversion says so explicitly so the colours match playback.
const stamp = path.join(BUILD, ".master");
if (!(REUSE && fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8") === masterHash)) {
  fs.rmSync(BUILD, { recursive: true, force: true });
  fs.mkdirSync(BUILD, { recursive: true });
  console.log("decoding frames…");
  execFileSync("ffmpeg", [
    "-v", "error", "-i", MASTER,
    "-vf", "scale=in_color_matrix=bt709:in_range=tv:out_range=pc:flags=spline+accurate_rnd+full_chroma_int,format=rgb24",
    "-fps_mode", "passthrough", "-compression_level", "1",
    path.join(BUILD, "%04d.png"),
  ], { stdio: "inherit" });
  fs.writeFileSync(stamp, masterHash);
}
const files = fs.readdirSync(BUILD).filter((f) => /^\d{4}\.png$/.test(f)).sort();
const N = files.length;

// 2. where she is in each frame, for the portrait crop
const cw = Math.round((H * PORTRAIT) / 2) * 2;
const centres = [];
for (const f of files) {
  const { data, info } = await sharp(path.join(BUILD, f)).resize(192, 108, { fit: "fill" }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const sorted = Uint8Array.from(data).sort();
  const floor = sorted[Math.floor(sorted.length * 0.6)]; // the dark background
  let sum = 0;
  let wsum = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const w = Math.max(0, data[y * info.width + x] - floor) ** 2;
      sum += w * (x + 0.5);
      wsum += w;
    }
  }
  centres.push(wsum ? sum / wsum / info.width : 0.5);
}
const SIGMA = 12; // frames
const smooth = centres.map((_, i) => {
  let s = 0;
  let ws = 0;
  for (let k = -3 * SIGMA; k <= 3 * SIGMA; k++) {
    const j = Math.min(N - 1, Math.max(0, i + k));
    const w = Math.exp(-(k * k) / (2 * SIGMA * SIGMA));
    s += centres[j] * w;
    ws += w;
  }
  return s / ws;
});
const left = smooth.map((c) => Math.min(W - cw, Math.max(0, Math.round(c * W - cw / 2))));

// 3. encode both sets
for (const set of ["landscape", "portrait"]) {
  fs.rmSync(path.join(OUT, set), { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, set), { recursive: true });
}
const webp = { quality: QUALITY, effort: 6, smartSubsample: true };
const bytes = { landscape: 0, portrait: 0 };
let next = 0;
let done = 0;
const worker = async () => {
  while (next < N) {
    const i = next++;
    const src = path.join(BUILD, files[i]);
    const name = `${String(i + 1).padStart(4, "0")}.webp`;
    const land = await sharp(src).webp(webp).toBuffer();
    const port = await sharp(src).extract({ left: left[i], top: 0, width: cw, height: H }).webp(webp).toBuffer();
    fs.writeFileSync(path.join(OUT, "landscape", name), land);
    fs.writeFileSync(path.join(OUT, "portrait", name), port);
    bytes.landscape += land.length;
    bytes.portrait += port.length;
    if (++done % 50 === 0 || done === N) process.stdout.write(`\rencoded ${done}/${N}`);
  }
};
await Promise.all(Array.from({ length: Math.max(1, os.cpus().length - 1) }, worker));

const version = createHash("sha1").update(`${masterHash}:${QUALITY}:${PORTRAIT}`).digest("hex").slice(0, 8);
const manifest = {
  version,
  master: path.relative(ROOT, MASTER).replace(/\\/g, "/"),
  frames: N,
  fps: FPS,
  landscape: { width: W, height: H },
  portrait: { width: cw, height: H },
  quality: QUALITY,
};
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
const mb = (b) => (b / 1048576).toFixed(1);
console.log(`\nlandscape ${mb(bytes.landscape)} MB, portrait ${mb(bytes.portrait)} MB, version ${version}`);
