/** One breakpoint. Below it the product is the phone drawn on Figma page
 *  `07 Mobile`: a top bar, a single column, a floating bottom rail of four
 *  tabs plus More, and every sheet arriving from the bottom. */
export const MOBILE_MAX = 899

const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`)

export const isMobile = (): boolean => mq.matches

/** The width at which a list beside a panel stops being two columns and
 *  becomes two screens. Below this, settings is an index you navigate into;
 *  above it, the index stays on screen and the panel changes beside it. */
export const SPLIT_MIN = 1024

const split = window.matchMedia(`(min-width: ${SPLIT_MIN}px)`)

export const isSplit = (): boolean => split.matches

/** Fires only when the breakpoint is actually crossed, not on every resize,
 *  because a re-render throws away scroll position and focus. */
export function onBreakpointChange(fn: () => void): void {
  for (const q of [mq, split]) {
    if ('addEventListener' in q) q.addEventListener('change', fn)
    else (q as MediaQueryList).addListener(fn)
  }
}
