import { shares, usd } from './format'
import { state } from './state'
import { CATALOGUE } from './catalogue'

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
  /** Worth showing in the palette before anyone types. */
  primary?: boolean
  hint?: string
}

/** One list, read by the jump-to overlay, the index, the breadcrumbs and the
 *  tabs. Four navigators that disagree are worse than one, so they share a
 *  source rather than each keeping their own. */
export const DESTINATIONS: Destination[] = [
  { label: 'Home', to: '/', place: 'home', kind: 'place', also: 'dashboard overview start' },

  { label: 'Transfer', to: '/transfer', place: 'wallet', kind: 'place', primary: true, also: 'wallet cash balance dollars move money' },
  { label: 'Add money', to: '/addmoney', place: 'wallet', kind: 'action', primary: true, also: 'buy dollars fund top up naira deposit', hint: 'Naira in, dollars out' },
  { label: 'Send money', to: '/send', place: 'wallet', kind: 'action', primary: true, also: 'pay transfer', hint: 'Pay a person or a wallet' },
  { label: 'Receive money', to: '/receive', place: 'wallet', kind: 'action', primary: true, also: 'address qr get paid base wallet address 0x copy', hint: 'Your address and code' },
  { label: 'Withdraw to your bank', to: '/withdraw', place: 'wallet', kind: 'action', primary: true, also: 'convert cash out naira bank payout', hint: 'Dollars out, naira into your bank' },
  { label: 'Your banks', to: '/transfer?sheet=banks', place: 'wallet', kind: 'screen', primary: true, also: 'account number gtbank kuda payout' },

  { label: 'Invest', to: '/invest', place: 'market', kind: 'place', primary: true, also: 'market stocks shares etfs browse buy' },
  { label: 'Your bucket', to: '/bucket', place: 'market', kind: 'screen', primary: true,
    also: 'basket cart picked saved pay later checkout', hint: 'Companies you have picked, not yet paid for' },
  { label: 'Apple', to: '/invest/aapl', place: 'market', kind: 'screen', also: 'aapl stock company' },
  { label: 'Invest in Apple', to: '/invest/aapl/invest', place: 'market', kind: 'action', also: 'buy aapl shares' },
  { label: 'Sell Apple', to: '/invest/aapl/sell', place: 'market', kind: 'action', also: 'aapl shares' },
  { label: 'Send Apple to someone', to: '/invest/aapl/send', place: 'market', kind: 'action',
    also: 'gift give transfer aapl shares to a person', hint: 'To another Tokkenly account' },

  { label: 'Grow', to: '/grow', place: 'grow', kind: 'place', primary: true, also: 'earn borrow interest' },
  { label: 'Move money into Earn', to: '/grow/earn', place: 'grow', kind: 'action', primary: true, also: 'save interest yield', hint: '4.8% a year, paid daily' },
  { label: 'Take money out of Earn', to: '/grow/takeout', place: 'grow', kind: 'action', primary: true, also: 'withdraw earn', hint: 'Any time, no fee' },
  { label: 'Borrow', to: '/grow/borrow', place: 'grow', kind: 'action', primary: true, also: 'loan against shares credit', hint: 'Against the shares you own' },
  { label: 'Repay', to: '/grow/repay', place: 'grow', kind: 'action', primary: true, also: 'pay back loan owed', hint: 'Clear what you owe' },

  { label: 'Activity', to: '/activity', place: 'history', kind: 'place', primary: true, also: 'history statement transactions receipts' },
  { label: 'Payments', to: '/activity?filter=payments', place: 'history', kind: 'screen', primary: true, also: 'sent received' },
  { label: 'Trades', to: '/activity?filter=trades', place: 'history', kind: 'screen', primary: true, also: 'bought sold shares' },
  { label: 'Grow activity', to: '/activity?filter=grow', place: 'history', kind: 'screen', primary: true, also: 'interest borrowed repaid' },
  { label: 'Notifications', to: '/activity?filter=alerts', place: 'history', kind: 'screen', primary: true,
    also: 'alerts bell unread told me announcements sign in filled', hint: 'What we have told you' },

  { label: 'Account', to: '/account', place: 'account', kind: 'place', primary: true, also: 'profile settings preferences options' },
  // Every settings group is its own address, so the palette can take somebody
  // straight to the one control they came for rather than to a list of eight.
  { label: 'Personal details', to: '/account/details', place: 'account', kind: 'screen', primary: true,
    also: 'name email phone address date of birth download my data' },
  { label: 'Preferences', to: '/account/preferences', place: 'account', kind: 'screen', primary: true,
    also: 'theme dark light home screen simple detailed naira bucket default intro' },
  { label: 'Notifications', to: '/account/notifications', place: 'account', kind: 'screen', primary: true,
    also: 'alerts buzz push prices payments earn borrowing',
    // Two screens carry the word: the ones you were sent, and the switches
    // that decide which get sent. The hint is what tells them apart in a list.
    hint: 'Choose what is worth a buzz' },
  { label: 'Security', to: '/account/security', place: 'account', kind: 'screen', primary: true,
    also: 'pin password face id recovery phrase devices sign out everywhere' },
  { label: 'Change your PIN', to: '/account/security?sheet=pin', place: 'account', kind: 'action', primary: true,
    also: 'four digits passcode new pin', hint: 'Four digits, for opening the app and large payments' },
  { label: 'Change your password', to: '/account/security?sheet=password', place: 'account', kind: 'action', primary: true,
    also: 'new password reset change sign in', hint: 'The one you sign in with' },
  { label: 'Payment methods', to: '/account/payments', place: 'account', kind: 'screen', primary: true,
    also: 'banks account number gtbank kuda payout fees what it costs' },
  { label: 'Verify your identity', to: '/verify', place: 'account', kind: 'action', primary: true,
    also: 'kyc nin bvn identity check limits raise lift', hint: 'Raises what you can move' },
  { label: 'Support', to: '/account/support', place: 'account', kind: 'screen', primary: true, also: 'help questions contact email us' },
  { label: 'Risk and legal', to: '/account/legal', place: 'account', kind: 'screen', primary: true,
    also: 'close my account delete data disclosures terms' },
  { label: 'Risk and disclosures', to: '/disclosures', place: 'account', kind: 'screen', primary: true,
    also: 'risk terms legal fees eligibility what you own custodian', hint: 'What you own, what it costs, what can go wrong' },
  { label: 'Everything', to: '/all', place: 'account', kind: 'screen', primary: true, also: 'all screens index directory sitemap' },
]

export const PLACE_LABEL: Record<Place, string> = {
  home: 'Home', wallet: 'Transfer', market: 'Invest',
  grow: 'Grow', history: 'Activity', account: 'Account',
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '')

/** The path without its query, which is how a destination is recognised. */
const bare = (to: string) => to.split('?')[0]

/** Where you are, as a trail you can step back up. */
export function trailFor(path: string, query: URLSearchParams): Destination[] {
  const here = DESTINATIONS.find((d) => {
    const [p, q] = d.to.split('?')
    if (p !== path) return false
    if (!q) return true
    return new URLSearchParams(q).get('filter') === query.get('filter')
  })
  // A step inside a flow keeps the flow's trail. /verify/number is not its own
  // destination and should not be — but losing the way back on step two of
  // four is worse than a slightly generic crumb.
  const step = here ?? DESTINATIONS.find((d) => {
    const p = bare(d.to)
    return p !== '/' && path.startsWith(p + '/')
  })
  if (!step) return []
  return trailTo(step, path)
}

function trailTo(here: Destination, path: string): Destination[] {
  {
  const root = DESTINATIONS.find((d) => d.place === here.place && d.kind === 'place')
  const trail: Destination[] = []
  if (root && root !== here) trail.push(root)
  // A stock's action sits under the stock, which sits under Invest.
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'invest' && parts[1] && parts[2]) {
    const stock = DESTINATIONS.find((d) => bare(d.to) === `/${parts[0]}/${parts[1]}`)
    if (stock && stock !== here) trail.push(stock)
  }
  trail.push(here)
  return trail
  }
}

export interface Hit { label: string; to: string; group: string; hint?: string }

/** Places and actions first, then the things she actually has: the people she
 *  pays, what she holds, and any reference she can read off a receipt. */
export function search(raw: string): Hit[] {
  const q = norm(raw.trim())
  if (!q) {
    return DESTINATIONS.filter((d) => d.kind !== 'screen' || d.primary)
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
      hits.push({ label: p.name, to: '/invest/' + p.ticker.toLowerCase(), group: 'Your shares',
                  hint: `${p.ticker} · ${shares(p.shares)} shares` })
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
      hits.push({ label: a.ref, to: '/activity?sheet=receipt&ref=' + a.ref, group: 'Receipts',
                  hint: `${a.type} · ${a.who}` })
    }
  }

  // Everything you could buy, not only what you already hold. This is a
  // product for buying shares, and typing "Microsoft" found nothing unless
  // you owned some — which is the wrong way round for a search box on a shop.
  const held = new Set(state.holdings.map((p) => p.ticker))
  for (const c of CATALOGUE) {
    if (held.has(c.ticker)) continue          // already listed under Your shares
    if (!norm(`${c.ticker} ${c.name} ${c.tags.join(' ')}`).includes(q)) continue
    hits.push({ label: `${c.ticker} · ${c.name}`, to: '/invest/' + c.ticker.toLowerCase(),
                group: c.kind === 'etf' ? 'Funds' : 'Companies', hint: usd(c.price) })
  }

  // A number in the query is an amount, and the three things you can do with
  // one are two keystrokes away rather than a screen and a keypad away.
  // Only when the whole query is an amount. Stripping the non-digits out of
  // anything turned the reference TKN-8F2K90 into "Send $8,290.00", which is
  // a suggestion nobody asked for attached to a number that does not exist.
  const asAmount = raw.trim().match(/^\$?\s*([\d,]+(?:\.\d{1,2})?)$/)
  if (asAmount && Number(asAmount[1].replace(/,/g, '')) > 0) {
    const v = Number(asAmount[1].replace(/,/g, ''))
    hits.unshift(
      { label: `Send ${usd(v)}`, to: '/send?v=' + v, group: 'Move money', hint: 'Pick who, then confirm' },
      { label: `Add ${usd(v)}`, to: '/addmoney?v=' + v, group: 'Move money', hint: 'Naira in, dollars out' },
      { label: `Withdraw ${usd(v)}`, to: '/withdraw?v=' + v, group: 'Move money', hint: 'Dollars out to your bank' },
    )
  }

  // A name that starts with what you typed is a better answer than one that
  // merely contains it, and the list was in source order — so the destination
  // registry always outranked the company you were actually looking for.
  const starts = (hit: Hit) => (norm(hit.label).startsWith(q) ? 0 : 1)
  return hits.sort((a, b) => starts(a) - starts(b)).slice(0, 12)
}
