import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, emptyState, bucketBar, showBucketBar } from '../components/bits'
import { table } from '../components/table'
import { sparkline, type Range } from '../components/chart'
import { pagerRow, pageable, beside, type Stop } from '../components/pager'
import { CATALOGUE, PICKS, find, tradable, discount, type Instrument, pathOf } from '../catalogue'
import { state, actions, inBucket, assetOn } from '../state'
import { usd, pct } from '../format'
import { go } from '../router'
import { toast } from '../components/sheet'
import { celebrate } from '../confetti'

/* The groupings on Invest, opened out.
   ---------------------------------------------------------------------------

   Invest ends in three cards holding three, four and however-many rows, with
   no way to see the rest and nothing to do from them but leave. Each is a
   question somebody is actually asking — what should I start with, what am I
   following, what is moving — and each answer was four rows long.

   Three screens, and each has to earn its address. A screen that is the same
   table under a different heading is a second door to one room, so:

    - Where people start is the three the product puts forward, with the reason
      it puts each forward and what it costs to try, then everything else that
      is open for trading underneath.
    - Your watchlist is what you follow, with a way to stop following from the
      list rather than from thirteen company pages.
    - Moving today is the whole market ranked by movement, gainers and fallers
      apart, because "moving" without a direction is two questions in one list.

   Popular is not among them. It is a chip on Invest that filters the table,
   the table is not capped, and a fourth screen would have been that same list
   at a second address. The strip names it and sends you to the chip. */

/** A year, drawn small. Same span and shape the company strip uses. */
const spark = (c: Instrument): Range => ({
  key: '1Y', days: 365, pct: ((c.price - c.yearLow) / c.yearLow) * 100,
  vol: 0.09, fmt: () => '', over: 'this year',
})

const STOPS: Stop[] = [
  // Popular goes back to Invest with the chip on. It is the one grouping that
  // already has a screen: the market table itself.
  { key: 'popular', label: 'Popular', to: '/invest?cat=Popular' },
  { key: 'starters', label: 'Where people start', to: '/invest/list/starters' },
  { key: 'watchlist', label: 'Your watchlist', to: '/invest/list/watchlist' },
  { key: 'movers', label: 'Moving today', to: '/invest/list/movers' },
]

const TITLES: Record<string, string> = {
  starters: 'Where people start',
  watchlist: 'Your watchlist',
  movers: 'Moving today',
}

/** One press into the bucket, the same plus every other list in the product
 *  carries. Nothing at all for a company that cannot be bought: the safest
 *  version of a control you must not press is a control that is not there. */
function bucketCell(c: Instrument): HTMLElement {
  if (!tradable(c)) {
    return h('span', { class: 'shut wraps', text: 'Not open yet',
      title: c.ticker + ' is not in the approved launch set yet, so it cannot be bought.' })
  }
  const inIt = !!inBucket(c.ticker)
  const b = h('button', {
    class: 'icon-btn' + (inIt ? ' on' : ''),
    ariaLabel: inIt ? c.name + ' is in your bucket' : 'Add ' + c.name + ' to your bucket',
    title: inIt ? 'In your bucket' : 'Add to bucket',
    html: inIt ? icon.check() : icon.plus(),
  })
  b.addEventListener('click', (e) => {
    e.stopPropagation()
    if (inIt) { go('/bucket'); return }
    celebrate(b)
    showBucketBar()
    actions.addToBucket(c.ticker, state.prefs.tradeDefault)
  })
  return b
}

/** The full table these screens exist to give the sections. Same columns and
 *  the same plus as the market's own list, so a company reads the same
 *  wherever it is met. */
function listTable(rows: Instrument[], extra?: (c: Instrument) => Node): HTMLElement {
  return table(
    [
      { key: 'name', label: 'Company' },
      { key: 'price', label: 'Price', align: 'right' },
      { key: 'day', label: 'Today', align: 'right' },
      { key: 'year', label: 'This year', align: 'right', optional: true },
      { key: 'buy', label: '', align: 'right', width: '104px' },
    ],
    rows.map((c) => [
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: c.ticker + ' · ' + c.name }),
        // Desktop only, the same as the market's own list, for the reason
        // that list already learned. The phone row gives this cell about 190px
        // and the sentence wants 280, so it ellipsised to an unreadable half
        // on twelve of movers' thirteen rows and all five of the watchlist's.
        // Letting it wrap instead ran rows from 68px to 144px and turned a
        // list you scan into a wall you read. It is on the company's own page,
        // one tap from here.
        h('small', { class: 'desk-only', text: c.plain })),
      h('span', { text: usd(c.price) }),
      h('span', { class: c.dayPct >= 0 ? 'pos' : 'warn',
        text: (c.dayPct >= 0 ? '+' : '−') + pct(Math.abs(c.dayPct)) }),
      sparkline(spark(c), c.price, c.ticker.charCodeAt(0)),
      extra ? extra(c) : bucketCell(c),
    ]),
    (i) => go(pathOf(rows[i])),
    undefined,
    { lead: 'name', detail: [], figure: ['price', 'day'], trail: 'buy' },
  )
}

/* ------------------------------------------------------------ starters --
   The three the product puts forward, and why.

   PICKS is gated to what can actually be bought: this list ends in a bucket
   and then in a payment, and offering a company the composer would refuse
   makes the first thing the product asks somebody to do a thing it then will
   not let them do. */
function starters(): (Node | null)[] {
  const picked = PICKS.map((p) => ({ p, c: find(p.ticker)! })).filter((x) => x.c)
  const others = CATALOGUE.filter(
    (c) => tradable(c) && !PICKS.some((p) => p.ticker === c.ticker))
  // `tradable` means "in the approved launch set", which is not the same as
  // "you can buy it this afternoon": an asset operations has switched off is
  // still in the set. On the one screen that tells somebody where to begin,
  // that difference matters — a first buy should not land on a paused company
  // — so the two are separated rather than blurred under one heading.
  const rest = others.filter((c) => assetOn(c.ticker))
  const paused = others.filter((c) => !assetOn(c.ticker))
  return [
    card(
      cardHead('The three we put forward',
        h('span', { class: 'muted t-caption', text: 'Any amount from a dollar' })),
      h('span', { class: 'muted',
        text: 'Every one of these is open for trading today. They are here because '
          + 'they are companies people already know, not because they are expected '
          + 'to do better than anything else.' }),
      ...picked.map(({ p, c }) => {
        const row = h('div', { class: 'start-row' },
          h('span', { class: 'two-line grow' },
            h('span', { class: 't-body-strong', text: c.name }),
            h('small', { text: p.line })),
          sparkline(spark(c), c.price, c.ticker.charCodeAt(0)),
          h('span', { class: 'two-line right' },
            h('span', { class: 't-body-strong', text: usd(c.price) }),
            h('small', { class: c.dayPct >= 0 ? 'pos' : 'warn',
              text: (c.dayPct >= 0 ? '+' : '−') + pct(Math.abs(c.dayPct)) })),
          bucketCell(c))
        row.addEventListener('click', () => go(pathOf(c)))
        return row
      })),
    rest.length
      ? card(
          cardHead('And everything else you can buy today',
            h('span', { class: 'muted t-caption', text: rest.length + ' more' })),
          listTable(rest))
      : null,
    // Named rather than dropped. A company that vanishes makes people think
    // they misremembered it; one that says "not right now" tells them to come
    // back — the same rule the rails and the market rows follow.
    paused.length
      ? card(
          cardHead('Paused right now'),
          h('span', { class: 'muted',
            text: `${paused.map((c) => c.name).join(', ')} ${paused.length === 1 ? 'is' : 'are'} `
              + 'in the launch set but trading is stopped. You can still look, and you '
              + 'can still follow.' }),
          ...paused.map((c) => {
            const row = h('div', { class: 'start-row' },
              h('span', { class: 'two-line grow' },
                h('span', { class: 't-body-strong', text: c.name }),
                h('small', { text: c.plain })),
              h('span', { class: 'shut wraps', text: 'Paused' }))
            row.addEventListener('click', () => go(pathOf(c)))
            return row
          }))
      : null,
    card(
      cardHead('Before you buy anything'),
      kv('The smallest amount', 'One dollar'),
      kv('What it costs', pct(state.fees.trade, 1) + ' of what you put in'),
      kv('When it trades', 'Every day, weekends included'),
      h('button', { class: 'btn btn-secondary', text: 'Risk and disclosures',
        on: { click: () => go('/disclosures') } })),
  ]
}

/* ----------------------------------------------------------- watchlist --
   What you follow, and the one thing the card underneath it could never do:
   stop following without opening thirteen company pages. */
function watchlist(): (Node | null)[] {
  const rows = state.watchlist.map((t) => find(t)).filter(Boolean) as Instrument[]
  if (!rows.length) {
    return [card(emptyState(
      'You are not following anything yet',
      'Following a company keeps it here so you can watch what it does before you '
        + 'decide. It costs nothing and it is not a holding.',
      { label: 'Go to Invest', onClick: () => go('/invest') },
      'search'))]
  }
  const unfollow = (c: Instrument) => {
    const b = h('button', {
      class: 'icon-btn', ariaLabel: 'Stop following ' + c.name, title: 'Stop following',
      html: icon.close(),
    })
    b.addEventListener('click', (e) => {
      e.stopPropagation()
      actions.toggleWatch(c.ticker)
      toast(c.ticker + ' removed from your watchlist')
    })
    return h('span', { class: 'row-acts' }, bucketCell(c), b)
  }
  const up = rows.filter((c) => c.dayPct >= 0).length
  return [
    card(
      cardHead('What you are following',
        h('span', { class: 'muted t-caption',
          text: `${rows.length} ${rows.length === 1 ? 'company' : 'companies'} · ${up} up today` })),
      listTable(rows, unfollow)),
    card(
      cardHead('What following does'),
      h('span', { class: 'muted',
        text: 'Nothing but this. A company you follow is not a company you own, '
          + 'nothing is bought and nothing is reserved — it is a list of what you '
          + 'are keeping an eye on.' })),
  ]
}

/* -------------------------------------------------------------- movers --
   "Moving today" without a direction is two questions in one list: the thing
   that is up four per cent and the thing that is down four are both moving,
   and nobody is looking for both at once. */
function movers(): (Node | null)[] {
  const byMove = (a: Instrument, b: Instrument) => b.dayPct - a.dayPct
  const gainers = CATALOGUE.filter((c) => c.dayPct > 0).sort(byMove)
  const fallers = CATALOGUE.filter((c) => c.dayPct < 0).sort((a, b) => a.dayPct - b.dayPct)
  const flat = CATALOGUE.filter((c) => c.dayPct === 0)
  const widest = CATALOGUE.reduce((m, c) => (Math.abs(c.dayPct) > Math.abs(m.dayPct) ? c : m))
  return [
    card(
      cardHead('The widest move today'),
      h('div', { class: 'kv' },
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: widest.name }),
          h('small', { text: widest.plain })),
        h('span', { class: (widest.dayPct >= 0 ? 'pos' : 'warn') + ' t-display',
          text: (widest.dayPct >= 0 ? '+' : '−') + pct(Math.abs(widest.dayPct)) })),
      kv('Price now', usd(widest.price)),
      kv('Against the real share', pct(Math.abs(discount(widest)), 2)
        + (discount(widest) >= 0 ? ' below' : ' above'))),
    gainers.length
      ? card(cardHead('Up today', h('span', { class: 'muted t-caption',
          text: gainers.length + ' of ' + CATALOGUE.length })), listTable(gainers))
      : null,
    fallers.length
      ? card(cardHead('Down today', h('span', { class: 'muted t-caption',
          text: fallers.length + ' of ' + CATALOGUE.length })), listTable(fallers))
      : null,
    flat.length
      ? card(cardHead('Flat'), listTable(flat))
      : null,
    card(
      h('span', { class: 'muted t-caption',
        text: 'A day is a day. A company that is down four per cent this afternoon '
          + 'is not a worse company than it was this morning, and one that is up is '
          + 'not a better one.' })),
  ]
}

export function listScreen(sub?: string): HTMLElement {
  const key = sub ?? ''
  const title = TITLES[key]
  if (!title) {
    return shell('market', pageHeader('Not found'),
      h('p', { class: 'muted', text: 'No list at that address.' }),
      h('button', { class: 'btn btn-secondary btn-sm', text: 'Back to Invest',
        on: { click: () => go('/invest') } }))
  }
  const body = key === 'starters' ? starters() : key === 'watchlist' ? watchlist() : movers()
  const page = shell(
    'market',
    pageHeader(title),
    pagerRow(STOPS, key, 'Lists on Invest'),
    h('div', { class: 'stack' }, ...body),
    bucketBar())
  const { prev, next } = beside(STOPS, key)
  pageable(page, { prev: prev.to, next: next.to, alive: '.pager' })
  return page
}
