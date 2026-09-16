/* ---------------------------------------------------------------- convert --
   Turning one thing you hold into another thing you hold.

   The product has had conversion in it since the day it could pay a Nigerian
   bank, but never as a thing you could ask for. It happened on the way past:
   naira became dollars because you added money, dollars became naira because
   you paid somebody. Both are conversions with an errand attached, and neither
   of them is the errand "I have naira and I want dollars".

   That left a person with ₦145,000 sitting in a balance they could spend on
   airtime and nothing else, and the only route out of it was to pay it to
   their own bank account and add it back — two movements, two fees' worth of
   waiting, and a Nigerian bank in the middle of a journey that never needed to
   leave the building.

   So: one screen, three balances, six ordered pairs. The address carries both
   halves — /convert/usdc/ngn — because the last time a way through this
   product kept half its state out of the address, the trail could not name
   where you were and a refresh landed you somewhere else. Both halves in the
   path, both halves in the trail, and a bookmark that holds.

   What it is not: a market. There is no order book here and no slippage, and
   the two stablecoins convert one for one because this product already sums
   them into one dollar figure on four screens. The day that stops being true
   is the day that sum has to go, and this is where it would show first.

   ---- what the screen became ----

   It was built as a composer, because every other way of moving money here is
   one: a rail of what you hold on the left, a panel on the right asking how
   much, a ruler under the field. That shape is right when the question is "how
   much of this", and converting is not that question. Converting is "this, for
   that", and the two halves are equals — which is why every product that does
   it, from a bureau de change window to 1inch, draws two rows and a control
   between them rather than a list and a form.

   So the rail is gone, the ruler is gone, and the summary rows that read back
   "You give" and "You get" are gone too, because the two fields now say those
   things themselves and saying them twice was the whole reason the screen felt
   long. What is left is the pair, the flip, the rate, and the button.

   The balances came off the rail and went under the tokens they belong to,
   which is the only place they were ever read. And the two fields count in two
   different units — naira on the naira side, dollars on the dollar side —
   which is a deliberate exception to item 19, written up in design.md: one
   amount with two faces is not two ways to enter an amount. */

import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, eyebrow } from '../components/shell'
import { swapCard } from '../components/swap'
import { state, money, moneyNaira } from '../state'
import { usd, naira } from '../format'
import { go, openSheet, closeSheet } from '../router'
import { assetOf, purseFor, type Asset } from '../assets'
import * as ledger from '../ledger'

const KEYS: Asset[] = ['usdc', 'usdt', 'ngn']

export const isAsset = (s?: string): s is Asset => !!s && (KEYS as string[]).includes(s)

/** What you hold of one, in the unit it is held in. Off the ledger, because
 *  the balance a refusal is measured against has to be the same number the
 *  posting will be measured against a moment later. */
const held = (a: Asset): number => ledger.balanceOf(purseFor(a))

export const figureOf = (a: Asset, n: number): string => (a === 'ngn' ? naira(n) : usd(n))

/** The same figure, through the privacy switch. A balance is yours; a rate and
 *  a quote are not, which is why only this one is masked. */
const balanceOf = (a: Asset): string => (a === 'ngn' ? moneyNaira(held(a)) : money(held(a)))

/** Where the pair is normally pointed when nobody has said.
 *
 *  Dollars to naira, out of whichever stablecoin there is more of. It is the
 *  errand the naira balance exists for — money you can actually spend in Lagos
 *  — and picking the fuller purse means the first thing somebody sees is a
 *  screen that can do what it offers rather than one already refusing. */
export function defaultPair(): [Asset, Asset] {
  return [held('usdt') > held('usdc') ? 'usdt' : 'usdc', 'ngn']
}

/** The other two, in a fixed order, so the row does not reshuffle itself when
 *  a balance changes underneath somebody's hand. */
const others = (from: Asset): Asset[] => KEYS.filter((k) => k !== from)

/** Is a rate involved, or are both sides dollars. The one fact the whole
 *  screen branches on, named once. */
export const crossesCurrency = (from: Asset, to: Asset): boolean =>
  from === 'ngn' || to === 'ngn'

/** How much of `to` you get for `dollars` of value. */
export const gets = (to: Asset, dollars: number, rate: number): number =>
  to === 'ngn' ? Math.round(dollars * rate) : dollars

/** And how much of `from` it costs. */
export const costs = (from: Asset, dollars: number, rate: number): number =>
  from === 'ngn' ? Math.round(dollars * rate) : dollars

/** An address for a pair. A `to` that cannot follow this `from` is dropped
 *  rather than carried, so there is no address in the product that names a
 *  conversion of a thing into itself. */
function pathFor(from: Asset, to?: Asset): string {
  const other = to && to !== from ? to : others(from)[0]
  return `/convert/${from}/${other}`
}

/* The figure the flip hands forward.
 *
 *  Turning the pair over is a navigation — the address carries both halves, so
 *  it has to be — and a navigation renders the screen again from scratch. The
 *  amount would be forgotten at exactly the moment somebody has just told the
 *  screen what it is. It lives here for the one tick between the press and the
 *  next render, and is taken rather than read, so a later arrival at the same
 *  address by any other route opens fresh. Not in the address: an amount is
 *  not part of where you are, and nobody should be able to bookmark one. */
let carried: number | null = null
const takeCarried = (): number | null => {
  const v = carried
  carried = null
  return v
}

/* ------------------------------------------------------------ the pickers --
   The three, as the body of a sheet. One question with three answers is a
   dialog, the same as Send's ways and Add money's.

   Which side it is answering matters: picking on the top row changes what you
   are spending, picking on the bottom changes what you are getting, and
   picking the asset already on the other side turns the pair over instead of
   making a pair of one thing — which is the only sensible reading of asking
   to convert USDC into USDC. */
export function convertWays(sideRaw = '', fromRaw = '', toRaw = ''): HTMLElement {
  const side = sideRaw === 'to' ? 'to' : 'from'
  const from = isAsset(fromRaw) ? fromRaw : defaultPair()[0]
  const to = isAsset(toRaw) && toRaw !== from ? toRaw : others(from)[0]
  const current = side === 'to' ? to : from
  const other = side === 'to' ? from : to

  const choose = (k: Asset): void => {
    closeSheet()
    if (k === current) return
    // Asking for the thing on the other row is asking to turn the pair over.
    if (k === other) return go(pathFor(to, from))
    go(side === 'to' ? pathFor(from, k) : pathFor(k, to))
  }

  return h('nav', { class: 'set-list ways',
                    ariaLabel: side === 'to' ? 'What to convert into'
                                             : 'What to convert out of' },
    ...KEYS.map((k) => {
      const def = assetOf(k)!
      const on = k === current
      const row = h('button', {
        class: 'set-row' + (on ? ' on' : ''),
        on: { click: () => choose(k) },
      },
        h('span', { class: 'who' },
          h('span', { class: 'mark', html: icon.convert() }),
          h('span', { class: 'two-line' },
            h('span', { class: 't-body-strong', text: def.name }),
            // The balance, not the blurb. The only reason to open this list is
            // to find the balance with something in it.
            h('small', { text: balanceOf(k) }))),
        on ? h('span', { class: 'muted', html: icon.check() })
           : h('span', { class: 'muted set-chev', html: icon.chevron() }))
      if (on) row.setAttribute('aria-current', 'true')
      return row
    }))
}

/* ---------------------------------------------------------------- the card --
   One card, the same at every width. It was a sheet over the wallet on a
   phone, because a composer with a rail beside it has nowhere to stand on a
   390px screen — but this is four rows and a button, and four rows and a
   button is a page. */
export function convertScreen(fromRaw?: string, toRaw?: string): HTMLElement {
  const [dFrom, dTo] = defaultPair()
  const from: Asset = isAsset(fromRaw) ? fromRaw : dFrom
  const wanted: Asset = isAsset(toRaw) ? toRaw : from === dFrom ? dTo : others(from)[0]
  const to: Asset = wanted === from ? others(from)[0] : wanted

  // An address that named half a pair, or a pair of one thing, is the same
  // place as the address that names it properly. Replacing rather than
  // pushing: an old link should not cost a step somebody then presses back
  // through.
  if (!isAsset(fromRaw) || !isAsset(toRaw) || toRaw === fromRaw) {
    queueMicrotask(() => go(pathFor(from, to), true))
  }

  const rate = state.ngnPerUsd
  const ceiling = held(from)
  const fromDef = assetOf(from)!
  const toDef = assetOf(to)!

  // One step, not two. The registry already has /convert as the parent of
  // every pair, so a screen that also names itself gets "Wallet › Convert ›
  // Convert › USDC to Naira" — the trail saying where you are twice because
  // two things both thought it was their job.
  const steps = [{ label: `${fromDef.name} to ${toDef.name}` }]

  // Chips in the unit the field is in, which is now the unit somebody thinks
  // in on that side of the pair. Out of naira they are naira; out of dollars
  // they are dollars. No conversion on the way in or out any more — the field
  // and the chips finally count the same thing.
  const quick = from === 'ngn'
    ? [10_000, 25_000, 50_000].map((n) => ({ label: naira(n), value: n }))
        .concat([{ label: 'All', value: ceiling }])
    : [50, 100, 250].map((n) => ({ label: usd(n, false), value: n }))
        .concat([{ label: 'All', value: ceiling }])

  const opening = takeCarried() ?? (from === 'ngn' ? 25_000 : 100)

  return shell('wallet',
    pageHeader('Convert', eyebrow('Money you can spend', money(state.cash)), { steps }),
    h('div', { class: 'stack swap-page' },
      swapCard({
        from, to, rate,
        initial: Math.min(opening, ceiling),
        ceiling,
        holdOfTo: held(to),
        quick,
        onPick: (side) => openSheet('convert-ways', { side, from, to }),
        onFlip: (carry) => { carried = carry; go(pathFor(to, from)) },
        onAction: (dollars) =>
          openSheet('convert-review', { v: String(dollars), from, to }),
      })))
}

/** /convert with no pair: straight to the default one, at every width. The
 *  narrow route used to open the three over the wallet, because the screen
 *  behind them was a rail and an empty panel and looked broken. It is a card
 *  now, and a card with a sensible pair already in it is a better answer than
 *  a question. */
export function convertEntryScreen(): HTMLElement {
  const [from, to] = defaultPair()
  queueMicrotask(() => go(pathFor(from, to), true))
  return convertScreen(from, to)
}
