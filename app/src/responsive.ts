/** One breakpoint. Below it the product is the phone drawn on Figma page
 *  `07 Mobile`: a top bar, a single column, a floating bottom rail of four
 *  tabs plus More, and every sheet arriving from the bottom. */
export const MOBILE_MAX = 899

const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`)

export const isMobile = (): boolean => mq.matches

/** Fires only when the breakpoint is actually crossed, not on every resize,
 *  because a re-render throws away scroll position and focus. */
export function onBreakpointChange(fn: () => void): void {
  if ('addEventListener' in mq) mq.addEventListener('change', fn)
  else (mq as MediaQueryList).addListener(fn)
}
