/* Hero sequence → phone frames.

   A portrait screen sees only a slice of each 16:9 frame: as tall as the
   frame, and as wide as the screen's shape allows, placed by the camera
   (src/lib/heroCamera.ts). This cuts every web frame of public/hero/sequence
   down to the band any portrait screen up to ASPECT wide (width / height)
   can see of it, with the camera wherever it may be while that frame is on
   screen (the frame either side of it too, as the player blends and the
   playhead moves on), and a margin. The site draws each band where it sat in
   the full frame (manifest.crop.x), so the camera, the blend and anything
   placed on the footage work exactly as before.

     public/hero/sequence-phone/frames/0001.webp …   every frame, cut
     public/hero/sequence-phone/manifest.json        the full manifest, plus
                                                     the cut and the camera

   Same pixels and quality as the full frames (nothing scaled), so a phone
   loses nothing; it just does not download or decode what it never shows.
   The manifest keeps the camera it was cut for: if the camera changes and
   this is not run again, heroSequence.ts gives phones the full frames.

     node tools/hero/encode-phone.mjs [--aspect 0.75] [--build tools/hero/build/frames]

   Reads the decoded master frames encode.mjs keeps in tools/hero/build/frames
   (run node tools/hero/encode.mjs --reuse first if they are missing). */

import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createSequence } from "../../src/lib/sequence.ts";
import { CAMERA } from "../../src/lib/heroCamera.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
/** the widest portrait screen served these frames, width / height. 0.75
    covers every phone held upright, the toolbars showing (an iPhone SE in
    Safari is about 0.68); wider (tablets, phones on their side) gets the full
    frames */
const ASPECT = Number(opt("aspect", "0.75"));
const MARGIN = 6; // px of frame either side of the band, for rounding
const BUILD = path.resolve(ROOT, opt("build", "tools/hero/build/frames"));
const FULL = path.join(ROOT, "public/hero/sequence");
const OUT = path.join(ROOT, "public/hero/sequence-phone");

const full = JSON.parse(fs.readFileSync(path.join(FULL, "manifest.json"), "utf8"));
const { width: W, height: H, frames: N, quality: QUALITY } = full;
const stamp = path.join(BUILD, ".master");
if (!fs.existsSync(stamp)) throw new Error(`no decoded frames in ${BUILD}: run node tools/hero/encode.mjs --reuse`);
const masterHash = fs.readFileSync(stamp, "utf8");
if (createHash("sha1").update(`${masterHash}:${QUALITY}`).digest("hex").slice(0, 8) !== full.version)
  throw new Error("the decoded frames are not the ones public/hero/sequence was made from: run node tools/hero/encode.mjs --reuse");

// the camera, exactly as the site runs it (web frame, fractional -> focus)
const focusAt = createSequence(full, "").cameraTrack(CAMERA);

// the band a portrait screen of this shape sees, for a focus (the player's
// "cover" placement: the frame fills the height, the focus goes to the middle
// of the screen without pulling an edge of the frame into view)
const view = W > H * ASPECT ? H * ASPECT : W;
const slice = (focus) => {
  const l = Math.min(Math.max(0, focus * W - view / 2), W - view);
  return [l, l + view];
};

// every frame's band: everything the camera can show while it is on screen
const need = [];
for (let k = 0; k < N; k++) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let p = k - 1; p <= k + 1 + 1e-9; p += 0.05) {
    const [l, r] = slice(focusAt(Math.min(N - 1, Math.max(0, p))));
    lo = Math.min(lo, l);
    hi = Math.max(hi, r);
  }
  need.push([Math.max(0, Math.floor(lo - MARGIN)), Math.min(W, Math.ceil(hi + MARGIN))]);
}
// one width for every frame (a multiple of 16), each band centred on what it needs
const CW = Math.min(W, Math.ceil(Math.max(...need.map(([l, r]) => r - l)) / 16) * 16);
const cropX = need.map(([l, r]) => {
  const x = Math.min(Math.max(0, Math.round((l + r) / 2 - CW / 2)), W - CW);
  if (x > l || x + CW < r) throw new Error("a band does not cover its frame's view");
  return x;
});
console.log(`band ${CW} x ${H} of ${W} x ${H} (${Math.round((CW / W) * 100)}% of each frame), screens up to ${ASPECT} wide`);

// encode, as encode.mjs does
const all = fs.readdirSync(BUILD).filter((f) => /^\d{4}\.png$/.test(f)).sort();
const files = full.sourceFrames.map((m) => all[m]);
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
    const buf = await sharp(path.join(BUILD, files[i])).extract({ left: cropX[i], top: 0, width: CW, height: H }).webp(webp).toBuffer();
    fs.writeFileSync(path.join(FRAMES, `${String(i + 1).padStart(4, "0")}.webp`), buf);
    bytes += buf.length;
    if (++done % 50 === 0 || done === N) process.stdout.write(`\rencoded ${done}/${N}`);
  }
};
await Promise.all(Array.from({ length: Math.max(1, os.cpus().length - 1) }, worker));

const manifest = {
  ...full,
  version: createHash("sha1").update(`${full.version}:${ASPECT}:${CW}:${JSON.stringify(cropX)}`).digest("hex").slice(0, 8),
  // the full encode it was cut from, and the camera it was cut along: heroSequence.ts uses these frames only while both still hold
  crop: { width: CW, x: cropX, aspect: ASPECT, camera: CAMERA, from: full.version },
};
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n${N} frames, ${(bytes / 1048576).toFixed(1)} MB, version ${manifest.version}`);
