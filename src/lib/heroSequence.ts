/* The hero video, as a scroll-scrubbed image sequence.

   Frames come from tools/hero/encode.mjs (master: media/hero/hero-master.mp4)
   and live in public/hero/sequence/frames/0001.webp …, full 16:9 frames at
   the source's own pixels. Every screen gets the same frames; a narrow
   (portrait) screen sees a slice of each one, and the camera picks which:
   a horizontal focus per frame, so the slice can glide to follow the action.

   Two parts:
   - preloadHero() downloads every frame once, as compressed blobs (tens of
     MB). The loader calls it so the loading screen covers the download; the
     hero calls it too, and both share the same download.
   - createHeroPlayer() draws onto a canvas. Only a short window of frames
     around the playhead is decoded at a time, because hundreds of decoded
     full-size frames would take gigabytes, more than any browser allows. */

import manifest from "../../public/hero/sequence/manifest.json";

export const HERO = manifest;

/** The web frame showing a given master frame (0-based, as numbered in After
    Effects). Repeated master frames are dropped by the encoder, so the two
    numberings drift apart; talk in master frames and convert here. */
export const heroFrame = (master: number) => {
  const src = manifest.sourceFrames;
  let k = 0;
  while (k + 1 < src.length && src[k + 1] <= master) k++;
  return k;
};

const frameUrl = (i: number) => `/hero/sequence/frames/${String(i + 1).padStart(4, "0")}.webp?v=${manifest.version}`;

/** The first frame, for the poster under the canvas */
export const heroPoster = frameUrl(0);

/** A camera track: [master frame, focus] keys, focus 0 to 1 across the frame
    width. Between keys the focus eases (smoothstep), so the slice glides. */
export type CameraKeys = readonly (readonly [number, number])[];
export const cameraTrack = (masterKeys: CameraKeys) => {
  const keys = masterKeys.map(([f, x]) => [heroFrame(f), x] as const);
  return (f: number) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let k = 1; k < keys.length; k++) {
    const [f0, x0] = keys[k - 1];
    const [f1, x1] = keys[k];
    if (f <= f1) {
      const t = (f - f0) / (f1 - f0);
      return x0 + (x1 - x0) * t * t * (3 - 2 * t);
    }
  }
  return keys[keys.length - 1][1];
  };
};

const blobs: (Blob | null)[] = new Array(manifest.frames).fill(null);
const waiting = new Map<number, (() => void)[]>();
const listeners = new Set<(done: number, total: number) => void>();
let loaded = 0;
let preload: Promise<void> | null = null;

/** Downloads every frame. Safe to call many times; progress reports per frame. */
export function preloadHero(onProgress?: (done: number, total: number) => void) {
  if (onProgress) listeners.add(onProgress);
  if (preload) return preload;
  // coarse to fine: every 16th frame first, so scrubbing works from the start
  const order: number[] = [];
  const seen = new Set<number>();
  for (const step of [16, 4, 1]) {
    for (let i = 0; i < manifest.frames; i += step) {
      if (seen.has(i)) continue;
      seen.add(i);
      order.push(i);
    }
  }
  let next = 0;
  const fetchFrame = async (i: number) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(frameUrl(i));
        if (!res.ok) throw new Error(String(res.status));
        blobs[i] = await res.blob();
        break;
      } catch {
        /* retried, then left empty: the nearest frame stands in */
      }
    }
    loaded++;
    waiting.get(i)?.forEach((f) => f());
    waiting.delete(i);
    listeners.forEach((l) => l(loaded, manifest.frames));
  };
  const worker = async () => {
    while (next < order.length) await fetchFrame(order[next++]);
  };
  preload = Promise.all(Array.from({ length: 6 }, worker)).then(() => {
    listeners.clear();
  });
  return preload;
}

type Decoded = ImageBitmap | HTMLImageElement;
const decode = (blob: Blob): Promise<Decoded> =>
  "createImageBitmap" in window
    ? createImageBitmap(blob)
    : new Promise((ok, fail) => {
        const im = new Image();
        im.onload = () => ok(im);
        im.onerror = fail;
        im.src = URL.createObjectURL(blob);
      });

export function createHeroPlayer(canvas: HTMLCanvasElement, camera: (frame: number) => number = () => 0.5) {
  const { width: FW, height: FH } = manifest;
  const N = manifest.frames;
  // decoded ahead of the playhead in the direction of travel, and behind it;
  // a smaller window on touch screens, where memory is tighter
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const AHEAD = touch ? 8 : 10;
  const BEHIND = touch ? 3 : 4;
  const g = canvas.getContext("2d", { alpha: false })!;
  const frames = new Map<number, Decoded>();
  const pending = new Set<number>();
  let target = 0;
  let focus = camera(0);
  let dir = 1;
  let drawn = -1;
  let drawnX = NaN;
  let destroyed = false;

  const draw = (force = false) => {
    // the target if it is ready, otherwise the nearest decoded frame
    let k = -1;
    for (let d = 0; d < N && k < 0; d++) {
      if (frames.has(target - d * dir)) k = target - d * dir;
      else if (frames.has(target + d * dir)) k = target + d * dir;
    }
    if (k < 0) return;
    if (k === drawn && !force && !moved()) return;
    const img = frames.get(k)!;
    const cw = canvas.width;
    const ch = canvas.height;
    const s = Math.max(cw / FW, ch / FH);
    // the focus point goes to the middle of the screen, without ever
    // pulling an edge of the frame into view
    const x = Math.round(Math.min(0, Math.max(cw - FW * s, cw / 2 - focus * FW * s)));
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(img, x, (ch - FH * s) / 2, FW * s, FH * s);
    if (drawn < 0) canvas.style.opacity = "1"; // the poster underneath until now
    drawn = k;
    drawnX = x;
  };

  const want = (i: number) => {
    if (i < 0 || i >= N || frames.has(i) || pending.has(i)) return;
    const blob = blobs[i];
    if (!blob) {
      // not downloaded yet: decode as soon as it lands
      const list = waiting.get(i) ?? [];
      list.push(() => !destroyed && Math.abs(i - target) <= AHEAD && want(i));
      waiting.set(i, list);
      return;
    }
    pending.add(i);
    decode(blob)
      .then((img) => {
        pending.delete(i);
        if (destroyed || Math.abs(i - target) > AHEAD + BEHIND) {
          if ("close" in img) img.close();
          return;
        }
        frames.set(i, img);
        if (Math.abs(i - target) < Math.abs(drawn - target) || drawn < 0) draw();
      })
      .catch(() => pending.delete(i));
  };

  // whether the camera has moved the frame by a pixel since the last draw
  const moved = () => {
    const s = Math.max(canvas.width / FW, canvas.height / FH);
    const x = Math.round(Math.min(0, Math.max(canvas.width - FW * s, canvas.width / 2 - focus * FW * s)));
    return x !== drawnX;
  };

  const update = () => {
    want(target);
    for (let d = 1; d <= AHEAD; d++) want(target + d * dir);
    for (let d = 1; d <= BEHIND; d++) want(target - d * dir);
    // free what has fallen out of the window
    for (const [i, img] of frames) {
      const ahead = (i - target) * dir;
      if (ahead > AHEAD || ahead < -BEHIND) {
        if (i === drawn) continue;
        if ("close" in img) img.close();
        frames.delete(i);
      }
    }
    draw();
  };

  // the backing store matches the screen's real pixels, so the frame is
  // resampled once, by drawImage, and never again by the compositor
  const size = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (w === canvas.width && h === canvas.height) return;
    canvas.width = w;
    canvas.height = h;
    draw(true);
  };
  const ro = new ResizeObserver(size);
  ro.observe(canvas);
  size();
  preloadHero();
  update();

  return {
    /** 0 is the first frame, 1 the last */
    set(progress: number) {
      const pos = Math.min(1, Math.max(0, progress)) * (N - 1);
      // the camera follows the exact scroll position, so it glides between frames
      focus = camera(pos);
      const f = Math.round(pos);
      if (f === target) return draw();
      dir = f > target ? 1 : -1;
      target = f;
      update();
    },
    destroy() {
      destroyed = true;
      ro.disconnect();
      frames.forEach((img) => "close" in img && img.close());
      frames.clear();
    },
  };
}
