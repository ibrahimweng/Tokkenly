/** One polite live region for the whole product.
 *
 *  There were none. The app replaces all of `#app` on every navigation, so a
 *  screen reader was told nothing when the page changed under it — no title, no
 *  landmark, no announcement — and the same was true of everything that appears
 *  without a page change: the sentence explaining a capped amount, the shortfall
 *  on the bucket, and every toast confirming that money had moved.
 *
 *  One region, polite, off screen, reused. Two regions compete and a rude one
 *  interrupts whatever the person was in the middle of reading, which on a
 *  money screen is usually a figure. */
let region: HTMLElement | null = null

function live(): HTMLElement {
  if (region) return region
  const el = document.createElement('div')
  el.className = 'sr-only'
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', 'polite')
  el.setAttribute('aria-atomic', 'true')
  document.body.appendChild(el)
  region = el
  return el
}

/** Say something once. Repeating the same string is a real case — two payments
 *  of the same amount — so the region is cleared first, since a live region
 *  whose text does not change announces nothing. */
export function say(message: string): void {
  if (!message) return
  const el = live()
  el.textContent = ''
  requestAnimationFrame(() => { el.textContent = message })
}

/** What the tab is called, and what a screen reader hears on arrival. The
 *  title was the fixed string "Tokkenly" on all twenty-six routes, which makes
 *  a browser history and a row of tabs useless as well as being silent. */
export function nameTheScreen(heading: string | null | undefined): void {
  const name = (heading ?? '').trim()
  document.title = name ? `${name} · Tokkenly` : 'Tokkenly'
  if (name) say(name)
}
