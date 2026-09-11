/** Minimal typed DOM builder. No framework, no virtual DOM: the router
 *  re-renders a screen wholesale, which is fast enough at this size. */

type Child = Node | string | number | null | undefined | false
type Props = {
  class?: string
  /** Only where something else has to point at it — a dialog naming its own
   *  heading, a skip link naming the content. Not a styling hook. */
  id?: string
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
  ariaLabelledby?: string
  ariaLive?: string
  ariaAtomic?: boolean | string
  ariaModal?: boolean | string
  ariaHidden?: boolean | string
  role?: string
  /** Takes a subtree out of the tab order, the accessibility tree and the
   *  pointer in one go. What a modal owes the page underneath it. */
  inert?: boolean
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
  if (props.id) el.id = props.id
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
  if (props.ariaLabelledby) el.setAttribute('aria-labelledby', props.ariaLabelledby)
  if (props.ariaLive) el.setAttribute('aria-live', props.ariaLive)
  if (props.ariaAtomic !== undefined) el.setAttribute('aria-atomic', String(props.ariaAtomic))
  if (props.ariaModal !== undefined) el.setAttribute('aria-modal', String(props.ariaModal))
  if (props.ariaHidden !== undefined) el.setAttribute('aria-hidden', String(props.ariaHidden))
  if (props.role) el.setAttribute('role', props.role)
  if (props.inert) el.setAttribute('inert', '')
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

/** What each keyed figure is showing right now. The app rebuilds the DOM on
 *  every state change, so the figure on screen cannot be read back off the
 *  element — it has to be remembered. The memory tracks the painted number
 *  frame by frame, not the destination: a render thrown away halfway through
 *  its travel hands the next one the figure the eye actually last saw. */
const lastShown = new Map<string, number>()

/** Which run owns each key. A rebuild starts a new one, and the old loop steps
 *  aside rather than fighting it for the same element's text. */
const owner = new Map<string, number>()
let runs = 0

const still = (): boolean =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------------------------------------------------------------------------
   Something on this screen just changed.

   This app rebuilds its whole tree on every state change, so the things that
   genuinely *change in place* — without a navigation and without a dialog —
   are the ones that do it themselves: a list narrowing as you type, the panel
   beside a rail becoming a different panel, a summary rewriting itself because
   you moved the amount, a row appearing because you turned something on.

   Those are exactly the changes nobody sees. There is no page turn to mark
   them and no scroll, so the screen is different and the eye was not told. The
   answer is small and consistent: what arrives fades up from eight pixels
   below, in the product's one curve, at the one duration set aside for this.

   Only what arrived. A stagger walks down a list so it reads as rows landing
   rather than a block appearing, and it is capped — a forty-row table that
   took eight hundred milliseconds to finish would be a table you wait for.

   It says nothing the first time a box is filled, because that is the screen
   being drawn rather than something changing on it — the same distinction
   `countTo` makes, for the same reason.

   It animates entrances and not exits, and that is a real limit rather than an
   oversight: an element that has been replaced is already gone by the time
   anything could animate it, and keeping the old tree alive to see it out
   would be a second copy of the truth for the sake of a fade. Written down
   rather than worked around.
   --------------------------------------------------------------------------- */

/** Replace what is inside something, and let what arrives say so. */
export function swap(host: Element, ...children: Child[]): void {
  host.replaceChildren()
  append(host, children)
  settle(host)
}

/** The same announcement, for content that arrived some other way — a row that
 *  stopped being hidden, a panel a caller filled itself. */
export function settle(host: Element): void {
  restart(host, 'swapped')
}

/** And for a thing that is itself the change rather than a box of changes: a
 *  warning appearing, a picture that is now a different picture. `swap` moves
 *  the children, which is right for a list and wrong for a hundred-and-
 *  twenty-one-cell QR code. */
export function settleSelf(el: Element): void {
  restart(el, 'swapped-self')
}

/* Which elements have already been drawn once, and in which of the two ways.
 *
 *  Filling a box for the first time is not a change — it is the screen being
 *  drawn — and `countTo` makes exactly this distinction for exactly this
 *  reason. Without it every one of these calls fired on first paint, which is
 *  a whole screen fading up when you arrive at it and, on `/all`, a heading
 *  measured at 3.5:1 by the contrast suite because it was still at 60%
 *  opacity. A full re-render makes new elements, so it drops out of this map
 *  on its own: only a box that survived its own repaint can animate. */
const drawn = new WeakMap<Element, Set<string>>()

function restart(el: Element, cls: string): void {
  if (still()) return
  let before = drawn.get(el)
  if (!before) drawn.set(el, (before = new Set()))
  if (!before.has(cls)) { before.add(cls); return }
  // Off and on again in one frame. Re-adding a class an element already has
  // does not restart a CSS animation, and the second time a list refilters is
  // exactly when somebody is watching for it.
  el.classList.remove(cls)
  void (el as HTMLElement).offsetWidth
  el.classList.add(cls)
}

/** Show or hide something, and let it arrive rather than appear.
 *
 *  Every note, warning and refusal in the product is drawn hidden and un-
 *  hidden when it applies, which means the one moment worth marking — the
 *  moment it starts applying — was a thing blinking into existence. */
export function show(el: HTMLElement, on: boolean): void {
  const was = el.hidden
  el.hidden = !on
  if (on && was) settleSelf(el)
}

/** A figure that travels to its new value rather than jumping to it. The first
 *  paint never animates: arriving on a screen is not a change. */
export function countTo(
  el: HTMLElement,
  key: string,
  to: number,
  fmt: (n: number) => string,
): void {
  const mine = ++runs
  owner.set(key, mine)

  const from = lastShown.get(key)
  // Half a cent apart is the same figure: the memory carries fractions the
  // formatter rounds away, and travelling between two identical strings is
  // half a second of nothing.
  if (from === undefined || Math.abs(to - from) < 0.005 || still()) {
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
    // Superseded, or this render was thrown away — the app rebuilds the whole
    // tree and can do it twice in a row, once for the state and once for the
    // route. Stop, leaving the memory on the last figure painted so the render
    // that survives carries on from there instead of landing.
    if (owner.get(key) !== mine || !el.isConnected) return
    if (!begun) begun = now
    const t = Math.min(1, (now - begun) / MS)
    // The same shape as --ease: quick away, settling at the end.
    const eased = 1 - Math.pow(1 - t, 3)
    const at = t < 1 ? from + (to - from) * eased : to
    lastShown.set(key, at)
    el.textContent = fmt(at)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
