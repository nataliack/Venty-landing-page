/* The hero video, as a scroll-scrubbed image sequence.

   Frames come from tools/hero/encode.mjs (master: media/hero/hero-master.mp4)
   and live in public/hero/sequence/{landscape,portrait}/0001.webp …
   Landscape screens get the full 16:9 frame, portrait screens a 4:5 crop
   that follows her, both at the source's own pixels.

   Two parts:
   - preloadHero() downloads every frame once, as compressed blobs (tens of
     MB). The loader calls it so the loading screen covers the download; the
     hero calls it too, and both share the same download.
   - createHeroPlayer() draws onto a canvas. Only a short window of frames
     around the playhead is decoded at a time, because hundreds of decoded
     full-size frames would take gigabytes, more than any browser allows. */

import manifest from "../../public/hero/sequence/manifest.json";

export type HeroOrient = "landscape" | "portrait";

export const HERO = manifest;

const frameUrl = (o: HeroOrient, i: number) =>
  `/hero/sequence/${o}/${String(i + 1).padStart(4, "0")}.webp?v=${manifest.version}`;

/** The first frame, for the poster under the canvas */
export const heroPoster = (o: HeroOrient) => frameUrl(o, 0);

// Chosen once per page load, like the loader: rotating a phone afterwards
// still works, the canvas covers with whichever set was downloaded.
let orient: HeroOrient | null = null;
export const heroOrient = (): HeroOrient =>
  (orient ??= window.innerWidth / window.innerHeight < 1 ? "portrait" : "landscape");

const blobs: (Blob | null)[] = new Array(manifest.frames).fill(null);
const waiting = new Map<number, (() => void)[]>();
const listeners = new Set<(done: number, total: number) => void>();
let loaded = 0;
let preload: Promise<void> | null = null;

/** Downloads every frame. Safe to call many times; progress reports per frame. */
export function preloadHero(onProgress?: (done: number, total: number) => void) {
  if (onProgress) listeners.add(onProgress);
  if (preload) return preload;
  const o = heroOrient();
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
        const res = await fetch(frameUrl(o, i));
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

const AHEAD = 10; // decoded ahead of the playhead, in the direction of travel
const BEHIND = 4;

export function createHeroPlayer(canvas: HTMLCanvasElement) {
  const o = heroOrient();
  const { width: FW, height: FH } = manifest[o];
  const N = manifest.frames;
  const g = canvas.getContext("2d", { alpha: false })!;
  const frames = new Map<number, Decoded>();
  const pending = new Set<number>();
  let target = 0;
  let dir = 1;
  let drawn = -1;
  let destroyed = false;

  const draw = (force = false) => {
    // the target if it is ready, otherwise the nearest decoded frame
    let k = -1;
    for (let d = 0; d < N && k < 0; d++) {
      if (frames.has(target - d * dir)) k = target - d * dir;
      else if (frames.has(target + d * dir)) k = target + d * dir;
    }
    if (k < 0 || (k === drawn && !force)) return;
    const img = frames.get(k)!;
    const cw = canvas.width;
    const ch = canvas.height;
    const s = Math.max(cw / FW, ch / FH);
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(img, (cw - FW * s) / 2, (ch - FH * s) / 2, FW * s, FH * s);
    if (drawn < 0) canvas.style.opacity = "1"; // the poster underneath until now
    drawn = k;
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
      const f = Math.round(Math.min(1, Math.max(0, progress)) * (N - 1));
      if (f === target) return;
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
