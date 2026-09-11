import { h } from '../ui'
import { icon } from '../icons'
import { ASSETS, assetOf, netsFor, netOf, type Asset } from '../assets'
import { state, MASK } from '../state'
import { usd, naira } from '../format'
import { isMobile } from '../responsive'

/* ---------------------------------------------------------------------------
   Which of your balances, and on which network.

   Two controls, written once. Before this there was one balance and one
   network and neither was ever asked about, so every screen that moved money
   could get away with saying "your wallet" and "Base". Three balances and
   three networks later, a screen that does not ask is a screen that has
   guessed — and the guess it makes is the one that loses somebody's money.
   --------------------------------------------------------------------------- */

/** What each balance holds, in its own currency. */
export const balanceOf = (a: Asset): number =>
  a === 'ngn' ? state.naira : a === 'usdt' ? state.usdt : state.usdc

/** And how that reads.
 *
 *  In its own currency, always — not in whatever the account counts in. The
 *  setting decides what a *price* is quoted in and what a total comes to; it
 *  does not decide what unit a holding is in, because that is a fact about the
 *  holding. You hold 1,680 USDC. Printing that as ₦2,520,000 beside a second
 *  line reading ₦2,520,000 was the same number twice, which is what made the
 *  distinction obvious.
 *
 *  Masked with the rest of them when balances are hidden, and without the
 *  cents on a phone: "USDC $1,680.00" does not fit across a third of 390
 *  pixels and "USDC $1,680" does. */
export const balanceText = (a: Asset, full = true): string => {
  if (state.prefs.hideBalances) return MASK
  return a === 'ngn' ? naira(state.naira) : usd(balanceOf(a), full)
}

/** And what that is in the other one. */
export const balanceAlso = (a: Asset): string => {
  if (state.prefs.hideBalances) return MASK
  return a === 'ngn' ? usd(state.naira / state.ngnPerUsd) : naira(balanceOf(a) * state.ngnPerUsd)
}

/** A figure in the currency an asset is counted in. Naira are naira; both
 *  stablecoins are dollars, and saying "1,680 USDC" rather than "$1,680" would
 *  be inventing a unit for a thing that already has one. */
export const inAsset = (a: Asset, dollars: number): string =>
  a === 'ngn' ? naira(dollars * state.ngnPerUsd) : usd(dollars)

/** What it costs to move this much, out of this balance, given the naira it
 *  has to become. Naira pays naira; a stablecoin pays dollars. */
export const costIn = (a: Asset, dollars: number): string => inAsset(a, dollars)

/* -------------------------------------------------------------- the pills --

   One row, under the amount. "How much, and in what" is one question and it is
   answered in one place — and the balance is on the pill, because the only
   reason to look at this row is to find the balance that covers what you just
   typed. */

export function payRow(opts: {
  assets: Asset[]
  get: () => Asset
  set: (a: Asset) => void
  /** What this payment needs, so a balance that cannot cover it says so
   *  rather than being pressed and refused a screen later. */
  needs?: (a: Asset) => number
  label?: string
  /** What the second line says. The balance, normally, because the only reason
   *  to look at this row is to find the one that covers what you typed. On a
   *  screen that is receiving rather than spending there is nothing to cover,
   *  so it says what the token is instead. */
  says?: 'balance' | 'what'
}): HTMLElement {
  const row = h('div', { class: 'pay-row', role: 'group', ariaLabel: opts.label ?? 'Pay with' })
  const paint = (): void => {
    for (const c of row.children) {
      const el = c as HTMLElement
      el.setAttribute('aria-pressed', String(el.dataset.value === opts.get()))
    }
  }
  for (const key of opts.assets) {
    const a = assetOf(key)!
    const short = balanceOf(key) < (opts.needs?.(key) ?? 0)
    const pill = h('button', {
      class: 'pay-pill' + (short ? ' short' : ''), dataset: { value: key },
      on: { click: () => { opts.set(key); paint() } },
    },
      h('span', { class: 't-body-strong', text: a.name }),
      h('small', { text: opts.says === 'what' ? a.what
        : short ? 'Not enough' : balanceText(key, !isMobile()) }))
    row.appendChild(pill)
  }
  paint()
  return h('div', { class: 'stack-8 pay-block' },
    h('span', { class: 't-caps subtle', text: opts.label ?? 'Paying with' }), row)
}

/* ------------------------------------------------------------- the network --

   Every network that carries the asset, with what it costs and how long it
   takes on the row — because those are the two facts anybody is choosing
   between, and a list of names is a list of names. */

export function netRow(opts: {
  asset: Asset
  get: () => string
  set: (n: string) => void
  label?: string
}): HTMLElement | null {
  const nets = netsFor(opts.asset)
  if (!nets.length) return null
  const row = h('div', { class: 'pay-row' })
  const paint = (): void => {
    for (const c of row.children) {
      const el = c as HTMLElement
      el.setAttribute('aria-pressed', String(el.dataset.value === opts.get()))
    }
  }
  for (const n of nets) {
    row.appendChild(h('button', {
      class: 'pay-pill', dataset: { value: n.key },
      on: { click: () => { opts.set(n.key); paint() } },
    },
      h('span', { class: 't-body-strong', text: n.name }),
      h('small', { text: n.fee ? usd(n.fee, false) + ' · ' + n.takes : 'Free · ' + n.takes })))
  }
  paint()
  return h('div', { class: 'stack-8 pay-block' },
    h('span', { class: 't-caps subtle', text: opts.label ?? 'Network' }), row)
}

/** The pair, stated rather than offered: what a review says about an asset and
 *  a network it is not asking you to change. */
export function assetLine(asset: Asset, net?: string): string {
  const a = assetOf(asset)!
  const n = net ? netOf(net) : undefined
  return n ? `${a.name} on ${n.name}` : a.name
}

/* ------------------------------------------------------------- a balance row --
   The wallet's own list. A mark, a name, what it is, and the figure — the
   same anatomy as every other row in the product, so three balances read as
   three of one thing rather than as three arrangements. */

export function purseRow(key: Asset, onClick?: () => void): HTMLElement {
  const a = assetOf(key)!
  const nets = netsFor(key)
  const body = [
    h('span', { class: 'mark', html: key === 'ngn' ? icon.convert() : icon.coin() }),
    h('span', { class: 'two-line grow' },
      h('span', { class: 't-body-strong', text: a.name }),
      h('small', { text: nets.length ? nets.map((n) => n.name).join(' · ') : a.what })),
    h('span', { class: 'two-line right' },
      h('span', { class: 't-body-strong', text: balanceText(key) }),
      h('small', { class: 'muted', text: balanceAlso(key) })),
  ]
  if (!onClick) return h('div', { class: 'sheet-row' }, ...body)
  return h('button', { class: 'sheet-row', on: { click: onClick } }, ...body,
    h('span', { class: 'muted', html: icon.chevron() }))
}

/** Every balance, in the order they are offered. */
export const purseRows = (onPick?: (a: Asset) => void): HTMLElement[] =>
  ASSETS.map((a) => purseRow(a.key, onPick ? () => onPick(a.key) : undefined))
