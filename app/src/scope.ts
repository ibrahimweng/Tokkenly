/** The lifetime of one drawing of the screen.
 *
 *  This app replaces its whole tree on every change rather than unmounting
 *  anything, so nothing is ever told it has gone. Listeners on `window` and
 *  `document`, resize observers and intervals all outlived the elements that
 *  set them up — a composer left a resize listener behind on every keystroke
 *  that changed state, and the rate clock on a review kept ticking after the
 *  review was replaced. Several cleaned themselves up on the next event,
 *  which is not the same as cleaning up: a keydown listener that removes
 *  itself on the next keypress is a listener that is still there until
 *  somebody presses a key.
 *
 *  So every render gets a signal, and the render after it aborts it. Anything
 *  that has to outlive a single element but not the screen it was drawn on
 *  passes `scope()` to `addEventListener`, or listens for its `abort`. */

let current = new AbortController()

/** The signal for whatever is being drawn now. */
export const scope = (): AbortSignal => current.signal

/** Ends the last drawing's listeners and starts a new lifetime. Called by the
 *  renderer, once, before it builds the next tree. */
export function nextScope(): AbortSignal {
  current.abort()
  current = new AbortController()
  return current.signal
}

/** Runs `fn` when the current drawing is replaced. */
export function onTeardown(fn: () => void): void {
  const s = current.signal
  if (s.aborted) { fn(); return }
  s.addEventListener('abort', fn, { once: true })
}
