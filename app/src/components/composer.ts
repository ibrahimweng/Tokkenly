import { h } from '../ui'
import { shell, pageHeader, eyebrow, type Place } from './shell'
import { card, cardHead, kv, callout as calloutEl } from './bits'
import { amountComposer } from './amount'

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
}

/** Every amount screen in the product is this shape: the composer on the
 *  left, the context that makes the decision on the right, the history under
 *  both. Building it once is what keeps them consistent. */
export function composerScreen(spec: ComposerSpec): HTMLElement {
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
    rightBox.replaceChildren(spec.right(v))
    button.textContent = spec.action(v)
    button.toggleAttribute('disabled', v <= 0 || v > spec.max)
  }

  comp.onChange(paint)
  button.addEventListener('click', () => {
    const v = comp.get()
    if (v > 0 && v <= spec.max) spec.onAction(v)
  })

  const left = card(
    cardHead(spec.cardLabel, h('span', { class: 'muted', text: spec.cardRight })),
    comp.el,
    summaryBox,
    calloutEl(spec.callout),
    button
  )
  left.style.width = '456px'
  left.style.flex = 'none'

  paint(spec.initial)

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
