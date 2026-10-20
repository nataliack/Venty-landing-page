/* A video as a scroll-scrubbed image sequence: the engine behind the hero
   (heroSequence.ts) and the table (tableSequence.ts).

   Frames come from tools/sequence/encode.mjs (the hero's from
   tools/hero/encode.mjs, the same pipeline): full frames at the source's own
   pixels, WebP, with a manifest. Every screen gets the same frames; a narrow
   (portrait) screen sees a slice of each one, and a camera picks which: a
   horizontal focus per frame, so the slice can glide to follow the action.

   Two parts per sequence:
   - preload() downloads every frame once, as compressed blobs, at full
     quality. It resolves on a ready set (the opening frames, and every 16th
     frame through the whole film, so a scrub anywhere already has a frame
     close by); the rest keep coming in behind it, the frames nearest the
     playhead first.
   - createPlayer() draws onto a canvas. Only a short window of frames around
     the playhead is decoded at a time, because hundreds of decoded full-size
     frames would take gigabytes, more than any browser allows.
     Between two frames it blends them by the scroll's exact position, so a
     slow scroll glides through the film instead of stepping frame by frame. */

export type SequenceManifest = {
  version: string;
  frames: number;
  width: number;
  height: number;
  sourceFrames: number[];
};

/** A camera track: [master frame, focus] keys, focus 0 to 1 across the frame
    width. Between keys the focus eases (smoothstep), so the slice glides. */
export type CameraKeys = readonly (readonly [number, number])[];

type Decoded = ImageBitmap | HTMLImageElement;
const viaImage = (blob: Blob): Promise<Decoded> =>
  new Promise((ok, fail) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = fail;
    im.src = URL.createObjectURL(blob);
  });
// (an <img> as the fallback too where createImageBitmap can't read the format)
const decode = (blob: Blob): Promise<Decoded> =>
  "createImageBitmap" in window ? createImageBitmap(blob).catch(() => viaImage(blob)) : viaImage(blob);

export function createSequence(
  manifest: SequenceManifest,
  base: string,
  { opening = 48, ext = "webp" }: { opening?: number; ext?: "webp" | "avif" } = {},
) {
  const N = manifest.frames;
  const frameUrl = (i: number) => `${base}/frames/${String(i + 1).padStart(4, "0")}.${ext}?v=${manifest.version}`;

  /** The web frame showing a given master frame (0-based, as numbered in the
      edit). Repeated master frames are dropped by the encoder, so the two
      numberings drift apart; talk in master frames and convert here. */
  const frameOf = (master: number) => {
    const src = manifest.sourceFrames;
    let k = 0;
    while (k + 1 < src.length && src[k + 1] <= master) k++;
    return k;
  };

  /** Fractional web position of a master frame, for smooth scrubbing */
  const positionOf = (master: number) => {
    const src = manifest.sourceFrames;
    if (master <= src[0]) return 0;
    for (let k = 1; k < src.length; k++) {
      if (src[k] >= master) return k - 1 + (master - src[k - 1]) / (src[k] - src[k - 1]);
    }
    return src.length - 1;
  };

  const cameraTrack = (masterKeys: CameraKeys) => {
    const keys = masterKeys.map(([f, x]) => [frameOf(f), x] as const);
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

  const blobs: (Blob | null)[] = new Array(N).fill(null);
  const waiting = new Map<number, (() => void)[]>();
  const listeners = new Set<(done: number, total: number) => void>();
  let preloading: Promise<void> | null = null;

  /** The frames preload() resolves on: the opening (what the first scroll
      plays) and every 16th frame through the rest. */
  const READY: number[] = (() => {
    const s = new Set<number>();
    for (let i = 0; i < Math.min(opening, N); i++) s.add(i);
    for (let i = 0; i < N; i += 16) s.add(i);
    s.add(N - 1);
    return [...s];
  })();
  const isReady = new Set(READY);

  /** Where the playhead is: the background download follows it */
  let playhead = 0;
  let headDir = 1;
  const setPlayhead = (frame: number, dir: number) => {
    playhead = frame;
    headDir = dir;
  };

  /** Downloads every frame (safe to call many times). Progress and the promise
      cover the ready set; the rest carry on downloading after it resolves. */
  function preload(onProgress?: (done: number, total: number) => void) {
    if (onProgress) listeners.add(onProgress);
    if (preloading) return preloading;
    const state = new Uint8Array(N); // 0 waiting, 1 fetching, 2 done
    let readyDone = 0;
    let resolveReady = () => {};
    preloading = new Promise<void>((ok) => (resolveReady = ok));
    // after the ready set, coarse to fine: every 4th frame, then the rest
    const rest: number[] = [];
    for (const step of [4, 1]) for (let i = 0; i < N; i += step) if (!isReady.has(i) && !rest.includes(i)) rest.push(i);
    let readyNext = 0;
    let restNext = 0;

    // the next frame to fetch: the ready set first, then whatever is just
    // ahead of the playhead (where the scroll is going), then coarse to fine
    const pick = () => {
      while (readyNext < READY.length) {
        const i = READY[readyNext++];
        if (state[i] === 0) return i;
      }
      for (let d = 0; d < 72; d++) {
        const i = playhead + d * headDir;
        if (i >= 0 && i < N && state[i] === 0) return i;
        const j = playhead - Math.min(d, 12) * headDir; // and a little behind
        if (d <= 12 && j >= 0 && j < N && state[j] === 0) return j;
      }
      while (restNext < rest.length) {
        const i = rest[restNext++];
        if (state[i] === 0) return i;
      }
      return -1;
    };

    const fetchFrame = async (i: number) => {
      state[i] = 1;
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
      state[i] = 2;
      waiting.get(i)?.forEach((f) => f());
      waiting.delete(i);
      if (isReady.has(i)) {
        readyDone++;
        listeners.forEach((l) => l(readyDone, READY.length));
        if (readyDone === READY.length) {
          listeners.clear();
          resolveReady();
        }
      }
    };
    const worker = async () => {
      for (let i = pick(); i >= 0; i = pick()) await fetchFrame(i);
    };
    for (let k = 0; k < 6; k++) worker();
    return preloading;
  }

  /** alpha: frames with transparency (the canvas is cleared under each
      draw). fit: "cover" fills the canvas (a slice, picked by the camera),
      "contain" shows the whole frame, centred. blend: between two frames,
      lay the next over the earlier by the exact position (on by default);
      off, it always shows exactly one frame, the nearest. */
  function createPlayer(
    canvas: HTMLCanvasElement,
    camera: (frame: number) => number = () => 0.5,
    { alpha = false, fit = "cover", blend = true }: { alpha?: boolean; fit?: "cover" | "contain"; blend?: boolean } = {},
  ) {
    const { width: FW, height: FH } = manifest;
    // where the frame sits in a box of this size: its scale and top left
    const place = (cw: number, ch: number) => {
      if (fit === "contain") {
        const s = Math.min(cw / FW, ch / FH);
        return { s, x: (cw - FW * s) / 2, y: (ch - FH * s) / 2 };
      }
      const s = Math.max(cw / FW, ch / FH);
      // the focus point goes to the middle of the screen, without ever
      // pulling an edge of the frame into view
      return { s, x: Math.min(0, Math.max(cw - FW * s, cw / 2 - focus * FW * s)), y: (ch - FH * s) / 2 };
    };
    // decoded ahead of the playhead in the direction of travel, and behind it;
    // a smaller window on touch screens, where memory is tighter
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const AHEAD = touch ? 8 : 10;
    const BEHIND = touch ? 3 : 4;
    // decodes running at once. A full-HD decode takes a phone tens of ms and
    // cannot be cancelled, so the queue below is what keeps a fast scroll from
    // piling up a backlog the landing frame then has to wait behind
    const PARALLEL = touch ? 2 : 3;
    const g = canvas.getContext("2d", { alpha })!;
    const frames = new Map<number, Decoded>();
    const pending = new Set<number>();
    const wanted = new Set<number>();
    // frames kept decoded outside the window, for a move the caller knows is
    // coming (see pin() below)
    let pinned = new Set<number>();
    let target = 0;
    let pos = 0; // the exact (fractional) position; target is the nearest frame
    let focus = camera(0);
    let dir = 1;
    let drawn = -1;
    let drawnOver = -1;
    let drawnMix = 0;
    let drawnX = NaN;
    let destroyed = false;

    const draw = (force = false) => {
      // between two decoded frames: the earlier one, and the next over it by
      // how far the scroll has gone between them (in 32 steps, so a still
      // scroll draws nothing). Otherwise the target if it is ready, or the
      // nearest decoded frame.
      const a = Math.floor(pos);
      const mix = Math.round((pos - a) * 32) / 32;
      let k = -1;
      let over = -1;
      if (blend && mix > 0 && mix < 1 && frames.has(a) && frames.has(a + 1)) {
        k = a;
        over = a + 1;
      }
      for (let d = 0; d < N && k < 0; d++) {
        if (frames.has(target - d * dir)) k = target - d * dir;
        else if (frames.has(target + d * dir)) k = target + d * dir;
      }
      if (k < 0) return;
      const m = over < 0 ? 0 : mix;
      if (k === drawn && over === drawnOver && m === drawnMix && !force && !moved()) return;
      const p = place(canvas.width, canvas.height);
      const { s, y } = p;
      const x = Math.round(p.x);
      if (alpha) g.clearRect(0, 0, canvas.width, canvas.height);
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = "high";
      g.drawImage(frames.get(k)!, x, y, FW * s, FH * s);
      if (over >= 0) {
        g.globalAlpha = m;
        g.drawImage(frames.get(over)!, x, y, FW * s, FH * s);
        g.globalAlpha = 1;
      }
      if (drawn < 0) canvas.style.opacity = "1"; // the poster underneath until now
      drawn = k;
      drawnOver = over;
      drawnMix = m;
      drawnX = x;
    };

    const inWindowOf = (i: number) => {
      const ahead = (i - target) * dir;
      return ahead <= AHEAD && ahead >= -BEHIND;
    };
    const inWindow = (i: number) => {
      if (pinned.has(i)) return true;
      const ahead = (i - target) * dir;
      return ahead <= AHEAD && ahead >= -BEHIND;
    };

    // Starts decodes, nearest the playhead first, never more than PARALLEL at
    // a time. Requests that have fallen out of the window are dropped here, so
    // only frames still worth showing are ever decoded.
    const pump = () => {
      while (pending.size < PARALLEL && !destroyed) {
        let next = -1;
        let best = Infinity;
        for (const i of wanted) {
          if (!inWindow(i) || frames.has(i)) {
            wanted.delete(i);
            continue;
          }
          const d = Math.abs(i - target) + ((i - target) * dir < 0 ? 0.5 : 0); // ahead before behind
          if (d < best) {
            best = d;
            next = i;
          }
        }
        if (next < 0) return;
        wanted.delete(next);
        const i = next;
        pending.add(i);
        decode(blobs[i]!)
          .then((img) => {
            if (destroyed || !inWindow(i)) {
              if ("close" in img) img.close();
              return;
            }
            frames.set(i, img);
            draw(); // a closer frame, or the other half of a blend (draw skips if nothing changes)
          })
          .catch(() => {})
          .finally(() => {
            pending.delete(i);
            pump();
          });
      }
    };

    const want = (i: number) => {
      if (i < 0 || i >= N || frames.has(i) || pending.has(i)) return;
      if (blobs[i]) {
        wanted.add(i);
        return;
      }
      // not downloaded yet: queue it as soon as it lands
      const list = waiting.get(i) ?? [];
      list.push(() => {
        if (destroyed || !inWindow(i)) return;
        want(i);
        pump();
      });
      waiting.set(i, list);
    };

    // where the frame sits in the canvas box, in CSS px: scale and offset
    const view = () => place(canvas.clientWidth, canvas.clientHeight);

    // whether the camera has moved the frame by a pixel since the last draw
    const moved = () => Math.round(place(canvas.width, canvas.height).x) !== drawnX;

    const update = () => {
      setPlayhead(target, dir);
      wanted.clear();
      want(target);
      for (let d = 1; d <= AHEAD; d++) want(target + d * dir);
      for (let d = 1; d <= BEHIND; d++) want(target - d * dir);
      // free what has fallen out of the window
      for (const [i, img] of frames) {
        const ahead = (i - target) * dir;
        if (ahead > AHEAD || ahead < -BEHIND) {
          if (i === drawn || i === drawnOver || pinned.has(i)) continue;
          if ("close" in img) img.close();
          frames.delete(i);
        }
      }
      pump();
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
    preload();
    update();

    return {
      /** 0 is the first frame, 1 the last */
      set(progress: number) {
        this.setPosition(Math.min(1, Math.max(0, progress)) * (N - 1));
      },
      /** A web frame position, fractional */
      setPosition(position: number) {
        pos = Math.min(N - 1, Math.max(0, position));
        // the camera follows the exact scroll position, so it glides between frames
        focus = camera(pos);
        const f = Math.round(pos);
        if (f === target) return draw();
        dir = f > target ? 1 : -1;
        target = f;
        update();
      },
      /** A point of the video frame (source px) on screen, CSS px from the
          canvas's top left: what an overlay needs to stay stuck to it */
      project(fx: number, fy: number) {
        const v = view();
        return { x: v.x + fx * v.s, y: v.y + fy * v.s, s: v.s };
      },
      /** Keeps these frames decoded, outside the window, until the next call:
          for a move the caller knows may come (a sparse run of frames along
          it, so the fast part of the move always has a frame close by while
          the window catches up). Decoded after the window's own frames. */
      pin(list: number[]) {
        const next = new Set(list.filter((i) => i >= 0 && i < N));
        for (const [i, img] of frames) {
          if (pinned.has(i) && !next.has(i) && !inWindowOf(i) && i !== drawn && i !== drawnOver) {
            if ("close" in img) img.close();
            frames.delete(i);
          }
        }
        pinned = next;
        for (const i of pinned) want(i);
        pump();
      },
      /** The frame on the canvas now (for checks) */
      get shown() {
        return drawn;
      },
      destroy() {
        destroyed = true;
        ro.disconnect();
        frames.forEach((img) => "close" in img && img.close());
        frames.clear();
      },
    };
  }

  return { manifest, frameUrl, frameOf, positionOf, cameraTrack, setPlayhead, preload, createPlayer, poster: frameUrl(0) };
}
