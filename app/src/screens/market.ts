import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, emptyState } from '../components/bits'
import { table } from '../components/table'
import { CATALOGUE, CATEGORIES, INDICES, PICKS, find, type Instrument } from '../catalogue'
import { state } from '../state'
import { usd, pct } from '../format'
import { go, current } from '../router'

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
  row.addEventListener('click', () => go('/market/' + c.ticker.toLowerCase()))
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
    go('/market?' + q.toString())
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
  }
  const ordered = [...list].sort((a, b) =>
    (cmp[sortKey] ?? cmp.cap)(a, b) * (sortDir === 'asc' ? 1 : -1))

  const setQuery = (k: string, v: string) => {
    const q = new URLSearchParams(r.query)
    if (v) q.set(k, v); else q.delete(k)
    const s = q.toString()
    go('/market' + (s ? '?' + s : ''))
  }

  return shell(
    'market',
    pageHeader('Market', h('span', { class: 'muted', text: 'Tokenised, so it trades 24/7' })),
    h('label', { class: 'field' },
      h('span', { html: icon.search() }),
      h('input', {
        placeholder: 'Search a company or a fund',
        value: r.query.get('q') ?? '',
        on: { keydown: (e) => { if ((e as KeyboardEvent).key === 'Enter') setQuery('q', (e.target as HTMLInputElement).value) } },
      })),
    h('p', { class: 'muted', style: { margin: '0' },
      text: 'Everything here is a tokenised share. You can buy part of one, and the market never closes.' }),
    h('div', { class: 'chip-row' }, ...CATEGORIES.map((c) =>
      h('button', { class: 'chip', text: c, ariaPressed: c === cat && !term,
        on: { click: () => setQuery('cat', c) } }))),
    h('div', { class: 'row equal' }, ...INDICES.map((i) =>
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
            h('span', { class: 'muted t-caption', text: list.length + (list.length === 1 ? ' company' : ' companies') })),
          list.length
            ? table(
                [
                  { key: 'name', label: 'Company', sortable: true },
                  { key: 'price', label: 'Price', align: 'right', sortable: true },
                  { key: 'day', label: 'Today', align: 'right', sortable: true },
                  { key: 'range', label: 'Year range', optional: true },
                  { key: 'cap', label: 'Size', align: 'right', optional: true, sortable: true },
                  { key: 'yield', label: 'Yield', align: 'right', optional: true, sortable: true },
                  { key: 'pe', label: 'P/E', align: 'right', optional: true, sortable: true },
                ],
                ordered.map((c) => [
                  h('span', { class: 'two-line' },
                    h('span', { class: 't-body-strong', text: `${c.ticker} · ${c.name}` }),
                    h('small', { text: c.plain })),
                  h('span', { class: 't-body-strong nowrap', text: usd(c.price) }),
                  h('span', { class: (c.dayPct >= 0 ? 'pos' : 'warn') + ' t-body-strong nowrap',
                    text: (c.dayPct >= 0 ? '+' : '') + pct(c.dayPct) }),
                  rangeBar(c),
                  h('span', { class: 'muted nowrap', text: c.cap }),
                  h('span', { class: 'muted nowrap', text: c.dividend ? pct(c.dividend) : '—' }),
                  h('span', { class: 'muted nowrap', text: c.pe ? c.pe.toFixed(1) : '—' }),
                ]),
                (n) => go('/market/' + ordered[n].ticker.toLowerCase()),
                { current: { key: sortKey, dir: sortDir }, onSort }
              )
            : emptyState('Nothing matches that',
                'Try another company, fund or ticker.',
                { label: 'Clear the search', onClick: () => go('/market') })
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
          row.addEventListener('click', () => go('/market/' + c.ticker.toLowerCase()))
          return row
        })),
      card(cardHead('Your watchlist'), ...state.watchlist.map(tickerRow)),
      card(cardHead('Moving today'),
        ...[...CATALOGUE].sort((a, b) => Math.abs(b.dayPct) - Math.abs(a.dayPct)).slice(0, 4)
          .map((c) => tickerRow(c.ticker))))
  )
}
