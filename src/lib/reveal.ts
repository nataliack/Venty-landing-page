/* Text reveals slide words up from behind a mask (overflow: clip). A mask
   the size of the line box cuts ascenders, descenders and letters that lean
   past their box (the g in "average", Bigilla's swashes), because headlines
   set line-height under 1. Every mask gets room on all sides, taken back with
   negative margins so the layout does not move. Hidden states then start a
   little lower than the mask's own height (HIDDEN). */

export const MASK_ROOM = { top: "0.3em", bottom: "0.36em", side: "0.14em" };

/** yPercent for text waiting below its (padded) mask */
export const HIDDEN = 160;

export function padMasks(masks: Element[]) {
  for (const m of masks) {
    const s = (m as HTMLElement).style;
    s.padding = `${MASK_ROOM.top} ${MASK_ROOM.side} ${MASK_ROOM.bottom}`;
    s.margin = `-${MASK_ROOM.top} -${MASK_ROOM.side} -${MASK_ROOM.bottom}`;
  }
}
