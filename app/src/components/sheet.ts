import { h, append } from '../ui'
import { icon } from '../icons'
import { closeSheet } from '../router'
import { say } from '../announce'
import { spinCoin } from './coin'

/* ---------------- what makes a sheet a dialog ----------------

   A sheet was a div over a scrim. It looked modal and behaved like a panel
   that happened to be on top: no role, nothing naming it, focus left wherever
   it was, and Tab walking straight through into the wallet underneath. A
   keyboard user could open Send and reach the Convert button behind it.

   Four things make it real, and they are the same four for both shapes below,
   so they live in one function. */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const focusables = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)

/** Which dialog has already been handed focus. The app rebuilds the whole tree
 *  on every state change, dialog included, so "focus it on mount" would drag
 *  the caret back to the panel every time anything in it changed. Keyed on the
 *  address, which is what actually identifies a dialog here. */
let focusedFor = ''

/** Called by the render loop when it draws a screen with nothing over it. */
export function dialogClosed(): void { focusedFor = '' }

function asDialog(scrim: HTMLElement, panel: HTMLElement, onClose: () => void): void {
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  panel.tabIndex = -1

  // Named by its own heading wherever it has one — the head's <h2>, or the
  // outcome sheet's, which sits under the tick instead. Only when it has
  // neither does it fall back to a label of its own.
  const head = panel.querySelector('h2')
  if (head) {
    if (!head.id) head.id = 'dlg-' + Math.random().toString(36).slice(2, 8)
    panel.setAttribute('aria-labelledby', head.id)
  } else {
    panel.setAttribute('aria-label', 'Dialog')
  }

  // Tab stays inside. Without this the page behind is inert to the pointer and
  // wide open to the keyboard, which is the more common way in.
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return
    const items = focusables(panel)
    if (!items.length) { e.preventDefault(); return }
    const first = items[0]
    const last = items[items.length - 1]
    const on = document.activeElement
    if (e.shiftKey && (on === first || on === panel)) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && on === last) { e.preventDefault(); first.focus() }
  })

  requestAnimationFrame(() => {
    if (!scrim.isConnected) return
    const key = location.hash
    // A new dialog takes focus. So does a rebuilt one that has lost it: the
    // tree can be replaced twice in a row, once for the state and once for the
    // route, and the discarded panel takes the focus with it — leaving the
    // caret on <body> with a dialog on screen. What this must not do is pull
    // focus off a control inside the dialog somebody is already using.
    const adrift = document.activeElement === document.body || document.activeElement === null
    if (focusedFor === key && !adrift) return
    focusedFor = key
    // The panel rather than its first control, so a screen reader reads what
    // this is before it reads what to do about it.
    panel.focus()
  })

  void onClose
}

/** One sheet shape for the whole product: 480 wide, radius 28, a head with a
 *  close, then whatever the flow needs. design.md 11b.4e. */
export function sheet(title: string, ...body: (Node | false | null)[]): HTMLElement {
  const panel = h('div', { class: 'sheet' })
  panel.appendChild(
    h(
      'div',
      { class: 'sheet-head' },
      // An outcome sheet leads with a tick and names itself below it, so it
      // passes no title here. It was still emitting the <h2>, empty, on every
      // successful payment — a heading with nothing in it is a rung on the
      // ladder that goes nowhere.
      title ? h('h2', { text: title }) : null,
      h('button', { class: 'close', ariaLabel: 'Close', html: icon.close(), on: { click: closeSheet } })
    )
  )
  append(panel, body)

  const scrim = h('div', {
    class: 'scrim',
    on: {
      click: (e) => {
        if (e.target === scrim) closeSheet()
      },
    },
  }, panel)

  // Escape closes, and the listener retires with the sheet it belongs to.
  const onKey = (e: KeyboardEvent) => {
    if (!scrim.isConnected) {
      removeEventListener('keydown', onKey)
      return
    }
    if (e.key === 'Escape') closeSheet()
  }
  addEventListener('keydown', onKey)
  asDialog(scrim, panel, closeSheet)
  return scrim
}

/** A dialog over a screen, addressed by its own path rather than ?sheet=.
 *  Send and Receive work this way: Figma draws them as D09 and D12, a modal
 *  over the wallet, not as screens of their own. Closing goes somewhere real
 *  because there is no sheet parameter to drop. */
export function modalOver(
  base: HTMLElement,
  title: string,
  onClose: () => void,
  ...body: (Node | false | null)[]
): HTMLElement {
  const panel = h('div', { class: 'sheet' },
    h('div', { class: 'sheet-head' },
      h('h2', { text: title }),
      h('button', { class: 'close', ariaLabel: 'Close', html: icon.close(), on: { click: onClose } })))
  append(panel, body)
  const scrim = h('div', {
    class: 'scrim',
    on: { click: (e) => { if (e.target === scrim) onClose() } },
  }, panel)
  const onKey = (e: KeyboardEvent) => {
    if (!scrim.isConnected) { removeEventListener('keydown', onKey); return }
    if (e.key === 'Escape') onClose()
  }
  addEventListener('keydown', onKey)
  asDialog(scrim, panel, onClose)
  // The screen this is drawn over goes inert — out of the tab order, out of
  // the accessibility tree and deaf to the pointer. Child by child, because
  // the dialog is about to become a child too and must not inert itself.
  for (const el of [...base.children]) el.setAttribute('inert', '')
  base.appendChild(scrim)
  return base
}

export function figure(label: string, value: string, cls = '', note = ''): HTMLElement {
  return h('div', { class: 'figure' },
    h('span', { class: 't-caps subtle', text: label }),
    h('span', { class: 't-display-xl ' + cls, text: value }),
    // Whether it is finished. It was a boxed callout at the foot of the sheet,
    // which is 68px and the last place anybody looks for the status of the
    // number at the top. It belongs with the number.
    note ? h('span', { class: 'muted t-caption', text: note }) : null)
}

/** The facts of a record or a review.
 *
 *  One fact per row is right for four of them and wrong for eight. The buy
 *  review ran 832px on a desktop and scrolled on a phone, and a receipt for a
 *  trade ran 952 and scrolled on both — so the sheet where money is agreed to
 *  and the sheet that is the record of it were the two longest dialogs in the
 *  product, which is exactly backwards.
 *
 *  Past four facts the panel pairs them into two columns, which halves the
 *  height and hides nothing. A value too long to sit in half a sheet takes the
 *  whole width instead of wrapping into a column of ragged two-line cells. */
export function panel(...rows: [string, string][]): HTMLElement {
  const p = h('div', { class: 'panel' + (rows.length > 4 ? ' pairs' : '') })
  for (const [label, value] of rows) {
    p.appendChild(h('div', { class: 'cell' + (value.length > 20 ? ' wide' : '') },
      h('span', { class: 't-caps subtle', text: label }),
      h('span', { class: 't-body-strong', text: value })))
  }
  return p
}

/** The same facts, with the ones nobody opened this for folded away.
 *
 *  A receipt for a trade was the tallest dialog in the product: nine facts, a
 *  company, a year of its price and three buttons, at 952px on a desktop and
 *  scrolling on a phone. Pairing the rows was not enough on its own.
 *
 *  What stays is what somebody opens a receipt to check — who it was with,
 *  what they got, what it came to, and the reference they are matching against
 *  a statement. What folds is the arithmetic behind the total and the state of
 *  the holding afterwards: still here, one press away, and no longer the reason
 *  the sheet does not fit.
 *
 *  Only for a record. A review states every term it is asking agreement to,
 *  and folding one of those would be hiding a term behind a button. */
export function foldPanel(keep: number, rows: [string, string][]): HTMLElement {
  const p = panel(...rows)
  if (rows.length <= keep + 1) return p
  const cells = [...p.children] as HTMLElement[]
  const hidden = cells.slice(keep)
  for (const c of hidden) c.hidden = true
  let open = false
  const more = h('button', {
    class: 'panel-more', text: hidden.length + ' more details',
  })
  more.setAttribute('aria-expanded', 'false')
  more.addEventListener('click', () => {
    open = !open
    for (const c of hidden) c.hidden = !open
    more.textContent = open ? 'Fewer details' : hidden.length + ' more details'
    more.setAttribute('aria-expanded', String(open))
  })
  p.appendChild(more)
  return p
}

/** The outcome sheet: a tick, what happened, the record, and a way on. */
export function outcome(
  title: string,
  line: string,
  rows: [string, string][],
  primary: { label: string; onClick: () => void },
  secondary?: { label: string; onClick: () => void },
  /** Whether this outcome is one to be pleased about. A trade that settled is;
   *  one that did not come back confirmed is not, and a coin turning happily
   *  over "Still settling" would be the product celebrating its own failure. */
  opts: { celebrate?: boolean } = {},
): HTMLElement {
  // The reveal. Deliberately not confetti: this is the moment money left the
  // account, and an animation that rewards that is one working for the product
  // against the person — which is what Robinhood's confetti on executed orders
  // was found to be. What is celebrated here is completion, not the trade — a
  // coin turning, in the product's own dots, then the words and the record
  // arriving after it in the order somebody reads them.
  const glad = opts.celebrate !== false
  const el = sheet(
    '',
    glad ? spinCoin() : h('div', { class: 'tick', html: icon.check() }),
    h('div', { class: 'figure' },
      // The outcome's own heading, where it actually reads: "Sent", "Bought",
      // "Still settling". It was a span, so the sheet had no heading at all
      // beyond the empty one in its head.
      h('h2', { class: 't-title', text: title }),
      h('span', { class: 'muted', text: line })),
    panel(...rows),
    h('button', { class: 'btn btn-primary', text: primary.label, on: { click: primary.onClick } }),
    secondary
      ? h('button', { class: 'btn btn-secondary', text: secondary.label, on: { click: secondary.onClick } })
      : null
  )
  el.querySelector('.sheet')?.classList.add('sheet-done')
  if (glad) el.querySelector('.sheet')?.classList.add('sheet-glad')
  return el
}

let toastRail: HTMLElement | null = null

/** A confirmation that goes away on its own.
 *
 *  It was unannounced and it took itself off the screen after 2,600ms with no
 *  way to hold it — content on a timer the reader does not control, which is a
 *  WCAG 2.2.1 failure on its own and, more plainly, is how somebody who reads
 *  slowly never finds out what happened to their money.
 *
 *  Three changes. It is announced, politely, so it reaches a screen reader at
 *  all. The countdown pauses while a pointer is over it or anything in it has
 *  focus, and starts again when they leave. And it can be dismissed, which is
 *  also the only way to be rid of one that is in the way. */
export function toast(message: string, tone: 'info' | 'success' | 'error' = 'info'): void {
  if (!toastRail) {
    toastRail = h('div', { class: 'toast-rail' })
    document.body.appendChild(toastRail)
  }
  const t = h('button', {
    class: 'toast' + (tone === 'info' ? '' : ' ' + tone),
    text: message,
    ariaLabel: message + '. Dismiss.',
    on: { click: () => t.remove() },
  })

  const LIFE = 2600
  let timer = 0
  const hold = () => { clearTimeout(timer); timer = 0 }
  const run = () => { hold(); timer = window.setTimeout(() => t.remove(), LIFE) }
  t.addEventListener('pointerenter', hold)
  t.addEventListener('focusin', hold)
  t.addEventListener('pointerleave', run)
  t.addEventListener('focusout', run)

  toastRail.appendChild(t)
  run()
  say(message)
}
