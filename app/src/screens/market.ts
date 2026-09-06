import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, emptyState } from '../components/bits'
import { table } from '../components/table'
import { CATALOGUE, CATEGORIES, INDICES, PICKS, find, discount, markGap, type Instrument } from '../catalogue'
import { state, actions, inBucket } from '../state'
import { usd, pct } from '../format'
import { go, current } from '../router'
import { toast } from '../components/sheet'

function tickerRow(ticker: string): HTMLElement {
  const c = find(ticker)
  if (!c) return h('div')
  const row = h('div', { class: 'kv', style: { cursor: 'pointer' } },
    h('span', { class: 'two-line' },
      h('span', { class: 't-body-strong', text: c.ticker }),
      h('small', { text: c.name })),
    h('span', { class: 'two-line right' },
      h('span', { class: 't-body-strong', text: usd(c.price) }),
      h('small', { class: c.dayPct >= 0 ? 'pos' : 'muted', text: (c.dayPct >= 0 ? '+' : '') + pct(c.dayPct) })))
  row.addEventListener('click', () => go('/invest/' + c.ticker.toLowerCase()))
  return row
}

/** Where today's price sits between the year's low and high. A number tells
 *  you the price; this tells you whether it is cheap or dear against its own
 *  twelve months, which is the thing a price alone cannot say. */
function rangeBar(c: Instrument): HTMLElement {
  const span = Math.max(c.yearHigh - c.yearLow, 0.0001)
  const at = Math.min(100, Math.max(0, ((c.price - c.yearLow) / span) * 100))
  return h('span', { class: 'range', ariaLabel:
    `${usd(c.price)} against a year between ${usd(c.yearLow)} and ${usd(c.yearHigh)}` },
    h('span', { class: 'range-track' },
      h('span', { class: 'range-at', style: { left: at + '%' } })),
    h('span', { class: 'range-ends' },
      h('small', { text: usd(c.yearLow, false) }),
      h('small', { text: usd(c.yearHigh, false) })))
}

/** One tap from the list into the bucket, without leaving the list. */
function bucketCell(c: Instrument): HTMLElement {
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
    actions.addToBucket(c.ticker, state.prefs.tradeDefault)
    toast(`${usd(state.prefs.tradeDefault, false)} of ${c.name} is in your bucket`, 'success')
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

export function marketScreen(): HTMLElement {
  const r = current()
  const cat = r.query.get('cat') ?? 'Popular'
  const term = (r.query.get('q') ?? '').toLowerCase()

  const list = CATALOGUE.filter((c) => {
    if (term) return (c.ticker + ' ' + c.name).toLowerCase().includes(term)
    if (cat === 'Everything') return true
    return c.tags.includes(cat)
  })

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
  const ordered = [...list].sort((a, b) =>
    (cmp[sortKey] ?? cmp.cap)(a, b) * (sortDir === 'asc' ? 1 : -1))

  const setQuery = (k: string, v: string) => {
    const q = new URLSearchParams(r.query)
    if (v) q.set(k, v); else q.delete(k)
    const s = q.toString()
    go('/invest' + (s ? '?' + s : ''))
  }

  return shell(
    'market',
    pageHeader('Invest', h('span', { class: 'muted', text: 'Tokenised, so it trades 24/7' })),
    h('label', { class: 'field' },
      h('span', { html: icon.search() }),
      h('input', {
        placeholder: 'Search a company or a fund',
        value: r.query.get('q') ?? '',
        on: { keydown: (e) => { if ((e as KeyboardEvent).key === 'Enter') setQuery('q', (e.target as HTMLInputElement).value) } },
      })),
    // The paragraph says what the header already says — "Tokenised, so it
    // trades 24/7" — and on a phone the two of them together cost 90px of the
    // one screen that is meant to show you things you can buy.
    h('p', { class: 'muted desk-only', style: { margin: '0' },
      text: 'US stocks and ETFs, tokenised. You can buy part of one from a dollar, and the market never closes.' }),
    // Seven filters wrapped onto three rows on a phone. One row that scrolls.
    h('div', { class: 'chip-row chip-scroll' }, ...CATEGORIES.map((c) =>
      h('button', { class: 'chip', text: c, ariaPressed: c === cat && !term,
        on: { click: () => setQuery('cat', c) } }))),
    // Three full-width cards, one per index, was 384px of a 844px screen for
    // three numbers a first-time investor did not come for. On a phone they
    // become a strip you can push sideways.
    h('div', { class: 'row equal indices' }, ...INDICES.map((i) =>
      // Level and move on one line: three cards across the page each holding a
      // stat in the top-left corner read as three cards that did not finish.
      // Negative takes the same warn the table gives it, not a quiet grey.
      card(
        h('span', { class: 't-caps subtle', text: i.name }),
        h('div', { class: 'kv' },
          h('span', { class: 't-display', text: i.value }),
          h('span', { class: (i.pct >= 0 ? 'pos' : 'warn') + ' t-body-strong nowrap',
            text: (i.pct >= 0 ? '+' : '') + pct(i.pct, 2) + ' today' }))))),
    // The list is the page, not a neighbour of the page. Seven columns of
    // company data cannot share 730px with a side column: the cells collide
    // and the year range lands on top of the price. It takes the full width,
    // and the three reading cards line up underneath it.
    h('div', { class: 'stack' },
        card(
          cardHead(term ? 'Results' : cat,
            h('span', { class: 'muted t-caption', text: countOf(list) })),
          list.length
            ? table(
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
                ordered.map((c) => [
                  h('span', { class: 'two-line' },
                    h('span', { class: 'name-line' },
                      h('span', { class: 't-body-strong', text: `${c.ticker} · ${c.name}` }),
                      c.kind === 'etf' ? h('span', { class: 'tag', text: 'ETF' }) : null),
                    // The one-line description is what the company does. On a
                    // phone the name cell is about 180px and the sentence
                    // wrapped to four lines, which turned a list of companies
                    // into a wall. It is on the stock page, one tap away.
                    h('small', { class: 'desk-only', text: c.plain })),
                  h('span', { class: 't-body-strong nowrap', text: usd(c.price) }),
                  h('span', { class: (c.dayPct >= 0 ? 'pos' : 'warn') + ' t-body-strong nowrap',
                    text: (c.dayPct >= 0 ? '+' : '') + pct(c.dayPct) }),
                  // What the token costs against the share it tracks, and the
                  // share's own price under it. The pair is the reference
                  // site's first numeric column, and it is the one number a
                  // tokenised product cannot honestly leave out.
                  h('span', { class: 'two-line right' },
                    h('span', { class: (markGap(c).over ? 'warn' : 'pos') + ' t-body-strong nowrap',
                      text: markGap(c).pct + ' ' + markGap(c).word }),
                    h('small', { text: usd(c.mark) })),
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
                (n) => go('/invest/' + ordered[n].ticker.toLowerCase()),
                { current: { key: sortKey, dir: sortDir }, onSort }
              )
            : emptyState('Nothing matches that',
                'Try another company, fund or ticker.',
                { label: 'Clear the search', onClick: () => go('/invest') })
        )),
    h('div', { class: 'row equal' },
      card(
        cardHead('Where people start'),
        ...PICKS.map((p) => {
          const c = find(p.ticker)!
          const row = h('div', { class: 'kv', style: { cursor: 'pointer' } },
            h('span', { class: 'two-line' },
              h('span', { class: 't-body-strong', text: c.name }),
              h('small', { text: p.line })),
            h('span', { class: 't-body-strong', text: usd(c.price) }))
          row.addEventListener('click', () => go('/invest/' + c.ticker.toLowerCase()))
          return row
        })),
      card(cardHead('Your watchlist'), ...state.watchlist.map(tickerRow)),
      card(cardHead('Moving today'),
        ...[...CATALOGUE].sort((a, b) => Math.abs(b.dayPct) - Math.abs(a.dayPct)).slice(0, 4)
          .map((c) => tickerRow(c.ticker)))),
    // Once, at the foot of the page. A risk line on every card is a risk line
    // nobody reads.
    h('p', { class: 'subtle t-caption', style: { margin: '0' } },
      h('span', { text: 'Investing involves risk. The value of what you hold can fall as well as rise, and you can get back less than you put in. ' }),
      h('button', { class: 'link quiet', text: 'Risk and disclosures',
        on: { click: () => go('/disclosures') } }))
  )
}
