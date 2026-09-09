import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, callout, bucketBar, showBucketBar } from '../components/bits'
import { table } from '../components/table'
import { barChart, type Range } from '../components/chart'
import { INDEXES, findIndex, listedIn, type Index, type Member } from '../indices'
import { find, tradable, pathOf } from '../catalogue'
import { state, actions, inBucket, assetOn } from '../state'
import { usd, pct } from '../format'
import { go } from '../router'
import { pagerRow, pageable, beside, type Stop } from '../components/pager'
import { celebrate } from '../confetti'

/* An index, opened.
   ---------------------------------------------------------------------------

   Invest carried three numbers with nothing behind them — the only figures in
   the product that could not be pressed, on a screen where everything else
   opens. Each is a page now: the level, the year, what the number actually
   measures, and the companies inside it by weight.

   The table is the point of the screen, and it is honest about a gap. Tokkenly
   lists thirteen instruments; the S&P has five hundred. A row it lists opens
   and can be bought from here. A row it does not carries its name, its weight
   and its indicative price, and says it is not listed. Twenty dead rows dressed
   as live ones would be the product lying about what it sells — and the gap is
   worth showing, because it is what the launch set looks like at index scale. */

/** The three, as the pager knows them. */
const STOPS: Stop[] = INDEXES.map((i) => ({ key: i.key, label: i.name, to: '/invest/index/' + i.key }))

/** The level over a year, drawn from the same seeded series every other chart
 *  in the product draws from. An index has no bid and no ask, so there is no
 *  reference line over it the way a token has one. */
function levelChart(ix: Index): HTMLElement {
  const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' })
  const date = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const time = (d: Date) => d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
  const level = Number(ix.level.replace(/,/g, ''))
  const ranges: Range[] = [
    { key: '1D', days: 1, pct: ix.pct, vol: 0.3, fmt: time, over: 'today' },
    { key: '1M', days: 30, pct: ix.yearPct * 0.14, vol: 0.22, fmt: date },
    { key: '3M', days: 91, pct: ix.yearPct * 0.34, vol: 0.2, fmt: date },
    { key: '1Y', days: 365, pct: ix.yearPct, vol: 0.16, fmt: month },
  ]
  return barChart({
    ranges, initial: '1Y', height: 220,
    title: ix.name + ' over time',
    endValue: level,
    seed: ix.key.charCodeAt(0) * 37,
    // Points, not dollars. The callout on this page says an index level is not
    // a price; a chart with dollar signs down its axis would be arguing with it.
    unit: 'points',
  })
}

/** One press into the bucket, for the rows Tokkenly sells. The same plus the
 *  market list and the company page carry. */
function bucketCell(m: Member): HTMLElement {
  const c = m.ticker ? find(m.ticker) : undefined
  // Not listed, not for sale, and no control at all rather than one that
  // refuses: the safest version of a button you must not press is no button.
  if (!c) return h('span', { class: 'shut wraps', text: 'Not listed here',
    title: m.name + ' is in this index. Tokkenly does not list it.' })
  if (!tradable(c)) return h('span', { class: 'shut wraps', text: 'Not open yet',
    title: c.ticker + ' is not in the approved launch set yet, so it cannot be bought.' })
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

/** What is in it, by weight.
 *
 *  Weight first, because that is the order the index itself is in and the
 *  thing the help card has just explained. The rank column is what makes the
 *  ordering legible as an ordering rather than as an accident. */
function members(ix: Index): HTMLElement {
  const rows = ix.members.map((m) => {
    const c = m.ticker ? find(m.ticker) : undefined
    const price = c ? c.price : m.price ?? 0
    const day = c ? c.dayPct : m.dayPct ?? 0
    return [
      h('span', { class: 'muted t-caption', text: String(ix.members.indexOf(m) + 1) }),
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong' + (c ? '' : ' muted'), text: m.name }),
        h('small', { text: c ? c.ticker + ' · ' + m.symbol : m.symbol })),
      h('span', { class: 't-body-strong', text: pct(m.weight, 2) }),
      h('span', { text: usd(price) }),
      h('span', { class: day >= 0 ? 'pos' : 'warn',
        text: (day >= 0 ? '+' : '−') + pct(Math.abs(day)) }),
      bucketCell(m),
    ]
  })
  return card(
    cardHead('What is in it',
      h('span', { class: 'muted t-caption',
        text: `${listedIn(ix).length} of these ${ix.members.length} are on Tokkenly` })),
    h('span', { class: 'subtle t-caption', text: ix.shown + '. Weights are indicative.' }),
    table(
      [
        { key: 'n', label: '#', width: '40px', optional: true },
        { key: 'name', label: 'Company' },
        { key: 'w', label: 'Weight', align: 'right' },
        { key: 'price', label: 'Price', align: 'right', optional: true },
        { key: 'day', label: 'Today', align: 'right' },
        { key: 'buy', label: '', align: 'right', width: '104px' },
      ],
      rows,
      // Only the ones that go somewhere. A row that lights up under the
      // pointer and then does nothing is a worse answer than a row that never
      // looked pressable.
      (i) => {
        const c = ix.members[i].ticker ? find(ix.members[i].ticker!) : undefined
        if (c) go(pathOf(c))
      },
      undefined,
      { lead: 'name', figure: ['w', 'day'], trail: 'buy' },
    ))
}

/** The fund that buys the whole thing, where Tokkenly lists one — and a
 *  straight answer where it does not. */
function wholeThing(ix: Index): HTMLElement {
  const c = ix.etf ? find(ix.etf) : undefined
  if (!c) {
    return card(
      cardHead('Owning the whole index'),
      h('span', { class: 'muted',
        text: `Tokkenly does not list a fund that tracks ${ix.name}. `
          + `The ${listedIn(ix).length} companies in it that Tokkenly does list are `
          + 'marked in the table, and can be bought one at a time.' }))
  }
  return card(
    cardHead('Owning the whole index'),
    h('span', { class: 'muted',
      text: `One holding instead of ${ix.count}. ${c.name} tracks this index, and `
        + `Tokkenly lists it as ${c.ticker}.` }),
    kv('Price', usd(c.price)),
    kv('Today', h('span', { class: c.dayPct >= 0 ? 'pos t-body-strong' : 'warn t-body-strong',
      text: (c.dayPct >= 0 ? '+' : '−') + pct(Math.abs(c.dayPct)) })),
    kv('Holds', String(c.holds ?? ix.count) + ' companies'),
    tradable(c) && assetOn(c.ticker)
      ? h('button', { class: 'btn btn-primary', text: 'Buy ' + c.ticker,
          on: { click: () => go(pathOf(c) + '/invest') } })
      : h('span', { class: 'muted t-caption',
          text: `${c.ticker} is not open for trading yet. It is here so you can watch it.` }),
    h('button', { class: 'btn btn-secondary', text: 'About ' + c.ticker,
      on: { click: () => go(pathOf(c)) } }))
}

/** The help. Four questions somebody actually has about a number they have
 *  been shown all week without being told what it is.
 *
 *  On the page rather than behind a link: an explanation somebody has to
 *  decide to go and find is an explanation for people who already know they
 *  need it. */
function how(ix: Index): HTMLElement {
  return card(
    cardHead('How to read it'),
    ...ix.how.map((r) => h('div', { class: 'two-line' },
      h('span', { class: 't-body-strong', text: r.q }),
      h('small', { text: r.a }))))
}

export function indexScreen(key?: string): HTMLElement {
  const ix = findIndex(key)
  if (!ix) {
    return shell('market', pageHeader('Not found'),
      h('p', { class: 'muted', text: 'No index at that address.' }),
      h('button', { class: 'btn btn-secondary btn-sm', text: 'Back to Invest',
        on: { click: () => go('/invest') } }))
  }
  const up = ix.pct >= 0
  const page = shell(
    'market',
    // The name alone. A sentence beside it squeezed the title to "S&P …" on a
    // phone — and it was the same sentence the What this is card prints two
    // inches below, which is one description in two places.
    pageHeader(ix.name),
    pagerRow(STOPS, ix.key, 'Indices'),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        card(
          h('div', { class: 'card-head' },
            h('div', { class: 'stack-8' },
              h('span', { class: 't-caps subtle', text: 'Where it stands' }),
              h('span', { class: 't-display-xl', text: ix.level }),
              h('span', { class: 'mark-line' },
                h('span', { class: (up ? 'pos' : 'warn') + ' t-body-strong',
                  text: (up ? '+' : '−') + pct(Math.abs(ix.pct), 2) }),
                h('span', { class: 'muted t-caption', text: 'today' })))),
          levelChart(ix)),
        members(ix)),
      h('div', { class: 'stack col-side' },
        card(
          cardHead('What this is'),
          h('span', { class: 'muted', text: ix.plain }),
          kv('Companies in it', String(ix.count)),
          kv('Weighted by', ix.key === 'dow' ? 'Share price' : 'Company size'),
          kv('On Tokkenly', `${listedIn(ix).length} of them`),
          callout('An index level is not a price. Nobody holds one, and it cannot '
            + 'be bought — what can be bought is the companies in it, or a fund '
            + 'that holds them all.')),
        how(ix),
        wholeThing(ix))),
    bucketBar())
  // The swipe and the arrow keys, the same as a company page and the lists.
  // The pager above is the one that has to be visible; these are for somebody
  // who has already worked out that this is a set of three.
  const { prev, next } = beside(STOPS, ix.key)
  pageable(page, { prev: prev.to, next: next.to, alive: '.pager' })
  return page
}
