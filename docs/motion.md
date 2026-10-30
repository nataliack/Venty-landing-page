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
| A vote link with no page yet, tapped (tablet and up) | The links rise out of their area (`EASE.in`, `--dur-quick`) and "Voting links coming soon" rises in behind the same clip (`EASE.out`, `--dur-base`, 0.12s after); after 2.6s they swap back the same way. The tab's panel and the footer card (`VoteSoon.tsx`) |
| The same on a phone | A bottom sheet built like the app's (`Sheet` in app.venty.au): it rises with `EASE.out` (`--dur-base`) over a shade that fades in, and drops with `EASE.in` (`--dur-quick`). It follows a drag down and closes past 90px; its handle turns periwinkle while held. Got it presses like a pill (0.965, `--ease-spring`) |

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

Before all of it, the loading screen (`FilamentLoader.tsx`): Edge, the locked
dark sky (a cornflower glow roaming the lower two thirds), with the cornflower
filament at dead centre (quiet along its length, glowing at its growing tip), the Venty lockup above it, a rolling word on the left (Loading,
Measuring, Drafting, Fitting, Ready) and the percentage on the right in the
same type. On the way in, everything reveals itself instead of appearing at once: the
wordmark's letters (V, e, n and the ty ligature) rise and lean into place
one after another from the right, under the bird as it comes in over them
along the top (and a small ripple runs through them from under it as it
touches down; on the way out they go one after another from the right as it
curls away), the filament draws out from the middle, the word and the number
slide in from their sides (`REVEAL_S` 1.1s, `EASE.out`); as
served, they wait hidden (`.is-pre`). The way in waits for the page to settle
(six smooth frames in a row, at most 1.2s): the rest of the page mounts in
long blocks as it starts, and a flight begun then would stutter. While it
flies, its path is worked out from the logo's box every frame, so a layout
that settles late (styles or fonts arriving on a first load) carries the
path with it. It leaves simply, like a page change: the words, number, filament
and wordmark clear (`EASE.in`, 0.4s) as the night settles to one flat colour;
then the screen breaks into squares (12 across on phones, 20 on desktop) that
clear row by row from the top with a little jitter (0.6s), uncovering the
hero's first frame, so the footage never moves or fades in. Meanwhile the
mark, cloud while it loads, turns cornflower (0.4s) and flies alone to the
top left. The mark is a bird facing right (its head the long piece up to the
right), cut into a body, a wing and the head, which fill it exactly at rest
(`src/lib/markFlight.ts`). Both of its flights follow paths Jose drew,
smooth curves through waypoints (`ENTER_PATH`, `EXIT_PATH`), its wings
beating. It points along its path all the way: its body (tail to beak) on
the line it is flying, nose up as it climbs, nose down as it dives, turning
with every bend. Where the path bends back on itself it would end up upside
down, so there it rolls over along its line of flight, head first, like a
bird banking (0.6s: the head rolls first on its neck, then the body after
it from the neck to the tail). Coming onto its line as it takes off, and off it as
it settles, it bends into the new angle head first (the beak first, the tail
last) rather than turning stiffly; and the last bend of each path meets the
mark nearly level, so there is little left to straighten as it lands. On the way in (2.3s, already
flying, slowing in) it comes from beyond the right edge, high along the top
facing left, then loops down round its place and curls up into it, turning
to face right; it settles there while the filament fills. On the way out
(1.9s, ease in-out) it lifts and curls left over its place, swoops down
through the middle, rises to the top left and hooks round onto the site's
logo, turning back to face right as it comes in and touching down exactly
on it, wings still, as the logo, which takes over
(the hero's opening no longer animates the logo). `FlyingMark` beats its
wings on the spot; the lab's "Mark · Flight" runs both, the journey with slow
motion and the beat with its settings.
Phones lay the line out as a column: the word at the top, the logo and the
filament dead centre, the number at the foot (they leave up and down). The glow rising along the bottom and the dots
fading up are the first moves of the opening. The Vote for Venty tab arrives
with the loading screen, above it, and is already in. The lab's "Loader ·
Filament" runs it on a bench, with slow motion.

## Section hand-offs

| Pattern | How | Used |
| --- | --- | --- |
| Dither rise | The next section is pulled up over the last screen of the one before (`margin-top: -100svh`, higher `z-index`), so it scrolls up over the pinned, still section 1:1 with the scroll. Above its top edge its colour dithers in (`DitherEdge`): an 8px screen grid, each cell 4 x 4 squares of 2px switching on in Bayer order, denser toward the edge, over a band 32% of the screen tall with a soft noise wobble. The grid is fixed to the screen, so squares flip on in place as the edge rises. Its entrance plays as it comes into view: the headline as soon as it is on screen (its top at `85%`), the rig and the composer once the section's top is halfway up (`top 50%`). Overlapping theme zones resolve to the later one (`ThemeZones`); a zone can switch at its own point with `data-theme-at` | Hero to Made to measure |

Every hand-off uses the same edge (12 Oct: one edge, for consistency): the
2px squares with the slow moving wave, the one from the closing scene into the
footer, in the colour of the section rising. All edges share one WebGL context
and one shader (`DitherEdge`, `getRenderer`).

| From → to | Rising | Over |
| --- | --- | --- |
| Hero → Made to measure | cloud | the pinned video |
| How it works → Features | night | the held last step, 1.3 screens: its layers part as you scroll (the meadow, cards and objects fly up at 0.9x, the valley rises at 0.55x so its peaks come into view); Features rises over the last screen of it |
| What you can make → On the line | cloud | the held last garment (desktop) |
| FAQ → The designer | night | the FAQ's empty foot |
| Closing scene → footer | cloud | the held last line |

The footer ends the bird's journey: when its lockup (white, over the meadow) comes into view, the bird glides in from beyond the left edge in one arc (`FOOTER_IN`, 2.8s) and lands in its place, where at the top of the page it flew out of the loader's lockup. While the lockup is on screen it keeps coming and going, always left to right, the way it faces, so it never turns round: rests 7s, lifts away in one arc beyond the right edge (`FOOTER_OUT`, 2.6s), and 4s later comes in from the left again. It flies over the sky's words and behind the two glass panels; cornflower in the air, it takes the wordmark's white as it settles and turns cornflower again as it lifts off. Over the hills, two banks of fog drift at different speeds (one seamless texture, `tools/footer/fog.cjs`, slid by a transform). Behind it the meadow moves in the wind: Jose's video on a seamless loop (its end cross-faded into its start), cut to the hills' mist by a mask made from the still's transparency; it loads only near the footer, fades in over its first frame once playing, and pauses off screen (media/README.md). Venty's phrases drift along a curve over the hills (an SVG `animate` on the text's start, 60s a loop); the Vote ticket's QUT mark builds as the horizon reveals.

A pinned section that something rises over holds one extra screen, still, at
its end. Without a pin (phones, the FAQ), the band rises through empty room
left at the foot of the section before (about 42svh), never over content.
Night meets night with a stitched seam instead (Features → What you can make).

## Keeping it fast

Measured with a headless Chrome profile (top-to-bottom scroll, frame times
per section, long tasks, bytes before the page opens). Rules that came out
of it:

- Nothing animates off screen. JS loops start and stop with an
  IntersectionObserver (`DitherEdge`, the Made with line);
  CSS loops pause under `[data-off]` (`PauseOffscreen.tsx`).
- Move and fade with `transform` and `opacity` only. A light that follows
  the pointer is a disc moved by a transform, not a gradient redrawn at a
  new position (the Features cards, which light only under the pointer,
  with a mouse, and run nothing otherwise). Custom properties inherit: writing
  one on a big element restyles everything inside it, every frame.
- No `filter: blur()` on things that move or animate: draw the soft light
  as a radial gradient instead (The designer, the closing glow).
- A scroll-scrubbed SVG scene is a stack of SVG layers, each moved as a
  whole with a CSS transform (the closing scene), not one SVG whose
  insides are animated.
- Never transition an inherited property (`color`, a custom property) on
  `<html>` or a big container: every element inherits each frame of it and
  the whole page restyles, 50ms and more a frame. The theme switch fades
  only backgrounds; text takes its colour from its own section.
- A loop on something hidden (opacity 0) still repaints its layer: run it
  only while it shows (the Mark up card's marching ants, which march while
  their selection is on or fading out, and are paused otherwise).
- Write to the DOM only when a value changes (the scrollbar, the glow).
- Heavy setup (a WebGL context, a shader compile) never runs at load: it
  waits for idle time after the loader, or for its section to come near.
- The hero sequence keeps every frame at full quality; the loader waits
  for a ready set (the opening, every 16th frame) and the rest stream in
  behind it, the frames nearest the playhead first.
- Images below the first screen are `loading="lazy"`; fonts are WOFF2.
