/* Scroll-scrubbed image sequence on a canvas, the same approach as the
   Workbench: frames load coarse to fine (every 8th first) so scrubbing works
   early, the canvas covers its box, and neighbouring frames are cross-faded
   so the motion stays smooth between them. */

type Opts = {
  canvas: HTMLCanvasElement;
  count: number;
  width: number; // source frame size
  height: number;
  src: (i: number) => string;
};

export function createSequence({ canvas, count, width, height, src }: Opts) {
  const g = canvas.getContext("2d")!;
  const frames: (HTMLImageElement | null)[] = new Array(count).fill(null);
  let pos = 0;
  let cancelled = false;
  let started = false;

  const nearest = (i: number) => {
    for (let d = 0; d < count; d++) {
      if (frames[i - d]) return i - d;
      if (frames[i + d]) return i + d;
    }
    return -1;
  };

  const cover = (img: HTMLImageElement, alpha: number) => {
    const cw = canvas.width;
    const ch = canvas.height;
    const s = Math.max(cw / width, ch / height);
    g.globalAlpha = alpha;
    g.drawImage(img, (cw - width * s) / 2, (ch - height * s) / 2, width * s, height * s);
  };

  const draw = () => {
    const a = Math.floor(pos);
    const b = Math.min(count - 1, a + 1);
    const t = pos - a;
    if (frames[a] && frames[b]) {
      cover(frames[a]!, 1);
      if (t > 0.001) cover(frames[b]!, t);
    } else {
      const n = nearest(Math.round(pos));
      if (n >= 0) cover(frames[n]!, 1);
    }
    g.globalAlpha = 1;
  };

  const size = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    draw();
  };
  const ro = new ResizeObserver(size);
  ro.observe(canvas);

  const load = () => {
    if (started) return;
    started = true;
    const order: number[] = [];
    for (const step of [8, 4, 2, 1]) {
      for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i);
    }
    if (!order.includes(count - 1)) order.splice(1, 0, count - 1);
    let next = 0;
    const worker = () => {
      if (cancelled || next >= order.length) return;
      const i = order[next++];
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        frames[i] = img;
        if (Math.abs(i - pos) < 9) draw();
        worker();
      };
      img.onerror = worker;
      img.src = src(i);
    };
    for (let k = 0; k < 6; k++) worker();
  };

  return {
    load,
    /** 0 to 1 across the whole sequence */
    set(progress: number) {
      pos = Math.min(1, Math.max(0, progress)) * (count - 1);
      draw();
    },
    destroy() {
      cancelled = true;
      ro.disconnect();
    },
  };
}
