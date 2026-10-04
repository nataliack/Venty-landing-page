/* Hero video → scroll sequence.

   Reads the master (media/hero/hero-master.mp4), decodes every frame at full
   quality and writes them as WebP, plus a manifest the site reads:

     public/hero/sequence/frames/0001.webp …   every frame, source size
     public/hero/sequence/manifest.json        count, size, version

   Nothing is ever scaled up or down: every source pixel is kept, so the only
   resample is the one the browser does to fit the screen. Phones get the
   same frames; which part of each one they see is the camera track in
   src/components/Hero.tsx, not something baked in here.

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

// 2. encode
const FRAMES = path.join(OUT, "frames");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });
const webp = { quality: QUALITY, effort: 6, smartSubsample: true };
let bytes = 0;
let next = 0;
let done = 0;
const worker = async () => {
  while (next < N) {
    const i = next++;
    const buf = await sharp(path.join(BUILD, files[i])).webp(webp).toBuffer();
    fs.writeFileSync(path.join(FRAMES, `${String(i + 1).padStart(4, "0")}.webp`), buf);
    bytes += buf.length;
    if (++done % 50 === 0 || done === N) process.stdout.write(`\rencoded ${done}/${N}`);
  }
};
await Promise.all(Array.from({ length: Math.max(1, os.cpus().length - 1) }, worker));

// 3. manifest. The version changes with the master or the quality, and the
//    site adds it to every frame URL, so a new encode is never served stale.
const manifest = {
  version: createHash("sha1").update(`${masterHash}:${QUALITY}`).digest("hex").slice(0, 8),
  master: path.relative(ROOT, MASTER).replace(/\\/g, "/"),
  frames: N,
  fps: FPS,
  width: W,
  height: H,
  quality: QUALITY,
};
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n${N} frames, ${(bytes / 1048576).toFixed(1)} MB, version ${manifest.version}`);
