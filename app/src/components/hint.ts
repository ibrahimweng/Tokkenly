import { h } from '../ui'

/* ---------------------------------------------------------------------------
   A question mark, and the shortest true answer.

   The product had one way to explain anything: put another sentence on the
   screen. That is why the two Borrow & Lend cards each carried a headline, a
   sub-clause, three figures and a caption — five pieces of text for a feature
   whose whole idea is one word. Text that explains a thing sits beside it
   forever, read once by the person who needed it and re-read by nobody.

   So: progressive disclosure, with the trigger the research actually asks for.
   Nielsen Norman's rule is that the affordance must be persistent and
   discoverable and must work on a press, not only on a hover — a tooltip that
   appears on hover is a tooltip a phone cannot open and a keyboard cannot
   reach. This is a real button, 24px, in the tab order, with a label.

   Three rules it keeps, and they are what stop it becoming clutter:

     One per idea, and only where the idea is genuinely not in the words. If
     the row says "Lent out $1,240" nothing needs explaining. If it says
     "Against $12,509 in shares", the word doing the work is one a person new
     to this has never used.

     Forty words or fewer. A popover that scrolls is a screen that lost an
     argument with itself, and the honest response to needing more than a
     paragraph is a link to the place that holds the whole answer.

     It never holds a fact that only lives here. Anything material — what we
     would sell, what a loan costs — is on a screen as well. A popover is the
     shortest route to an answer, never the only one.
   --------------------------------------------------------------------------- */

/** How far the panel is kept from the edge of the window. */
const EDGE = 12
const WIDTH = 272

let open: (() => void) | null = null

/** Shuts whatever is open. Called by the next trigger, by Escape, by a click
 *  anywhere else, and by the app rebuilding its tree underneath one. */
export function closeHint(): void {
  open?.()
  open = null
}

export interface Hint {
  /** Two or three words. It is a heading, not a sentence. */
  title: string
  /** Forty words or fewer, in the words the person would use. */
  body: string
  /** Where the whole answer lives, when there is more of it than this. */
  more?: { label: string; onClick: () => void }
}

/** The trigger. Put it directly after the thing it explains — the label, not
 *  the figure: a question mark after a number reads as doubt about the
 *  number. */
export function hint(h1: Hint): HTMLElement {
  const button = h('button', {
    class: 'hint',
    // "What this means" rather than "Help": a screen reader hearing "help
    // button" twelve times learns nothing about which twelve.
    ariaLabel: 'What ' + h1.title.toLowerCase() + ' means',
    text: '?',
  })
  button.setAttribute('aria-expanded', 'false')
  button.setAttribute('type', 'button')

  button.addEventListener('click', (e) => {
    e.stopPropagation()
    if (button.getAttribute('aria-expanded') === 'true') { closeHint(); return }
    closeHint()
    show(button, h1)
  })
  return button
}

function show(trigger: HTMLElement, spec: Hint): void {
  popover(trigger, spec.title,
    h('span', { class: 't-body-strong', text: spec.title }),
    h('span', { class: 'muted', text: spec.body }),
    spec.more
      ? h('button', { class: 'link', text: spec.more.label,
          on: { click: () => { closeHint(); spec.more!.onClick() } } })
      : null)
}

/** A panel pinned under a trigger, closed by the next one, by Escape, by a
 *  press anywhere else, and by the app rebuilding its tree underneath it.
 *
 *  Written for the question mark and used by everything since that needs to
 *  put a few things somewhere without taking over the screen: the header's
 *  overflow on a phone, a filter, an order. One of these open at a time,
 *  which is the reason it is a module and not a component. */
export function popover(trigger: HTMLElement, label: string, ...body: (Node | null)[]): void {
  const panel = h('div', { class: 'pop', role: 'dialog', ariaLabel: label },
    ...body.filter(Boolean) as Node[])
  document.body.appendChild(panel)
  trigger.setAttribute('aria-expanded', 'true')

  place(trigger, panel)

  // Anywhere else closes it. `capture` so a press on another control shuts
  // this first and still does its own job — a popover that eats the click
  // that dismissed it makes people press everything twice.
  const away = (e: Event) => { if (!panel.contains(e.target as Node)) closeHint() }
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { closeHint(); trigger.focus() }
  }
  const move = () => place(trigger, panel)
  setTimeout(() => document.addEventListener('click', away, true), 0)
  document.addEventListener('keydown', key)
  addEventListener('scroll', move, true)
  addEventListener('resize', move)

  // The tree is rebuilt on every state change, so the trigger this panel is
  // pinned to is routinely no longer on the page. Without this the panel
  // outlives the row it was explaining.
  const watch = setInterval(() => { if (!trigger.isConnected) closeHint() }, 200)

  open = () => {
    clearInterval(watch)
    document.removeEventListener('click', away, true)
    document.removeEventListener('keydown', key)
    removeEventListener('scroll', move, true)
    removeEventListener('resize', move)
    panel.remove()
    trigger.setAttribute('aria-expanded', 'false')
  }
}

/** Under the trigger, nudged back inside the window rather than allowed to
 *  hang off the edge. Above it instead when there is no room below, which on
 *  a phone is most of the time. */
function place(trigger: HTMLElement, panel: HTMLElement): void {
  const t = trigger.getBoundingClientRect()
  const w = Math.min(WIDTH, innerWidth - EDGE * 2)
  panel.style.width = w + 'px'
  const hgt = panel.offsetHeight
  const below = innerHeight - t.bottom
  const up = below < hgt + EDGE && t.top > hgt + EDGE
  panel.style.top = (up ? t.top - hgt - 8 : t.bottom + 8) + 'px'
  // Centred on the trigger, then pushed back inside the window.
  const want = t.left + t.width / 2 - w / 2
  panel.style.left = Math.max(EDGE, Math.min(want, innerWidth - w - EDGE)) + 'px'
}
