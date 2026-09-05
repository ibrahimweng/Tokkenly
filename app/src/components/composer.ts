import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, eyebrow, type Place } from './shell'
import { card, cardHead, kv, callout as calloutEl } from './bits'
import { amountComposer, keypad } from './amount'
import { isMobile } from '../responsive'
import { current, closeSheet } from '../router'

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
  right: (v: number) => Node
  bottom?: Node
  /** The place the composer belongs to. On the phone the amount arrives as a
   *  sheet over this, because there is no second column to put context in. */
  base: () => HTMLElement
}

export function composerScreen(spec: ComposerSpec): HTMLElement {
  const mobile = isMobile()

  // A review or an outcome sheet replaces the composer sheet rather than
  // stacking on it, so the phone only ever shows one sheet at a time.
  if (mobile && current().sheet) return spec.base()

  const comp = amountComposer({
    initial: spec.initial,
    max: spec.max,
    note: spec.note,
    quick: spec.quick,
  })

  const summaryBox = h('div', { class: 'stack-8' })
  const rightBox = h('div', { class: 'stack grow' })
  const button = h('button', { class: 'btn btn-filled' })

  function paint(v: number): void {
    summaryBox.replaceChildren(...spec.summary(v).map(([k, val, cls]) => kv(k, val, cls ?? '')))
    if (!mobile) rightBox.replaceChildren(spec.right(v))
    button.textContent = spec.action(v)
    button.toggleAttribute('disabled', v <= 0 || v > spec.max)
  }
  comp.onChange(paint)
  button.addEventListener('click', () => {
    const v = comp.get()
    if (v > 0 && v <= spec.max) spec.onAction(v)
  })
  paint(spec.initial)

  if (mobile) {
    const panel = h('div', { class: 'sheet' },
      h('div', { class: 'grabber' }),
      h('div', { class: 'sheet-head' },
        h('h2', { text: spec.title }),
        h('button', { class: 'close', ariaLabel: 'Back', html: icon.close(),
          on: { click: () => history.back() } })),
      comp.el,
      keypad(comp),
      summaryBox,
      button)
    const scrim = h('div', { class: 'scrim' }, panel)
    const base = spec.base()
    base.appendChild(scrim)
    return base
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
