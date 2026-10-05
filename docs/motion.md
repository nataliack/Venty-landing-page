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
| 0.6s | Vote for Venty | Slides in from the right, label writes in, the QUT mark builds (`VoteTab.tsx`) |
| 0.65s | Line under the title | `linesIn` |
| 0.8s | Scroll | `textIn`, then its hairline `drawLine` downward |

The footage and the bottom glow settle in underneath the loading screen, so
the loader opens onto them.

## Section hand-offs

| Pattern | How | Used |
| --- | --- | --- |
| Dither rise | The next section is pulled up over the last screen of the one before (`margin-top: -100svh`, higher `z-index`), so it scrolls up over the pinned, still section 1:1 with the scroll. Above its top edge its colour dithers in (`DitherEdge`): an 8px screen grid, each cell 4 x 4 squares of 2px switching on in Bayer order, denser toward the edge, over a band 32% of the screen tall with a soft noise wobble. The grid is fixed to the screen, so squares flip on in place as the edge rises. Its copy reveals once it has arrived (`top 20%`). Overlapping theme zones resolve to the later one (`ThemeZones`); a zone can switch at its own point with `data-theme-at` | Hero to Made to measure |
