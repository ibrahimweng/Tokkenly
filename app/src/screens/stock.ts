import { h } from '../ui'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, callout } from '../components/bits'
import { find } from '../catalogue'
import { state, actions, holding } from '../state'
import { usd, pct, signed } from '../format'
import { go } from '../router'
import { toast } from '../components/sheet'

function sparkline(seedNum: number, up: boolean): HTMLElement {
  let seed = seedNum
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
  const bars = h('div', { style: { display: 'flex', alignItems: 'flex-end', gap: '3px', height: '220px' } })
  for (let i = 0; i < 80; i++) {
    const t = i / 79
    const drift = up ? t * 0.55 : (1 - t) * 0.35
    const v = 0.3 + drift + (rand() - 0.5) * 0.14
    bars.appendChild(h('div', {
      style: {
        width: '5px', flex: 'none', borderRadius: '2px',
        height: Math.max(6, v * 220) + 'px',
        background: i > 72 ? 'var(--ink)' : 'var(--control-pressed)',
      },
    }))
  }
  return bars
}

export function stockScreen(ticker: string): HTMLElement {
  const c = find(ticker)
  if (!c) {
    return shell('market', pageHeader('Not found'),
      h('p', { class: 'muted', text: 'No such company. Go back to Market and search for it.' }),
      h('button', { class: 'btn btn-quiet btn-sm', text: 'Back to Market', on: { click: () => go('/market') } }))
  }
  const held = holding(c.ticker)
  const watching = state.watchlist.includes(c.ticker)

  const follow = h('button', {
    class: watching ? 'btn btn-quiet btn-sm' : 'btn btn-filled btn-sm',
    text: watching ? 'Following' : 'Follow',
    on: {
      click: () => {
        actions.toggleWatch(c.ticker)
        toast(watching ? c.ticker + ' removed from your watchlist' : c.ticker + ' added to your watchlist')
      },
    },
  })

  return shell(
    'market',
    pageHeader(c.name,
      h('div', { class: 'chip-row' }, follow,
        h('button', { class: 'btn btn-filled btn-sm', text: 'Buy ' + c.ticker,
          on: { click: () => go('/market/' + c.ticker.toLowerCase() + '/invest') } }))),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        card(
          h('div', { class: 'card-head' },
            h('div', { class: 'stack-8' },
              h('span', { class: 't-caps subtle', text: 'Price' }),
              h('span', { class: 't-display-xl', text: usd(c.price) })),
            h('span', { class: c.dayPct >= 0 ? 'chip pos' : 'chip',
              text: (c.dayPct >= 0 ? '+' : '') + pct(c.dayPct) + ' today' })),
          sparkline(c.ticker.charCodeAt(0) * 31, c.dayPct >= 0),
          h('div', { style: { display: 'flex', justifyContent: 'space-between' } },
            ...['Nov', 'Jan', 'Mar', 'May', 'Jul', 'Sep'].map((m) =>
              h('span', { class: 't-caption subtle', text: m })))
        ),
        card(
          cardHead('Growth and valuation'),
          kv('Market value', c.cap),
          kv('Price to earnings', String(c.pe)),
          kv('Dividend', pct(c.dividend, 2) + ' a year'),
          kv('Year low', usd(c.yearLow)),
          kv('Year high', usd(c.yearHigh))
        ),
        card(
          cardHead('News'),
          h('div', { class: 'stack-12' },
            ...[
              [c.name + ' beats expectations for the quarter', '2 hours ago · Reuters'],
              ['Analysts raise the twelve month target', 'Yesterday · Bloomberg'],
              ['What the new product line means for margins', '3 days ago · FT'],
            ].map(([t, s]) => h('div', { class: 'two-line' },
              h('span', { class: 't-body-strong', text: t }),
              h('small', { text: s }))))
        )),
      h('div', { class: 'stack col-side' },
        card(
          cardHead('What this is'),
          h('span', { class: 'muted', text: c.plain }),
          callout('A tokenised share tracks the real one and trades every day of the week, including weekends.')
        ),
        card(
          cardHead('Your position'),
          held && held.shares > 0
            ? h('div', { class: 'stack-12' },
                kv('You hold', held.shares.toFixed(2) + ' shares'),
                kv('Worth', usd(held.shares * c.price)),
                kv('Today', h('span', { class: c.dayPct >= 0 ? 'pos t-body-strong' : 't-body-strong',
                  text: signed((held.shares * c.price * c.dayPct) / 100) })))
            : h('span', { class: 'muted', text: 'You do not own any yet.' }),
          h('button', { class: 'btn btn-filled', text: 'Buy ' + c.ticker,
            on: { click: () => go('/market/' + c.ticker.toLowerCase() + '/invest') } }),
          held && held.shares > 0
            ? h('button', { class: 'btn btn-quiet', text: 'Sell ' + c.ticker,
                on: { click: () => go('/market/' + c.ticker.toLowerCase() + '/sell') } })
            : null
        )))
  )
}
