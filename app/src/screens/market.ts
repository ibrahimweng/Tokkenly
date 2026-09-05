import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead } from '../components/bits'
import { CATALOGUE, CATEGORIES, INDICES, PICKS, find } from '../catalogue'
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

export function marketScreen(): HTMLElement {
  const r = current()
  const cat = r.query.get('cat') ?? 'Popular'
  const term = (r.query.get('q') ?? '').toLowerCase()

  const list = CATALOGUE.filter((c) => {
    if (term) return (c.ticker + ' ' + c.name).toLowerCase().includes(term)
    if (cat === 'Everything') return true
    return c.tags.includes(cat)
  })

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
    h('div', { class: 'row' }, ...INDICES.map((i) =>
      card(
        h('span', { class: 't-caps subtle', text: i.name }),
        h('span', { class: 't-title', text: i.value }),
        h('span', { class: i.pct >= 0 ? 'pos' : 'muted', text: (i.pct >= 0 ? '+' : '') + pct(i.pct, 2) + ' today' })))),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        card(
          cardHead(term ? 'Results' : cat),
          ...(list.length
            ? list.map((c) => {
                const row = h('div', { class: 'kv', style: { cursor: 'pointer' } },
                  h('span', { class: 'two-line' },
                    h('span', { class: 't-body-strong', text: `${c.ticker} · ${c.name}` }),
                    h('small', { text: c.plain })),
                  h('span', { class: 'two-line right' },
                    h('span', { class: 't-body-strong', text: usd(c.price) }),
                    h('small', { class: c.dayPct >= 0 ? 'pos' : 'muted', text: (c.dayPct >= 0 ? '+' : '') + pct(c.dayPct) })))
                row.addEventListener('click', () => go('/market/' + c.ticker.toLowerCase()))
                return row
              })
            : [h('span', { class: 'muted', text: 'Nothing matches that.' })])
        ),
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
          })
        )),
      h('div', { class: 'stack col-side' },
        card(cardHead('Your watchlist'), ...state.watchlist.map(tickerRow)),
        card(cardHead('Moving today'),
          ...[...CATALOGUE].sort((a, b) => Math.abs(b.dayPct) - Math.abs(a.dayPct)).slice(0, 4)
            .map((c) => tickerRow(c.ticker)))))
  )
}
