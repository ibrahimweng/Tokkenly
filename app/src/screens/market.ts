import { h, swap } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, headLink, emptyState, bucketBar, showBucketBar } from '../components/bits'
import { searchField, searchNote } from '../components/search'
import { pageBar } from '../components/pager'
import { rank, onlyNear } from '../match'
import { table } from '../components/table'
import { CATALOGUE, CATEGORIES, PICKS, find, discount, markGap, tradable, catSlug, type Instrument, pathOf } from '../catalogue'
import { INDEXES, listedIn } from '../indices'
import { state, actions, inBucket, priced} from '../state'
import { pct } from '../format'
import { go, current } from '../router'
import { celebrate } from '../confetti'

function tickerRow(ticker: string): HTMLElement {
  const c = find(ticker)
  if (!c) return h('div')
  const row = h('div', { class: 'kv', style: { cursor: 'pointer' } },
    h('span', { class: 'two-line' },
      h('span', { class: 't-body-strong', text: c.ticker }),
      h('small', { text: c.name })),
    h('span', { class: 'two-line right' },
      h('span', { class: 't-body-strong', text: priced(c.price) }),
      h('small', { class: c.dayPct >= 0 ? 'pos' : 'muted', text: (c.dayPct >= 0 ? '+' : '') + pct(c.dayPct) })))
  row.addEventListener('click', () => go(pathOf(c)))
  return row
}

/** Where today's price sits between the year's low and high. A number tells
 *  you the price; this tells you whether it is cheap or dear against its own
 *  twelve months, which is the thing a price alone cannot say. */
function rangeBar(c: Instrument): HTMLElement {
  const span = Math.max(c.yearHigh - c.yearLow, 0.0001)
  const at = Math.min(100, Math.max(0, ((c.price - c.yearLow) / span) * 100))
  return h('span', { class: 'range', ariaLabel:
    `${priced(c.price)} against a year between ${priced(c.yearLow)} and ${priced(c.yearHigh)}` },
    h('span', { class: 'range-track' },
      h('span', { class: 'range-at', style: { left: at + '%' } })),
    h('span', { class: 'range-ends' },
      h('small', { text: priced(c.yearLow, false) }),
      h('small', { text: priced(c.yearHigh, false) })))
}

/** One tap from the list into the bucket, without leaving the list — for the
 *  companies you can actually buy. For the rest there is no control at all,
 *  because the safest version of a control you must not press is a control
 *  that is not there, and the state takes its place so the gap has a reason
 *  standing in it. The full sentence is on the company's own page, one tap
 *  away, the same as its description. */
function bucketCell(c: Instrument): HTMLElement {
  if (!tradable(c)) {
    // `.shut`, not `.tag`: a tag says what a row *is* — the ETF mark beside a
    // fund's name — and this says what can be done with it. They look alike
    // and they are not the same thing, which matters the moment anything
    // counts one of them.
    return h('span', { class: 'shut', text: 'Not open yet',
      title: c.ticker + ' is not in the approved launch set yet, so it cannot be bought.' })
  }
  const inIt = !!inBucket(c.ticker)
  const b = h('button', {
    class: 'icon-btn', ariaLabel: inIt ? c.name + ' is in your bucket' : 'Add ' + c.name + ' to your bucket',
    title: inIt ? 'In your bucket' : 'Add to bucket',
    html: inIt ? icon.check() : icon.plus(),
  })
  if (inIt) b.classList.add('on')
  b.addEventListener('click', (e) => {
    e.stopPropagation()   // the row navigates; this button does not
    if (inIt) { go('/bucket'); return }
    // Before the action, not after. addToBucket broadcasts, every listener
    // rebuilds the whole tree, and this button is detached by the time it
    // returns — so a burst measured from it afterwards is measured from an
    // element that is no longer on the page, and never appears.
    // Three confirmations of one press is noise, and the last two collided:
    // the toast rail sits where the bar docks. The burst says it worked and
    // the bar says what you now have, which is the more useful half. The bar
    // is a live region, so this is still announced.
    celebrate(b)
    showBucketBar()
    actions.addToBucket(c.ticker, state.prefs.tradeDefault)
  })
  return b
}

/** "5 companies" is wrong the moment a fund is in the list. */
function countOf(list: Instrument[]): string {
  const funds = list.filter((c) => c.kind === 'etf').length
  const firms = list.length - funds
  const bits: string[] = []
  if (firms) bits.push(firms + (firms === 1 ? ' company' : ' companies'))
  if (funds) bits.push(funds + (funds === 1 ? ' ETF' : ' ETFs'))
  return bits.join(' · ')
}

/** The list itself. Lifted out of the screen so the search can repaint it
 *  without rebuilding the page around the field being typed into. */
function tableOf(rows: Instrument[],
                 sort: { key: string; dir: 'asc' | 'desc'; onSort: (k: string) => void }): HTMLElement {
  return table(
    [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'price', label: 'Price', align: 'right', sortable: true },
      { key: 'day', label: 'Today', align: 'right', sortable: true },
      { key: 'disc', label: 'vs real', align: 'right', optional: true, sortable: true },
      { key: 'range', wide: true, label: 'Year range', optional: true },
      { key: 'cap', wide: true, label: 'Size', align: 'right', optional: true, sortable: true },
      { key: 'yield', wide: true, label: 'Yield', align: 'right', optional: true, sortable: true },
      { key: 'holders', wide: true, label: 'Holders', align: 'right', optional: true, sortable: true },
      { key: 'bucket', label: '', align: 'right' },
    ],
    rows.map((c) => [
      h('span', { class: 'two-line' },
        h('span', { class: 'name-line' },
          h('span', { class: 't-body-strong', text: `${c.ticker} · ${c.name}` }),
          c.kind === 'etf' ? h('span', { class: 'tag', text: 'ETF' }) : null),
        // The one-line description is what the company does. On a
        // phone the name cell is about 180px and the sentence
        // wrapped to four lines, which turned a list of companies
        // into a wall. It is on the stock page, one tap away.
        h('small', { class: 'desk-only', text: c.plain })),
      h('span', { class: 't-body-strong nowrap', text: priced(c.price) }),
      h('span', { class: (c.dayPct >= 0 ? 'pos' : 'warn') + ' t-body-strong nowrap',
        text: (c.dayPct >= 0 ? '+' : '') + pct(c.dayPct) }),
      // What the token costs against the share it tracks, and the
      // share's own price under it. The pair is the reference
      // site's first numeric column, and it is the one number a
      // tokenised product cannot honestly leave out.
      h('span', { class: 'two-line right' },
        h('span', { class: (markGap(c).over ? 'warn' : 'pos') + ' t-body-strong nowrap',
          text: markGap(c).pct + ' ' + markGap(c).word }),
        h('small', { text: priced(c.mark) })),
      rangeBar(c),
      h('span', { class: 'muted nowrap', text: c.cap }),
      h('span', { class: 'muted nowrap', text: c.dividend ? pct(c.dividend) : '—' }),
      h('span', { class: 'two-line right' },
        h('span', { class: 'muted nowrap', text: (c.holders / 1000).toFixed(1) + 'K' }),
        h('small', { class: c.holdersPct >= 0 ? 'pos' : 'warn',
          text: (c.holdersPct >= 0 ? '+' : '') + pct(c.holdersPct) })),
      // Deciding while you scan the list is the point of a bucket,
      // so the list is where it can be filled.
      bucketCell(c),
    ]),
    (n) => go(pathOf(rows[n])),
    { current: { key: sort.key, dir: sort.dir }, onSort: sort.onSort },
    // On a phone: the company, its price with today's move under it, and the
    // bucket button still on the row — deciding while you scan is the point of
    // a bucket, and it is the one control here that is not "open this
    // company". The other six columns are on the company's own page.
    { lead: 'name', figure: ['price', 'day'], trail: 'bucket' },
  )
}

export function marketScreen(): HTMLElement {
  const r = current()
  const cat = r.query.get('cat') ?? 'Popular'
  const term = (r.query.get('q') ?? '').toLowerCase()

  // Ranked rather than filtered. "Micrsoft" found nothing before, and a list
  // of companies that answers a dropped letter with silence is a list that
  // makes people type more carefully rather than one that helps them.
  const FIELDS = (c: Instrument) => [c.ticker, c.name, c.plain, c.tags.join(' ')]
  // Nine of the thirteen companies here cannot be bought yet. Every row says
  // so now, which is honest and is also nine rows of scrolling past things
  // that are not for sale. So: one press to see only what is. Off by default,
  // because a market that hides what is coming is a market that looks smaller
  // than it is (11g.34) — this narrows the list for somebody who has decided
  // to buy something today, and leaves it whole for everybody else.
  const openOnly = r.query.get('open') === '1'
  const listFor = (t: string): Instrument[] => {
    const all = t.trim()
      ? rank(t, CATALOGUE, FIELDS)
      : CATALOGUE.filter((c) => cat === 'Everything' || c.tags.includes(cat))
    return openOnly ? all.filter(tradable) : all
  }

  const sortKey = r.query.get('sort') ?? 'cap'
  const sortDir = (r.query.get('dir') ?? 'desc') as 'asc' | 'desc'
  const onSort = (key: string) => {
    const dir = key === sortKey && sortDir === 'desc' ? 'asc' : 'desc'
    const q = new URLSearchParams(r.query)
    q.set('sort', key); q.set('dir', dir)
    go('/invest?' + q.toString())
  }
  // Size arrives as "$3.41T", which sorts as text into nonsense. Read it back
  // into a number so the biggest company is actually the biggest.
  const capNum = (c: string) => {
    const n = parseFloat(c.replace(/[^0-9.]/g, ''))
    return n * (c.includes('T') ? 1e12 : c.includes('B') ? 1e9 : c.includes('M') ? 1e6 : 1)
  }
  const cmp: Record<string, (a: Instrument, b: Instrument) => number> = {
    name: (a, b) => a.name.localeCompare(b.name),
    price: (a, b) => a.price - b.price,
    day: (a, b) => a.dayPct - b.dayPct,
    cap: (a, b) => capNum(a.cap) - capNum(b.cap),
    yield: (a, b) => a.dividend - b.dividend,
    pe: (a, b) => a.pe - b.pe,
    disc: (a, b) => discount(a) - discount(b),
    holders: (a, b) => a.holders - b.holders,
  }
  // The results repaint themselves rather than the screen doing it. This app
  // rebuilds its whole tree on a route change, and a rebuilt tree takes the
  // focus out of the field somebody is still typing in — which is the same
  // fault the bucket's amount field hit and for the same reason. So the
  // address is only touched on Enter, and typing repaints this one card.
  const results = h('div', { class: 'stack' })
  // Five rows, and the arrows walk the rest of them. The card used to hold the
  // whole category — thirteen rows on Everything — which put whatever follows
  // it a screen and a half down. Held here rather than in the address: paging
  // a card is not somewhere you have been, and a route change would rebuild
  // the tree and take the focus out of the search field above.
  const PER = 5
  let page = 0
  const paint = (t: string): void => {
    const rows = listFor(t)
    const sorted = [...rows].sort((a, b) =>
      (cmp[sortKey] ?? cmp.cap)(a, b) * (sortDir === 'asc' ? 1 : -1))
    const pages = Math.max(1, Math.ceil(sorted.length / PER))
    if (page >= pages) page = 0
    const shown = sorted.slice(page * PER, page * PER + PER)
    const turn = (n: number) => { page = Math.min(Math.max(0, n), pages - 1); paint(t) }
    swap(results,
      card(
        cardHead(t.trim() ? 'Results' : cat,
          h('span', { class: 'muted t-caption', text: countOf(rows) })),
        searchNote(t, rows.length, onlyNear(t, rows, FIELDS)),
        rows.length
          ? tableOf(shown, { key: sortKey, dir: sortDir, onSort })
          // Which of the two things emptied the list. Telling somebody to try
          // another ticker when what they did was ask for the four buyable
          // companies inside a category that holds none of them sends them to
          // fix the wrong thing.
          : openOnly && !t.trim()
            ? emptyState('Nothing here is open for trading yet',
                `Everything in ${cat} is waiting on its contract and eligibility checks. You can still look at any of it.`,
                { label: 'Show everything', onClick: () => setQuery('open', '') })
            : emptyState('Nothing matches that',
                openOnly
                  ? 'Nothing open for trading matches that. Try another company, or show everything.'
                  : 'Try another company, fund or ticker.',
                openOnly
                  ? { label: 'Show everything', onClick: () => setQuery('open', '') }
                  : { label: 'Clear the search', onClick: () => go('/invest') }),
        // "View more" names nothing, and rule 49 is the reason this product
        // does not ship links that say it. The count and the category are what
        // somebody wants to know before pressing.
        rows.length
          ? pageBar(page, pages, turn, t.trim() ? undefined : {
              label: rows.length === 1 ? `The one in ${cat}` : `All ${rows.length} in ${cat}`,
              to: '/invest/list/' + catSlug(cat) })
          : null,
      ))
  }

  paint(term)

  const setQuery = (k: string, v: string) => {
    const q = new URLSearchParams(r.query)
    if (v) q.set(k, v); else q.delete(k)
    const s = q.toString()
    go('/invest' + (s ? '?' + s : ''))
  }

  return shell(
    'market',
    pageHeader('Invest', h('span', { class: 'muted', text: 'Tokenised, so it trades 24/7' })),
    searchField({
      placeholder: 'Search a company or a fund',
      value: r.query.get('q') ?? '',
      // Straight to the company. On the one screen that sells companies, the
      // fastest answer to typing a name is that company's own page, not a
      // one-row table with its name in it.
      suggest: (t) => rank(t, CATALOGUE, FIELDS).slice(0, 7).map((c) => ({
        label: `${c.ticker} · ${c.name}`,
        hint: priced(c.price),
        group: c.kind === 'etf' ? 'Funds' : 'Companies',
        pick: () => go(pathOf(c)),
      })),
      onType: paint,
      onCommit: (v) => setQuery('q', v),
    }),
    // The paragraph says what the header already says — "Tokenised, so it
    // trades 24/7" — and on a phone the two of them together cost 90px of the
    // one screen that is meant to show you things you can buy.
    h('p', { class: 'muted desk-only', style: { margin: '0' },
      text: 'US stocks and ETFs, tokenised. You can buy part of one from a dollar, and the market never closes.' }),
    // Seven filters wrapped onto three rows on a phone. One row that scrolls.
    //
    // The first one is not a category. A category asks what kind of thing this
    // is; this asks what you can do with it, and the two answers are not
    // alternatives — you can want the funds and want them buyable. So it wears
    // a tick and stands on the other side of a rule, and it stays where the
    // thumb can reach it when the rest of the row is pushed sideways.
    h('div', { class: 'chip-row chip-scroll' },
      h('button', {
        class: 'chip chip-only', ariaPressed: openOnly,
        on: { click: () => setQuery('open', openOnly ? '' : '1') },
      },
        h('span', { class: 'ic', html: icon.check() }),
        h('span', { text: 'Open for trading' })),
      h('span', { class: 'chip-split', ariaHidden: 'true' }),
      ...CATEGORIES.map((c) =>
        h('button', { class: 'chip', text: c, ariaPressed: c === cat && !term,
          on: { click: () => setQuery('cat', c) } }))),
    // Three full-width cards, one per index, was 384px of a 844px screen for
    // three numbers a first-time investor did not come for. On a phone they
    // become a strip you can push sideways.
    // They open now (11g.64). They were the only figures on this screen that
    // could not be pressed, which on a page where every other number leads
    // somewhere reads as three cards that are broken rather than three that
    // are only information.
    h('div', { class: 'row equal indices' }, ...INDEXES.map((i) => {
      const c = card(
        h('span', { class: 't-caps subtle', text: i.name }),
        h('div', { class: 'kv' },
          h('span', { class: 't-display', text: i.level }),
          h('span', { class: (i.pct >= 0 ? 'pos' : 'warn') + ' t-body-strong nowrap',
            text: (i.pct >= 0 ? '+' : '') + pct(i.pct, 2) + ' today' })),
        // What is behind the card, said on the card. "Three cards you can
        // press" is only useful if it looks like one.
        h('span', { class: 'subtle t-caption',
          text: `${i.count} companies · ${listedIn(i).length} on Tokkenly` }))
      c.classList.add('door-card')
      c.setAttribute('role', 'link')
      c.tabIndex = 0
      c.addEventListener('click', () => go('/invest/index/' + i.key))
      c.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go('/invest/index/' + i.key) }
      })
      return c
    })),
    // The list is the page, not a neighbour of the page. Seven columns of
    // company data cannot share 730px with a side column: the cells collide
    // and the year range lands on top of the price. It takes the full width,
    // and the three reading cards line up underneath it.
    results,
    h('div', { class: 'row equal' },
      card(
        // The heading is the way in, the same pattern the wallet uses for
        // "All activity". The card keeps its rows, because Invest is a page
        // you scan; the screen is there for when four rows is not enough.
        //
        // And the link names what is on the other side rather than saying
        // "See all", which names nothing — rule 49, and `names.mjs` caught all
        // three the first time they were written.
        cardHead('Where people start', headLink('Why these three', '/invest/list/starters')),
        ...PICKS.map((p) => {
          const c = find(p.ticker)!
          const row = h('div', { class: 'kv', style: { cursor: 'pointer' } },
            h('span', { class: 'two-line' },
              h('span', { class: 't-body-strong', text: c.name }),
              h('small', { text: p.line })),
            h('span', { class: 't-body-strong', text: priced(c.price) }))
          row.addEventListener('click', () => go(pathOf(c)))
          return row
        })),
      card(cardHead('Your watchlist', headLink('Everything you follow', '/invest/list/watchlist')),
        ...state.watchlist.map(tickerRow)),
      card(cardHead('Moving today', headLink('Up and down today', '/invest/list/movers')),
        ...[...CATALOGUE].sort((a, b) => Math.abs(b.dayPct) - Math.abs(a.dayPct)).slice(0, 4)
          .map((c) => tickerRow(c.ticker)))),
    // Once, at the foot of the page. A risk line on every card is a risk line
    // nobody reads.
    h('p', { class: 'subtle t-caption', style: { margin: '0' } },
      h('span', { text: 'Prices go down as well as up. You can get back less than you put in. ' }),
      h('button', { class: 'link quiet', text: 'Risk and disclosures',
        on: { click: () => go('/disclosures') } })),
    bucketBar()
  )
}
