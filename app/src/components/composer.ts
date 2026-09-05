import { h } from '../ui'
import { shell, pageHeader, eyebrow, type Place } from './shell'
import { card, cardHead, kv, callout as calloutEl } from './bits'
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
  /** How it presents on a wide screen. Most composers are a screen of their
   *  own, the way Figma draws Add money, Convert, Invest, Borrow, Earn, Repay
   *  and Take out. Send is a dialog over the wallet, the way Figma draws D09.
   *  The phone shows a sheet either way. */
  present?: 'screen' | 'modal'
  /** Where closing the dialog goes. Ignored when it presents as a screen. */
  closeTo?: string
  /** A row above the amount, for a dialog that needs to name its target. */
  lede?: () => Node
}

export function composerScreen(spec: ComposerSpec): HTMLElement {
  const mobile = isMobile()
  const overlaid = mobile || spec.present === 'modal'

  // A review or an outcome replaces the composer rather than stacking on it,
  // so only one thing is ever floating over the base.
  if (overlaid && current().sheet) return spec.base()

  const comp = amountComposer({
    initial: spec.initial,
    max: spec.max,
    note: spec.note,
    quick: spec.quick,
  })

  const summaryBox = h('div', { class: 'stack-8' })
  const rightBox = h('div', { class: 'stack grow' })
  const button = h('button', { class: 'btn btn-primary' })

  function paint(v: number): void {
    summaryBox.replaceChildren(...spec.summary(v).map(([k, val, cls]) => kv(k, val, cls ?? '')))
    if (!overlaid && spec.right) rightBox.replaceChildren(spec.right(v))
    button.textContent = spec.action(v)
    button.toggleAttribute('disabled', v <= 0 || v > spec.max)
  }
  comp.onChange(paint)
  button.addEventListener('click', () => {
    const v = comp.get()
    if (v > 0 && v <= spec.max) spec.onAction(v)
  })
  paint(spec.initial)

  if (overlaid) {
    const leave = () => (spec.closeTo && !mobile ? go(spec.closeTo) : history.back())
    const out = modalOver(spec.base(), spec.title, leave,
      spec.lede ? spec.lede() : null,
      comp.el,
      // The keypad is the phone's way in. A dialog has a keyboard already, and
      // room for the sentence the phone has to drop.
      mobile ? keypad(comp) : null,
      summaryBox,
      mobile ? null : calloutEl(spec.callout),
      button)
    if (mobile) out.querySelector('.sheet')?.prepend(h('div', { class: 'grabber' }))
    return out
  }

  const left = card(
    cardHead(spec.cardLabel, h('span', { class: 'muted', text: spec.cardRight })),
    comp.el, summaryBox, calloutEl(spec.callout), button)
  left.style.width = '456px'
  left.style.flex = 'none'

  return shell(
    spec.place,
    pageHeader(spec.title, eyebrow(spec.eyebrow[0], spec.eyebrow[1])),
    h('div', { class: 'row' }, left, rightBox),
    spec.bottom ?? null
  )
}

/** A three column scenario table. Borrow shows what a fall does, Earn shows
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
