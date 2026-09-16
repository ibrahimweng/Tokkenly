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
   is the day that sum has to go, and this is where it would show first. */

import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, eyebrow } from '../components/shell'
import { composerScreen } from '../components/composer'
import { state, money, moneyNaira } from '../state'
import { usd, naira } from '../format'
import { go, openSheet, closeSheet } from '../router'
import { isSplit } from '../responsive'
import { walletScreen } from './wallet'
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

/* --------------------------------------------------------------- the rail --
   Which balance you are converting out of. The same shape as Send's three
   ways, because it is the same question in the same place: a list of things on
   the left, the thing you picked filling the panel on the right. */
function convertRail(from?: Asset, to?: Asset,
                     pick?: (a: Asset) => void): HTMLElement {
  return h('nav', { class: 'set-list ways' + (from ? ' rail' : ''),
                    ariaLabel: 'What to convert out of' },
    ...KEYS.map((k) => {
      const def = assetOf(k)!
      const row = h('button', {
        class: 'set-row' + (k === from ? ' on' : ''),
        on: { click: () => (pick ? pick(k) : go(pathFor(k, k === to ? undefined : to))) },
      },
        h('span', { class: 'who' },
          h('span', { class: 'mark', html: icon.convert() }),
          h('span', { class: 'two-line' },
            h('span', { class: 't-body-strong', text: def.name }),
            // The balance, not the blurb. The only reason to read this list is
            // to find the balance with something in it.
            h('small', { text: balanceOf(k) }))),
        h('span', { class: 'muted set-chev', html: icon.chevron() }))
      if (k === from) row.setAttribute('aria-current', 'page')
      return row
    }))
}

/** The three, as the body of a sheet. The phone's way in, the same as Send's
 *  and Add money's: a question with three answers is a dialog. */
export const convertWays = (): HTMLElement =>
  convertRail(undefined, undefined, (a) => { closeSheet(); go(pathFor(a)) })

/** An address for a pair. A `to` that cannot follow this `from` is dropped
 *  rather than carried, so there is no address in the product that names a
 *  conversion of a thing into itself. */
function pathFor(from: Asset, to?: Asset): string {
  const other = to && to !== from ? to : others(from)[0]
  return `/convert/${from}/${other}`
}

/* ------------------------------------------------------------ the composer --
   One question — how much — with the pair stated above it and the arithmetic
   under it. The amount is in dollars whatever the pair is, because that is the
   one denomination every composer in this product works in, and a field that
   changed currency under somebody's hand would be a fourth way to enter an
   amount on a product that decided there were two. What changes is what the
   rows underneath say, which is where the naira belongs. */
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
  const cross = crossesCurrency(from, to)
  const split = isSplit()
  // The ceiling is what you hold, full stop. Not `movementCeiling`: nothing
  // here crosses the boundary of the account, and the rule that caps movements
  // exempts moving your own money between your own buckets by name.
  const ceiling = from === 'ngn' ? held('ngn') / rate : held(from)
  const fromDef = assetOf(from)!
  const toDef = assetOf(to)!

  // One step, not two. The registry already has /convert as the parent of
  // every pair, so a screen that also names itself gets "Wallet › Convert ›
  // Convert › USDC to Naira" — the trail saying where you are twice because
  // two things both thought it was their job.
  const steps = [{ label: `${fromDef.name} to ${toDef.name}` }]

  // Chips in the unit somebody thinks in. Out of naira they are naira, out of
  // dollars they are dollars, and both are stored as the dollars the field
  // holds — which is the whole reason the field is one denomination.
  const quick = from === 'ngn'
    ? [10_000, 25_000, 50_000].map((n) => ({ label: naira(n), value: n / rate }))
      .concat([{ label: 'All', value: ceiling }])
    : [50, 100, 250].map((n) => ({ label: usd(n, false), value: n }))
      .concat([{ label: 'All', value: ceiling }])

  const spec = {
    place: 'wallet' as const,
    base: () => convertPicker(from, to),
    // What it is turning into, above the amount. The rail on the left already
    // says what it is coming out of; this is the half the rail cannot show,
    // and on a phone there is no rail so it carries both.
    lede: () => h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle compose-label', text: 'Into' }),
      ...others(from).map((k) => {
        const def = assetOf(k)!
        const on = k === to
        return h('button', {
          class: 'sheet-row' + (on ? ' on' : ''),
          style: { background: on ? 'var(--control)' : 'transparent' },
          ariaPressed: String(on),
          on: { click: () => go(pathFor(from, k)) },
        },
          h('span', { class: 'mark', html: icon.convert() }),
          h('span', { class: 'two-line grow' },
            h('span', { class: 't-body-strong', text: def.name }),
            h('small', { text: def.what })),
          on ? h('span', { class: 'muted', html: icon.check() }) : null)
      })),
    title: 'Convert',
    eyebrow: [fromDef.name + ' available', figureOf(from, held(from))] as [string, string],
    cardLabel: 'How much',
    cardRight: fromDef.name + ' ' + figureOf(from, held(from)),
    initial: Math.min(from === 'ngn' ? 25_000 / rate : 100, ceiling),
    max: ceiling,
    maxLabel: `What you hold in ${fromDef.name}`,
    note: cross
      ? `${fromDef.name} out of your wallet, ${toDef.name} into it. Nothing leaves your account.`
      : 'Both are dollars, so one becomes the other with no rate in between.',
    quick,
    summary: (v: number): [string, string, string?][] => cross
      ? [
          ['Rate', '1 dollar = ' + naira(rate)],
          ['You give', figureOf(from, costs(from, v, rate))],
          ['You get', figureOf(to, gets(to, v, rate))],
          ['Fee', 'No fee'],
        ]
      : [
          ['Rate', 'One for one · both are dollars'],
          ['You give', usd(v) + ' of ' + fromDef.name],
          ['You get', usd(v) + ' of ' + toDef.name],
          ['Fee', 'No fee'],
        ],
    callout: cross
      ? 'You get a firm rate on the next screen. It is held for ninety seconds.'
      : 'This does not touch your limits. Both balances are yours before and after.',
    action: (v: number) => 'Convert ' + figureOf(from, costs(from, v, rate)),
    onAction: (v: number) =>
      openSheet('convert-review', { v: String(v), from, to }),
  }

  if (split) {
    return shell('wallet',
      pageHeader('Convert', eyebrow('Money you can spend', money(state.cash)), { steps }),
      h('div', { class: 'row set-split' },
        h('div', { class: 'stack set-col' }, convertRail(from, to)),
        h('div', { class: 'stack grow set-panel' },
          composerScreen({ ...spec, inline: true }))))
  }
  return composerScreen(spec)
}

/** The pair with nothing typed yet. Wide only: on a phone the three come up as
 *  a sheet over the wallet, the same as Send's do. */
function convertPicker(from: Asset, to: Asset): HTMLElement {
  return shell('wallet',
    pageHeader('Convert', eyebrow('Money you can spend', money(state.cash)),
      { steps: [{ label: `${assetOf(from)!.name} to ${assetOf(to)!.name}` }] }),
    h('div', { class: 'row set-split' },
      h('div', { class: 'stack set-col' }, convertRail(from, to)),
      h('div', { class: 'stack grow set-panel' })))
}

/** /convert with no pair. Wide: straight to the default pair, because a rail
 *  beside an empty panel is a screen that looks broken. Narrow: the three come
 *  up over the wallet, which is where the press came from. */
export function convertEntryScreen(): HTMLElement {
  const [from, to] = defaultPair()
  if (isSplit()) {
    queueMicrotask(() => go(pathFor(from, to), true))
    return convertPicker(from, to)
  }
  // Narrow: the three come up from the bottom over the wallet, and closing
  // them lands on the wallet rather than on a screen holding a title and three
  // rows with nowhere sensible to go back to.
  queueMicrotask(() => go('/transfer?sheet=convert-ways', true))
  return walletScreen()
}

