"use client";

import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { BODIES, FITS, PROMPT, SAMPLE_A, SAMPLE_B, SKETCH_SVG, type Att, type Body, type Fit, type Kind, type Pin } from "./data";
import dynamic from "next/dynamic";
import { Icon, I } from "./icons";

// the drawing pad's code only loads the first time someone opens it
const Pad = dynamic(() => import("./Pad").then((m) => m.Pad), { ssr: false });
// uploads are local previews: free their memory when they go
const release = (src?: string) => src?.startsWith("blob:") && URL.revokeObjectURL(src);
// what each ease means, in plain words
const EASE_HINT: Record<Fit, string> = { Close: "Sits close to the body", Easy: "A little room to move", Loose: "Relaxed and roomy" };

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
  // one menu open at a time: opening one closes the other
  const [menu, setMenu] = useState<null | "body" | "ease">(null);
  const bodyBtn = useRef<HTMLButtonElement>(null);
  const easeBtn = useRef<HTMLButtonElement>(null);
  const [focused, setFocused] = useState(false);
  const [typing, setTyping] = useState(false);
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
    setTyping(false);
    setPressed(false);
    // a touch mid-entrance completes the story, it never stalls it
    if (autoDraft) onDraft();
    else setHint(true);
  };
  useEffect(() => {
    if (!play) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) {
      // reduced motion: the finished state at once, by design
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAtts(refs);
      setText(prompt);
      if (autoDraft) onDraft();
      return;
    }
    scripted.current = true;
    const t = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    refs.forEach((a, i) => t(250 + i * 260, () => setAtts((l) => [...l, a])));
    t(1000, () => setTyping(true));
    for (let i = 1; i <= prompt.length; i++) t(1000 + i * 26, () => setText(prompt.slice(0, i)));
    t(1000 + prompt.length * 26 + 60, () => setTyping(false));
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
      setAtts((l) =>
        l.map((a) => {
          if (a.id !== id) return a;
          release(a.src);
          return { ...a, src, marked: false, pins: [] };
        }),
      );
      replaceId.current = null;
      return;
    }
    imgs.slice(0, 6).forEach((f) => add("photo", URL.createObjectURL(f)));
  };

  // any press outside the open menu closes it (its own button toggles it); Escape too
  useEffect(() => {
    if (!menu) return;
    const btn = menu === "body" ? bodyBtn : easeBtn;
    const off = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key !== "Escape") return;
        setMenu(null);
        btn.current?.focus();
        return;
      }
      const t = e.target as Node;
      if (btn.current?.contains(t) || (t as HTMLElement).closest?.(".mtm-menu")) return;
      setMenu(null);
    };
    document.addEventListener("pointerdown", off);
    document.addEventListener("keydown", off);
    return () => {
      document.removeEventListener("pointerdown", off);
      document.removeEventListener("keydown", off);
    };
  }, [menu]);
  const toggle = (m: "body" | "ease") => setMenu((o) => (o === m ? null : m));

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
          <li key={a.id} className="mtm-chipwrap">
            {/* the whole image opens it; the dots are where the eye goes */}
            <button type="button" className="mtm-chipref" onClick={() => setView(a.id)} aria-label={`${label(a)}${a.marked ? ", marked up" : ""}${a.pins?.length ? `, ${a.pins.length} notes` : ""}. Options`} title={label(a)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.src} alt="" draggable={false} />
              <span className="mtm-chipref__more" aria-hidden="true">
                <Icon d={I.more} size={18} weight={3} />
              </span>
              {!!a.pins?.length && <span className="mtm-chipref__count">{a.pins.length}</span>}
            </button>
            {/* remove: on the corner, half outside the image */}
            <button
              type="button"
              className="mtm-chipx"
              aria-label={`Remove ${label(a)}`}
              title="Remove"
              onClick={() => {
                release(a.src);
                setAtts((l) => l.filter((x) => x.id !== a.id));
              }}
            >
              <Icon d={I.x} size={11} weight={2.2} />
            </button>
          </li>
        ))}
        {atts.length === 0 && <li className="mtm-small self-center px-1">Drop or paste images here, or use + below</li>}
      </ul>

      <label className="sr-only" htmlFor="mtm-prompt">
        Describe it
      </label>
      <div className="mtm-textwrap">
        <textarea
          id="mtm-prompt"
          className="mtm-text"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Describe it in a few words"
        />
        {/* the cursor at the end of the words: solid while typing, blinking at rest,
            gone once the field is focused (the real caret takes over) */}
        {!focused && (
          <div className="mtm-text mtm-mirror" aria-hidden="true">
            {text}
            <span className={`mtm-caret ${typing ? "is-typing" : ""}`} />
          </div>
        )}
      </div>

      <div className="mtm-tools">
        <button type="button" className="mtm-icon" onClick={() => file.current?.click()} aria-label="Add images" title="Add images">
          <Icon d={I.plus} size={18} />
        </button>
        <button type="button" className="mtm-icon" onClick={() => setPad({})} aria-label="New sketch" title="Sketch">
          <Icon d={I.brush} size={17} />
        </button>
        <span className="mtm-divider" aria-hidden="true" />
        <div className="relative">
          <button ref={bodyBtn} type="button" className="mtm-chip mtm-menu-btn" onClick={() => toggle("body")} aria-expanded={menu === "body"} aria-haspopup="listbox" aria-label={`Drafted for ${body.name}. Change`} title={body.m}>
            <Icon d={I.tape} size={16} />
            {body.name}
            <Icon d={I.chev} size={14} />
          </button>
          {menu === "body" && (
            <Menu anchor={bodyBtn} className="mtm-menu--body" label="Draft for">
              {BODIES.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={b.id === body.id}
                    onClick={() => {
                      onBody(b);
                      setMenu(null);
                      bodyBtn.current?.focus();
                    }}
                  >
                    <span>{b.name}</span>
                    <span className="mtm-small">{b.m}</span>
                  </button>
                </li>
              ))}
            </Menu>
          )}
        </div>
        <div className="mtm-seg mtm-ease" role="group" aria-label="Ease: how much room it has">
          <span className="mtm-seg__label" aria-hidden="true">
            <Icon d={I.ease} size={13} />
            Ease
          </span>
          {FITS.map((f) => (
            <button key={f} type="button" aria-pressed={fit === f} onClick={() => onFit(f)} title={EASE_HINT[f]}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative mtm-ease-drop">
          <button ref={easeBtn} type="button" className="mtm-chip mtm-menu-btn" onClick={() => toggle("ease")} aria-expanded={menu === "ease"} aria-haspopup="listbox" aria-label={`Ease: ${fit}. Change`}>
            <Icon d={I.ease} size={15} />
            {fit}
            <Icon d={I.chev} size={14} />
          </button>
          {menu === "ease" && (
            <Menu anchor={easeBtn} className="mtm-menu--body mtm-menu--ease" label="Ease" end>
              {FITS.map((f) => (
                <li key={f}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={fit === f}
                    onClick={() => {
                      onFit(f);
                      setMenu(null);
                      easeBtn.current?.focus();
                    }}
                  >
                    <span>{f}</span>
                    <span className="mtm-small">{EASE_HINT[f]}</span>
                  </button>
                </li>
              ))}
            </Menu>
          )}
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
                <Icon d={I.brush} size={16} /> Draw on it
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
                  release(current.src);
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

/* A menu off its button, drawn at the top of the page (a portal) so nothing
   in the section can sit over it: not the sleeve, not the pieces. It opens
   below the button when there is room, above when there is not, and keeps
   to the screen's edges. `end` lines it up with the button's right edge. */
function Menu({ anchor, className, label, end, children }: { anchor: RefObject<HTMLButtonElement | null>; className: string; label: string; end?: boolean; children: ReactNode }) {
  const el = useRef<HTMLUListElement>(null);
  const [at, setAt] = useState<CSSProperties>({ visibility: "hidden" });
  useLayoutEffect(() => {
    const place = () => {
      const b = anchor.current?.getBoundingClientRect();
      const m = el.current;
      if (!b || !m) return;
      const w = m.offsetWidth;
      const h = m.offsetHeight;
      const gap = 8;
      const below = window.innerHeight - b.bottom - gap >= h || b.top - gap < h;
      const x = end ? b.right - w : b.left;
      setAt({
        top: below ? b.bottom + gap : b.top - gap - h,
        left: Math.max(gap, Math.min(x, window.innerWidth - w - gap)),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor, end]);
  return createPortal(
    <ul ref={el} className={`mtm-menu mtm-pop ${className}`} style={at} role="listbox" aria-label={label}>
      {children}
    </ul>,
    document.body,
  );
}
