/* ------------------------------------------------------------------- swap --
   Two amounts that are the same amount.

   Every other composer in this product asks one question — how much — and the
   answer is one number. Converting asks it once but the answer has two faces:
   ₦25,000 and $16.67 are not two amounts, they are one amount written in the
   two units it is passing between. A single field made you hold the other face
   in your head, or read it off a summary row three lines down, and the summary
   row is where it had been living.

   So the card carries both, each in its own unit, and typing in either solves
   the other. Dollars are the pivot, because dollars are what the ledger posts
   in and what `actions.convert` takes; naira is a face, not a second truth.

   Why not `amountComposer`: that one is a field welded to a ruler, a hint and
   a row of chips, and eight screens depend on the weld. This needs the field
   and nothing else, twice, so it borrows the conventions — a real input, a
   decimal inputmode, formatted on blur, Enter commits — rather than the code. */

import { h } from '../ui'
import { icon } from '../icons'
import { card, kv, callout as calloutEl } from './bits'
import { parseAmount, naira, USD, NGN, type Unit } from '../format'
import { assetOf, type Asset } from '../assets'

export const unitFor = (a: Asset): Unit => (a === 'ngn' ? NGN : USD)

/** Which of the hero's four colours each balance wears. Read off wallet.ts
 *  rather than chosen again: two lists that both decide what colour USDC is
 *  are two lists that will eventually disagree. */
const DOT: Record<Asset, string> = { usdc: 'a', usdt: 'd', ngn: 'c' }

/** One face of the amount, in dollars. */
export const toDollars = (a: Asset, n: number, rate: number): number =>
  a === 'ngn' ? n / rate : n

/** And back out of dollars, into the unit that asset is held in. Naira rounds
 *  to the naira: there has been no kobo in this product since item 23, and a
 *  field that offers to convert ₦16.67 is offering something that does not
 *  exist. */
export const fromDollars = (a: Asset, d: number, rate: number): number =>
  a === 'ngn' ? Math.round(d * rate) : d

export interface SwapSpec {
  from: Asset
  to: Asset
  rate: number
  /** Where the top field opens, in the `from` asset's own unit. */
  initial: number
  /** What you hold of `from`, in that unit. The only ceiling here: nothing
   *  crosses the boundary of the account, and the rule that caps movements
   *  exempts moving your own money between your own buckets by name. */
  ceiling: number
  /** What you already hold of `to`, in its unit. Not a ceiling — the
   *  receiving end has none — just the other half of the answer to "how much
   *  of each of these do I have", which is the question the rail used to
   *  answer and now nothing else does. */
  holdOfTo: number
  quick: { label: string; value: number }[]
  onPick: (side: 'from' | 'to') => void
  /** Flip the pair. Handed the figure the bottom field is holding, so the
   *  amount survives the turn rather than the card forgetting it. */
  onFlip: (carry: number) => void
  onAction: (dollars: number) => void
}

/** A field and the chip that names what it counts. */
function sideRow(o: {
  label: string
  asset: Asset
  unit: Unit
  value: number
  balance: string
  max?: () => void
  onPick: () => void
  onInput: (v: number) => void
  onSubmit: () => void
}): { el: HTMLElement; set: (v: number) => void } {
  const def = assetOf(o.asset)!
  const input = h('input', {
    type: 'text',
    inputmode: 'decimal',
    value: o.unit.fmt(o.value),
    ariaLabel: `${o.label}, in ${def.name}`,
  }) as HTMLInputElement

  input.addEventListener('input', () => o.onInput(parseAmount(input.value)))
  input.addEventListener('focus', () => input.select())
  input.addEventListener('blur', () => { input.value = o.unit.fmt(read()) })
  input.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key !== 'Enter') return
    e.preventDefault()
    o.onSubmit()
  })

  let held = o.value
  const read = () => held

  const el = h('div', { class: 'swap-row' },
    h('div', { class: 'swap-head' },
      // --muted, not --subtle: the row is --control, and --subtle on it is
      // 4.21:1 in dark, under the 4.5 a 12px label needs. 11g.36 made the
      // same measurement for the timeframe strip.
      h('span', { class: 't-caps muted', text: o.label }),
      // The balance sits with the token it belongs to, which is the only
      // place it means anything. Dropping the rail took the balances off the
      // screen; this puts them back where they are read rather than where
      // they were listed.
      h('span', { class: 'swap-bal' },
        h('span', { class: 'muted', text: o.balance }),
        o.max
          ? h('button', { class: 'link quiet swap-max', text: 'Max',
              on: { click: o.max } })
          : null)),
    h('div', { class: 'swap-field' },
      h('div', { class: 'swap-amount' }, input),
      h('button', { class: 'chip swap-token', on: { click: o.onPick } },
        // The same dot the Wallet's hero keys its four segments with. There
        // are no token logos in this product and inventing three here would
        // be a fourth place that has to agree about what USDC looks like.
        h('span', { class: 'dot ' + DOT[o.asset] }),
        h('span', { text: def.name }),
        h('span', { class: 'ic', html: icon.chevron() }))))

  return {
    el,
    set: (v) => {
      held = v
      if (document.activeElement !== input) input.value = o.unit.fmt(v)
    },
  }
}

export function swapCard(spec: SwapSpec): HTMLElement {
  const { from, to, rate } = spec
  const fu = unitFor(from)
  const tu = unitFor(to)
  const cross = from === 'ngn' || to === 'ngn'
  const fromDef = assetOf(from)!
  const toDef = assetOf(to)!

  // The top field is the one with a ceiling, so the top field is the one the
  // card keeps. Everything else is derived from it on every keystroke.
  let top = Math.max(0, Math.min(spec.ceiling, spec.initial))

  const dollars = () => toDollars(from, top, rate)
  const bottom = () => fromDollars(to, dollars(), rate)

  const action = h('button', { class: 'btn btn-primary btn-lg' })
  const rateRow = kv('Rate', cross ? '1 dollar = ' + naira(rate)
                                   : 'One for one · both are dollars')
  const feeRow = kv('Fee', 'No fee')

  const topRow = sideRow({
    label: 'You pay', asset: from, unit: fu, value: top,
    balance: fu.fmt(spec.ceiling),
    max: () => { top = spec.ceiling; sync() },
    onPick: () => spec.onPick('from'),
    onInput: (v) => { top = Math.min(spec.ceiling, Math.max(0, v)); sync() },
    onSubmit: () => fire(),
  })

  const botRow = sideRow({
    label: 'You get', asset: to, unit: tu, value: bottom(),
    balance: tu.fmt(spec.holdOfTo),
    onPick: () => spec.onPick('to'),
    // Typing into the receiving end is the same question asked from the other
    // side, so it back-solves and then re-clamps: ask for more naira than the
    // dollars can buy and the pair settles at what they can.
    onInput: (v) => {
      top = Math.min(spec.ceiling, Math.max(0, fromDollars(from, toDollars(to, v, rate), rate)))
      sync()
    },
    onSubmit: () => fire(),
  })

  /** Redraw everything the amount implies — both fields, every time.
   *
   *  It used to redraw only the bottom, on the theory that the top is the one
   *  being typed into. That is true exactly half the time: type into the
   *  receiving end and the field that needs rewriting is the other one, and
   *  the card sat there showing $100.00 next to ₦75,000, which is not a rate
   *  anybody has ever been offered. Each field declines the write while it has
   *  the caret, so "write both" and "do not fight the cursor" are one rule
   *  held in one place instead of a flag passed down from every caller. */
  function sync(): void {
    topRow.set(top)
    botRow.set(bottom())
    const d = dollars()
    action.textContent = 'Convert ' + fu.fmt(top)
    action.toggleAttribute('disabled', !(d > 0))
  }

  const fire = () => { const d = dollars(); if (d > 0) spec.onAction(d) }
  action.addEventListener('click', fire)

  const chips = h('div', { class: 'chip-row swap-quick' })
  for (const q of spec.quick) {
    if (q.value <= 0 || q.value > spec.ceiling + 0.5 / fu.minor) continue
    chips.appendChild(h('button', { class: 'chip', text: q.label,
      on: { click: () => { top = Math.min(spec.ceiling, q.value); sync() } } }))
  }

  const el = card(
    h('div', { class: 'swap' },
      topRow.el,
      // The flip sits between the two rows and on top of the seam, because it
      // is about the pair and not about either half of it.
      h('div', { class: 'swap-flip-rail' },
        h('button', { class: 'icon-btn swap-flip', ariaLabel:
            `Swap: convert ${toDef.name} into ${fromDef.name} instead`,
          on: { click: () => spec.onFlip(bottom()) } },
          h('span', { class: 'ic', html: icon.flip() }))),
      botRow.el),
    chips.children.length ? chips : null,
    h('div', { class: 'stack-8 swap-detail' }, rateRow, feeRow),
    calloutEl(cross
      ? 'You get a firm rate on the next screen. It is held for ninety seconds.'
      : 'This does not touch your limits. Both balances are yours before and after.'),
    action)

  sync()
  return el
}
