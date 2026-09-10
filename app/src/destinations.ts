import { shares, usd } from './format'
import { state } from './state'
import { CATALOGUE, CATEGORIES, catSlug, inCategory, pathOf, tradable } from './catalogue'

export type Place = 'home' | 'wallet' | 'market' | 'grow' | 'spend' | 'history' | 'account'

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
  /** The staff console. It shares the `account` group so it sorts with the
   *  rest of the settings, but it is nobody's parent except its own screens'. */
  staff?: boolean
  /** A thing on a page rather than a page.
   *
   *  A company has an address, and it needs one: the trail is built from this
   *  registry, so a company missing from it has no way back (11g.67). What it
   *  is not is a screen of the product. Invest, the three indices and the
   *  three groupings are the pages; the thirteen companies are rows on them,
   *  and listing all thirteen and their three actions each in the index of
   *  screens turned eight entries into thirty-three and told somebody reading
   *  it that Tokkenly has thirty-three places under Invest.
   *
   *  So: addressable, trailed, findable — and not listed as a screen. */
  item?: boolean
  hint?: string
}

/** Every company, generated from the catalogue.
 *
 *  This was four hand-written lines for Apple, and that is exactly how twelve
 *  of the thirteen ended up with no trail at all: the registry is what the
 *  breadcrumbs read, so a company missing from it got a bare title and no way
 *  back to Invest but the rail. Disney, Nike, Coca-Cola and nine others, on
 *  the screen the whole product is for. A list written by hand beside a list
 *  that grows is a list that will fall behind it, so this one is derived.
 *
 *  The page for all thirteen; the three actions only for the ones that can
 *  actually be bought. Offering "Invest in Disney" in a search box, when the
 *  screen behind it says Disney is not open for trading, is the same mistake
 *  as a button that refuses — and the address still carries a correct trail
 *  either way, because `trailFor` finds the company above it.
 */
/** The chips on Invest, each as a screen.
 *
 *  The card on Invest shows five rows and pages through the rest, so the rest
 *  need somewhere to be: a chip that filters a card is a filter, and a chip
 *  with a screen behind it is a place. 11g.65 argued against exactly this and
 *  was right at the time — a screen showing the same rows at a second address
 *  is a second door to one room — but the card is a five-row preview now, so
 *  the room is only behind the one door. */
const CATEGORY_PAGES: Destination[] = CATEGORIES.map((c) => ({
  // Not "everything you can buy": nine of the thirteen cannot be, and the
  // card three lines down says so.
  label: c === 'Everything' ? 'Everything listed' : c,
  to: '/invest/list/' + catSlug(c),
  place: 'market' as Place,
  kind: 'screen' as const,
  also: 'category filter chip ' + c + ' companies shares stocks',
  hint: `${inCategory(c).length} ${inCategory(c).length === 1 ? 'company' : 'companies and funds'}`,
}))

const COMPANIES: Destination[] = CATALOGUE.flatMap((c) => {
  const at = pathOf(c)
  const words = `${c.ticker} ${c.under} ${c.name} `
    + `${c.kind === 'etf' ? 'etf fund index tracker' : 'stock share company'} ${c.tags.join(' ')}`
  const page: Destination = { label: c.name, to: at, place: 'market', kind: 'screen',
    also: words, hint: c.plain, item: true }
  if (!tradable(c)) return [page]
  return [
    page,
    { label: 'Invest in ' + c.name, to: at + '/invest', place: 'market', kind: 'action',
      also: 'buy ' + words, item: true },
    { label: 'Sell ' + c.name, to: at + '/sell', place: 'market', kind: 'action',
      also: 'sell ' + words, item: true },
    { label: 'Send ' + c.name + ' to someone', to: at + '/send', place: 'market', kind: 'action',
      also: 'gift give transfer ' + words + ' to a person', hint: 'To another Tokkenly account',
      item: true },
  ]
})

/** One list, read by the jump-to overlay, the index, the breadcrumbs and the
 *  tabs. Four navigators that disagree are worse than one, so they share a
 *  source rather than each keeping their own. */
export const DESTINATIONS: Destination[] = [
  { label: 'Home', to: '/', place: 'home', kind: 'place', also: 'dashboard overview start' },

  { label: 'Wallet', to: '/transfer', place: 'wallet', kind: 'place', primary: true, also: 'transfer cash balance dollars move money convert' },
  { label: 'Add money', to: '/addmoney', place: 'wallet', kind: 'action', primary: true, also: 'buy dollars fund top up naira deposit', hint: 'Naira in, dollars out' },
  { label: 'Send money', to: '/send', place: 'wallet', kind: 'action', primary: true,
    also: 'pay transfer withdraw convert cash out naira bank payout wallet address',
    hint: 'To a person, a wallet or a bank' },
  // The three ways money comes in, as addresses of their own. Receive was a
  // second name for the Base one; it still resolves and goes there.
  { label: 'Bank transfer', to: '/addmoney/bank', place: 'wallet', kind: 'screen',
    also: 'naira nigerian account virtual deposit pay in', hint: 'Naira from any Nigerian bank' },
  { label: 'USDC on Base', to: '/addmoney/base', place: 'wallet', kind: 'screen',
    also: 'receive address qr get paid 0x copy wallet onchain', hint: 'Dollars from any Base wallet' },
  { label: 'Debit card', to: '/addmoney/card', place: 'wallet', kind: 'screen',
    also: 'card visa mastercard naira instant', hint: 'Naira on a card' },
  // The three ways to send, as addresses of their own. They were four cards on
  // one screen, which meant the palette could offer "Send money" and nothing
  // else, and the trail could not say which way somebody had taken.
  { label: 'Someone on Tokkenly', to: '/send/tokkenly', place: 'wallet', kind: 'screen',
    also: 'person friend name pay someone dollars instant', hint: 'Dollars, in about a minute' },
  { label: 'A bank account', to: '/send/bank', place: 'wallet', kind: 'screen',
    also: 'naira nigeria payout withdraw cash out gtbank kuda transfer account number',
    hint: 'Dollars out, naira in' },
  { label: 'USDC on Base', to: '/send/base', place: 'wallet', kind: 'screen',
    also: 'chain crypto wallet address 0x onchain network', hint: 'Dollars on the network' },
  // Still listed, because it is what people search for. It resolves into Send
  // with the destination already answered rather than to a screen of its own.

  { label: 'Your banks', to: '/transfer?sheet=banks', place: 'wallet', kind: 'screen', primary: true, also: 'account number gtbank kuda payout' },
  { label: 'Your naira account', to: '/account/payments', place: 'wallet', kind: 'screen', primary: true,
    also: 'virtual account number where to send naira deposit providus', hint: 'Where to send naira' },

  { label: 'Invest', to: '/invest', place: 'market', kind: 'place', primary: true, also: 'market stocks shares etfs browse buy' },
  // The three indices. They are not things you can hold, so they sit under
  // Invest as screens rather than as actions, and the trail reads
  // Invest › S&P 500 the same as it reads Invest › Apple.
  { label: 'S&P 500', to: '/invest/index/sp500', place: 'market', kind: 'screen',
    also: 'sp500 s&p index five hundred largest us market level', hint: 'The five hundred largest US companies' },
  { label: 'Nasdaq-100', to: '/invest/index/nasdaq', place: 'market', kind: 'screen',
    also: 'nasdaq index technology hundred qqq', hint: 'The hundred largest on the Nasdaq' },
  { label: 'Dow Jones', to: '/invest/index/dow', place: 'market', kind: 'screen',
    also: 'dow jones industrial average thirty index', hint: 'Thirty large American companies' },
  // The three groupings Invest ends in. Popular is not among them: it is a
  // chip on Invest that filters the market table, and a screen for it would be
  // that same list at a second address (11g.65).
  { label: 'Where people start', to: '/invest/list/starters', place: 'market', kind: 'screen',
    also: 'starter first buy beginner picks suggestions new', hint: 'The three we put forward, and why' },
  { label: 'Your watchlist', to: '/invest/list/watchlist', place: 'market', kind: 'screen',
    also: 'following follow watch list saved', hint: 'What you are following' },
  { label: 'Moving today', to: '/invest/list/movers', place: 'market', kind: 'screen',
    also: 'movers gainers fallers up down biggest move today', hint: 'Up and down, apart' },
  { label: 'Your bucket', to: '/bucket', place: 'market', kind: 'screen', primary: true,
    also: 'basket cart picked saved pay later checkout', hint: 'Companies you have picked, not yet paid for' },
  ...CATEGORY_PAGES,
  ...COMPANIES,

  { label: 'Borrow & Lend', to: '/grow', place: 'grow', kind: 'place', primary: true,
    also: 'earn grow interest yield loan credit save lending' },
  { label: 'Lending', to: '/grow/lending', place: 'grow', kind: 'screen', primary: true,
    also: 'lent out earnings interest paid what you lent',
    hint: 'What you have lent, and what it has paid' },
  { label: 'Borrowing', to: '/grow/borrowing', place: 'grow', kind: 'screen', primary: true,
    also: 'loan owed debt what backs it shares against the loan',
    hint: 'What you owe, and what backs it' },
  { label: 'Lend your dollars', to: '/grow/earn', place: 'grow', kind: 'action', primary: true,
    also: 'earn save interest yield deposit', hint: '4.8% a year, paid daily' },
  { label: 'Take back what you lent', to: '/grow/takeout', place: 'grow', kind: 'action', primary: true,
    also: 'withdraw earn out', hint: 'Any time, no fee' },
  { label: 'Borrow', to: '/grow/borrow', place: 'grow', kind: 'action', primary: true, also: 'loan against shares credit', hint: 'Against the shares you own' },
  { label: 'Repay', to: '/grow/repay', place: 'grow', kind: 'action', primary: true, also: 'pay back loan owed', hint: 'Clear what you owe' },

  /* Spend. Three errands that are the reason a person keeps a naira balance
     "just in case" — and a person who keeps a naira balance just in case has
     already left. Each is its own address, because each asks a different
     question first: whose number, which bundle, whose meter. */
  { label: 'Spend', to: '/spend', place: 'spend', kind: 'place', primary: true,
    also: 'bills pay airtime data electricity light nepa recharge top up meter token naira' },
  { label: 'Airtime', to: '/spend/airtime', place: 'spend', kind: 'screen', primary: true,
    also: 'recharge credit top up phone number mtn airtel glo 9mobile vtu',
    hint: 'Any Nigerian number' },
  { label: 'Data', to: '/spend/data', place: 'spend', kind: 'screen', primary: true,
    also: 'internet bundle gigabytes gb mb subscription mtn airtel glo 9mobile',
    hint: 'Bundles from the four networks' },
  { label: 'Electricity', to: '/spend/electricity', place: 'spend', kind: 'screen', primary: true,
    also: 'light nepa power units meter token prepaid postpaid disco ikeja eko phed aedc',
    hint: 'A prepaid token, or a postpaid bill' },

  { label: 'Operations', to: '/admin', place: 'account', kind: 'place', primary: true, staff: true,
    also: 'admin ops console staff switches providers reconciliation audit launch pilot kill switch',
    hint: 'Staff view: switches, providers, reconciliation' },
  { label: 'Provider status', to: '/admin/status', place: 'account', kind: 'screen',
    also: 'admin health up down switch chainlink 0x didit base cdp outage' },
  { label: 'Feature switches', to: '/admin/switches', place: 'account', kind: 'screen',
    also: 'admin kill switch turn off buying selling funding gas asset' },
  { label: 'Reconciliation', to: '/admin/breaks', place: 'account', kind: 'screen',
    also: 'admin breaks differences provider records balances' },
  { label: 'Audit history', to: '/admin/audit', place: 'account', kind: 'screen',
    also: 'admin staff actions who did what log' },
  { label: 'Launch readiness', to: '/admin/launch', place: 'account', kind: 'screen',
    also: 'admin gates before launch legal contracts limits security review' },
  { label: 'Your wallet', to: '/account/wallet', place: 'account', kind: 'screen', primary: true,
    also: 'address base smart account export key you hold your own key custody gas sponsored invite',
    hint: 'Base · you hold your own key' },

  { label: 'Activity', to: '/activity', place: 'history', kind: 'place', primary: true, also: 'history statement transactions receipts' },
  { label: 'Payments', to: '/activity?filter=payments', place: 'history', kind: 'screen', primary: true, also: 'sent received' },
  { label: 'Trades', to: '/activity?filter=trades', place: 'history', kind: 'screen', primary: true, also: 'bought sold shares' },
  { label: 'Borrowing and lending', to: '/activity?filter=grow', place: 'history', kind: 'screen', primary: true, also: 'grow earn interest borrowed repaid lent' },
  { label: 'Statement', to: '/statement', place: 'history', kind: 'screen', primary: true,
    also: 'ledger accounts double entry proof balance where money came from',
    hint: 'Every movement, both ends' },
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

/** The pages, which is what an index of screens is an index of. Everything
 *  reads this; the breadcrumbs read the full list, because a trail has to be
 *  able to name a row you are standing on. */
export const SCREENS: Destination[] = DESTINATIONS.filter((d) => !d.item)

export const PLACE_LABEL: Record<Place, string> = {
  home: 'Home', wallet: 'Wallet', market: 'Invest',
  grow: 'Borrow & Lend', spend: 'Spend', history: 'Activity', account: 'Account',
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
  if (here) return trailTo(here, path)
  // A step inside a flow keeps the flow's trail. /verify/number is not its own
  // destination and should not be — but losing the way back on step two of
  // four is worse than a slightly generic crumb. The same is true of the
  // twenty-seven action addresses under the nine companies that cannot be
  // bought: /invest/dis/invest is a real screen and was a dead end.
  //
  // The deepest registered ancestor, not the first one that matches. /invest
  // matches /invest/dis/invest too, and taking it put the place at the end of
  // its own trail — "Disney › Invest" — because `trailTo` pushes whatever it
  // was handed last. Sorting by length asks the question the caller meant:
  // what is the nearest thing above this that has a name.
  const up = DESTINATIONS
    .filter((d) => bare(d.to) !== '/' && path.startsWith(bare(d.to) + '/'))
    .sort((a, b) => bare(b.to).length - bare(a.to).length)[0]
  if (!up) return []
  // That ancestor is a parent, not this screen. The caller replaces the last
  // entry with the screen's own title, so it needs something of its own to
  // replace — otherwise Disney is dropped and the trail reads "Invest › Buy".
  return [...trailTo(up, path), { label: '', to: path, place: up.place, kind: 'screen' }]
}

function trailTo(here: Destination, path: string): Destination[] {
  {
  // The root is the place this screen actually sits under, not whichever
  // place in its group happens to come first in the list. Operations and
  // Account share the `account` group, and Operations was written first, so
  // verification, the disclosures and the index of every screen all told a
  // customer they were standing inside the staff console.
  const roots = DESTINATIONS.filter((d) => d.place === here.place && d.kind === 'place')
  const root = roots.find((d) => path === bare(d.to) || path.startsWith(bare(d.to) + '/'))
    ?? roots.find((d) => !d.staff)
  const trail: Destination[] = []
  if (root && root !== here) trail.push(root)
  // Every address between the place and here that is a screen of its own. A
  // stock's action sits under the stock, which sits under Invest; a way of
  // sending sits under Send, which sits under the wallet. It was written for
  // the first of those alone and had to be written again for the second, so
  // it is written once for any depth instead.
  const parts = path.split('/').filter(Boolean)
  for (let n = 1; n < parts.length; n++) {
    const up = '/' + parts.slice(0, n).join('/')
    if (root && up === bare(root.to)) continue
    const step = DESTINATIONS.find((d) => bare(d.to) === up)
    if (step && step !== here && !trail.includes(step)) trail.push(step)
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
    return SCREENS.filter((d) => d.kind !== 'screen' || d.primary)
      .slice(0, 8)
      .map((d) => ({ label: d.label, to: d.to, group: PLACE_LABEL[d.place], hint: d.hint }))
  }
  const hits: Hit[] = []
  for (const d of SCREENS) {
    const hay = norm(d.label + ' ' + (d.also ?? '') + ' ' + PLACE_LABEL[d.place])
    if (hay.includes(q)) hits.push({ label: d.label, to: d.to, group: PLACE_LABEL[d.place], hint: d.hint })
  }
  for (const p of state.holdings) {
    if (norm(p.ticker + ' ' + p.name).includes(q)) {
      hits.push({ label: p.name, to: pathOf(p.ticker), group: 'Your shares',
                  hint: `${p.ticker} · ${shares(p.shares)} shares` })
    }
  }
  const seenWho = new Set<string>()
  for (const a of state.activity) {
    if (a.kind === 'payment' && !seenWho.has(a.who) && norm(a.who).includes(q)) {
      seenWho.add(a.who)
      hits.push({ label: a.who, to: '/send/tokkenly?to=' + encodeURIComponent(a.who), group: 'People', hint: 'Send money' })
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
    hits.push({ label: `${c.ticker} · ${c.name}`, to: pathOf(c),
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
      { label: `Send ${usd(v)}`, to: '/send', group: 'Move money', hint: 'Pick who, then confirm' },
      { label: `Add ${usd(v)}`, to: '/addmoney?v=' + v, group: 'Move money', hint: 'Naira in, dollars out' },
      { label: `Withdraw ${usd(v)}`, to: '/withdraw?v=' + v, group: 'Move money', hint: 'Dollars out to your bank' },
      { label: `Pay ${usd(v)} to a Nigerian account`, to: '/send/bank', group: 'Move money', hint: 'Any account, name checked first' },
    )
  }

  // A name that starts with what you typed is a better answer than one that
  // merely contains it, and the list was in source order — so the destination
  // registry always outranked the company you were actually looking for.
  const starts = (hit: Hit) => (norm(hit.label).startsWith(q) ? 0 : 1)
  return hits.sort((a, b) => starts(a) - starts(b)).slice(0, 12)
}
