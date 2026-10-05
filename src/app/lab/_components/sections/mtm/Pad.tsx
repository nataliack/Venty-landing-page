"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Pin } from "./data";
import { Icon, I } from "./icons";

/* The drawing pad: a dialog over the section, for a new sketch or for
   drawing on a photo. Tools: pen, highlighter, eraser, and pins (tap to
   drop a numbered note). Size slider with a live preview, palette swatches
   plus a custom colour (hue, shade, hex, recent colours), undo and redo
   (Ctrl/Cmd + Z, Shift for redo), clear, and a dress-form guide on paper.
   Saving flattens the drawing onto the photo; pins stay as data. */

type Tool = "pen" | "marker" | "eraser" | "pin";
type Stroke = { tool: Tool; color: string; size: number; pts: [number, number][] };

const PALETTE = [
  { name: "Ink", c: "#121524" },
  { name: "Navy", c: "#384c65" },
  { name: "Cornflower", c: "#687ef5" },
  { name: "Periwinkle", c: "#9daccd" },
  { name: "Cloud", c: "#eff4ff" },
];
const FORM =
  "M86 8 L114 8 L113 40 Q150 48 160 70 Q166 92 162 112 Q156 140 144 170 Q140 196 164 226 Q168 246 150 262 L104 266 L104 300 L140 306 Q144 314 100 314 Q56 314 60 306 L96 300 L96 266 L50 262 Q32 246 36 226 Q60 196 56 170 Q44 140 38 112 Q34 92 40 70 Q50 48 87 40 Z";

const hsl = (h: number, s: number, l: number) => {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

function ColourPicker({ value, recent, onPick }: { value: string; recent: string[]; onPick: (c: string) => void }) {
  const [hue, setHue] = useState(230);
  const [tone, setTone] = useState(55); // lightness, 10..90
  const [hex, setHex] = useState(value);
  const pick = (c: string) => {
    setHex(c);
    onPick(c);
  };
  return (
    <div className="mtm-picker" role="dialog" aria-label="Custom colour">
      <div className="mtm-picker__preview" style={{ background: hex }} />
      <label className="mtm-picker__row">
        <span>Hue</span>
        <input
          type="range"
          min={0}
          max={360}
          value={hue}
          className="mtm-range mtm-range--hue"
          onChange={(e) => {
            const h = Number(e.target.value);
            setHue(h);
            pick(hsl(h, 0.78, tone / 100));
          }}
        />
      </label>
      <label className="mtm-picker__row">
        <span>Shade</span>
        <input
          type="range"
          min={10}
          max={90}
          value={tone}
          className="mtm-range"
          style={{ background: `linear-gradient(90deg, ${hsl(hue, 0.78, 0.1)}, ${hsl(hue, 0.78, 0.5)}, ${hsl(hue, 0.78, 0.9)})` }}
          onChange={(e) => {
            const t = Number(e.target.value);
            setTone(t);
            pick(hsl(hue, 0.78, t / 100));
          }}
        />
      </label>
      <label className="mtm-picker__row">
        <span>Hex</span>
        <input
          className="mtm-hex"
          value={hex}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => {
            const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            setHex(v);
            if (/^#[0-9a-f]{6}$/i.test(v)) onPick(v);
          }}
        />
      </label>
      {recent.length > 0 && (
        <div className="mtm-picker__row">
          <span>Recent</span>
          <div className="flex gap-1.5">
            {recent.map((c) => (
              <button key={c} type="button" className="mtm-swatch is-sm" style={{ background: c }} aria-label={`Recent colour ${c}`} onClick={() => pick(c)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Pad({
  base,
  pins: startPins = [],
  title,
  onClose,
  onSave,
}: {
  base?: string;
  pins?: Pin[];
  title: string;
  onClose: () => void;
  onSave: (src: string, pins: Pin[]) => void;
}) {
  const board = useRef<HTMLDivElement>(null);
  const under = useRef<HTMLCanvasElement>(null);
  const over = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement | null>(null);
  const strokes = useRef<Stroke[]>([]);
  const redo = useRef<Stroke[]>([]);
  const live = useRef<Stroke | null>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [size, setSize] = useState(4);
  const [color, setColor] = useState(base ? "#687ef5" : "#121524");
  const [recent, setRecent] = useState<string[]>([]);
  const [picker, setPicker] = useState(false);
  const [guide, setGuide] = useState(true);
  const [pins, setPins] = useState<Pin[]>(startPins);
  const [editing, setEditing] = useState<number | null>(null);
  const [counts, setCounts] = useState({ s: 0, r: 0 }); // strokes and redo, for the buttons
  const [ratio, setRatio] = useState(4 / 5);
  const bump = () => setCounts({ s: strokes.current.length, r: redo.current.length });

  const dims = useCallback(() => {
    const r = board.current!.getBoundingClientRect();
    return { w: r.width, h: r.height, dpr: Math.min(2, window.devicePixelRatio || 1) };
  }, []);
  const cover = (ctx: CanvasRenderingContext2D, im: HTMLImageElement, w: number, h: number) => {
    const s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
    ctx.drawImage(im, (w - im.naturalWidth * s) / 2, (h - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
  };

  const paintUnder = useCallback(() => {
    const c = under.current;
    if (!c || !board.current) return;
    const { w, h, dpr } = dims();
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#eff4ff";
    ctx.fillRect(0, 0, w, h);
    if (img.current) cover(ctx, img.current, w, h);
    else if (guide) {
      const s = (h * 0.86) / 320;
      ctx.save();
      ctx.translate(w / 2 - 100 * s, h * 0.07);
      ctx.scale(s, s);
      ctx.strokeStyle = "rgba(72, 95, 136, 0.3)";
      ctx.lineWidth = 1.2 / s;
      ctx.setLineDash([4 / s, 5 / s]);
      ctx.stroke(new Path2D(FORM));
      ctx.restore();
    }
  }, [dims, guide]);

  const paintOver = useCallback(() => {
    const c = over.current;
    if (!c || !board.current) return;
    const { w, h, dpr } = dims();
    if (c.width !== Math.round(w * dpr)) {
      c.width = w * dpr;
      c.height = h * dpr;
    }
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of [...strokes.current, ...(live.current ? [live.current] : [])]) {
      ctx.globalCompositeOperation = s.tool === "eraser" ? "destination-out" : "source-over";
      ctx.globalAlpha = s.tool === "marker" ? 0.35 : 1;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.tool === "marker" ? s.size * 3 : s.tool === "eraser" ? s.size * 4 : s.size;
      ctx.beginPath();
      s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
      if (s.pts.length === 1) ctx.lineTo(s.pts[0][0] * w + 0.1, s.pts[0][1] * h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }, [dims]);

  // the board takes the photo's own shape; a sketch is 4:5 paper
  useEffect(() => {
    if (!base) return;
    const im = new Image();
    im.onload = () => {
      img.current = im;
      setRatio(im.naturalWidth / im.naturalHeight);
    };
    im.src = base;
  }, [base]);
  useEffect(() => {
    paintUnder();
    paintOver();
    const ro = new ResizeObserver(() => {
      paintUnder();
      paintOver();
    });
    if (board.current) ro.observe(board.current);
    return () => ro.disconnect();
  }, [paintUnder, paintOver, ratio]);

  const undo = useCallback(() => {
    const s = strokes.current.pop();
    if (s) redo.current.push(s);
    paintOver();
    bump();
  }, [paintOver]);
  const again = useCallback(() => {
    const s = redo.current.pop();
    if (s) strokes.current.push(s);
    paintOver();
    bump();
  }, [paintOver]);

  // keys: Ctrl/Cmd + Z undo, + Shift redo, Escape closes
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) again();
        else undo();
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [undo, again, onClose]);

  const at = (e: React.PointerEvent): [number, number] => {
    const r = over.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };
  const down = (e: React.PointerEvent) => {
    if (tool === "pin") {
      const [x, y] = at(e);
      setPins((p) => [...p, { x, y, note: "" }]);
      setEditing(pins.length);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    live.current = { tool, color, size, pts: [at(e)] };
    redo.current = [];
    paintOver();
  };
  const move = (e: React.PointerEvent) => {
    if (!live.current) return;
    live.current.pts.push(at(e));
    paintOver();
  };
  const up = () => {
    if (!live.current) return;
    strokes.current.push(live.current);
    live.current = null;
    paintOver();
    bump();
  };
  const choose = (c: string, keep = true) => {
    setColor(c);
    if (tool === "eraser" || tool === "pin") setTool("pen");
    if (keep && !PALETTE.some((p) => p.c === c)) setRecent((r) => [c, ...r.filter((x) => x !== c)].slice(0, 5));
  };
  const save = () => {
    const { w, h } = dims();
    const out = document.createElement("canvas");
    out.width = w * 2;
    out.height = h * 2;
    const ctx = out.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.fillStyle = "#eff4ff";
    ctx.fillRect(0, 0, w, h);
    if (img.current) cover(ctx, img.current, w, h);
    ctx.drawImage(over.current!, 0, 0, w, h);
    onSave(out.toDataURL("image/png"), pins.filter((p) => p.note.trim()));
  };

  const has = counts.s > 0;
  const changed = has || pins.length !== startPins.length || pins.some((p, i) => p.note !== startPins[i]?.note);
  const preview = tool === "marker" ? size * 3 : tool === "eraser" ? size * 4 : size;

  // rendered on the body: the composer's glass (backdrop-filter) would
  // otherwise trap a fixed dialog inside the card
  return createPortal(
    <div className="mtm-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="mtm-modal__scrim" onClick={onClose} />
      <div className="mtm-pad">
        <div className="mtm-pad__head">
          <button type="button" className="mtm-ghost" onClick={onClose}>
            Cancel
          </button>
          <p className="mtm-pad__title">{title}</p>
          <button type="button" className="btn-primary is-small" onClick={save} disabled={!changed}>
            <span className="btn-primary__label">{base ? "Save changes" : "Add sketch"}</span>
          </button>
        </div>

        {/* tools */}
        <div className="mtm-pad__tools" role="toolbar" aria-label="Drawing tools">
          <div className="mtm-seg">
            {(
              [
                ["pen", "Pen", I.pen],
                ["marker", "Highlighter", I.marker],
                ["eraser", "Eraser", I.erase],
                ["pin", "Note", I.pin],
              ] as const
            ).map(([t, name, d]) => (
              <button key={t} type="button" aria-pressed={tool === t} onClick={() => setTool(t)} title={name}>
                <Icon d={d} size={16} />
                <span className="mtm-hide-sm">{name}</span>
              </button>
            ))}
          </div>

          <label className="mtm-size" title="Brush size">
            <span className="mtm-size__dot" style={{ width: Math.min(28, preview), height: Math.min(28, preview), background: tool === "eraser" ? "transparent" : color, opacity: tool === "marker" ? 0.4 : 1 }} />
            <input type="range" min={1} max={14} value={size} onChange={(e) => setSize(Number(e.target.value))} className="mtm-range" aria-label="Brush size" />
          </label>

          <div className="relative flex items-center gap-1.5" role="group" aria-label="Colour">
            {PALETTE.map((p) => (
              <button key={p.c} type="button" className="mtm-swatch" style={{ background: p.c }} aria-label={p.name} aria-pressed={color === p.c} onClick={() => choose(p.c, false)} />
            ))}
            <button
              type="button"
              className="mtm-swatch mtm-swatch--custom"
              aria-label="Custom colour"
              aria-expanded={picker}
              aria-pressed={!PALETTE.some((p) => p.c === color)}
              style={{ "--c": color } as React.CSSProperties}
              onClick={() => setPicker((o) => !o)}
            />
            {picker && <ColourPicker value={color} recent={recent} onPick={(c) => choose(c)} />}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {!base && (
              <button type="button" className="mtm-icon" aria-pressed={guide} onClick={() => setGuide((g) => !g)} title="Dress form guide">
                <Icon d={I.form} size={17} />
              </button>
            )}
            <button type="button" className="mtm-icon" onClick={undo} disabled={!has} title="Undo (Ctrl/Cmd + Z)" aria-label="Undo">
              <Icon d={I.undo} size={17} />
            </button>
            <button type="button" className="mtm-icon" onClick={again} disabled={!counts.r} title="Redo (Shift + Ctrl/Cmd + Z)" aria-label="Redo">
              <Icon d={I.redo} size={17} />
            </button>
            <button
              type="button"
              className="mtm-icon"
              onClick={() => {
                strokes.current = [];
                redo.current = [];
                setPins([]);
                paintOver();
                bump();
              }}
              disabled={!has && !pins.length}
              title="Clear"
              aria-label="Clear"
            >
              <Icon d={I.trash} size={17} />
            </button>
          </div>
        </div>

        <div className="mtm-pad__body">
          <div ref={board} className="mtm-pad__board" style={{ aspectRatio: String(ratio), width: `min(100%, calc(62svh * ${ratio}))` }}>
            <canvas ref={under} className="absolute inset-0 h-full w-full" aria-hidden="true" />
            <canvas
              ref={over}
              className="absolute inset-0 h-full w-full touch-none"
              style={{ cursor: tool === "pin" ? "copy" : tool === "eraser" ? "cell" : "crosshair" }}
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
              role="img"
              aria-label={base ? "Drawing on the image" : "Sketch"}
            />
            {pins.map((p, i) => (
              <button
                key={i}
                type="button"
                className={`mtm-pinmark ${editing === i ? "is-on" : ""}`}
                style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                onClick={() => setEditing(i)}
                aria-label={`Note ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
            {!has && !pins.length && <p className="mtm-pad__hint">{tool === "pin" ? "Tap where the note goes" : base ? "Draw where you want it changed" : "Draw the shape. A rough line is plenty."}</p>}
          </div>

          {/* notes for the pins */}
          <div className="mtm-notes" aria-label="Notes">
            <p className="mtm-eyebrow">Notes</p>
            {pins.length === 0 ? (
              <p className="mtm-small mt-2">Choose Note, then tap the drawing to pin what should change there.</p>
            ) : (
              <ol className="mt-2 space-y-1.5">
                {pins.map((p, i) => (
                  <li key={i} className={`mtm-note ${editing === i ? "is-on" : ""}`}>
                    <span className="mtm-note__n">{i + 1}</span>
                    <input
                      autoFocus={editing === i}
                      value={p.note}
                      placeholder="What changes here?"
                      onFocus={() => setEditing(i)}
                      onChange={(e) => setPins((l) => l.map((x, k) => (k === i ? { ...x, note: e.target.value } : x)))}
                      aria-label={`Note ${i + 1}`}
                    />
                    <button type="button" aria-label={`Remove note ${i + 1}`} onClick={() => setPins((l) => l.filter((_, k) => k !== i))}>
                      <Icon d={I.x} size={14} />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
