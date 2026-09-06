/** Minimal typed DOM builder. No framework, no virtual DOM: the router
 *  re-renders a screen wholesale, which is fast enough at this size. */

type Child = Node | string | number | null | undefined | false
type Props = {
  class?: string
  text?: string
  html?: string
  href?: string
  type?: string
  value?: string
  placeholder?: string
  disabled?: boolean
  hidden?: boolean
  inputmode?: string
  ariaCurrent?: string
  ariaPressed?: boolean | string
  ariaLabel?: string
  ariaLive?: string
  role?: string
  /** For a div that has to take the keyboard — the PIN pad is one. */
  tabIndex?: number
  title?: string
  dataset?: Record<string, string>
  style?: Partial<CSSStyleDeclaration>
  on?: Partial<{ [K in keyof HTMLElementEventMap]: (ev: HTMLElementEventMap[K]) => void }>
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  if (props.class) el.className = props.class
  if (props.text !== undefined) el.textContent = props.text
  if (props.html !== undefined) el.innerHTML = props.html
  if (props.href !== undefined) el.setAttribute('href', props.href)
  if (props.type !== undefined) el.setAttribute('type', props.type)
  if (props.value !== undefined) (el as HTMLInputElement).value = props.value
  if (props.hidden !== undefined) el.hidden = props.hidden
  if (props.placeholder !== undefined) el.setAttribute('placeholder', props.placeholder)
  if (props.disabled) el.setAttribute('disabled', 'true')
  if (props.inputmode) el.setAttribute('inputmode', props.inputmode)
  if (props.ariaCurrent) el.setAttribute('aria-current', props.ariaCurrent)
  if (props.ariaPressed !== undefined) el.setAttribute('aria-pressed', String(props.ariaPressed))
  if (props.ariaLabel) el.setAttribute('aria-label', props.ariaLabel)
  if (props.ariaLive) el.setAttribute('aria-live', props.ariaLive)
  if (props.role) el.setAttribute('role', props.role)
  if (props.tabIndex !== undefined) el.tabIndex = props.tabIndex
  if (props.title !== undefined) el.setAttribute('title', props.title)
  if (props.dataset) for (const [k, v] of Object.entries(props.dataset)) el.dataset[k] = v
  if (props.style) Object.assign(el.style, props.style)
  if (props.on) {
    for (const [name, fn] of Object.entries(props.on)) {
      el.addEventListener(name, fn as EventListener)
    }
  }
  append(el, children)
  return el
}

export function append(parent: Node, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue
    parent.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)))
  }
}

export function frag(...children: Child[]): DocumentFragment {
  const f = document.createDocumentFragment()
  append(f, children)
  return f
}

/** `<a>` that routes internally. Every navigation in the product goes through this. */
export function link(to: string, cls: string, ...children: Child[]): HTMLAnchorElement {
  const a = h('a', { class: cls, href: '#' + to })
  append(a, children)
  return a
}


/* ------------------------------------------------------------- continuity --
   The product has one curve and one duration for every state change, which is
   the right discipline and was already done. What it had none of is
   choreography: after a trade the balance simply became a different number,
   with nothing to connect the figure you were looking at to the figure you are
   looking at now. Carrying the eye across that gap is the cheapest thing in
   interface design that reads as expensive, and the only one here a person
   feels without being able to name it. */

/** What each keyed figure was showing last time it was drawn. The app rebuilds
 *  the DOM on every state change, so the previous value cannot be read back
 *  off the element — it has to be remembered. */
const lastShown = new Map<string, number>()

const still = (): boolean =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** A figure that travels to its new value rather than jumping to it. The first
 *  paint never animates: arriving on a screen is not a change. */
export function countTo(
  el: HTMLElement,
  key: string,
  to: number,
  fmt: (n: number) => string,
): void {
  const from = lastShown.get(key)
  if (from === undefined || from === to || still()) {
    lastShown.set(key, to)
    el.textContent = fmt(to)
    return
  }

  // Start from where the last figure was, so the first frame is continuous
  // with what was on screen rather than a jump followed by a crawl back.
  el.textContent = fmt(from)

  const MS = 520
  let begun = 0
  const step = (now: number): void => {
    if (!el.isConnected) {
      // This render was thrown away before it was ever seen — the app rebuilds
      // the whole tree and can do it twice in a row, once for the state and
      // once for the route. Leave the memory where it was so the render that
      // survives is the one that does the travelling; consuming the change
      // here is what made the balance jump.
      if (begun) lastShown.set(key, to)
      return
    }
    if (!begun) { begun = now; lastShown.set(key, to) }
    const t = Math.min(1, (now - begun) / MS)
    // The same shape as --ease: quick away, settling at the end.
    const eased = 1 - Math.pow(1 - t, 3)
    el.textContent = fmt(from + (to - from) * eased)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
