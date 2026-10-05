"use client";

import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import { BODIES, FITS, PROMPT, SAMPLE_A, SAMPLE_B, SKETCH_SVG, type Att, type Body, type Fit, type Kind, type Pin } from "./data";
import { Icon, I } from "./icons";
import { Pad } from "./Pad";

/* The composer. One field: references as compact chips above the words,
   the body and the fit on the toolbar, Draft pattern on the right.

   Adding: drop or paste images anywhere on the card; + opens the picker
   straight away; the pencil starts a sketch. A chip opens a viewer with
   plain actions (Draw on it, Replace, Remove). Drawing happens in the pad
   (Pad.tsx). Uploads stay in the browser.

   `play` runs the entrance once: chips drop in, the prompt types itself,
   Draft presses. Any touch on the card skips to the end. */

const FULL: Att[] = [
  { id: 1, kind: "photo", src: SAMPLE_A, pins: [{ x: 0.42, y: 0.32, note: "Halter neck" }] },
  { id: 2, kind: "sketch", src: SKETCH_SVG },
  { id: 3, kind: "photo", src: SAMPLE_B },
];

type Props = {
  /** the references and the prompt it opens with (defaults: the gown) */
  refs?: Att[];
  prompt?: string;
  /** false: the entrance ends on a hint to press Draft instead of pressing it */
  autoDraft?: boolean;
  /** shown in place of the Draft button once drafted (e.g. the CTA) */
  done?: ReactNode;
  play: boolean;
  drafting: boolean;
  body: Body;
  fit: Fit;
  onBody: (b: Body) => void;
  onFit: (f: Fit) => void;
  onDraft: () => void;
};

export const Composer = forwardRef<HTMLButtonElement, Props>(function Composer(
  { refs = FULL, prompt = PROMPT, autoDraft = true, done, play, drafting, body, fit, onBody, onFit, onDraft },
  draftRef,
) {
  const nextId = useRef(4);
  const [atts, setAtts] = useState<Att[]>([]);
  const [text, setText] = useState("");
  const [bodyOpen, setBodyOpen] = useState(false);
  const [view, setView] = useState<number | null>(null);
  const [pad, setPad] = useState<null | { forId?: number }>(null);
  const [drag, setDrag] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [hint, setHint] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const replaceId = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const scripted = useRef(false);

  // the entrance, once
  const finish = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (!scripted.current) return;
    scripted.current = false;
    setAtts(refs);
    setText(prompt);
    setPressed(false);
    // a touch mid-entrance completes the story, it never stalls it
    if (autoDraft) onDraft();
    else setHint(true);
  };
  useEffect(() => {
    if (!play) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) {
      setAtts(refs);
      setText(prompt);
      if (autoDraft) onDraft();
      return;
    }
    scripted.current = true;
    const t = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    refs.forEach((a, i) => t(250 + i * 260, () => setAtts((l) => [...l, a])));
    for (let i = 1; i <= prompt.length; i++) t(1000 + i * 26, () => setText(prompt.slice(0, i)));
    const end = 1000 + prompt.length * 26 + 350;
    if (autoDraft) {
      t(end, () => setPressed(true));
      t(end + 220, () => {
        setPressed(false);
        scripted.current = false;
        onDraft();
      });
    } else
      t(end, () => {
        scripted.current = false;
        setHint(true);
      });
    return () => timers.current.forEach(clearTimeout);
    // runs once, when the section first comes into view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  const label = (a: Att) => `${a.kind === "photo" ? "Photo" : "Sketch"} ${atts.filter((x) => x.kind === a.kind && x.id <= a.id).length}`;
  const add = (kind: Kind, src: string) => setAtts((l) => (l.length >= 6 ? l : [...l, { id: nextId.current++, kind, src }]));
  const addFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (replaceId.current !== null && imgs[0]) {
      const id = replaceId.current;
      const src = URL.createObjectURL(imgs[0]);
      setAtts((l) => l.map((a) => (a.id === id ? { ...a, src, marked: false, pins: [] } : a)));
      replaceId.current = null;
      return;
    }
    imgs.slice(0, 6).forEach((f) => add("photo", URL.createObjectURL(f)));
  };

  useEffect(() => {
    if (!bodyOpen) return;
    const off = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof PointerEvent && (e.target as HTMLElement).closest(".mtm-menu, .mtm-menu-btn")) return;
      setBodyOpen(false);
    };
    document.addEventListener("pointerdown", off);
    document.addEventListener("keydown", off);
    return () => {
      document.removeEventListener("pointerdown", off);
      document.removeEventListener("keydown", off);
    };
  }, [bodyOpen]);

  const current = view !== null ? atts.find((a) => a.id === view) : undefined;
  const padFor = pad?.forId ? atts.find((a) => a.id === pad.forId) : undefined;

  return (
    <div
      className={`mtm-card ${drag ? "is-drop" : ""}`}
      onPointerDownCapture={finish}
      onKeyDownCapture={finish}
      onDragEnter={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        addFiles(e.dataTransfer.files);
      }}
      onPaste={(e) => {
        const files = Array.from(e.clipboardData.items)
          .filter((i) => i.type.startsWith("image/"))
          .map((i) => i.getAsFile())
          .filter(Boolean) as File[];
        if (files.length) {
          e.preventDefault();
          addFiles(files);
        }
      }}
    >
      {/* references */}
      <ul className="mtm-chips" aria-label="References">
        {atts.map((a) => (
          <li key={a.id}>
            <button type="button" className="mtm-chipref" onClick={() => setView(a.id)} aria-label={`${label(a)}${a.marked ? ", marked up" : ""}${a.pins?.length ? `, ${a.pins.length} notes` : ""}. Open`} title={label(a)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.src} alt="" draggable={false} />
              {a.kind === "sketch" && (
                <span className="mtm-chipref__kind">
                  <Icon d={I.pen} size={10} />
                </span>
              )}
              {(a.marked || !!a.pins?.length) && <span className="mtm-chipref__count">{a.pins?.length || <Icon d={I.pen} size={9} />}</span>}
            </button>
          </li>
        ))}
        {atts.length === 0 && <li className="mtm-small self-center px-1">Drop or paste images here, or use + below</li>}
      </ul>

      <label className="sr-only" htmlFor="mtm-prompt">
        Describe it
      </label>
      <textarea id="mtm-prompt" className="mtm-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe it in a few words" />

      <div className="mtm-tools">
        <button type="button" className="mtm-icon" onClick={() => file.current?.click()} aria-label="Add images" title="Add images">
          <Icon d={I.plus} size={18} />
        </button>
        <button type="button" className="mtm-icon" onClick={() => setPad({})} aria-label="New sketch" title="Sketch">
          <Icon d={I.pen} size={17} />
        </button>
        <span className="mtm-divider" aria-hidden="true" />
        <div className="relative">
          <button type="button" className="mtm-chip mtm-menu-btn" onClick={() => setBodyOpen((o) => !o)} aria-expanded={bodyOpen} aria-label={`Draft for ${body.name}, ${body.date}`}>
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
                      onBody(b);
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
            <button key={f} type="button" aria-pressed={fit === f} onClick={() => onFit(f)}>
              {f}
            </button>
          ))}
        </div>
        {done ? (
          <div className="mtm-go mtm-done">{done}</div>
        ) : (
        <button
          ref={draftRef}
          type="button"
          className={`btn-primary is-small mtm-go ${pressed ? "is-pressed" : ""} ${hint && !drafting ? "is-hint" : ""}`}
          onClick={() => {
            setHint(false);
            onDraft();
          }}
          disabled={drafting || (!text.trim() && !atts.length)}
        >
          <span className="btn-primary__label">
            {drafting ? "Drafting" : "Draft pattern"}
            <Icon d={I.arrow} size={16} />
          </span>
          {drafting && <span className="mtm-go__bar" aria-hidden="true" />}
        </button>
        )}
      </div>

      <input
        ref={file}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {drag && (
        <div className="mtm-drop" aria-hidden="true">
          <Icon d={I.image} size={22} />
          Drop to add
        </div>
      )}

      {/* the viewer: one reference, large, with plain actions */}
      {current && (
        <div className="mtm-viewer" role="dialog" aria-label={label(current)}>
          <div className="mtm-viewer__img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.src} alt={label(current)} />
            {current.pins?.map((p, i) => (
              <span key={i} className="mtm-pinmark" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }} title={p.note}>
                {i + 1}
              </span>
            ))}
          </div>
          <div className="mtm-viewer__side">
            <p className="mtm-viewer__title">
              {label(current)}
              {current.marked && <span className="mtm-small"> · marked up</span>}
            </p>
            {!!current.pins?.length && (
              <ol className="mt-2 space-y-1">
                {current.pins.map((p, i) => (
                  <li key={i} className="mtm-small flex gap-2">
                    <span className="mtm-note__n">{i + 1}</span>
                    {p.note}
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-auto grid gap-1.5 pt-3">
              <button
                type="button"
                className="mtm-ghost"
                onClick={() => {
                  setPad({ forId: current.id });
                  setView(null);
                }}
              >
                <Icon d={I.pen} size={16} /> Draw on it
              </button>
              {current.kind === "photo" && (
                <button
                  type="button"
                  className="mtm-ghost"
                  onClick={() => {
                    replaceId.current = current.id;
                    file.current?.click();
                    setView(null);
                  }}
                >
                  <Icon d={I.replace} size={16} /> Replace
                </button>
              )}
              <button
                type="button"
                className="mtm-ghost is-danger"
                onClick={() => {
                  setAtts((l) => l.filter((a) => a.id !== current.id));
                  setView(null);
                }}
              >
                <Icon d={I.trash} size={16} /> Remove
              </button>
              <button type="button" className="mtm-ghost justify-center" onClick={() => setView(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {pad && (
        <Pad
          base={padFor?.src}
          pins={padFor?.pins}
          title={padFor ? `Drawing on ${label(padFor)}` : "New sketch"}
          onClose={() => setPad(null)}
          onSave={(src: string, pins: Pin[]) => {
            if (padFor) setAtts((l) => l.map((a) => (a.id === padFor.id ? { ...a, src, pins, marked: true } : a)));
            else {
              const id = nextId.current++;
              setAtts((l) => [...l, { id, kind: "sketch", src, pins }]);
            }
            setPad(null);
          }}
        />
      )}
    </div>
  );
});
