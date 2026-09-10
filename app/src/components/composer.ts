import { h } from '../ui'
import { icon } from '../icons'
import { USD, type Unit } from '../format'
import { shell, pageHeader, eyebrow, renderBase, type Place } from './shell'
import { card, cardHead, kv, callout as calloutEl, fieldError } from './bits'
import { amountComposer, keypad } from './amount'
import { isMobile } from '../responsive'
import { current, closeSheet, go } from '../router'
import { modalOver } from './sheet'

export interface ComposerSpec {
  place: Place
  title: string
  eyebrow: [string, string]
  cardLabel: string
  cardRight: string
  initial: number
  max: number
  note?: string
  /** How the ceiling names itself when someone asks for more than it. */
  maxLabel?: string
  quick?: { label: string; value: number }[]
  summary: (v: number) => [string, string, string?][]
  callout: string
  action: (v: number) => string
  onAction: (v: number) => void
  right?: (v: number) => Node
  bottom?: Node
  /** The place the composer belongs to. On the phone the amount arrives as a
   *  sheet over this, because there is no second column to put context in. */
  base: () => HTMLElement
  /** A row above the amount, for a composer that has to name its target.
   *  Send is the only one: the others are about your own money and the title
   *  says which pot. */
  lede?: () => Node
  /** Whether this flow carries the risks the disclosures describe. Buying,
   *  selling and borrowing do; moving your own money between your own
   *  accounts does not, and a legal link on a bank transfer is noise. */
  risky?: boolean
  /** A reason this particular amount must not go through, checked on every
   *  keystroke. Separate from the ceiling: a ceiling is about your account and
   *  says "not this much", a guard is about the market and says "not this
   *  trade". Both take the button away rather than letting somebody press it
   *  and be refused a screen later. */
  guard?: (v: number) => { title: string; why: string }[]
  /** Hand back the composing card on its own rather than a whole screen, for
   *  a caller that has somewhere of its own to put it. Send does: the three
   *  ways stay in a rail beside it while the amount is typed, so the composer
   *  is a panel in that screen and not a screen of its own. The phone is
   *  unaffected — there the composer is a sheet either way, because there is
   *  no second column to be beside. */
  inline?: boolean
  /** What the header says, when the caller is drawing the header itself. */
  header?: HTMLElement
  /** What this composer counts in. Dollars unless the screen says otherwise:
   *  airtime, data and electricity are priced and bought in naira, so the
   *  amount, the ceiling and the message that names the ceiling are all in
   *  naira and the dollar cost is a line in the summary. */
  unit?: Unit
}

/** The way to the full disclosures, under the button that takes the risk. The
 *  callout above it says the one sentence that matters; this is where the rest
 *  of it lives, rather than two screens away in settings. */
function riskLink(): HTMLElement {
  return h('p', { class: 'risk-link' },
    h('button', { class: 'link quiet', text: 'What you own, and what can go wrong',
      on: { click: () => go('/disclosures') } }))
}

/* ---------------------------------------------------------------------------
   One rule, both ways round.

   Composing is a screen; committing is a dialog. Every composer in the product
   is a place with an address, a title and room for the context beside it —
   what the loan does if the shares fall, what the last five orders were, who
   you can pay. Send and Receive were the two exceptions: dialogs over the
   wallet, so the one composer that most needs a list beside it had nowhere to
   put one, and Receive's warning about the network sat in a box you dismissed
   rather than on a page you can link somebody to.

   The phone has no second column, so there a composer is a sheet over its
   place — uniformly, all eight of them. The review, the PIN and the outcome
   are dialogs at every width, because those are commits.
   --------------------------------------------------------------------------- */

export function composerScreen(spec: ComposerSpec): HTMLElement {
  const mobile = isMobile()
  const overlaid = mobile

  // A review or an outcome replaces the composer rather than stacking on it,
  // so only one thing is ever floating over the base.
  if (overlaid && current().sheet) return renderBase(spec.base)

  // What the composer can actually open at. A screen asks for a comfortable
  // starting figure — $500 of a share, $300 out to a bank — without knowing
  // what this account is allowed to move, and an unverified account is
  // allowed $250. Opening above the ceiling left the field reading $500, the
  // receipt costing $500, and the button dead, with nothing on screen saying
  // why. Open at the ceiling instead, and say so.
  const opening = Math.min(spec.initial, spec.max)
  const openedCapped = spec.initial > spec.max

  const unit = spec.unit ?? USD
  const comp = amountComposer({
    initial: opening,
    max: spec.max,
    note: spec.note,
    quick: spec.quick,
    unit,
  })

  const capNote = fieldError()
  capNote.hidden = true
  // The market's refusal, not the account's. It reads as a callout rather than
  // a field error because it is not something typed wrongly — the amount is
  // fine and the book is not.
  const guardNote = calloutEl('', 'warning')
  guardNote.hidden = true
  const summaryBox = h('div', { class: 'stack-8 summary' })
  /* On a phone the terms fold to the three that are money.
   *
   *  The buy composer is 870 pixels of content in a 743-pixel dialog, so its
   *  own Buy button sits below the fold and has to be scrolled to — on the
   *  screen where money leaves. `trade.mjs` was written to catch exactly that
   *  and never saw it, because it was reading the first `.btn-primary` in the
   *  document and finding one on the page *behind* the dialog.
   *
   *  Nothing is dropped. What you cannot buy without seeing is what it costs
   *  and what it comes to; how many shares, the slippage floor and the gap to
   *  the real price open on one tap, and are all stated again on the review,
   *  which is the commit point. Item 61's ceiling holds either way: no dialog
   *  scrolls on a 390 by 844 phone. */
  const KEEP = 3
  let open = false
  const rightBox = h('div', { class: 'stack grow' })
  const button = h('button', { class: 'btn btn-primary' })

  function paint(v: number, capped = false): void {
    const rows = spec.summary(v).map(([k, val, cls]) => kv(k, val, cls ?? ''))
    if (!mobile || rows.length <= KEEP + 1) {
      summaryBox.replaceChildren(...rows)
    } else {
      const rest = rows.length - KEEP
      const more = h('button', {
        class: 'panel-more', text: open ? 'Fewer details' : rest + ' more details',
      })
      more.setAttribute('aria-expanded', String(open))
      more.addEventListener('click', () => { open = !open; paint(comp.get(), capped) })
      summaryBox.replaceChildren(...(open ? rows : rows.slice(0, KEEP)), more)
    }
    if (!overlaid && spec.right) rightBox.replaceChildren(spec.right(v))
    button.textContent = spec.action(v)
    // Every reason at once. A trade can be refused because it is paused *and*
    // too big for the book, and showing one of those sends somebody off to fix
    // half a problem — they come back with a smaller order and meet the pause
    // they were never told about.
    const stop = spec.guard?.(v) ?? []
    guardNote.hidden = !stop.length
    if (stop.length) {
      guardNote.replaceChildren(
        h('span', { html: icon.alert() }),
        h('div', { class: 'stack-8' },
          ...stop.map((s) => h('span', { class: 'two-line' },
            h('span', { class: 't-body-strong', text: s.title }),
            h('small', { text: s.why })))))
    }
    button.toggleAttribute('disabled', v <= 0 || v > spec.max || stop.length > 0)
    // Say why the figure stopped where it did, at the place it stopped.
    capNote.hidden = !capped
    if (capped) {
      capNote.replaceChildren(h('span', { html: icon.alert() }),
        h('span', { text: `${spec.maxLabel ?? 'The most you can use here'} is ${unit.fmt(spec.max)}.` }))
    }
  }
  comp.onChange(paint)
  const act = (): void => {
    const v = comp.get()
    if (v > 0 && v <= spec.max) spec.onAction(v)
  }
  button.addEventListener('click', act)
  // Enter in the amount field goes where the button goes. Same guard, because
  // a keystroke that skips a check the button runs is a second door.
  comp.onSubmit(act)
  paint(opening, openedCapped)

  if (overlaid) {
    const out = modalOver(renderBase(spec.base), spec.title, () => history.back(),
      spec.lede ? spec.lede() : null,
      comp.el, capNote,
      // The keypad is the phone's way in. A dialog has a keyboard already, and
      // room for the sentence the phone has to drop.
      mobile ? keypad(comp) : null,
      summaryBox, guardNote,
      mobile ? null : calloutEl(spec.callout),
      button,
      spec.risky ? riskLink() : null)
    if (mobile) {
      const panel = out.querySelector('.sheet')
      panel?.prepend(h('div', { class: 'grabber' }))
      // Named, so the two compressions that get this dialog under item 61's
      // ceiling land on the one dialog that needs them and on nothing else.
      panel?.classList.add('sheet-compose')
    }
    return out
  }

  const left = card(
    cardHead(spec.cardLabel, h('span', { class: 'muted', text: spec.cardRight })),
    spec.lede ? spec.lede() : null,
    comp.el, capNote, summaryBox, guardNote, calloutEl(spec.callout), button,
    spec.risky ? riskLink() : null)
  // A stated width, not an inline one: the stacking rule has to be able to
  // release it below 1240, and it cannot outrank a style attribute.
  left.classList.add('col-compose')

  // The card alone, for a screen that has its own shell to put it in.
  if (spec.inline) return left

  return shell(
    spec.place,
    pageHeader(spec.title, eyebrow(spec.eyebrow[0], spec.eyebrow[1])),
    h('div', { class: 'row' }, left, rightBox),
    spec.bottom ?? null
  )
}

/** A three column scenario table. Borrow shows what a fall does, Lend shows
 *  what the balance pays, Repay shows what each repayment leaves. */
export function scenarios(
  title: string,
  head: [string, string, string],
  rows: [string, string, string][]
): HTMLElement {
  const grid = h('div', { class: 'stack-12' })
  const line = (cells: [string, string, string], caps: boolean) =>
    h('div', { style: { display: 'flex', gap: '12px', alignItems: 'baseline' } },
      h('span', { class: caps ? 't-caps subtle' : 't-body-strong right', style: { width: '110px' }, text: cells[0] }),
      h('span', { class: caps ? 't-caps subtle' : 't-body-strong right', style: { width: '140px' }, text: cells[1] }),
      h('span', { class: caps ? 't-caps subtle grow right' : 'muted grow right', text: cells[2] }))
  grid.appendChild(h('span', { class: 't-caps subtle', text: title }))
  grid.appendChild(line(head, true))
  for (const r of rows) grid.appendChild(line(r, false))
  return grid
}

export { closeSheet }
