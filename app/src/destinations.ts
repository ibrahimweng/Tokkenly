import { state } from './state'

export type Place = 'home' | 'wallet' | 'market' | 'grow' | 'history' | 'account'

export interface Destination {
  label: string
  to: string
  place: Place
  /** A place is a top level tab. An action does something. A screen is a
   *  view you land on. The distinction is what the index groups by. */
  kind: 'place' | 'action' | 'screen'
  /** Words a person might type that are not in the label. */
  also?: string
  /** Appears as a tab under its place's header. */
  tab?: boolean
  hint?: string
}

/** One list, read by the jump-to overlay, the index, the breadcrumbs and the
 *  tabs. Four navigators that disagree are worse than one, so they share a
 *  source rather than each keeping their own. */
export const DESTINATIONS: Destination[] = [
  { label: 'Home', to: '/', place: 'home', kind: 'place', also: 'dashboard overview start' },

  { label: 'Wallet', to: '/wallet', place: 'wallet', kind: 'place', tab: true, also: 'cash balance dollars' },
  { label: 'Add money', to: '/addmoney', place: 'wallet', kind: 'action', tab: true, also: 'buy dollars fund top up naira deposit', hint: 'Naira in, dollars out' },
  { label: 'Send money', to: '/send', place: 'wallet', kind: 'action', tab: true, also: 'pay transfer', hint: 'Pay a person or a wallet' },
  { label: 'Receive money', to: '/receive', place: 'wallet', kind: 'action', tab: true, also: 'address qr get paid', hint: 'Your address and code' },
  { label: 'Convert to naira', to: '/convert', place: 'wallet', kind: 'action', tab: true, also: 'cash out withdraw bank payout', hint: 'Dollars out, naira into your bank' },
  { label: 'Your banks', to: '/wallet?sheet=banks', place: 'wallet', kind: 'screen', tab: true, also: 'account number gtbank kuda payout' },

  { label: 'Market', to: '/market', place: 'market', kind: 'place', tab: true, also: 'stocks shares invest browse' },
  { label: 'Apple', to: '/market/aapl', place: 'market', kind: 'screen', also: 'aapl stock company' },
  { label: 'Invest in Apple', to: '/market/aapl/invest', place: 'market', kind: 'action', also: 'buy aapl shares' },
  { label: 'Sell Apple', to: '/market/aapl/sell', place: 'market', kind: 'action', also: 'aapl shares' },

  { label: 'Grow', to: '/grow', place: 'grow', kind: 'place', tab: true, also: 'earn borrow interest' },
  { label: 'Move money into Earn', to: '/grow/earn', place: 'grow', kind: 'action', tab: true, also: 'save interest yield', hint: '4.8% a year, paid daily' },
  { label: 'Take money out of Earn', to: '/grow/takeout', place: 'grow', kind: 'action', tab: true, also: 'withdraw earn', hint: 'Any time, no fee' },
  { label: 'Borrow', to: '/grow/borrow', place: 'grow', kind: 'action', tab: true, also: 'loan against shares credit', hint: 'Against the shares you own' },
  { label: 'Repay', to: '/grow/repay', place: 'grow', kind: 'action', tab: true, also: 'pay back loan owed', hint: 'Clear what you owe' },

  { label: 'History', to: '/history', place: 'history', kind: 'place', tab: true, also: 'activity statement transactions' },
  { label: 'Payments', to: '/history?filter=payments', place: 'history', kind: 'screen', tab: true, also: 'sent received' },
  { label: 'Trades', to: '/history?filter=trades', place: 'history', kind: 'screen', tab: true, also: 'bought sold shares' },
  { label: 'Grow activity', to: '/history?filter=grow', place: 'history', kind: 'screen', tab: true, also: 'interest borrowed repaid' },

  { label: 'Account', to: '/account', place: 'account', kind: 'place', tab: true, also: 'profile details name address' },
  { label: 'Security', to: '/security', place: 'account', kind: 'screen', tab: true, also: 'pin face id recovery phrase devices sign out' },
  { label: 'Support', to: '/support', place: 'account', kind: 'screen', tab: true, also: 'help questions contact email us' },
  { label: 'Everything', to: '/all', place: 'account', kind: 'screen', tab: true, also: 'all screens index directory sitemap' },
]

export const PLACE_LABEL: Record<Place, string> = {
  home: 'Home', wallet: 'Wallet', market: 'Market',
  grow: 'Grow', history: 'History', account: 'Account',
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '')

/** The path without its query, which is how a destination is recognised. */
const bare = (to: string) => to.split('?')[0]

export function tabsFor(place: Place): Destination[] {
  return DESTINATIONS.filter((d) => d.place === place && d.tab)
}

/** Where you are, as a trail you can step back up. */
export function trailFor(path: string, query: URLSearchParams): Destination[] {
  const here = DESTINATIONS.find((d) => {
    const [p, q] = d.to.split('?')
    if (p !== path) return false
    if (!q) return true
    return new URLSearchParams(q).get('filter') === query.get('filter')
  })
  if (!here) return []
  const root = DESTINATIONS.find((d) => d.place === here.place && d.kind === 'place')
  const trail: Destination[] = []
  if (root && root !== here) trail.push(root)
  // A stock's action sits under the stock, which sits under Market.
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'market' && parts[1] && parts[2]) {
    const stock = DESTINATIONS.find((d) => bare(d.to) === `/${parts[0]}/${parts[1]}`)
    if (stock && stock !== here) trail.push(stock)
  }
  trail.push(here)
  return trail
}

export interface Hit { label: string; to: string; group: string; hint?: string }

/** Places and actions first, then the things she actually has: the people she
 *  pays, what she holds, and any reference she can read off a receipt. */
export function search(raw: string): Hit[] {
  const q = norm(raw.trim())
  if (!q) {
    return DESTINATIONS.filter((d) => d.kind !== 'screen' || d.tab)
      .slice(0, 8)
      .map((d) => ({ label: d.label, to: d.to, group: PLACE_LABEL[d.place], hint: d.hint }))
  }
  const hits: Hit[] = []
  for (const d of DESTINATIONS) {
    const hay = norm(d.label + ' ' + (d.also ?? '') + ' ' + PLACE_LABEL[d.place])
    if (hay.includes(q)) hits.push({ label: d.label, to: d.to, group: PLACE_LABEL[d.place], hint: d.hint })
  }
  for (const p of state.holdings) {
    if (norm(p.ticker + ' ' + p.name).includes(q)) {
      hits.push({ label: p.name, to: '/market/' + p.ticker.toLowerCase(), group: 'Your shares',
                  hint: `${p.ticker} · ${p.shares.toFixed(2)} shares` })
    }
  }
  const seenWho = new Set<string>()
  for (const a of state.activity) {
    if (a.kind === 'payment' && !seenWho.has(a.who) && norm(a.who).includes(q)) {
      seenWho.add(a.who)
      hits.push({ label: a.who, to: '/send?to=' + encodeURIComponent(a.who), group: 'People', hint: 'Send money' })
    }
  }
  for (const a of state.activity) {
    if (norm(a.ref).includes(q)) {
      hits.push({ label: a.ref, to: '/history?sheet=receipt&ref=' + a.ref, group: 'Receipts',
                  hint: `${a.type} · ${a.who}` })
    }
  }
  return hits.slice(0, 12)
}
