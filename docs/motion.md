# Venty motion

One set of eases, durations and reveals for the whole landing page, so every
section moves like the same site. The values live in code in two places
that mirror each other:

- `src/lib/motion.ts`: GSAP tokens and reveal helpers
- `src/app/globals.css` (`:root`): the same values as CSS custom properties,
  for hovers and state changes

Reach for these before writing a new value. If something truly needs a new
one, add it to both files and to this page; never inline a one-off.

## Rules of thumb

| Situation | Ease | Why |
| --- | --- | --- |
| Something arrives (reveal, entrance, panel opening) | `EASE.out` (`expo.out`, CSS `--ease-out-expo`) | Fast start, long soft landing |
| Something leaves | `EASE.in` (`power3.in`, CSS `--ease-in`), quicker than it came | Gets out of the way |
| Something moves between two states, a line draws, a wipe | `EASE.inOut` (`power3.inOut`, CSS `--ease-in-out`) | Even, deliberate |
| Presses, pills, small pulls toward the pointer | CSS `--ease-spring` | A little overshoot, feels physical |
| Small settles (opacity, nudges) | `EASE.soft` (`power2.out`) | Quiet |
| Scroll-scrubbed timelines | `power2.inOut` defaults, `scrub: 0.8` | The scroll is the clock |

Text never just fades in. It rises from behind a mask.

## Durations

| Token | GSAP | CSS | Use |
| --- | --- | --- | --- |
| quick | `DUR.quick` 0.35s | `--dur-quick` | Hovers, presses, colour changes |
| base | `DUR.base` 0.7s | `--dur-base` | Menus, panels, short slides, the magnetic pull |
| reveal | `DUR.reveal` 1.2s | `--dur-reveal` | Text and object reveals |
| long | `DUR.long` 2.4s | | The big opening moves (the hero footage) |

## Staggers

| Token | Value | Use |
| --- | --- | --- |
| `STAGGER.chars` | 0.03s | Letter by letter (rare) |
| `STAGGER.words` | 0.05s | Word by word, mostly in scroll-scrubbed lines |
| `STAGGER.lines` | 0.08s | Line by line, the default for text |
| `STAGGER.items` | 0.1s | Separate objects in a group |

## Reveals (`src/lib/motion.ts`)

| Helper | What it does | Where it is used |
| --- | --- | --- |
| `textIn(tl, targets, at)` | Masked lines or words rise into view (`yPercent` from `HIDDEN`), 1.2s expo out, 0.08s stagger | Hero title, Scroll |
| `linesIn(tl, el, at)` | Splits running text into masked lines, reveals them, then undoes the split so it reflows | Hero line under the title |
| `fadeUp` / `fadeDown(tl, targets, at)` | Fades in while travelling 14px into place (up from below, or down from above for things at the top edge) | Announcement bar items, logo, section menu |
| `drawLine(tl, targets, at, origin, axis)` | A hairline draws out from its origin | The bar's bottom rule (from the centre), Scroll's hairline (downward) |
| `wipeIn(tl, targets, at)` | A pill or panel opens out from its left edge, a clip wipe that keeps the rounding | Primary button in the hero |
| `afterLoader(cb)` | Waits for the loading screen to leave before an opening plays | Hero opening, Vote for Venty |

Text masks get room for ascenders, descenders and swashes with `padMasks`
and `.line-mask` (`src/lib/reveal.ts`), so nothing is clipped.
Text waiting to rise sits at `HIDDEN` (160%), below its padded mask: any
less and swashes peek out.

Sections below the hero reveal with `useReveals(root)` (`src/lib/useReveals.ts`):
each `[data-reveal]` group plays once when its top reaches 78% of the screen
(or its own `data-reveal="top 70%"`), rising its `[data-rise]` spans
(`textIn`), splitting and rising its `[data-lines]` text (`linesIn`) and
fading up its `[data-up]` objects (`fadeUp`). The group gets `.is-in`, which
CSS uses to start the small pieces inside it (ink drawing, chat bubbles).

## Hover and press

| Element | Behaviour |
| --- | --- |
| Primary button | Drawn up to 8px toward the pointer, the label a little further (`--dur-base`, `--ease-spring`). Gives 2% under the pointer, inner edge light tightens, a soft swirl turns inside. Press dips to 0.965 (`0.12s`) and springs back |
| Vote for Venty tab | Pulls out 6px. The same swirl as the button. The QUT bars pull up and drop again (a replay always finishes; a hover during one is ignored) |
| Section menu | Glass brightens, edge lightens, label to cloud, the chevrons ease apart. Press dips to 0.97 |
| Links in panels | An underline draws in from the left; the arrow flies out right and a second follows in |

Every hover is gated with `@media (hover: hover)` so nothing sticks after a
tap on a phone, and every animation respects `prefers-reduced-motion`.

## The hero opening, as a worked example

Once the loader has gone (`Hero.tsx`):

| At | Object | Motion |
| --- | --- | --- |
| 0 | Announcement bar rule | `drawLine` from the centre |
| 0.15s | Maker, countdown, rolling line | `fadeDown`, 0.1s apart |
| 0.25s | Logo | `fadeDown` |
| 0.32s | Section menu | `fadeDown` |
| 0.35s | Title | `textIn`, line by line |
| 0.55s | Create your pattern | `wipeIn` |
| 0.65s | Line under the title | `linesIn` |
| 0.8s | Scroll | `textIn`, then its hairline `drawLine` downward |

Before all of it, the loading screen (`MeasureLoader.tsx`) ends by growing
the hero's first frame to fill the screen, landing exactly on the hero, so
the footage never moves or fades in: the glow rising along the bottom and
the dots fading up are the first moves of the opening. The Vote for Venty
tab arrives with the loading screen, above it, and is already in.

## Section hand-offs

| Pattern | How | Used |
| --- | --- | --- |
| Dither rise | The next section is pulled up over the last screen of the one before (`margin-top: -100svh`, higher `z-index`), so it scrolls up over the pinned, still section 1:1 with the scroll. Above its top edge its colour dithers in (`DitherEdge`): an 8px screen grid, each cell 4 x 4 squares of 2px switching on in Bayer order, denser toward the edge, over a band 32% of the screen tall with a soft noise wobble. The grid is fixed to the screen, so squares flip on in place as the edge rises. Its copy reveals once it has arrived (`top 20%`). Overlapping theme zones resolve to the later one (`ThemeZones`); a zone can switch at its own point with `data-theme-at` | Hero to Made to measure |

Every hand-off is a different textile, in the colour of the section rising:

| From → to | Rising | Pattern | Over |
| --- | --- | --- | --- |
| Hero → Made to measure | cloud | squares, lumps | the pinned video |
| How it works → Features | night | weave | the held end of the table (desktop) |
| What you can make → Made with Venty | cloud | stitch | the held last garment (desktop) |
| FAQ → Meet the maker | night | cross-stitch | the FAQ's empty foot |
| Closing scene → footer | cloud | squares, wave | the held last line |

A pinned section that something rises over holds one extra screen, still, at
its end. Without a pin (phones, the FAQ), the band rises through empty room
left at the foot of the section before (about 42svh), never over content.
Night meets night with a stitched seam instead (Features → What you can make).

## Keeping it fast

Measured with a headless Chrome profile (top-to-bottom scroll, frame times
per section, long tasks, bytes before the page opens). Rules that came out
of it:

- Nothing animates off screen. JS loops start and stop with an
  IntersectionObserver (`useGlow`, `DitherEdge`, the Made with line);
  CSS loops pause under `[data-off]` (`PauseOffscreen.tsx`).
- Move and fade with `transform` and `opacity` only. A light that follows
  the pointer is a disc moved by a transform, not a gradient redrawn at a
  new position (the Features cards). Custom properties inherit: writing
  one on a big element restyles everything inside it, every frame.
- No `filter: blur()` on things that move or animate: draw the soft light
  as a radial gradient instead (Meet the maker, the closing glow).
- A scroll-scrubbed SVG scene is a stack of SVG layers, each moved as a
  whole with a CSS transform (the closing scene), not one SVG whose
  insides are animated.
- Write to the DOM only when a value changes (the scrollbar, the glow).
- Heavy setup (a WebGL context, a shader compile) never runs at load: it
  waits for idle time after the loader, or for its section to come near.
- The hero sequence keeps every frame at full quality; the loader waits
  for a ready set (the opening, every 16th frame) and the rest stream in
  behind it, the frames nearest the playhead first.
- Images below the first screen are `loading="lazy"`; fonts are WOFF2.
