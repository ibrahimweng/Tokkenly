/** One breakpoint. Below it the product is the phone drawn on Figma page
 *  `07 Mobile`: a top bar, a single column, a floating bottom rail of four
 *  tabs plus More, and every sheet arriving from the bottom. */
export const MOBILE_MAX = 899

const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`)

export const isMobile = (): boolean => mq.matches

/** A tablet held upright.
 *
 *  It is under MOBILE_MAX and it always will be — 768, 810 and 834 are every
 *  iPad in portrait, and a finger is still a finger at 834 — so the shell it
 *  gets is the phone's: a floating nav bar, targets a thumb can find, sheets
 *  from the bottom. What it does not get is the phone's *layout*, because 834
 *  is twice 390 and the phone's layout does not stretch: three doors 92 tall
 *  become letterboxes, and a row puts a name at one edge and a figure at the
 *  other with four hundred pixels of nothing between them.
 *
 *  The height is in the query on purpose. A phone lying on its side is 844
 *  wide, which is inside this band, and it is 390 tall — two columns of doors
 *  with the pictures back is exactly the wrong answer for it. `min-height` is
 *  what tells a tablet from a phone that has been turned over. The CSS says
 *  the same thing in a media query, and the two have to be changed together. */
export const TOUCH_WIDE_MIN = 700
const wide = window.matchMedia(
  `(min-width: ${TOUCH_WIDE_MIN}px) and (max-width: ${MOBILE_MAX}px) and (min-height: 700px)`)
export const isWideTouch = (): boolean => wide.matches

/** The width at which a list beside a panel stops being two columns and
 *  becomes two screens. Below this, settings is an index you navigate into;
 *  above it, the index stays on screen and the panel changes beside it. */
export const SPLIT_MIN = 1024

const split = window.matchMedia(`(min-width: ${SPLIT_MIN}px)`)

export const isSplit = (): boolean => split.matches

/** Fires only when the breakpoint is actually crossed, not on every resize,
 *  because a re-render throws away scroll position and focus. */
export function onBreakpointChange(fn: () => void): void {
  for (const q of [mq, split, wide]) {
    if ('addEventListener' in q) q.addEventListener('change', fn)
    else (q as MediaQueryList).addListener(fn)
  }
}
