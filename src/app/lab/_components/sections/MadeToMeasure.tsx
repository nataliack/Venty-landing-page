"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import "./sections.css";

/* 2. Made to measure (lab draft, after Jose's Figma frame).

   One composer, light mode, that shows Venty's core in a single gesture:
   any idea in (photos, a sketch, words), your measurements on, a pattern
   out. The UX fixes the app's current launcher:
   - one field, not seven entry points; text, photos and sketches combine
   - everything you add is an attachment tile: Photo 1, Sketch 1, and a
     photo you have drawn on is "Photo 2 · marked up"
   - every tile has Draw over and Remove; Draw over opens the same drawing
     pad as Sketch, with the photo underneath
   - the drawing pad has pen, colour, eraser, undo and clear, and what you
     draw is kept
   - the body and the fit sit on the toolbar, not behind "details"
   - Draft pattern turns the composer into its result: the pieces, what it
     was drafted from, and the print sizes, then the real CTA.
   Everything stays in the browser: uploads are local previews only. */

type Kind = "photo" | "sketch";
type Att = { id: number; kind: Kind; src: string; marked?: boolean };

const SAMPLES = ["/lab/reel/17.webp", "/lab/reel/13.webp", "/lab/reel/06.webp", "/lab/reel/12.webp"];

// a slip dress, drawn as a quick line sketch (the pre-filled sketch)
const SKETCH_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 380'><rect width='300' height='380' fill='#eff4ff'/><g fill='none' stroke='#121524' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><path d='M118 40 L126 120 M182 40 L174 120'/><path d='M126 120 Q150 140 174 120'/><path d='M126 120 Q112 190 118 214 Q100 290 78 350 Q150 366 222 350 Q200 290 182 214 Q188 190 174 120'/><path d='M118 214 Q150 226 182 214' stroke-dasharray='2 7'/><path d='M150 140 L150 350' stroke='#687ef5' stroke-width='2' stroke-dasharray='1 8'/></g></svg>`,
)}`;

const BODIES = [
  { id: "me-oct", name: "Me", date: "Oct 2026", m: "Bust 92 · Waist 74 · Hip 98" },
  { id: "me-mar", name: "Me", date: "Mar 2026", m: "Bust 90 · Waist 73 · Hip 97" },
  { id: "mum", name: "Mum", date: "Jun 2026", m: "Bust 101 · Waist 86 · Hip 106" },
];
const FITS = ["Close", "Easy", "Loose"] as const;
const PROMPT = "A bias-cut slip dress like photo 1, midi length, with the neckline from my sketch.";

/* --------------------------------------------------------------- icons */
const I = {
  image: "M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5zM4 15l4.5-4.5L13 15l2.5-2.5L20 17M15.5 8.5h.01",
  pen: "M4 20l4-1L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4zM14 6l3 3",
  x: "M6 6l12 12M18 6L6 18",
  plus: "M12 5v14M5 12h14",
  undo: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  erase: "M7 20h10M5.5 13.5l7-7a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12 17H8z",
  trash: "M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  arrow: "M5 12h14M13 6l6 6-6 6",
  tape: "M3 9h18v6H3zM7 9v3M11 9v2M15 9v3M19 9v2",
  print: "M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v6H7z",
  chev: "M7 10l5 5 5-5",
  back: "M15 6l-6 6 6 6",
};
function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/* ---------------------------------------------------------- sketch pad */
type Stroke = { tool: "pen" | "eraser"; color: string; size: number; pts: [number, number][] };
const INKS = [
  { name: "Ink", c: "#121524" },
  { name: "Cornflower", c: "#687ef5" },
  { name: "Cloud", c: "#eff4ff" },
];
// a dress form as a faint guide under a fresh sketch
const FORM =
  "M86 8 L114 8 L113 40 Q150 48 160 70 Q166 92 162 112 Q156 140 144 170 Q140 196 164 226 Q168 246 150 262 L104 266 L104 300 L140 306 Q144 314 100 314 Q56 314 60 306 L96 300 L96 266 L50 262 Q32 246 36 226 Q60 196 56 170 Q44 140 38 112 Q34 92 40 70 Q50 48 87 40 Z";

function SketchPad({ base, title, onCancel, onSave }: { base?: string; title: string; onCancel: () => void; onSave: (src: string) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const under = useRef<HTMLCanvasElement>(null);
  const over = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const live = useRef<Stroke | null>(null);
  const img = useRef<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  // ink on paper; cornflower over a photo, where ink would vanish in the dark
  const [ink, setInk] = useState(base ? INKS[1].c : INKS[0].c);
  const [count, setCount] = useState(0); // re-render for undo/clear states

  const size = useCallback(() => {
    const r = wrap.current!.getBoundingClientRect();
    return { w: r.width, h: r.height, dpr: Math.min(2, window.devicePixelRatio || 1) };
  }, []);

  // cover-fit an image into w x h
  const cover = (ctx: CanvasRenderingContext2D, im: HTMLImageElement, w: number, h: number) => {
    const s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
    const dw = im.naturalWidth * s;
    const dh = im.naturalHeight * s;
    ctx.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
  };

  const paintUnder = useCallback(() => {
    const c = under.current!;
    const { w, h, dpr } = size();
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#eff4ff";
    ctx.fillRect(0, 0, w, h);
    if (img.current) cover(ctx, img.current, w, h);
    else {
      // the guide: a dress form, centred, very faint
      const s = (h * 0.86) / 320;
      ctx.save();
      ctx.translate(w / 2 - 100 * s, h * 0.07);
      ctx.scale(s, s);
      ctx.strokeStyle = "rgba(72, 95, 136, 0.28)";
      ctx.lineWidth = 1.2 / s;
      ctx.setLineDash([4 / s, 5 / s]);
      ctx.stroke(new Path2D(FORM));
      ctx.restore();
    }
  }, [size]);

  const paintOver = useCallback(() => {
    const c = over.current!;
    const { w, h, dpr } = size();
    if (c.width !== w * dpr) {
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
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.beginPath();
      s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (s.pts.length === 1) ctx.lineTo(s.pts[0][0] + 0.1, s.pts[0][1]);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }, [size]);

  useEffect(() => {
    if (base) {
      const im = new Image();
      im.onload = () => {
        img.current = im;
        paintUnder();
      };
      im.src = base;
    }
    paintUnder();
    paintOver();
    const ro = new ResizeObserver(() => {
      paintUnder();
      paintOver();
    });
    ro.observe(wrap.current!);
    return () => ro.disconnect();
  }, [base, paintUnder, paintOver]);

  const at = (e: React.PointerEvent): [number, number] => {
    const r = over.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const down = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    live.current = { tool, color: ink, size: tool === "eraser" ? 22 : 3, pts: [at(e)] };
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
    setCount(strokes.current.length);
    paintOver();
  };
  const undo = () => {
    strokes.current.pop();
    setCount(strokes.current.length);
    paintOver();
  };
  const clear = () => {
    strokes.current = [];
    setCount(0);
    paintOver();
  };
  const save = () => {
    // flatten: the photo (or plain paper, no guide) under the strokes
    const { w, h } = size();
    const out = document.createElement("canvas");
    out.width = w * 2;
    out.height = h * 2;
    const ctx = out.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.fillStyle = "#eff4ff";
    ctx.fillRect(0, 0, w, h);
    if (img.current) cover(ctx, img.current, w, h);
    ctx.drawImage(over.current!, 0, 0, w, h);
    onSave(out.toDataURL("image/png"));
  };

  return (
    <div className="mtm-pad">
      <div className="mtm-pad__bar">
        <button type="button" className="mtm-ghost" onClick={onCancel}>
          <Icon d={I.back} size={16} /> Back
        </button>
        <p className="mtm-pad__title">{title}</p>
        <button type="button" className="btn-primary is-small mtm-save" onClick={save} disabled={!count}>
          <span className="btn-primary__label">{base ? "Save markup" : "Add sketch"}</span>
        </button>
      </div>
      <div ref={wrap} className="mtm-pad__board">
        <canvas ref={under} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <canvas
          ref={over}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ cursor: tool === "eraser" ? "cell" : "crosshair" }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          role="img"
          aria-label={base ? "Drawing over the image" : "Sketch area"}
        />
        {!count && <p className="mtm-pad__hint">{base ? "Draw where you want it changed" : "Draw the shape. A rough line is plenty."}</p>}
      </div>
      <div className="mtm-pad__tools" role="toolbar" aria-label="Drawing tools">
        <div className="mtm-seg">
          <button type="button" aria-pressed={tool === "pen"} onClick={() => setTool("pen")}>
            <Icon d={I.pen} size={16} /> Pen
          </button>
          <button type="button" aria-pressed={tool === "eraser"} onClick={() => setTool("eraser")}>
            <Icon d={I.erase} size={16} /> Eraser
          </button>
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Colour">
          {INKS.map((c) => (
            <button
              key={c.c}
              type="button"
              aria-label={c.name}
              aria-pressed={ink === c.c && tool === "pen"}
              className="mtm-swatch"
              style={{ background: c.c }}
              onClick={() => {
                setInk(c.c);
                setTool("pen");
              }}
            />
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          <button type="button" className="mtm-ghost" onClick={undo} disabled={!count}>
            <Icon d={I.undo} size={16} /> Undo
          </button>
          <button type="button" className="mtm-ghost" onClick={clear} disabled={!count}>
            <Icon d={I.trash} size={16} /> Clear
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- result */
// a slip dress, as drafted: front and back on the bias, straps, facing
const PIECES = [
  { name: "Front", note: "Cut 1 on the bias", d: "M30 10 L62 10 L72 40 Q74 60 70 78 L84 230 L8 230 L22 78 Q18 60 20 40 Z", x: 10, w: 92 },
  { name: "Back", note: "Cut 1 on the bias", d: "M28 18 L64 18 L72 44 Q74 62 70 80 L84 230 L8 230 L22 80 Q18 62 20 44 Z", x: 118, w: 92 },
  { name: "Straps", note: "Cut 2", d: "M6 20 L18 20 L18 150 L6 150 Z M28 20 L40 20 L40 150 L28 150 Z", x: 226, w: 46 },
  { name: "Facing", note: "Cut 2", d: "M4 30 Q40 10 76 30 L76 52 Q40 34 4 52 Z", x: 284, w: 80 },
];

function Result({ body, fit, onEdit }: { body: (typeof BODIES)[number]; fit: string; onEdit: () => void }) {
  const [paper, setPaper] = useState<"A4" | "A0" | "Projector">("A4");
  return (
    <div className="mtm-result">
      <div className="mtm-sheet" aria-label="The drafted pattern pieces">
        <svg viewBox="0 0 370 262" className="h-full w-full" role="img" aria-label="Front, back, straps and facing of a slip dress">
          {PIECES.map((p, i) => (
            <g key={p.name} transform={`translate(${p.x} 8)`}>
              <path d={p.d} className="mtm-piece" style={{ animationDelay: `${0.1 + i * 0.18}s` }} pathLength={1} />
              <text x={p.w / 2 - 4} y={244} className="mtm-piece__label" textAnchor="middle">
                {p.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="mtm-result__side">
        <p className="mtm-eyebrow">Drafted</p>
        <p className="mtm-result__title">Bias slip dress</p>
        <ul className="mtm-facts">
          <li>
            <span>Pieces</span>
            <span>4</span>
          </li>
          <li>
            <span>Body</span>
            <span>
              {body.name} · {body.date}
            </span>
          </li>
          <li>
            <span>Fit</span>
            <span>{fit}</span>
          </li>
        </ul>
        <p className="mtm-eyebrow mt-5">Print it</p>
        <div className="mtm-seg mt-2 w-full" role="group" aria-label="Print size">
          {(["A4", "A0", "Projector"] as const).map((p) => (
            <button key={p} type="button" aria-pressed={paper === p} onClick={() => setPaper(p)} className="flex-1">
              {p}
            </button>
          ))}
        </div>
        <p className="mtm-small mt-2">{paper === "A4" ? "16 pages, with a page map" : paper === "A0" ? "One sheet, true scale" : "Projector file, true scale"}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          <PrimaryButton href={APP_URL} size="sm">
            {CTA_LABEL}
          </PrimaryButton>
          <button type="button" className="mtm-ghost" onClick={onEdit}>
            <Icon d={I.back} size={16} /> Edit prompt
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ composer */
function Composer() {
  const nextId = useRef(4);
  const [atts, setAtts] = useState<Att[]>([
    { id: 1, kind: "photo", src: SAMPLES[0] },
    { id: 2, kind: "sketch", src: SKETCH_SVG },
    { id: 3, kind: "photo", src: SAMPLES[1] },
  ]);
  const [text, setText] = useState(PROMPT);
  const [body, setBody] = useState(BODIES[0]);
  const [bodyOpen, setBodyOpen] = useState(false);
  const [fit, setFit] = useState<(typeof FITS)[number]>("Easy");
  const [addOpen, setAddOpen] = useState(false);
  const [pad, setPad] = useState<null | { forId?: number }>(null);
  const [stage, setStage] = useState<"compose" | "drafting" | "result">("compose");
  const file = useRef<HTMLInputElement>(null);

  const label = (a: Att) => {
    const n = atts.filter((x) => x.kind === a.kind && x.id <= a.id).length;
    return `${a.kind === "photo" ? "Photo" : "Sketch"} ${n}${a.marked ? " · marked up" : ""}`;
  };
  const add = (kind: Kind, src: string) => {
    setAtts((l) => (l.length >= 6 ? l : [...l, { id: nextId.current++, kind, src }]));
  };
  const onFiles = (fl: FileList | null) => {
    if (!fl) return;
    Array.from(fl)
      .slice(0, 6)
      .forEach((f) => f.type.startsWith("image/") && add("photo", URL.createObjectURL(f)));
    setAddOpen(false);
  };

  // close the little menus on Escape or a click elsewhere
  useEffect(() => {
    if (!addOpen && !bodyOpen) return;
    const off = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof PointerEvent && (e.target as HTMLElement).closest(".mtm-menu, .mtm-menu-btn")) return;
      setAddOpen(false);
      setBodyOpen(false);
    };
    document.addEventListener("pointerdown", off);
    document.addEventListener("keydown", off);
    return () => {
      document.removeEventListener("pointerdown", off);
      document.removeEventListener("keydown", off);
    };
  }, [addOpen, bodyOpen]);

  const draft = () => {
    setStage("drafting");
    setTimeout(() => setStage("result"), 1600);
  };

  const editing = pad?.forId ? atts.find((a) => a.id === pad.forId) : undefined;

  return (
    <div className="mtm-card" data-stage={stage}>
      {stage === "result" ? (
        <Result body={body} fit={fit} onEdit={() => setStage("compose")} />
      ) : pad ? (
        <SketchPad
          base={editing?.src}
          title={editing ? `Drawing on ${label(editing)}` : "New sketch"}
          onCancel={() => setPad(null)}
          onSave={(src) => {
            if (editing) setAtts((l) => l.map((a) => (a.id === editing.id ? { ...a, src, marked: a.kind === "photo" } : a)));
            else add("sketch", src);
            setPad(null);
          }}
        />
      ) : (
        <>
          {/* what you are working from */}
          <ul className="mtm-atts" aria-label="Attached">
            {atts.map((a) => (
              <li key={a.id} className="mtm-att">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.src} alt={label(a)} draggable={false} />
                <span className="mtm-att__tag">
                  {label(a).split(" · ")[0]}
                  {a.marked && (
                    <span className="mtm-att__marked" title="Marked up">
                      <Icon d={I.pen} size={10} />
                    </span>
                  )}
                </span>
                <span className="mtm-att__acts">
                  <button type="button" aria-label={`Draw over ${label(a)}`} title="Draw over" onClick={() => setPad({ forId: a.id })}>
                    <Icon d={I.pen} size={15} />
                  </button>
                  <button type="button" aria-label={`Remove ${label(a)}`} title="Remove" onClick={() => setAtts((l) => l.filter((x) => x.id !== a.id))}>
                    <Icon d={I.x} size={15} />
                  </button>
                </span>
              </li>
            ))}
            {atts.length < 6 && (
              <li>
                <button type="button" className="mtm-att mtm-att--add mtm-menu-btn" onClick={() => setAddOpen((o) => !o)} aria-expanded={addOpen}>
                  <Icon d={I.plus} size={20} />
                  <span>Add</span>
                </button>
              </li>
            )}
          </ul>

          {addOpen && (
            <div className="mtm-menu" role="dialog" aria-label="Add a reference">
              <div className="grid grid-cols-4 gap-1.5">
                {SAMPLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="mtm-menu__thumb"
                    onClick={() => {
                      add("photo", s);
                      setAddOpen(false);
                    }}
                    aria-label="Add this sample photo"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s} alt="" />
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button type="button" className="mtm-ghost justify-center" onClick={() => file.current?.click()}>
                  <Icon d={I.image} size={16} /> From your device
                </button>
                <button
                  type="button"
                  className="mtm-ghost justify-center"
                  onClick={() => {
                    setAddOpen(false);
                    setPad({});
                  }}
                >
                  <Icon d={I.pen} size={16} /> Sketch
                </button>
              </div>
            </div>
          )}
          <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />

          <label className="sr-only" htmlFor="mtm-prompt">
            Describe it
          </label>
          <textarea id="mtm-prompt" className="mtm-text" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe it in a few words" />

          {/* toolbar: add from either source, then who it is for and how it sits */}
          <div className="mtm-tools">
            <div className="flex gap-1.5">
              <button type="button" className="mtm-ghost mtm-menu-btn" onClick={() => setAddOpen((o) => !o)} aria-expanded={addOpen}>
                <Icon d={I.image} size={16} /> Images
              </button>
              <button type="button" className="mtm-ghost" onClick={() => setPad({})}>
                <Icon d={I.pen} size={16} /> Sketch
              </button>
            </div>
            <span className="mtm-divider" aria-hidden="true" />
            <div className="relative">
              <button type="button" className="mtm-chip mtm-menu-btn" onClick={() => setBodyOpen((o) => !o)} aria-expanded={bodyOpen} aria-label={`Body: ${body.name}, ${body.date}`}>
                <Icon d={I.tape} size={16} />
                {body.name} · {body.date}
                <Icon d={I.chev} size={14} />
              </button>
              {bodyOpen && (
                <ul className="mtm-menu mtm-menu--body" role="listbox" aria-label="Draft for">
                  {BODIES.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={b.id === body.id}
                        onClick={() => {
                          setBody(b);
                          setBodyOpen(false);
                        }}
                      >
                        <span>
                          {b.name} · {b.date}
                        </span>
                        <span className="mtm-small">{b.m}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mtm-seg" role="group" aria-label="Fit">
              {FITS.map((f) => (
                <button key={f} type="button" aria-pressed={fit === f} onClick={() => setFit(f)}>
                  {f}
                </button>
              ))}
            </div>
            <button type="button" className="btn-primary is-small mtm-go" onClick={draft} disabled={stage === "drafting" || (!text.trim() && !atts.length)}>
              <span className="btn-primary__label">
                {stage === "drafting" ? "Drafting" : "Draft pattern"}
                <Icon d={I.arrow} size={16} />
              </span>
              {stage === "drafting" && <span className="mtm-go__bar" aria-hidden="true" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- section */
export function MadeToMeasure() {
  return (
    <div data-lenis-prevent className="absolute inset-0 overflow-y-auto">
      <section className="mtm" aria-labelledby="mtm-title">
        <div className="mtm-dots" aria-hidden="true" />
        <div className="mtm-head">
          <p className="mtm-eyebrow">Made to measure</p>
          <h2 id="mtm-title" className="mtm-title">
            Venty turns any idea into a pattern drafted for you.
          </h2>
        </div>

        <Composer />

        {/* the three ideas, as small graphics instead of numbered copy */}
        <ul className="mtm-cues" aria-label="How it adds up">
          <li>
            <Icon d={I.image} />
            Photo, sketch or words
          </li>
          <li aria-hidden="true" className="mtm-cues__plus">
            +
          </li>
          <li>
            <Icon d={I.tape} />
            Your measurements
          </li>
          <li aria-hidden="true" className="mtm-cues__plus">
            =
          </li>
          <li>
            <Icon d={I.print} />
            A pattern to print
          </li>
        </ul>
      </section>
    </div>
  );
}
